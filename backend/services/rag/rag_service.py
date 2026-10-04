"""
RAGService - ingestion, retrieval, ranking and source-grounded context.

Pipeline: collect -> clean/normalise -> chunk -> embed -> vector store ->
retrieve + rank (relevance x freshness) -> context with sources.
"""

import hashlib
import logging
import math
import os
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

from core.settings import settings
from core.validation import base_symbol
from repositories import get_repository
from repositories.excel_store import utc_now
from services.rag.embeddings import HashingEmbedder
from services.rag.processing import chunk_text, clean_text, screen_untrusted
from services.rag.vector_store import InMemoryVectorStore

logger = logging.getLogger(__name__)

MARKET_SCOPE = "MARKET"


def _parse_time(value) -> Optional[datetime]:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _parse_markdown_doc(path: str) -> Dict:
    with open(path, encoding="utf-8") as fh:
        raw = fh.read()
    meta, body = {}, raw
    if raw.startswith("---"):
        _, header, body = raw.split("---", 2)
        for line in header.strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
    return {"meta": meta, "body": body}


class RAGService:
    def __init__(self, embedder=None, store=None, documents_dir: str = None, repository=None):
        self.embedder = embedder or HashingEmbedder()
        self.store = store or InMemoryVectorStore()
        self.documents_dir = documents_dir or settings.DOCUMENTS_DIR
        self._repo = repository
        self._lock = threading.Lock()
        self._loaded_scopes = set()

    @property
    def repo(self):
        return self._repo or get_repository()

    # -- ingestion ----------------------------------------------------------
    def ingest_text(self, scope: str, title: str, text: str, source: str, doc_type: str,
                    url: str = None, published_at: str = None, record: bool = False) -> int:
        """Clean, chunk, embed and index one document. Returns chunks added."""
        text = clean_text(text)
        if not text:
            return 0
        doc_key = hashlib.sha1(f"{scope}|{url or title}|{text[:200]}".encode()).hexdigest()
        chunks = chunk_text(text, settings.RAG_CHUNK_WORDS, settings.RAG_CHUNK_OVERLAP)
        new_chunks, metas = [], []
        retrieved_at = utc_now()
        for i, chunk in enumerate(chunks):
            key = f"{doc_key}:{i}"
            if self.store.has(key):
                continue
            new_chunks.append(f"{title}. {chunk}")
            metas.append({
                "chunk_key": key, "scope": scope, "title": clean_text(title), "text": chunk,
                "source": source, "url": url, "doc_type": doc_type,
                "published_at": published_at, "retrieved_at": retrieved_at,
            })
        if new_chunks:
            self.store.add(self.embedder.embed(new_chunks), metas)
            if record:
                try:
                    self.repo.insert("documents", {
                        "stock_id": scope, "title": title, "source": source, "url": url,
                        "doc_type": doc_type, "published_at": published_at,
                        "ingested_at": retrieved_at, "chunk_count": len(new_chunks),
                    })
                except Exception as exc:
                    logger.warning("Could not record document metadata: %s", exc)
        return len(new_chunks)

    def ingest_local_documents(self, scope: str) -> int:
        with self._lock:
            if scope in self._loaded_scopes:
                return 0
            self._loaded_scopes.add(scope)
        folder = os.path.join(self.documents_dir, scope)
        if not os.path.isdir(folder):
            return 0
        added = 0
        for name in sorted(os.listdir(folder)):
            if not name.endswith((".md", ".txt")):
                continue
            doc = _parse_markdown_doc(os.path.join(folder, name))
            meta = doc["meta"]
            added += self.ingest_text(
                scope, meta.get("title", name), doc["body"],
                source=meta.get("source", "Local document"), doc_type=meta.get("doc_type", "document"),
                url=meta.get("url"), published_at=meta.get("published_at"),
            )
        return added

    def ingest_news(self, symbol: str, articles: List[Dict]) -> int:
        scope = base_symbol(symbol)
        added = 0
        for a in articles:
            body = " ".join(filter(None, [a.get("description"), a.get("content")]))
            added += self.ingest_text(
                scope, a.get("title") or "Untitled article", body or a.get("title", ""),
                source=(a.get("source") or {}).get("name") or "News",
                doc_type="news", url=a.get("url"), published_at=a.get("publishedAt"),
            )
        return added

    def ingest_analysis(self, symbol: str, summary: str) -> int:
        """Store platform analysis output so later questions can reference it."""
        return self.ingest_text(base_symbol(symbol), "Previous platform analysis", summary,
                                source="Platform analysis (model output)", doc_type="platform_analysis",
                                published_at=utc_now())

    def ensure_background(self, symbol: str) -> None:
        self.ingest_local_documents(base_symbol(symbol))
        self.ingest_local_documents(MARKET_SCOPE)

    # -- retrieval ----------------------------------------------------------
    def _freshness(self, published: Optional[datetime], now: datetime) -> float:
        if published is None:
            return 0.5  # undated background material: neutral weight
        age_days = max(0.0, (now - published).total_seconds() / 86400)
        return math.pow(0.5, age_days / settings.RAG_FRESHNESS_HALF_LIFE_DAYS)

    def retrieve_documents(self, symbol: str, query: str, top_k: int = 20) -> List[Dict]:
        self.ensure_background(symbol)
        q = self.embedder.embed([clean_text(query)])
        return self.store.search(q, top_k=top_k, scope=[base_symbol(symbol), MARKET_SCOPE])

    def rank_documents(self, candidates: List[Dict], k: int = 5, min_similarity: float = 0.02) -> List[Dict]:
        now = datetime.now(timezone.utc)
        ranked = []
        for c in candidates:
            if c["similarity"] < min_similarity:
                continue
            published = _parse_time(c.get("published_at"))
            freshness = self._freshness(published, now)
            age_days = None if published is None else (now - published).days
            is_current = age_days is not None and age_days <= settings.RAG_CURRENT_WINDOW_DAYS
            ranked.append({
                **c,
                "freshness": round(freshness, 3),
                "score": round(0.75 * c["similarity"] + 0.25 * freshness * c["similarity"] * 2, 4),
                "age_days": age_days,
                "recency": "current" if is_current else ("background" if published is None else "historical"),
            })
        ranked.sort(key=lambda r: r["score"], reverse=True)
        # De-duplicate: keep the best chunk per source document.
        seen, unique = set(), []
        for r in ranked:
            doc_id = r["chunk_key"].split(":")[0]
            if doc_id in seen:
                continue
            seen.add(doc_id)
            unique.append(r)
            if len(unique) >= k:
                break
        return unique

    def build_context(self, symbol: str, query: str, k: int = 5) -> Dict:
        """Retrieve, rank and package context with source attribution."""
        ranked = self.rank_documents(self.retrieve_documents(symbol, query), k=k)
        sources, blocks, flagged_any = [], [], False
        for i, r in enumerate(ranked, start=1):
            safe_text, flagged = screen_untrusted(r["text"])
            flagged_any = flagged_any or flagged
            sources.append({
                "id": i, "title": r["title"], "source": r["source"], "url": r.get("url"),
                "doc_type": r["doc_type"], "published_at": r.get("published_at"),
                "retrieved_at": r.get("retrieved_at"), "recency": r["recency"],
                "relevance": round(r["similarity"], 3), "score": r["score"],
                "excerpt": safe_text[:400], "flagged_untrusted_content": flagged,
            })
            blocks.append(
                f'<document id="{i}" source="{r["source"]}" type="{r["doc_type"]}" '
                f'published="{r.get("published_at") or "undated"}" recency="{r["recency"]}">\n'
                f"{safe_text}\n</document>"
            )
        return {
            "query": query,
            "sources": sources,
            "context": "\n".join(blocks),
            "flagged_untrusted_content": flagged_any,
            "retrieved_at": utc_now(),
        }


rag_service = RAGService()

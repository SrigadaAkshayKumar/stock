"""News ingestion: fetch, normalise, score sentiment and persist articles."""

import logging
from datetime import datetime, timezone
from typing import Dict, List

import requests

from core.settings import settings
from core.validation import base_symbol
from repositories import get_repository
from services.market_data_service import stock_service
from services.sentiment_service import EnhancedSentimentAnalyzer

logger = logging.getLogger(__name__)


def _empty_summary() -> Dict:
    return EnhancedSentimentAnalyzer()._get_empty_sentiment_summary()


def fetch_latest_news(symbol: str, page_size: int = None) -> Dict:
    """Fetch recent articles from NewsAPI with retry handling.

    Returns ``{"articles": [...], "sentiment_summary": {...}, "provider_available": bool}``.
    Each article carries ``source``, ``publishedAt`` and ``retrieved_at`` for grounding.
    """
    base = base_symbol(symbol)
    company = stock_service.get_stock(base)["name"]
    retrieved_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    if not settings.NEWS_API_KEY:
        return {"articles": [], "sentiment_summary": _empty_summary(), "provider_available": False,
                "retrieved_at": retrieved_at}

    params = {
        "q": f'"{company}" OR {base}',
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": page_size or settings.NEWS_PAGE_SIZE,
        "apiKey": settings.NEWS_API_KEY,
    }
    data = None
    for attempt in range(3):
        try:
            resp = requests.get("https://newsapi.org/v2/everything", params=params,
                                timeout=settings.HTTP_TIMEOUT_SECONDS)
            if resp.status_code == 429 or resp.status_code >= 500:
                raise requests.HTTPError(f"status {resp.status_code}")
            data = resp.json()
            break
        except (requests.RequestException, ValueError) as exc:
            logger.warning("NewsAPI attempt %d failed for %s: %s", attempt + 1, base, exc)
    if not data or data.get("status") != "ok" or not data.get("articles"):
        return {"articles": [], "sentiment_summary": _empty_summary(), "provider_available": data is not None,
                "retrieved_at": retrieved_at}

    articles, summary = EnhancedSentimentAnalyzer().analyze_news_articles(data["articles"])
    for a in articles:
        a["retrieved_at"] = retrieved_at
    return {"articles": articles, "sentiment_summary": summary, "provider_available": True,
            "retrieved_at": retrieved_at}


def persist_articles(symbol: str, articles: List[Dict], repo=None) -> int:
    repo = repo or get_repository()
    base = base_symbol(symbol)
    known = {r.get("url") for r in repo.find("news_articles", stock_id=base)}
    added = 0
    for a in articles:
        if not a.get("url") or a["url"] in known:
            continue
        repo.insert("news_articles", {
            "stock_id": base,
            "title": a.get("title"),
            "description": a.get("description"),
            "url": a.get("url"),
            "source": (a.get("source") or {}).get("name"),
            "published_at": a.get("publishedAt"),
            "retrieved_at": a.get("retrieved_at"),
            "sentiment": a.get("sentiment"),
            "sentiment_score": a.get("sentiment_score"),
        })
        known.add(a["url"])
        added += 1
    return added

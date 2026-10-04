"""In-memory vector store with metadata filtering.

Good for development and single-instance deployments. For production use a
managed vector database (e.g. pgvector on RDS, OpenSearch) behind the same
``add`` / ``search`` interface.
"""

import threading
from typing import Dict, List

import numpy as np
from scipy import sparse


class InMemoryVectorStore:
    def __init__(self):
        self._lock = threading.RLock()
        self._vectors = None
        self._meta: List[Dict] = []
        self._keys = set()

    def __len__(self):
        return len(self._meta)

    def has(self, key: str) -> bool:
        return key in self._keys

    def add(self, vectors, metadatas: List[Dict]) -> None:
        with self._lock:
            vectors = sparse.csr_matrix(vectors)
            self._vectors = vectors if self._vectors is None else sparse.vstack([self._vectors, vectors]).tocsr()
            self._meta.extend(metadatas)
            self._keys.update(m["chunk_key"] for m in metadatas)

    def search(self, query_vector, top_k: int = 20, **filters) -> List[Dict]:
        with self._lock:
            if self._vectors is None:
                return []
            scores = np.asarray((self._vectors @ sparse.csr_matrix(query_vector).T).todense()).ravel()
            results = []
            for idx in np.argsort(-scores):
                meta = self._meta[idx]
                if all(meta.get(k) in (v if isinstance(v, (list, tuple, set)) else [v]) for k, v in filters.items()):
                    results.append({**meta, "similarity": float(scores[idx])})
                    if len(results) >= top_k:
                        break
            return results

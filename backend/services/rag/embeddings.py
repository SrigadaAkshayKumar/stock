"""Embedding generation.

The default embedder is a stateless hashed TF-IDF-style vectoriser (word and
bigram features, L2-normalised). It needs no model download or API key and
supports incremental ingestion. Swap in a neural embedding model by
implementing the same ``embed(texts) -> sparse/dense matrix`` interface.
"""

from typing import List

from sklearn.feature_extraction.text import HashingVectorizer


class HashingEmbedder:
    name = "hashing-ngram-v1"

    def __init__(self, n_features: int = 2 ** 18):
        self._vectorizer = HashingVectorizer(
            n_features=n_features,
            ngram_range=(1, 2),
            stop_words="english",
            alternate_sign=False,
            norm="l2",
        )

    def embed(self, texts: List[str]):
        return self._vectorizer.transform(texts)

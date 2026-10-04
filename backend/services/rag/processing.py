"""Cleaning, normalisation, chunking and prompt-injection screening."""

import html
import re
from typing import List

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_CTRL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_TRUNC_RE = re.compile(r"\[\+\d+ chars\]")  # NewsAPI truncation marker

# Phrases typical of prompt-injection attempts inside retrieved content.
_INJECTION_PATTERNS = [
    r"ignore (all |any )?(previous|prior|above) (instructions|prompts?)",
    r"disregard (all |any )?(previous|prior|above)",
    r"you are now",
    r"system prompt",
    r"act as (an?|the) ",
    r"reveal (your|the) (instructions|prompt|keys?)",
    r"</?(system|assistant|user|instructions?)>",
]
_INJECTION_RE = re.compile("|".join(_INJECTION_PATTERNS), re.IGNORECASE)


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = html.unescape(text)
    text = _TAG_RE.sub(" ", text)
    text = _TRUNC_RE.sub(" ", text)
    text = _CTRL_RE.sub(" ", text)
    return _WS_RE.sub(" ", text).strip()


def chunk_text(text: str, chunk_words: int = 180, overlap: int = 40) -> List[str]:
    words = text.split()
    if not words:
        return []
    if len(words) <= chunk_words:
        return [" ".join(words)]
    step = max(1, chunk_words - overlap)
    chunks = []
    for start in range(0, len(words), step):
        chunks.append(" ".join(words[start:start + chunk_words]))
        if start + chunk_words >= len(words):
            break
    return chunks


def screen_untrusted(text: str) -> tuple:
    """Neutralise instruction-like phrases in retrieved content.

    Returns ``(safe_text, flagged)``. Retrieved text is data, never instructions.
    """
    flagged = bool(_INJECTION_RE.search(text))
    safe = _INJECTION_RE.sub("[removed]", text) if flagged else text
    return safe, flagged

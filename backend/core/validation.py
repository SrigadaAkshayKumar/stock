"""Input validation helpers shared by the API layer."""

import re

_SYMBOL_RE = re.compile(r"^[A-Z0-9&\-]{1,20}(\.(NS|BO))?$")
MAX_QUESTION_CHARS = 1000


class ValidationError(ValueError):
    pass


def clean_symbol(raw: str) -> str:
    """Upper-case and validate a ticker such as ``TCS`` or ``TCS.NS``."""
    symbol = (raw or "").strip().upper()
    if not _SYMBOL_RE.match(symbol):
        raise ValidationError(f"Invalid stock symbol: {raw!r}")
    return symbol


def base_symbol(symbol: str) -> str:
    """Strip the exchange suffix: ``TCS.NS`` -> ``TCS``."""
    return symbol.split(".")[0].upper()


def clean_question(raw) -> str:
    if not isinstance(raw, str) or not raw.strip():
        raise ValidationError("A non-empty 'question' is required")
    question = raw.strip()
    if len(question) > MAX_QUESTION_CHARS:
        raise ValidationError(f"Question must be at most {MAX_QUESTION_CHARS} characters")
    return question

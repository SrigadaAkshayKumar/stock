"""Fundamental / company information.

When live market data is enabled, fundamentals are fetched from yfinance.
Otherwise only price-derived metrics are returned and provider metrics are
explicitly reported as unavailable (never invented).
"""

import logging
from datetime import datetime, timezone
from typing import Dict

from core.settings import settings
from core.validation import base_symbol
from services.market_data_service import stock_service

logger = logging.getLogger(__name__)

_FIELDS = {
    "marketCap": "market_cap",
    "trailingPE": "pe_ratio",
    "forwardPE": "forward_pe",
    "priceToBook": "price_to_book",
    "dividendYield": "dividend_yield",
    "returnOnEquity": "return_on_equity",
    "debtToEquity": "debt_to_equity",
    "profitMargins": "profit_margin",
    "revenueGrowth": "revenue_growth",
    "earningsGrowth": "earnings_growth",
    "beta": "beta",
}


def _fetch_provider_fundamentals(base: str) -> Dict:
    if not settings.LIVE_MARKET_DATA:
        return {}
    try:
        import yfinance as yf
        info = yf.Ticker(f"{base}{settings.DEFAULT_EXCHANGE_SUFFIX}").info or {}
        return {ours: info.get(theirs) for theirs, ours in _FIELDS.items() if info.get(theirs) is not None}
    except Exception as exc:
        logger.warning("Fundamentals provider unavailable for %s: %s", base, exc)
        return {}


def get_fundamentals(symbol: str) -> Dict:
    base = base_symbol(symbol)
    provider = _fetch_provider_fundamentals(base)
    return {
        "company": stock_service.get_stock(base),
        "price_metrics": stock_service.get_stock_metrics(base),
        "provider_metrics": provider,
        "provider_available": bool(provider),
        "note": None if provider else (
            "Valuation metrics (P/E, market cap, margins) need a live provider. "
            "Set LIVE_MARKET_DATA=true to fetch them; only price-derived metrics are shown."
        ),
        "retrieved_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }

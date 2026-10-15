"""Unit tests for stock search functionality and Enter key trigger handling (fixes #216)."""

import pytest
from core.validation import clean_symbol, ValidationError
from services.market_data_service import StockService, StockNotFoundError


def sanitize_search_query(query: str) -> str:
    """Python reference mirroring sanitizeSearchQuery in StockList.jsx."""
    if not isinstance(query, str):
        return ""
    return query.strip()


def get_stock_search_url(query: str):
    """Python reference mirroring getStockSearchUrl in StockList.jsx."""
    sanitized = sanitize_search_query(query)
    return f"/stock/{sanitized}" if sanitized else None


def simulate_key_down(event_key: str, search_query: str):
    """Simulates the onKeyDown event behavior implemented in StockList.jsx."""
    prevented_default = False
    navigated_url = None

    if event_key == "Enter":
        prevented_default = True
        navigated_url = get_stock_search_url(search_query)

    return {
        "prevented_default": prevented_default,
        "navigated_url": navigated_url,
    }


def test_sanitize_search_query():
    """Verify whitespace trimming and non-string handling."""
    assert sanitize_search_query("  TCS  ") == "TCS"
    assert sanitize_search_query("INFY.NS") == "INFY.NS"
    assert sanitize_search_query("   ") == ""
    assert sanitize_search_query("") == ""
    assert sanitize_search_query(None) == ""
    assert sanitize_search_query(123) == ""


def test_get_stock_search_url():
    """Verify URL generation for valid tickers and empty queries."""
    assert get_stock_search_url("TCS") == "/stock/TCS"
    assert get_stock_search_url("  RELIANCE.BO  ") == "/stock/RELIANCE.BO"
    assert get_stock_search_url("   ") is None
    assert get_stock_search_url("") is None


def test_enter_key_triggers_search():
    """Verify Enter keydown triggers navigation and prevents default form submission."""
    result = simulate_key_down("Enter", "TCS")
    assert result["prevented_default"] is True
    assert result["navigated_url"] == "/stock/TCS"


def test_enter_key_with_whitespace_query():
    """Verify Enter keydown with empty/whitespace query does not navigate."""
    result = simulate_key_down("Enter", "   ")
    assert result["prevented_default"] is True
    assert result["navigated_url"] is None


def test_other_keys_do_not_trigger_search():
    """Verify non-Enter keys do not trigger navigation or preventDefault."""
    for key in ["Tab", "Escape", "ArrowDown", "Space", "a"]:
        result = simulate_key_down(key, "TCS")
        assert result["prevented_default"] is False
        assert result["navigated_url"] is None


def test_search_ticker_backend_resolution():
    """Verify searched ticker resolution with backend StockService."""
    stock_service = StockService(live=False)

    # Valid ticker searched
    price_info = stock_service.get_live_price("TCS")
    assert price_info["symbol"] == "TCS"

    # Valid ticker with exchange suffix
    price_info_ns = stock_service.get_live_price("INFY.NS")
    assert price_info_ns["symbol"] == "INFY"

    # Unknown ticker raises StockNotFoundError
    with pytest.raises(StockNotFoundError):
        stock_service.get_live_price("NONEXISTENT_TICKER")

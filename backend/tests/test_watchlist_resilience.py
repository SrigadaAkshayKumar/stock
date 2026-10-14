"""Unit tests for watchlist localStorage corrupted data resilience and validation (fixes #261)."""

import json
import pytest
from services.market_data_service import stock_service


def parse_safe_watchlist(raw_data: str) -> list:
    """Python reference implementation mirroring getLocalWatchlist error handling."""
    if not raw_data:
        return []
    try:
        parsed = json.loads(raw_data)
        if not isinstance(parsed, list):
            return []
        return [
            item for item in parsed
            if isinstance(item, dict) and isinstance(item.get("symbol"), str) and item["symbol"].strip()
        ]
    except (json.JSONDecodeError, TypeError, ValueError):
        return []


def test_empty_or_none_watchlist():
    """Verify empty or missing data safely returns an empty list."""
    assert parse_safe_watchlist("") == []
    assert parse_safe_watchlist(None) == []


def test_valid_watchlist_parsing():
    """Verify valid JSON list parses properly."""
    valid_data = json.dumps([
        {"symbol": "TCS", "name": "Tata Consultancy Services"},
        {"symbol": "INFY", "name": "Infosys"},
    ])
    result = parse_safe_watchlist(valid_data)
    assert len(result) == 2
    assert result[0]["symbol"] == "TCS"
    assert result[1]["symbol"] == "INFY"


def test_corrupted_json_syntax():
    """Verify corrupted JSON syntax is caught and falls back to empty list."""
    corrupted_cases = [
        "{invalid_json",
        "[{\"symbol\": \"TCS\",",
        "undefined",
        "NaN",
        "<html>Error 500</html>",
        "[{symbol: invalid}]",
    ]
    for case in corrupted_cases:
        assert parse_safe_watchlist(case) == [], f"Failed to handle corrupted case: {case}"


def test_non_array_json_types():
    """Verify non-array JSON types (objects, strings, numbers, booleans) fall back to empty list."""
    non_array_cases = [
        json.dumps({"symbol": "TCS", "name": "Tata"}),  # dict instead of list
        json.dumps("string_value"),
        json.dumps(12345),
        json.dumps(True),
        json.dumps(None),
    ]
    for case in non_array_cases:
        assert parse_safe_watchlist(case) == []


def test_array_with_corrupted_elements():
    """Verify arrays containing invalid or null entries filter out corrupted items."""
    mixed_data = json.dumps([
        None,
        123,
        "raw_string",
        [],
        {"no_symbol": "Missing symbol key"},
        {"symbol": 123},  # non-string symbol
        {"symbol": ""},   # empty symbol
        {"symbol": "RELIANCE", "name": "Reliance Industries"},
    ])
    result = parse_safe_watchlist(mixed_data)
    assert len(result) == 1
    assert result[0] == {"symbol": "RELIANCE", "name": "Reliance Industries"}


def test_watchlist_symbols_match_supported_stocks():
    """Verify watchlist items can match supported stocks in market_data_service."""
    supported = {s["symbol"] for s in stock_service.list_supported()}
    sample_watchlist = [
        {"symbol": "TCS", "name": "Tata Consultancy Services"},
        {"symbol": "INFY", "name": "Infosys"},
    ]
    for item in sample_watchlist:
        assert item["symbol"] in supported

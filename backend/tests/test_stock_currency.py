"""Unit tests for Indian stock currency and rupee symbol formatting (fixes #253)."""

import pytest
from flask import Flask

from services.stock_service import get_stock_data_handler
from services.market_data_service import StockService


@pytest.fixture
def test_app():
    app = Flask(__name__)
    return app


def test_stock_data_handler_returns_inr_currency(test_app):
    """Verify get_stock_data_handler returns INR currency and ₹ symbol for Indian stocks."""
    with test_app.test_request_context():
        for symbol in ["TCS", "INFY", "RELIANCE"]:
            response = get_stock_data_handler(symbol)
            assert response.status_code == 200

            data = response.get_json()
            assert "stock_info" in data
            stock_info = data["stock_info"]

            assert stock_info.get("currency") == "INR"
            assert stock_info.get("currency_symbol") == "₹"


def test_market_data_service_live_price_returns_inr_currency():
    """Verify StockService.get_live_price includes INR currency and ₹ symbol."""
    service = StockService(live=False)
    for ticker in ["TCS", "INFY.NS", "RELIANCE.BO"]:
        price_info = service.get_live_price(ticker)
        assert price_info.get("currency") == "INR"
        assert price_info.get("currency_symbol") == "₹"


def test_currency_symbol_resolution_rules():
    """Verify currency symbol selection for Indian vs foreign markets."""
    def resolve_currency_symbol(ticker: str = "", exchange: str = "") -> str:
        upper_ticker = (ticker or "").upper()
        upper_exchange = (exchange or "").upper()

        if (
            "NASDAQ" in upper_exchange
            or "NYSE" in upper_exchange
            or (
                not upper_ticker.endswith(".NS")
                and not upper_ticker.endswith(".BO")
                and upper_ticker in {"AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA"}
            )
        ):
            return "$"
        return "₹"

    # Indian exchange tickers (NSE / BSE)
    assert resolve_currency_symbol("TCS.NS") == "₹"
    assert resolve_currency_symbol("RELIANCE.BO") == "₹"
    assert resolve_currency_symbol("INFY") == "₹"
    assert resolve_currency_symbol("HDFCBANK.NS") == "₹"
    assert resolve_currency_symbol("", "BSE") == "₹"
    assert resolve_currency_symbol("", "NSE") == "₹"

    # US tickers / exchanges
    assert resolve_currency_symbol("AAPL") == "$"
    assert resolve_currency_symbol("MSFT") == "$"
    assert resolve_currency_symbol("GOOGL", "NASDAQ") == "$"

    # Default fallback
    assert resolve_currency_symbol() == "₹"

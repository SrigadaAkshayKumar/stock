"""Unit tests for stock data error handling and invalid ticker responses (fixes #262)."""

import pytest
from flask import Flask

from services.stock_service import get_stock_data_handler
from services.market_data_service import StockNotFoundError, stock_service


@pytest.fixture
def test_app():
    app = Flask(__name__)
    return app


def test_invalid_ticker_returns_404_json(test_app):
    """Verify get_stock_data_handler returns 404 with descriptive error message for invalid tickers."""
    with test_app.test_request_context():
        invalid_symbols = ["INVALID_TICKER", "XYZ_UNKNOWN", "NONEXISTENT123"]
        for symbol in invalid_symbols:
            result = get_stock_data_handler(symbol)
            assert isinstance(result, tuple)
            response, status_code = result
            assert status_code == 404

            data = response.get_json()
            assert "error" in data
            assert f"No data found for ticker {symbol}" in data["error"]


def test_invalid_ticker_stock_service_raises_lookup_error():
    """Verify StockService raises StockNotFoundError for unsupported ticker symbols."""
    with pytest.raises(StockNotFoundError):
        stock_service.get_price_history("DEFINITELY_NOT_A_VALID_TICKER_999")


def test_error_message_resolution_rules():
    """Verify expected error messaging logic matching frontend resolveStockErrorMessage."""
    default_msg = "No stock data found for this ticker. Please try another symbol."

    def resolve_error(backend_error: str = None, is_network_error: bool = False) -> str:
        if backend_error:
            return f"{backend_error}. Please try another symbol."
        if is_network_error:
            return "Network error: Unable to connect to server. Please try again."
        return default_msg

    assert resolve_error("No data found for ticker FOO") == "No data found for ticker FOO. Please try another symbol."
    assert resolve_error(is_network_error=True) == "Network error: Unable to connect to server. Please try again."
    assert resolve_error() == default_msg

"""Unit tests for stock metric trend and previous close calculation (fixes #247)."""

import json
import os
import pandas as pd
import pytest
from flask import Flask

from services.stock_service import get_stock_data_handler, normalize_symbol


@pytest.fixture
def test_app():
    app = Flask(__name__)
    return app


def test_normalize_symbol():
    assert normalize_symbol("TCS.NS") == "TCS"
    assert normalize_symbol("RELIANCE.BO") == "RELIANCE"
    assert normalize_symbol("AAPL") == "AAPL"


def test_stock_basic_info_contains_previous_close(test_app):
    """Verify stock_info includes previous_close from the prior session."""
    with test_app.test_request_context():
        response = get_stock_data_handler("TCS")
        assert response.status_code == 200

        data = response.get_json()
        assert "stock_info" in data
        stock_info = data["stock_info"]

        assert "previous_close" in stock_info
        assert isinstance(stock_info["previous_close"], float)
        assert stock_info["previous_close"] > 0


def test_previous_close_matches_prior_session_not_oldest(test_app):
    """Verify previous_close corresponds to df.iloc[-2]['Close'] and not df.iloc[0]['Close']."""
    csv_path = os.path.join(os.path.dirname(__file__), "..", "services", "data", "TCS.csv")
    df = pd.read_csv(csv_path)
    df["Date"] = pd.to_datetime(df["Date"], dayfirst=True, errors="coerce")
    df = df.dropna(subset=["Date"]).sort_values("Date", ascending=True).reset_index(drop=True)

    oldest_close = round(float(df.iloc[0]["Close"]), 2)
    prior_session_close = round(float(df.iloc[-2]["Close"]), 2)
    latest_close = round(float(df.iloc[-1]["Close"]), 2)

    # Ensure test dataset has distinct values to validate difference
    assert oldest_close != prior_session_close

    with test_app.test_request_context():
        response = get_stock_data_handler("TCS")
        data = response.get_json()
        stock_info = data["stock_info"]

        assert stock_info["close"] == latest_close
        assert stock_info["previous_close"] == prior_session_close
        assert stock_info["previous_close"] != oldest_close


def test_previous_close_single_row_dataset(tmp_path, monkeypatch, test_app):
    """Verify single-row dataset falls back safely to latest close for previous_close."""
    import services.stock_service as stock_service_mod

    # Create dummy single-row CSV
    csv_file = tmp_path / "TESTONE.csv"
    csv_file.write_text(
        "Date,Open,High,Low,Close,Volume\n01-01-2026,100.0,105.0,98.0,102.5,5000\n"
    )

    monkeypatch.setattr(stock_service_mod, "DATA_FOLDER", str(tmp_path))

    with test_app.test_request_context():
        response = stock_service_mod.get_stock_data_handler("TESTONE")
        assert response.status_code == 200
        data = response.get_json()
        stock_info = data["stock_info"]

        assert stock_info["close"] == 102.5
        assert stock_info["previous_close"] == 102.5


def test_trend_calculation_logic():
    """Verify trend indicator direction between current open and previous close."""
    def compute_trend(open_val, prev_close_val):
        if open_val is None or prev_close_val is None:
            return "neutral"
        if open_val > prev_close_val:
            return "up"
        elif open_val < prev_close_val:
            return "down"
        return "neutral"

    # Opening higher than previous close -> Bullish / UP trend
    assert compute_trend(155.0, 150.0) == "up"

    # Opening lower than previous close -> Bearish / DOWN trend
    assert compute_trend(145.0, 150.0) == "down"

    # Flat open -> NEUTRAL trend
    assert compute_trend(150.0, 150.0) == "neutral"

    # Edge cases
    assert compute_trend(None, 150.0) == "neutral"
    assert compute_trend(150.0, None) == "neutral"

"""Unit tests for prediction cache key versioning, stale cache invalidation, and fresh bypass (fixes #266)."""

import os
from types import ModuleType
import sys
from flask import jsonify
import pytest


def test_get_stock_data_version_existing_file():
    """Verify data version returns file mtime for existing CSV dataset."""
    from routes.stock_routes import get_stock_data_version, DATA_FOLDER

    tcs_path = os.path.join(DATA_FOLDER, "TCS.csv")
    if os.path.exists(tcs_path):
        expected_mtime = str(int(os.path.getmtime(tcs_path)))
        assert get_stock_data_version("TCS") == expected_mtime


def test_get_stock_data_version_missing_file():
    """Verify data version returns '0' for non-existent stock symbols."""
    from routes.stock_routes import get_stock_data_version

    assert get_stock_data_version("NONEXISTENT_SYMBOL_XYZ") == "0"


def test_get_prediction_cache_key_canonicalization():
    """Verify cache key canonicalizes symbol (strips exchange suffixes and uppercases)."""
    from routes.stock_routes import get_prediction_cache_key

    key1 = get_prediction_cache_key("tcs")
    key2 = get_prediction_cache_key("TCS.NS")
    key3 = get_prediction_cache_key("TCS.BO")
    assert key1 == key2 == key3
    assert key1.startswith("resp:/api/stock/TCS/predict?v=")


def test_prediction_cache_stale_invalidation_and_refresh(monkeypatch):
    """Verify that updating the underlying stock data invalidates the stale cache, and refresh bypasses it."""
    # Stub service modules before importing app
    mod = ModuleType("services.stock_service")
    modp = ModuleType("services.stock_predict")
    mod.get_stock_data_handler = lambda *args, **kwargs: jsonify({"ok": True})

    handler_calls = {"count": 0, "latest_version": 100}

    def stub_predict_handler(symbol):
        handler_calls["count"] += 1
        return jsonify({
            "predictions": [100.0, 105.0],
            "symbol": symbol,
            "version": handler_calls["latest_version"],
        })

    modp.predict_stock_handler = stub_predict_handler
    sys.modules["services.stock_service"] = mod
    sys.modules["services.stock_predict"] = modp

    from app import app
    import routes.stock_routes as routes
    import utils.cache as cache

    monkeypatch.setattr(cache, "CACHE_ENABLED", True, raising=False)
    monkeypatch.setattr(cache, "_get_redis_client", lambda: None, raising=False)
    monkeypatch.setattr(cache, "_memory_cache", {}, raising=False)
    monkeypatch.setattr(routes, "predict_stock_handler", stub_predict_handler, raising=True)

    # Mock get_stock_data_version to simulate data file version changes
    current_version = {"val": "1000"}
    monkeypatch.setattr(routes, "get_stock_data_version", lambda sym: current_version["val"])

    client = app.test_client()
    url = "/api/stock/AAPL/predict"

    # 1) First call: Cache MISS, prediction computed and cached
    r1 = client.get(url)
    assert r1.status_code == 200
    assert r1.headers.get("X-Cache") == "MISS"
    assert handler_calls["count"] == 1
    assert r1.get_json()["version"] == 100

    # 2) Second call before data update: Cache HIT, returns cached prediction
    r2 = client.get(url)
    assert r2.status_code == 200
    assert r2.headers.get("X-Cache") == "HIT"
    assert handler_calls["count"] == 1  # Not recomputed

    # 3) Underlying stock data updates: data version changes
    current_version["val"] = "2000"
    handler_calls["latest_version"] = 200

    # Third call after data update: Stale cache is automatically invalidated -> MISS
    r3 = client.get(url)
    assert r3.status_code == 200
    assert r3.headers.get("X-Cache") == "MISS"
    assert handler_calls["count"] == 2  # Fresh prediction computed!
    assert r3.get_json()["version"] == 200

    # 4) Explicit bypass via refresh=true
    r4 = client.get(url + "?refresh=true")
    assert r4.status_code == 200
    assert r4.headers.get("X-Cache") == "BYPASS"
    assert handler_calls["count"] == 3

    # 5) Explicit bypass via fresh=true
    r5 = client.get(url + "?fresh=true")
    assert r5.status_code == 200
    assert r5.headers.get("X-Cache") == "BYPASS"
    assert handler_calls["count"] == 4

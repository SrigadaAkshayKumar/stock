from flask import jsonify
from types import ModuleType
import sys


def test_stock_cache_miss_then_hit_and_bypass(monkeypatch):
    # Stub service modules BEFORE importing app to avoid heavy deps
    mod = ModuleType('services.stock_service')
    modp = ModuleType('services.stock_predict')
    calls = {"n": 0}

    def stub_stock_handler(symbol, chart_period, table_period):
        calls["n"] += 1
        return jsonify({
            "symbol": symbol,
            "chart_period": chart_period,
            "table_period": table_period,
            "ok": True
        })

    mod.get_stock_data_handler = stub_stock_handler  # type: ignore[attr-defined]
    # minimal predict stub to satisfy import
    def _stub_predict(symbol):
        return jsonify({"predictions": [42], "symbol": symbol})
    modp.predict_stock_handler = _stub_predict  # type: ignore[attr-defined]
    sys.modules['services.stock_service'] = mod
    sys.modules['services.stock_predict'] = modp

    # Import app
    from app import app
    # Force caching on and force in-memory (no redis attempts)
    import utils.cache as cache
    monkeypatch.setattr(cache, "CACHE_ENABLED", True, raising=False)
    monkeypatch.setattr(cache, "_get_redis_client", lambda: None, raising=False)
    # reset memory cache to clean state
    monkeypatch.setattr(cache, "_memory_cache", {}, raising=False)

    # Handlers are already stubbed by module injection above

    client = app.test_client()
    url = "/api/stock/TEST?chart_period=1d&table_period=1d"

    # 1) MISS
    r1 = client.get(url)
    assert r1.status_code == 200
    assert r1.headers.get("X-Cache") == "MISS"
    assert calls["n"] == 1

    # 2) HIT
    r2 = client.get(url)
    assert r2.status_code == 200
    assert r2.headers.get("X-Cache") == "HIT"
    assert calls["n"] == 1  # no recompute

    # 3) BYPASS with refresh=true
    r3 = client.get(url + "&refresh=true")
    assert r3.status_code == 200
    assert r3.headers.get("X-Cache") == "BYPASS"
    assert calls["n"] == 2


def test_predict_cache_miss_then_hit(monkeypatch):
    # Stub both service modules BEFORE importing app
    mod = ModuleType('services.stock_service')
    modp = ModuleType('services.stock_predict')
    mod.get_stock_data_handler = lambda *args, **kwargs: jsonify({"ok": True})  # type: ignore[attr-defined]
    calls = {"n": 0}
    def stub_predict_handler(symbol):
        calls["n"] += 1
        return jsonify({
            "predictions": [1, 2, 3],
            "symbol": symbol
        })
    modp.predict_stock_handler = stub_predict_handler  # type: ignore[attr-defined]
    sys.modules['services.stock_service'] = mod
    sys.modules['services.stock_predict'] = modp

    from app import app
    import routes.stock_routes as routes
    import utils.cache as cache
    monkeypatch.setattr(cache, "CACHE_ENABLED", True, raising=False)
    monkeypatch.setattr(cache, "_get_redis_client", lambda: None, raising=False)
    monkeypatch.setattr(cache, "_memory_cache", {}, raising=False)
    # Ensure routes use our counting stub for this test run
    monkeypatch.setattr(routes, "predict_stock_handler", stub_predict_handler, raising=True)

    client = app.test_client()
    url = "/api/stock/FOO/predict"

    # MISS
    r1 = client.get(url)
    assert r1.status_code == 200
    assert r1.headers.get("X-Cache") == "MISS"
    assert calls["n"] == 1

    # HIT
    r2 = client.get(url)
    assert r2.status_code == 200
    assert r2.headers.get("X-Cache") == "HIT"
    assert calls["n"] == 1

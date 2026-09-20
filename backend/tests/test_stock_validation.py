import sys
from types import ModuleType
from flask import jsonify


def normalize_symbol_fn(symbol: str) -> str:
    if not symbol:
        return ""
    return symbol.upper().replace(".NS", "").replace(".BO", "")


def test_normalize_symbol():
    assert normalize_symbol_fn("INFY.NS") == "INFY"
    assert normalize_symbol_fn("infy.ns") == "INFY"
    assert normalize_symbol_fn("tcs.bo") == "TCS"
    assert normalize_symbol_fn("RELIANCE") == "RELIANCE"
    assert normalize_symbol_fn("reliance") == "RELIANCE"
    assert normalize_symbol_fn("") == ""
    assert normalize_symbol_fn(None) == ""


def test_stock_validation_and_error_handling(monkeypatch):
    # Stub service modules before importing app, following the project's test pattern
    mod = ModuleType('services.stock_service')
    modp = ModuleType('services.stock_predict')

    def stub_stock_handler(symbol, chart_period="1mo", table_period="1mo"):
        if not symbol or not str(symbol).strip():
            return jsonify({"error": "Ticker parameter is required"}), 400
        clean_symbol = normalize_symbol_fn(symbol)
        supported = ["INFY", "RELIANCE", "TCS"]
        if clean_symbol not in supported:
            return jsonify({"error": f"No data found for ticker {clean_symbol}"}), 404
        return jsonify({
            "stock_data": [{"Close": 100}],
            "stock_info": {"name": clean_symbol},
            "chart_period": chart_period,
            "table_period": table_period,
        }), 200

    mod.get_stock_data_handler = stub_stock_handler
    mod.normalize_symbol = normalize_symbol_fn
    modp.predict_stock_handler = lambda s: jsonify({"symbol": s})
    sys.modules['services.stock_service'] = mod
    sys.modules['services.stock_predict'] = modp

    from app import app
    import routes.stock_routes as routes
    import utils.cache as cache

    monkeypatch.setattr(routes, "get_stock_data_handler", stub_stock_handler, raising=True)
    monkeypatch.setattr(cache, "_memory_cache", {}, raising=False)

    client = app.test_client()

    # 1. Unsupported ticker returns 404 with clear error feedback
    resp_invalid = client.get("/api/stock/INVALIDXYZ123?refresh=true")
    assert resp_invalid.status_code == 404
    data_invalid = resp_invalid.get_json()
    assert "error" in data_invalid
    assert "No data found for ticker INVALIDXYZ123" in data_invalid["error"]

    # 2. Valid ticker returns 200
    resp_valid = client.get("/api/stock/INFY?refresh=true")
    assert resp_valid.status_code == 200
    data_valid = resp_valid.get_json()
    assert "stock_data" in data_valid
    assert data_valid["stock_info"]["name"] == "INFY"

    # 3. Lowercase valid ticker is supported and returns 200
    resp_lower = client.get("/api/stock/infy?refresh=true")
    assert resp_lower.status_code == 200
    data_lower = resp_lower.get_json()
    assert data_lower["stock_info"]["name"] == "INFY"

    # 4. Suffix ticker (e.g. .NS / .BO) returns 200
    resp_suffix = client.get("/api/stock/INFY.NS?refresh=true")
    assert resp_suffix.status_code == 200
    data_suffix = resp_suffix.get_json()
    assert data_suffix["stock_info"]["name"] == "INFY"

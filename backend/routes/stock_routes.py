from flask import Blueprint, request, make_response, Response
from services.stock_service import get_stock_data_handler
from services.stock_predict import predict_stock_handler
from utils.cache import (
    get_cache,
    set_cache,
    cache_key_from,
    is_cache_enabled,
    DEFAULT_TTL_STOCK,
    DEFAULT_TTL_PRED,
)

stock_routes = Blueprint('stock_routes', __name__)

# GET /api/stock/<symbol>
@stock_routes.route('/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    chart_period = request.args.get("chart_period", "1mo")
    table_period = request.args.get("table_period", "1mo")
    refresh = request.args.get("refresh", "false").lower() in ("1", "true", "yes", "on")

    # Build cache key
    key = cache_key_from(
        f"/api/stock/{symbol}",
        {"chart_period": chart_period, "table_period": table_period}
    )

    # Attempt cache HIT unless refresh requested
    if is_cache_enabled() and not refresh:
        cached = get_cache(key)
        if cached:
            resp = make_response(cached)
            resp.headers["Content-Type"] = "application/json"
            resp.headers["X-Cache"] = "HIT"
            return resp

    # Miss or bypass -> compute
    result = get_stock_data_handler(symbol, chart_period, table_period)

    # Normalize to Response object (supports Response or tuple variants)
    resp: Response
    if isinstance(result, Response):
        resp = result
    elif isinstance(result, tuple):
        body = result[0]
        status = result[1] if len(result) > 1 else 200
        headers = result[2] if len(result) > 2 else {}
        if isinstance(body, Response):
            resp = body
            resp.status_code = status
            for k, v in (headers or {}).items():
                try:
                    resp.headers[k] = v
                except Exception:
                    pass
        else:
            resp = make_response(body, status)
            for k, v in (headers or {}).items():
                try:
                    resp.headers[k] = v
                except Exception:
                    pass
    else:
        # Fallback
        resp = make_response(result)

    # Cache successful responses
    if is_cache_enabled() and getattr(resp, "status_code", 200) == 200:
        try:
            payload = resp.get_data(as_text=True)
            set_cache(key, payload, ttl=DEFAULT_TTL_STOCK)
        except Exception:
            pass

    try:
        if hasattr(resp, 'headers'):
            resp.headers["X-Cache"] = "MISS" if not refresh else "BYPASS"
    except Exception:
        pass
    return resp

# GET /api/stock/<symbol>/predict
@stock_routes.route('/stock/<symbol>/predict', methods=['GET'])
def predict(symbol):
    refresh = request.args.get("refresh", "false").lower() in ("1", "true", "yes", "on")

    key = cache_key_from(f"/api/stock/{symbol}/predict", {})

    if is_cache_enabled() and not refresh:
        cached = get_cache(key)
        if cached:
            resp = make_response(cached)
            resp.headers["Content-Type"] = "application/json"
            resp.headers["X-Cache"] = "HIT"
            return resp

    result = predict_stock_handler(symbol)

    # Normalize to Response
    if isinstance(result, Response):
        resp = result
    elif isinstance(result, tuple):
        body = result[0]
        status = result[1] if len(result) > 1 else 200
        headers = result[2] if len(result) > 2 else {}
        if isinstance(body, Response):
            resp = body
            resp.status_code = status
            for k, v in (headers or {}).items():
                try:
                    resp.headers[k] = v
                except Exception:
                    pass
        else:
            resp = make_response(body, status)
            for k, v in (headers or {}).items():
                try:
                    resp.headers[k] = v
                except Exception:
                    pass
    else:
        resp = make_response(result)

    if is_cache_enabled() and getattr(resp, "status_code", 200) == 200:
        try:
            payload = resp.get_data(as_text=True)
            set_cache(key, payload, ttl=DEFAULT_TTL_PRED)
        except Exception:
            pass

    try:
        resp.headers["X-Cache"] = "MISS" if not refresh else "BYPASS"
    except Exception:
        pass
    return resp

"""API routes for the AI-powered analysis platform (v2 endpoints)."""

import json
import logging
import os

from flask import Blueprint, jsonify, request, send_file

from core.rate_limit import rate_limited
from core.settings import settings
from core.validation import ValidationError, base_symbol, clean_question, clean_symbol
from repositories import get_repository
from services.market_data_service import StockNotFoundError, stock_service
from utils.cache import cache_key_from, get_cache, is_cache_enabled, set_cache
from workers.job_queue import job_queue

logger = logging.getLogger(__name__)

analysis_routes = Blueprint("analysis_routes", __name__)


@analysis_routes.errorhandler(ValidationError)
def _bad_request(exc):
    return jsonify({"error": str(exc)}), 400


@analysis_routes.errorhandler(StockNotFoundError)
def _not_found(exc):
    return jsonify({"error": str(exc)}), 404


def _symbol(raw: str) -> str:
    return base_symbol(clean_symbol(raw))


def _refresh() -> bool:
    return request.args.get("refresh", "false").lower() in ("1", "true", "yes", "on")


# -- system -------------------------------------------------------------------
@analysis_routes.route("/health", methods=["GET"])
def health():
    from services.agent.llm_client import llm_available
    return jsonify({
        "status": "ok",
        "environment": settings.ENV,
        "db_backend": settings.DB_BACKEND,
        "live_market_data": settings.LIVE_MARKET_DATA,
        "news_provider_configured": bool(settings.NEWS_API_KEY),
        "llm_configured": llm_available(),
    })


@analysis_routes.route("/stocks", methods=["GET"])
def list_stocks():
    return jsonify({"stocks": stock_service.list_supported()})


# -- market data & analysis building blocks ---------------------------------
@analysis_routes.route("/stock/<symbol>/price", methods=["GET"])
def live_price(symbol):
    return jsonify(stock_service.get_live_price(_symbol(symbol)))


@analysis_routes.route("/stock/<symbol>/history", methods=["GET"])
def price_history(symbol):
    period = request.args.get("period", "1y")
    df = stock_service.get_price_history(_symbol(symbol), period)
    return jsonify({
        "symbol": _symbol(symbol),
        "period": period,
        "source": df.attrs.get("source"),
        "dates": df["Date"].dt.strftime("%Y-%m-%d").tolist(),
        "open": df["Open"].round(2).tolist(),
        "high": df["High"].round(2).tolist(),
        "low": df["Low"].round(2).tolist(),
        "close": df["Close"].round(2).tolist(),
        "volume": df["Volume"].fillna(0).astype(int).tolist(),
    })


@analysis_routes.route("/stock/<symbol>/indicators", methods=["GET"])
def indicators(symbol):
    from services.indicator_service import get_technical_indicators
    return jsonify(get_technical_indicators(stock_service.get_price_history(_symbol(symbol), "max")))


@analysis_routes.route("/stock/<symbol>/fundamentals", methods=["GET"])
def fundamentals(symbol):
    from services.fundamentals_service import get_fundamentals
    return jsonify(get_fundamentals(_symbol(symbol)))


@analysis_routes.route("/stock/<symbol>/forecast", methods=["GET"])
def forecast(symbol):
    from services.prediction_service import prediction_service
    try:
        horizon = int(request.args.get("horizon", 5))
    except ValueError:
        raise ValidationError("horizon must be an integer")
    if not 1 <= horizon <= 20:
        raise ValidationError("horizon must be between 1 and 20 trading days")
    return jsonify(prediction_service.predict(_symbol(symbol), horizon))


@analysis_routes.route("/stock/<symbol>/forecast/evaluation", methods=["GET"])
def forecast_evaluation(symbol):
    from services.prediction_service import prediction_service
    return jsonify(prediction_service.evaluate_prediction(_symbol(symbol)))


@analysis_routes.route("/stock/<symbol>/risk", methods=["GET"])
def risk(symbol):
    from services.agent.tools import calculate_risk
    return jsonify(calculate_risk(_symbol(symbol)))


@analysis_routes.route("/stock/<symbol>/news", methods=["GET"])
def news(symbol):
    from services.agent.tools import search_latest_news
    return jsonify(search_latest_news(_symbol(symbol)))


@analysis_routes.route("/stock/<symbol>/rag/search", methods=["GET"])
def rag_search(symbol):
    from services.rag.rag_service import rag_service
    query = clean_question(request.args.get("q", ""))
    return jsonify(rag_service.build_context(_symbol(symbol), query))


@analysis_routes.route("/stock/<symbol>/ingest", methods=["POST"])
def ingest(symbol):
    """Queue news/document ingestion and embedding in the background."""
    from services.agent.tools import search_latest_news
    from services.rag.rag_service import rag_service
    sym = _symbol(symbol)

    def task():
        rag_service.ensure_background(sym)
        result = search_latest_news(sym)
        return {"articles_ingested": len(result["articles"]), "vector_store_chunks": len(rag_service.store)}

    return jsonify(job_queue.submit("ingest", task)), 202


@analysis_routes.route("/stock/<symbol>/analysis", methods=["GET"])
def analysis(symbol):
    from services.analysis_service import collect_analysis
    sym = _symbol(symbol)
    key = cache_key_from(f"/api/stock/{sym}/analysis", {})
    if is_cache_enabled() and not _refresh():
        cached = get_cache(key)
        if cached:
            resp = jsonify(json.loads(cached))
            resp.headers["X-Cache"] = "HIT"
            return resp
    result = collect_analysis(sym)
    payload = json.dumps(result, default=str)
    if is_cache_enabled():
        set_cache(key, payload, ttl=settings.CACHE_TTL_ANALYSIS)
    resp = jsonify(json.loads(payload))
    resp.headers["X-Cache"] = "BYPASS" if _refresh() else "MISS"
    return resp


# -- AI agent -------------------------------------------------------------------
@analysis_routes.route("/stock/<symbol>/agent/chat", methods=["POST"])
@rate_limited()
def agent_chat(symbol):
    from services.agent.agent_service import agent_service
    body = request.get_json(silent=True) or {}
    question = clean_question(body.get("question"))
    session_id = body.get("session_id")
    if session_id is not None and (not isinstance(session_id, str) or len(session_id) > 64):
        raise ValidationError("Invalid session_id")
    return jsonify(agent_service.chat(_symbol(symbol), question, session_id=session_id))


# -- reports --------------------------------------------------------------------
@analysis_routes.route("/stock/<symbol>/report.pdf", methods=["GET"])
@rate_limited(10)
def report_pdf(symbol):
    from services.report_service import report_service
    record = report_service.generate(_symbol(symbol))
    return send_file(record["storage_path"], mimetype="application/pdf",
                     as_attachment=True, download_name=record["file_name"])


@analysis_routes.route("/stock/<symbol>/reports", methods=["POST"])
@rate_limited(10)
def queue_report(symbol):
    from services.report_service import report_service
    sym = _symbol(symbol)

    def task():
        record = report_service.generate(sym)
        return {"report_id": record.get("id"), "file_name": record["file_name"],
                "download_url": f"/api/reports/{record.get('id')}/download"}

    return jsonify(job_queue.submit("report", task)), 202


@analysis_routes.route("/jobs/<job_id>", methods=["GET"])
def job_status(job_id):
    job = job_queue.status(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)


@analysis_routes.route("/reports/<report_id>/download", methods=["GET"])
def download_report(report_id):
    record = get_repository().find_one("reports", id=report_id)
    if not record or not record.get("storage_path"):
        return jsonify({"error": "Report not found"}), 404
    path = os.path.abspath(record["storage_path"])
    if not path.startswith(os.path.abspath(settings.REPORTS_DIR)) or not os.path.exists(path):
        return jsonify({"error": "Report file unavailable"}), 404
    return send_file(path, mimetype="application/pdf", as_attachment=True, download_name=record["file_name"])

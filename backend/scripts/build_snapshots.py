"""
Pre-compute frontend snapshots so the demo site loads instantly.

The backend pipeline (market data -> indicators -> ML models -> news -> RAG ->
risk -> report) is run here, ahead of time, and its output is written as static
files the React app ships with:

    public/snapshots/index.json        symbols that have a snapshot
    public/snapshots/<SYMBOL>.json     prices, analysis, agent evidence, legacy prediction
    public/reports/<SYMBOL>.pdf        the 14-section PDF report

Run from the backend folder (re-run whenever you want fresher data):

    python scripts/build_snapshots.py                # every stock with local CSV data
    python scripts/build_snapshots.py TCS INFY       # only these
    LIVE_MARKET_DATA=true NEWS_API_KEY=... python scripts/build_snapshots.py   # every listed stock, live prices + news
"""

import json
import logging
import os
import shutil
import sys
import time

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_ROOT, ".."))
sys.path.insert(0, BACKEND_ROOT)
os.chdir(BACKEND_ROOT)
# A Redis cache is not needed for a one-off build.
os.environ.setdefault("CACHE_ENABLED", "false")

from app import app  # noqa: E402  (registers blueprints, loads .env)
from services.agent import tools as agent_tools  # noqa: E402
from services.agent.agent_service import INTENT_KEYWORDS, INTENT_TOOLS, _TOOL_ORDER  # noqa: E402
from services.analysis_service import collect_analysis  # noqa: E402
from services.market_data_service import StockNotFoundError, stock_service  # noqa: E402
from services.report_service import ReportService  # noqa: E402
from services.stock_predict import predict_stock_handler  # noqa: E402

logger = logging.getLogger("build_snapshots")

SNAPSHOT_DIR = os.path.join(PROJECT_ROOT, "public", "snapshots")
REPORT_DIR = os.path.join(PROJECT_ROOT, "public", "reports")

# One retrieval query per agent intent; the browser agent picks the matching result.
RAG_QUERIES = {
    "outlook": "short term outlook growth drivers demand guidance",
    "technical": "recent price trend momentum market sentiment",
    "fundamental": "revenue earnings margins valuation balance sheet dividend",
    "news": "recent developments announcements results",
    "risk": "key risks headwinds competition regulation currency",
    "company": "business model segments products customers strategy",
    "price": "recent price performance market",
    "report": "recent developments key risks growth drivers",
    "overview": "recent developments key risks growth drivers",
}


def _round(values, digits=2):
    return [None if v != v else round(float(v), digits) for v in values]  # v != v -> NaN


def _ohlcv(symbol):
    df = stock_service.get_price_history(symbol, "max")
    return {
        "source": df.attrs.get("source", "csv"),
        "date": df["Date"].dt.strftime("%Y-%m-%d").tolist(),
        "open": _round(df["Open"]),
        "high": _round(df["High"]),
        "low": _round(df["Low"]),
        "close": _round(df["Close"]),
        "volume": [int(v) for v in df["Volume"].fillna(0)],
    }


def _timed(fn):
    start = time.perf_counter()
    try:
        return fn(), "ok", round((time.perf_counter() - start) * 1000, 1)
    except Exception as exc:  # keep the snapshot even if one tool fails
        logger.warning("tool failed: %s", exc)
        return {"error": str(exc)}, "error", round((time.perf_counter() - start) * 1000, 1)


def _agent_evidence(symbol, analysis):
    """Outputs of every agent tool, captured from the real backend services."""
    tools, timings = {}, {}
    primary = analysis.get("primary_prediction") or {}
    indicators = {k: v for k, v in (analysis.get("indicators") or {}).items() if k != "series"}
    news = analysis.get("news") or {}
    # Reuse what the analysis already computed instead of re-running the models.
    reused = {
        "get_live_price": analysis.get("price"),
        "get_technical_indicators": indicators,
        "get_fundamentals": analysis.get("fundamentals"),
        "search_latest_news": news,
        "run_ml_prediction": primary,
        "calculate_risk": analysis.get("risk"),
    }
    for name, value in reused.items():
        tools[name], timings[name] = value, "ok"

    tools["get_historical_prices"], timings["get_historical_prices"], _ = _timed(
        lambda: agent_tools.get_historical_prices(symbol, period="6mo"))

    rag = {}
    for intent, query in RAG_QUERIES.items():
        rag[intent], _, _ = _timed(lambda q=query: agent_tools.retrieve_company_documents(symbol, query=q))
    tools["retrieve_company_documents"] = rag
    tools["generate_report"] = {
        "message": "The full PDF report is ready.",
        "download_url": f"reports/{symbol}.pdf",
    }
    # The routing tables go along so the browser agent routes exactly like AgentService.
    return {"tools": tools, "intent_keywords": INTENT_KEYWORDS, "intent_tools": INTENT_TOOLS,
            "tool_order": _TOOL_ORDER}


def _legacy_prediction(symbol):
    with app.app_context():
        result = predict_stock_handler(symbol)
    response, status = (result if isinstance(result, tuple) else (result, 200))[:2]
    return response.get_json() if status == 200 else None


def build(symbol, reports):
    started = time.perf_counter()
    analysis = collect_analysis(symbol, include_series=True, persist=False)
    snapshot = {
        "symbol": symbol,
        "company": analysis.get("company"),
        "generated_at": analysis.get("generated_at"),
        "prices": _ohlcv(symbol),
        "analysis": analysis,
        "agent": _agent_evidence(symbol, analysis),
        "legacy_prediction": _legacy_prediction(symbol),
        "report_url": f"reports/{symbol}.pdf",
    }
    path = os.path.join(SNAPSHOT_DIR, f"{symbol}.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(snapshot, fh, separators=(",", ":"), default=str)

    pdf = reports.export_pdf(reports.build_report(analysis), f"{symbol}.pdf")
    shutil.copyfile(pdf, os.path.join(REPORT_DIR, f"{symbol}.pdf"))
    logger.info("%s: snapshot %.0f KB, %.1fs", symbol, os.path.getsize(path) / 1024,
                time.perf_counter() - started)
    return _summary(snapshot)


def _summary(snapshot):
    """Small per-stock card data for the home page (last close, change, 30-day sparkline)."""
    close = snapshot["prices"]["close"]
    return {
        "name": (snapshot.get("company") or {}).get("name"),
        "close": close[-1],
        "change_pct": round((close[-1] / close[-2] - 1) * 100, 2) if len(close) > 1 else 0.0,
        "as_of": snapshot["prices"]["date"][-1],
        "outlook": (snapshot["analysis"].get("primary_prediction") or {}).get("outlook"),
        "source": snapshot["prices"]["source"],
        "spark": close[-30:],
    }


def _default_symbols():
    """Every stock with local CSV data; with live data on, every stock the UI lists."""
    if stock_service.live:
        with open(os.path.join(PROJECT_ROOT, "src", "components", "data", "stockData.json"), encoding="utf-8") as fh:
            listed = json.load(fh)
        return sorted({s["symbol"].split(".")[0] for exchange in listed.values() for s in exchange})
    return [s["symbol"] for s in stock_service.list_supported()]


def main(argv):
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    os.makedirs(SNAPSHOT_DIR, exist_ok=True)
    os.makedirs(REPORT_DIR, exist_ok=True)

    wanted = [s.upper().split(".")[0] for s in argv] or _default_symbols()
    reports = ReportService()
    built = {}
    for symbol in wanted:
        try:
            built[symbol] = build(symbol, reports)
        except StockNotFoundError:
            logger.warning("%s: no price data (set LIVE_MARKET_DATA=true to fetch it), skipped", symbol)
        except Exception:
            logger.exception("%s: snapshot failed", symbol)

    index_path = os.path.join(SNAPSHOT_DIR, "index.json")
    summaries = {}
    if os.path.exists(index_path):
        with open(index_path, encoding="utf-8") as fh:
            summaries = json.load(fh).get("summaries", {})
    summaries.update(built)
    symbols = sorted(summaries)
    with open(index_path, "w", encoding="utf-8") as fh:
        json.dump({"symbols": symbols, "summaries": summaries,
                   "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}, fh)
    sources = {sym: summary.get("source") for sym, summary in built.items()}
    print(f"Built {len(built)}/{len(wanted)} snapshots: {sources}")
    print(f"Snapshots available for: {', '.join(symbols) or 'none'}")
    if not built:
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv[1:])

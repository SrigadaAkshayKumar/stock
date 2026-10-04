"""Consolidated analysis object used by the dashboard, the agent and reports."""

import logging
from typing import Dict

from core.settings import DISCLAIMER
from core.validation import base_symbol
from repositories import get_repository
from repositories.excel_store import utc_now
from services.agent.agent_service import AgentService
from services.agent import tools as agent_tools
from services.indicator_service import get_technical_indicators
from services.market_data_service import stock_service
from services.prediction_service import prediction_service
from services.rag.rag_service import rag_service

logger = logging.getLogger(__name__)


def collect_analysis(symbol: str, include_series: bool = True, persist: bool = True) -> Dict:
    symbol = base_symbol(symbol)
    df = stock_service.get_price_history(symbol, "max")
    errors = {}

    def safe(name, fn, default=None):
        try:
            return fn()
        except Exception as exc:
            logger.warning("Analysis step %s failed for %s: %s", name, symbol, exc)
            errors[name] = str(exc)
            return default

    price = safe("price", lambda: stock_service.get_live_price(symbol), {})
    history = safe("history", lambda: agent_tools.get_historical_prices(symbol, period="1y"), {})
    indicators = safe("indicators", lambda: get_technical_indicators(df), {})
    fundamentals = safe("fundamentals", lambda: agent_tools.get_fundamentals(symbol), {})
    predictions = safe("predictions", lambda: prediction_service.predict_all(symbol), [])
    news = safe("news", lambda: agent_tools.search_latest_news(symbol), {"articles": [], "sentiment_summary": {}})
    rag = safe("rag", lambda: agent_tools.retrieve_company_documents(
        symbol, query="recent developments key risks growth drivers"), {"sources": []})
    primary = next((p for p in predictions if p["horizon_trading_days"] == 5), predictions[0] if predictions else None)
    risk = safe("risk", lambda: agent_tools.calculate_risk(
        symbol, prediction=primary, sentiment=news.get("sentiment_summary"),
        indicators=indicators), {})

    results = {
        "get_live_price": price, "get_historical_prices": history,
        "get_technical_indicators": {k: v for k, v in indicators.items() if k != "series"},
        "get_fundamentals": fundamentals, "search_latest_news": news,
        "retrieve_company_documents": rag, "run_ml_prediction": primary or {}, "calculate_risk": risk,
    }
    structured = AgentService._structure(results)
    summary = AgentService._rule_based_answer(symbol, ["overview"], structured, results, [])
    sources = AgentService._sources(results)

    analysis = {
        "symbol": symbol,
        "company": stock_service.get_stock(symbol),
        "price": price,
        "history": history,
        "indicators": indicators if include_series else {k: v for k, v in indicators.items() if k != "series"},
        "fundamentals": fundamentals,
        "predictions": predictions,
        "primary_prediction": primary,
        "news": news,
        "rag_findings": rag.get("sources", []),
        "risk": risk,
        "ai_summary": structured,
        "ai_conclusion": summary,
        "sources": sources,
        "errors": errors,
        "disclaimer": DISCLAIMER,
        "generated_at": utc_now(),
    }

    if persist:
        try:
            get_repository().insert("analysis_results", {
                "stock_id": symbol,
                "summary": summary[:30000],
                "outlook": structured.get("short_term_outlook"),
                "evidence_refs": ", ".join(s.get("title", "") for s in sources)[:2000],
            })
            rag_service.ingest_analysis(symbol, summary)
        except Exception as exc:
            logger.warning("Could not persist analysis: %s", exc)
    return analysis

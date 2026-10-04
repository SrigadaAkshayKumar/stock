"""
AgentService - stock-specific analysis agent.

detect_intent() -> select_tools() -> execute_tools() -> generate_response()

The selected stock is always the conversation context. Tool outputs are the
evidence; the response separates evidence, model output, uncertainty and the
conclusion, and lists the sources used.
"""

import json
import logging
import re
import time
from typing import Dict, List

from core.settings import DISCLAIMER
from core.validation import base_symbol
from repositories import get_repository
from repositories.excel_store import utc_now
from services.agent import llm_client
from services.agent.tools import TOOLS

logger = logging.getLogger(__name__)

INTENT_KEYWORDS = {
    "outlook": [
        "will", "going to", "next few days", "next week", "tomorrow", "forecast", "predict",
        "prediction", "outlook", "increase", "decrease", "go up", "go down", "rise", "fall",
        "buy", "sell", "hold", "target", "bullish", "bearish", "short term", "short-term",
    ],
    "technical": ["rsi", "macd", "moving average", "sma", "ema", "bollinger", "indicator",
                  "technical", "support", "resistance", "momentum", "trend", "overbought", "oversold"],
    "fundamental": ["pe", "p/e", "valuation", "market cap", "revenue", "earnings", "profit",
                    "dividend", "fundamental", "margin", "debt", "growth", "52 week", "52-week"],
    "news": ["news", "latest", "recent", "sentiment", "headline", "announcement", "why did", "why is",
             "what happened", "today"],
    "risk": ["risk", "volatile", "volatility", "drawdown", "safe", "var", "downside", "danger"],
    "company": ["what does", "business", "about the company", "segments", "profile", "sector",
                "industry", "competitor"],
    "price": ["price", "trading at", "current", "quote", "how much", "close", "open", "volume"],
    "report": ["report", "pdf", "download", "export"],
}

INTENT_TOOLS = {
    "outlook": ["get_live_price", "get_historical_prices", "get_technical_indicators",
                "search_latest_news", "retrieve_company_documents", "run_ml_prediction", "calculate_risk"],
    "technical": ["get_live_price", "get_technical_indicators"],
    "fundamental": ["get_live_price", "get_fundamentals", "retrieve_company_documents"],
    "news": ["search_latest_news", "retrieve_company_documents"],
    "risk": ["get_live_price", "get_technical_indicators", "run_ml_prediction", "search_latest_news",
             "calculate_risk", "retrieve_company_documents"],
    "company": ["get_fundamentals", "retrieve_company_documents"],
    "price": ["get_live_price", "get_historical_prices"],
    "report": ["generate_report"],
    "overview": ["get_live_price", "get_technical_indicators", "run_ml_prediction",
                 "search_latest_news", "retrieve_company_documents", "calculate_risk"],
}

# Tools whose inputs depend on other tools' outputs run last.
_TOOL_ORDER = list(TOOLS.keys())


class AgentService:
    def __init__(self, repository=None, tools: Dict = None):
        self._repo = repository
        self.tools = tools or TOOLS

    @property
    def repo(self):
        return self._repo or get_repository()

    # -- pipeline -----------------------------------------------------------
    def detect_intent(self, question: str) -> List[str]:
        q = f" {question.lower()} "
        intents = []
        for intent, words in INTENT_KEYWORDS.items():
            for w in words:
                if re.search(rf"(?<![a-z]){re.escape(w)}(?![a-z])", q):
                    intents.append(intent)
                    break
        return intents or ["overview"]

    def select_tools(self, intents: List[str]) -> List[str]:
        selected = set()
        for intent in intents:
            selected.update(INTENT_TOOLS.get(intent, []))
        return [t for t in _TOOL_ORDER if t in selected]

    def execute_tools(self, symbol: str, tool_names: List[str], question: str) -> Dict:
        results, trace = {}, []
        for name in tool_names:
            kwargs = {"query": question}
            if name == "calculate_risk":
                kwargs.update(
                    prediction=results.get("run_ml_prediction"),
                    sentiment=(results.get("search_latest_news") or {}).get("sentiment_summary"),
                    indicators=results.get("get_technical_indicators"),
                )
            start = time.perf_counter()
            try:
                results[name] = self.tools[name](symbol, **kwargs)
                status = "ok"
            except Exception as exc:  # graceful degradation per tool
                logger.warning("Tool %s failed for %s: %s", name, symbol, exc)
                results[name] = {"error": str(exc)}
                status = "error"
            trace.append({"tool": name, "status": status,
                          "duration_ms": round((time.perf_counter() - start) * 1000, 1)})
        return {"results": results, "trace": trace}

    def generate_response(self, symbol: str, question: str, intents: List[str], execution: Dict,
                          history: List[Dict] = None) -> Dict:
        results = execution["results"]
        structured = self._structure(results)
        sources = self._sources(results)
        documents = (results.get("retrieve_company_documents") or {}).get("context", "")

        answer, mode = None, "rule_based"
        evidence = {k: v for k, v in results.items() if k != "retrieve_company_documents"}
        llm_answer = llm_client.synthesize(question, symbol, json.dumps(evidence, default=str)[:30000],
                                           documents, history)
        if llm_answer:
            answer, mode = llm_answer, "llm"
        else:
            answer = self._rule_based_answer(symbol, intents, structured, results, sources)

        return {
            "symbol": symbol,
            "question": question,
            "answer": answer,
            "answer_mode": mode,
            "intents": intents,
            "analysis": structured,
            "sources": sources,
            "tool_trace": execution["trace"],
            "disclaimer": DISCLAIMER,
            "generated_at": utc_now(),
        }

    # -- helpers ------------------------------------------------------------
    @staticmethod
    def _structure(results: Dict) -> Dict:
        pred = results.get("run_ml_prediction") or {}
        ind = results.get("get_technical_indicators") or {}
        news = results.get("search_latest_news") or {}
        risk = results.get("calculate_risk") or {}
        return {
            "short_term_outlook": pred.get("outlook"),
            "prediction_horizon": f"{pred['horizon_trading_days']} trading sessions" if pred.get("horizon_trading_days") else None,
            "model_confidence": pred.get("confidence"),
            "probability_up": pred.get("probability_up"),
            "predicted_price": pred.get("predicted_price"),
            "backtest_directional_accuracy": (pred.get("backtest") or {}).get("directional_accuracy"),
            "model_version": pred.get("model_version"),
            "technical_bias": ind.get("technical_bias"),
            "key_technical_signals": [s["detail"] for s in ind.get("signals", [])][:5],
            "news_sentiment": (news.get("sentiment_summary") or {}).get("overall_sentiment"),
            "risk_level": risk.get("risk_level"),
            "risk_factors": risk.get("risk_factors", []),
        }

    @staticmethod
    def _sources(results: Dict) -> List[Dict]:
        sources = []
        for s in (results.get("retrieve_company_documents") or {}).get("sources", []):
            sources.append({**s, "kind": "retrieved_document"})
        for a in (results.get("search_latest_news") or {}).get("articles", [])[:5]:
            sources.append({"kind": "news", "title": a["title"], "source": a["source"], "url": a["url"],
                            "published_at": a["published_at"], "retrieved_at": a.get("retrieved_at")})
        price = results.get("get_live_price")
        if isinstance(price, dict) and "as_of" in price:
            sources.append({"kind": "market_data", "title": "Market price data",
                            "source": price.get("source"), "published_at": price.get("as_of"),
                            "retrieved_at": price.get("retrieved_at")})
        pred = results.get("run_ml_prediction")
        if isinstance(pred, dict) and pred.get("model_version"):
            sources.append({"kind": "model_output", "title": "ML prediction model",
                            "source": pred["model_version"], "published_at": pred.get("generated_at")})
        return sources

    @staticmethod
    def _rule_based_answer(symbol, intents, s, results, sources) -> str:
        lines = []
        price = results.get("get_live_price") or {}
        if "price" in price:
            lines.append(
                f"**Market data:** {symbol} last closed at {price['price']} on {price['as_of']} "
                f"({price['change_pct']:+.2f}% vs previous close; source: {price['source']})."
            )
        hist = results.get("get_historical_prices") or {}
        if "change_pct" in hist:
            lines.append(f"Over the last {hist['period']} the price moved {hist['change_pct']:+.2f}% "
                         f"(range {hist['low']}–{hist['high']}).")
        if s.get("technical_bias"):
            lines.append(f"**Technical signals ({s['technical_bias']}):** " + "; ".join(s["key_technical_signals"]) + ".")
        fund = results.get("get_fundamentals") or {}
        if fund.get("company"):
            c, m = fund["company"], fund.get("price_metrics", {})
            lines.append(f"**Company:** {c['name']} ({c.get('sector') or 'sector n/a'}). "
                         f"52-week range {m.get('low_52w')}–{m.get('high_52w')}, 1-year return {m.get('return_1y_pct')}%.")
            if fund.get("provider_metrics"):
                pm = fund["provider_metrics"]
                lines.append("Provider metrics: " + ", ".join(f"{k}={v}" for k, v in pm.items()) + ".")
            elif fund.get("note"):
                lines.append(fund["note"])
        news = results.get("search_latest_news") or {}
        if news:
            if news.get("articles"):
                lines.append(f"**News:** {len(news['articles'])} recent articles, overall sentiment "
                             f"{s.get('news_sentiment') or 'n/a'}. Latest: \"{news['articles'][0]['title']}\".")
            else:
                lines.append("**News:** no recent articles were available from the news provider.")
        docs = (results.get("retrieve_company_documents") or {}).get("sources", [])
        if docs:
            refs = "; ".join(f"[{d['id']}] {d['title']} ({d['recency']})" for d in docs[:3])
            lines.append(f"**Retrieved context:** {refs}.")
            lines.append(f"> {docs[0]['excerpt'][:300]}…")
        if s.get("short_term_outlook"):
            acc = s.get("backtest_directional_accuracy")
            lines.append(
                f"**ML model:** {s['short_term_outlook']} over {s['prediction_horizon']} — probability of a rise "
                f"{s['probability_up'] * 100:.0f}%, expected price ≈ {s['predicted_price']}. "
                f"Backtested directional accuracy: {acc * 100:.1f}%."
                + (" This is close to chance, so treat the signal as weak." if acc is not None and acc < 0.55 else "")
            )
        if s.get("risk_level"):
            lines.append(f"**Risk ({s['risk_level']}):** " + " ".join(s["risk_factors"][:4]))
        report = results.get("generate_report")
        if report:
            lines.append(f"**Report:** {report['message']} ({report['download_url']})")
        conclusion = AgentService._conclusion(s)
        if conclusion:
            lines.append(conclusion)
        if not lines:
            lines.append("I could not gather enough evidence to answer that question.")
        return "\n\n".join(lines)

    @staticmethod
    def _conclusion(s: Dict) -> str:
        votes = []
        if s.get("short_term_outlook") and (s.get("model_confidence") or 0) >= 0.55:
            votes.append(("ML model", s["short_term_outlook"].lower()))
        if s.get("technical_bias"):
            votes.append(("technicals", s["technical_bias"]))
        if s.get("news_sentiment") in ("positive", "negative"):
            votes.append(("news sentiment", "bullish" if s["news_sentiment"] == "positive" else "bearish"))
        if not votes:
            return ""
        directions = {d for _, d in votes if d != "neutral"}
        detail = ", ".join(f"{name}: {d}" for name, d in votes)
        if len(directions) == 1:
            view = f"the available evidence leans **{directions.pop()}** ({detail})"
        elif not directions:
            view = f"the available evidence is **neutral** ({detail})"
        else:
            view = f"the signals are **mixed** ({detail}), so there is no clear short-term edge"
        risk = f" Risk level: {s['risk_level']}." if s.get("risk_level") else ""
        return (f"**Conclusion:** {view}.{risk} This is probabilistic, not a recommendation, "
                "and can change quickly with new information.")

    # -- sessions -----------------------------------------------------------
    def _history(self, session_id: str) -> List[Dict]:
        try:
            return [{"role": m["role"], "content": m["content"]}
                    for m in self.repo.find("chat_messages", limit=12, session_id=session_id)]
        except Exception:
            return []

    def chat(self, symbol: str, question: str, session_id: str = None, user_id: str = None) -> Dict:
        symbol = base_symbol(symbol)
        history = []
        try:
            if session_id and self.repo.find_one("chat_sessions", id=session_id, stock_id=symbol):
                history = self._history(session_id)
            else:
                session_id = self.repo.insert("chat_sessions", {"stock_id": symbol, "user_id": user_id})["id"]
        except Exception as exc:
            logger.warning("Chat session storage unavailable: %s", exc)

        intents = self.detect_intent(question)
        tools = self.select_tools(intents)
        execution = self.execute_tools(symbol, tools, question)
        response = self.generate_response(symbol, question, intents, execution, history)
        response["session_id"] = session_id

        try:
            self.repo.insert("chat_messages", {"session_id": session_id, "role": "user", "content": question})
            self.repo.insert("chat_messages", {"session_id": session_id, "role": "assistant",
                                               "content": response["answer"], "tools_used": ",".join(tools)})
        except Exception as exc:
            logger.warning("Could not store chat messages: %s", exc)
        return response


agent_service = AgentService()

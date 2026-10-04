"""Tools the agent can invoke. Each tool takes the symbol plus keyword args
and returns JSON-serialisable evidence."""

from typing import Callable, Dict

from services.fundamentals_service import get_fundamentals as _get_fundamentals
from services.indicator_service import get_technical_indicators as _get_indicators
from services.market_data_service import stock_service
from services.news_service import fetch_latest_news, persist_articles
from services.prediction_service import prediction_service
from services.rag.rag_service import rag_service
from services.risk_service import calculate_risk as _calculate_risk


def get_live_price(symbol: str, **_) -> Dict:
    return stock_service.get_live_price(symbol)


def get_historical_prices(symbol: str, period: str = "6mo", **_) -> Dict:
    df = stock_service.get_price_history(symbol, period)
    closes = df["Close"]
    return {
        "period": period,
        "start": df["Date"].iloc[0].strftime("%Y-%m-%d"),
        "end": df["Date"].iloc[-1].strftime("%Y-%m-%d"),
        "start_close": round(float(closes.iloc[0]), 2),
        "end_close": round(float(closes.iloc[-1]), 2),
        "change_pct": round((float(closes.iloc[-1]) / float(closes.iloc[0]) - 1) * 100, 2),
        "high": round(float(df["High"].max()), 2),
        "low": round(float(df["Low"].min()), 2),
        "metrics": stock_service.get_stock_metrics(symbol),
    }


def get_technical_indicators(symbol: str, **_) -> Dict:
    data = _get_indicators(stock_service.get_price_history(symbol, "max"))
    data.pop("series", None)
    return data


def get_fundamentals(symbol: str, **_) -> Dict:
    return _get_fundamentals(symbol)


def search_latest_news(symbol: str, **_) -> Dict:
    news = fetch_latest_news(symbol)
    if news["articles"]:
        rag_service.ingest_news(symbol, news["articles"])
        try:
            persist_articles(symbol, news["articles"])
        except Exception:
            pass
    return {
        "provider_available": news["provider_available"],
        "sentiment_summary": news["sentiment_summary"],
        "articles": [
            {
                "title": a.get("title"),
                "source": (a.get("source") or {}).get("name"),
                "url": a.get("url"),
                "published_at": a.get("publishedAt"),
                "retrieved_at": a.get("retrieved_at"),
                "sentiment": a.get("sentiment"),
            }
            for a in news["articles"]
        ],
    }


def retrieve_company_documents(symbol: str, query: str = "", **_) -> Dict:
    name = stock_service.get_stock(symbol)["name"]
    # Anchor the user's question to the company so short questions still retrieve context.
    return rag_service.build_context(symbol, f"{name} {symbol} {query} business drivers outlook risks")


def run_ml_prediction(symbol: str, horizon: int = 5, **_) -> Dict:
    return prediction_service.predict(symbol, horizon)


def calculate_risk(symbol: str, prediction: Dict = None, sentiment: Dict = None,
                   indicators: Dict = None, **_) -> Dict:
    return _calculate_risk(stock_service.get_price_history(symbol, "max"), prediction, sentiment, indicators)


def generate_report(symbol: str, **_) -> Dict:
    return {
        "download_url": f"/api/stock/{symbol}/report.pdf",
        "message": "A complete PDF analysis report can be downloaded from this link.",
    }


TOOLS: Dict[str, Callable] = {
    "get_live_price": get_live_price,
    "get_historical_prices": get_historical_prices,
    "get_technical_indicators": get_technical_indicators,
    "get_fundamentals": get_fundamentals,
    "search_latest_news": search_latest_news,
    "retrieve_company_documents": retrieve_company_documents,
    "run_ml_prediction": run_ml_prediction,
    "calculate_risk": calculate_risk,
    "generate_report": generate_report,
}

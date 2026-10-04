"""Tests for the ML prediction layer, the agent and the v2 API."""

import pytest

from repositories import set_repository
from repositories.excel_store import ExcelStore


@pytest.fixture(autouse=True)
def temp_repo(tmp_path):
    set_repository(ExcelStore(str(tmp_path / "db.xlsx")))
    yield
    set_repository(None)


@pytest.fixture(autouse=True)
def no_llm(monkeypatch):
    from core.settings import settings
    monkeypatch.setattr(settings, "LLM_ENABLED", False)


def test_prediction_contract_and_storage():
    from repositories import get_repository
    from services.prediction_service import PredictionService

    svc = PredictionService()
    result = svc.predict("TCS", horizon=5)
    assert result["predicted_direction"] in {"up", "down"}
    assert 0.5 <= result["confidence"] <= 1
    assert result["outlook"] in {"Bullish", "Neutral", "Bearish"}
    bt = result["backtest"]
    for key in ("directional_accuracy", "baseline_accuracy", "mae", "rmse"):
        assert bt[key] is not None
    assert result["model_version"].endswith(result["model_version"].split("-")[-1])
    stored = get_repository().find("predictions", stock_id="TCS")
    assert len(stored) == 1 and stored[0]["horizon"] == 5
    # Predicting again for the same date/model does not duplicate the record.
    svc.predict("TCS", horizon=5)
    assert len(get_repository().find("predictions", stock_id="TCS")) == 1


def test_prediction_evaluation_fills_outcomes():
    from repositories import get_repository
    from services.prediction_service import PredictionService

    get_repository().insert("predictions", {
        "stock_id": "INFY", "prediction_date": "2025-01-01", "target_date": "2025-01-08",
        "horizon": 5, "base_price": 1.0, "predicted_price": 2.0, "predicted_direction": "up",
        "confidence": 0.6, "model_version": "test",
    })
    report = PredictionService().evaluate_prediction("INFY")
    assert report["evaluated"] == 1
    assert report["live_directional_accuracy"] == 1.0


def test_agent_intent_and_tool_selection():
    from services.agent.agent_service import AgentService

    agent = AgentService()
    intents = agent.detect_intent("Will the stock decrease over the next few days?")
    assert intents == ["outlook"]
    tools = agent.select_tools(intents)
    assert {"run_ml_prediction", "search_latest_news", "retrieve_company_documents",
            "calculate_risk", "get_technical_indicators"} <= set(tools)
    assert tools.index("calculate_risk") > tools.index("run_ml_prediction")
    assert agent.detect_intent("hello there") == ["overview"]
    assert "technical" in agent.detect_intent("What is the RSI?")


def test_agent_degrades_gracefully_when_a_tool_fails():
    from services.agent.agent_service import AgentService
    from services.agent.tools import TOOLS

    def broken(symbol, **_):
        raise RuntimeError("provider down")

    agent = AgentService(tools={**TOOLS, "get_technical_indicators": broken})
    response = agent.chat("TCS", "Show me the RSI and current price")
    trace = {t["tool"]: t["status"] for t in response["tool_trace"]}
    assert trace["get_technical_indicators"] == "error"
    assert trace["get_live_price"] == "ok"
    assert response["answer"] and response["disclaimer"]


def test_api_endpoints():
    from app import app
    from core.rate_limit import reset_rate_limits

    reset_rate_limits()
    client = app.test_client()
    assert client.get("/api/health").json["status"] == "ok"
    assert client.get("/api/stock/NOPE/price").status_code == 404
    assert client.get("/api/stock/%3Cscript%3E/price").status_code == 400

    chat = client.post("/api/stock/RELIANCE.NS/agent/chat", json={"question": "What is the current price?"})
    assert chat.status_code == 200
    body = chat.json
    assert body["symbol"] == "RELIANCE" and body["session_id"]
    assert any(s["kind"] == "market_data" for s in body["sources"])

    follow_up = client.post("/api/stock/RELIANCE/agent/chat",
                            json={"question": "And the risk?", "session_id": body["session_id"]})
    assert follow_up.json["session_id"] == body["session_id"]
    assert client.post("/api/stock/RELIANCE/agent/chat", json={}).status_code == 400

    pdf = client.get("/api/stock/INFY/report.pdf")
    assert pdf.status_code == 200 and pdf.data[:4] == b"%PDF"

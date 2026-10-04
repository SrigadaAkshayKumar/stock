# API Reference

Base URL: `http://localhost:10000/api`. Symbols can be passed as `TCS`, `TCS.NS` or
`TCS.BO`; the exchange suffix is stripped. Invalid symbols return `400`, and unknown symbols `404`.

## System

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Status and which optional providers are configured |
| GET | `/stocks` | Supported stocks with metadata |

## Market data & analysis

| Method | Path | Description |
|---|---|---|
| GET | `/stock/<s>` | Legacy price table, chart and news (`chart_period`, `table_period`, `refresh`) |
| GET | `/stock/<s>/price` | Latest price with `source`, `as_of`, `is_live`, `retrieved_at` |
| GET | `/stock/<s>/history?period=1y` | OHLCV arrays (`1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max`) |
| GET | `/stock/<s>/indicators` | Latest indicators, interpreted signals, technical bias, chart series |
| GET | `/stock/<s>/fundamentals` | Company metadata, price-derived metrics, provider metrics (when live) |
| GET | `/stock/<s>/forecast?horizon=5` | ML prediction (horizon 1–20 trading days) with backtest metrics |
| GET | `/stock/<s>/forecast/evaluation` | Realised outcomes of stored predictions, live accuracy |
| GET | `/stock/<s>/risk` | Volatility, drawdown, VaR/CVaR, Sharpe, risk level, risk factors |
| GET | `/stock/<s>/news` | Latest articles with sentiment (requires `NEWS_API_KEY`) |
| GET | `/stock/<s>/rag/search?q=...` | Ranked, source-attributed context from the RAG layer |
| GET | `/stock/<s>/analysis` | Consolidated analysis used by the dashboard (cached; `refresh=true` bypasses) |
| GET | `/stock/<s>/predict` | Legacy long-term linear-regression projection |

## AI agent

`POST /stock/<s>/agent/chat` (rate limited, 30/min per client by default)

```json
{ "question": "Will the stock decrease over the next few days?", "session_id": null }
```

Response:

```jsonc
{
  "symbol": "TCS",
  "session_id": "…",                 // send back to continue the conversation
  "answer": "…",                     // markdown-style text with **bold** sections
  "answer_mode": "llm" | "rule_based",
  "intents": ["outlook"],
  "analysis": { "short_term_outlook": "Bullish", "prediction_horizon": "5 trading sessions",
                "model_confidence": 0.63, "technical_bias": "bearish", "risk_level": "Medium",
                "key_technical_signals": ["…"], "risk_factors": ["…"], "...": "…" },
  "sources": [ { "kind": "retrieved_document|news|market_data|model_output", "title": "…",
                 "source": "…", "url": "…", "published_at": "…", "retrieved_at": "…",
                 "recency": "current|historical|background" } ],
  "tool_trace": [ { "tool": "run_ml_prediction", "status": "ok", "duration_ms": 41.2 } ],
  "disclaimer": "…"
}
```

## Reports & background jobs

| Method | Path | Description |
|---|---|---|
| GET | `/stock/<s>/report.pdf` | Generate and download the PDF report synchronously |
| POST | `/stock/<s>/reports` | Queue report generation → `202 {id, status}` |
| POST | `/stock/<s>/ingest` | Queue news/document ingestion and embedding → `202 {id}` |
| GET | `/jobs/<id>` | Job status: `queued`, `running`, `completed` (with `result`) or `failed` |
| GET | `/reports/<id>/download` | Download a generated report |

## Errors

| Status | Meaning |
|---|---|
| 400 | Validation error (`{"error": "…"}`) |
| 404 | Unknown stock, job or report |
| 429 | Rate limit exceeded (`Retry-After` header) |
| 500 | Unexpected server error |

# Implementation Roadmap & Status

Status of the project agenda ("AI-Powered Stock Market Analysis & Prediction Platform").
✅ done in this upgrade · 🟡 foundation in place, follow-up needed · ⏳ not started

## Phase 1: Application modernisation
* ✅ Modular layers: `core/`, `routes/`, `services/`, `repositories/`, `workers/`
* ✅ Repository layer with Excel dev database; PostgreSQL schema prepared
* ✅ Environment-based configuration (`backend/.env.example`)
* 🟡 PostgreSQL repository implementation (switch with `DB_BACKEND=postgres`)

## Phase 2: Live market system
* ✅ Market data service with optional live data (yfinance) and offline fallback
* ✅ Technical indicators and market metrics; stock dashboard
* ✅ Caching (Redis/in-memory), retries, timeouts, rate limiting
* ✅ Period filters on the legacy stock endpoint (were ignored before)

## Phase 3: ML upgrade
* ✅ Feature-engineering pipeline, candidate model selection
* ✅ Walk-forward backtesting (accuracy, baseline, MAE, RMSE, MAPE)
* ✅ Prediction tracking, outcome evaluation, model versioning
* 🟡 Scheduled evaluation/retraining and drift alerts

## Phase 4: RAG & information pipeline
* ✅ News and document ingestion, cleaning, chunking, embeddings, vector store
* ✅ Relevance × freshness ranking, source grounding, timestamps, current/historical labels
* ✅ Prompt-injection screening of retrieved content
* 🟡 More sources (exchange filings, earnings transcripts); neural embeddings; managed vector DB

## Phase 5: AI stock agent
* ✅ Intent detection, tool selection/execution, evidence-backed responses
* ✅ All nine agent tools; stock-specific chat UI with sources and tool trace
* ✅ Optional Claude synthesis with rule-based fallback

## Phase 6: Reporting
* ✅ Consolidated analysis object and 14-section PDF report (sync + async job)

## Phase 7: Scalability & deployment
* ✅ Background job queue, Dockerfiles, docker-compose, CI workflow, centralised logging
* 🟡 SQS workers, S3 report storage, ECR/ECS deploy job, CloudWatch alarms

## Phase 8: HLD/LLD documentation
* ✅ [HLD](HLD.md), [LLD](LLD.md) with sequence diagrams, [API](API.md),
  [Database + ER diagram](DATABASE.md), [Model lifecycle](MODEL_LIFECYCLE.md),
  [AWS deployment](DEPLOYMENT_AWS.md)

## Not yet covered
* ⏳ Server-side authentication/authorisation of API requests (Firebase token verification)
* ⏳ Fundamentals for offline mode (needs a licensed data source)

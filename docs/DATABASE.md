# Database Design

**Current development storage:** an Excel workbook (`backend/storage/dev_database.xlsx`,
created automatically) with one sheet per table. Implementation:
`backend/repositories/excel_store.py`.

**Target:** PostgreSQL (AWS RDS) once the project is tested and deployed to the cloud. The schema
is in [`backend/db/schema.sql`](../backend/db/schema.sql) and uses the same table and column
names (`backend/repositories/schema.py`). Services only use the repository interface
(`insert`, `find`, `find_one`, `update`), so switching means adding a Postgres repository
and setting `DB_BACKEND=postgres`. No service code changes.

Price history is still read from the CSV dataset (`backend/services/data`), or from yfinance
when `LIVE_MARKET_DATA=true`. The `stock_prices` table is defined for the PostgreSQL migration.

## Tables

| Table | Purpose |
|---|---|
| users | User accounts and profile information |
| stocks | Stock identifiers, exchanges and company metadata |
| stock_prices | Historical and processed price/volume data |
| technical_indicators | Calculated indicators and their timestamps |
| fundamentals | Structured company/fundamental information |
| news_articles | News content, source, publication time, retrieval time, sentiment |
| documents | RAG source documents and ingestion metadata |
| predictions | ML predictions, confidence, horizon, model version and realised outcome |
| analysis_results | Generated analysis summaries and evidence references |
| chat_sessions | Stock-specific AI agent sessions |
| chat_messages | User questions and agent responses (with tools used) |
| reports | Generated report metadata and storage references |

## ER diagram

```mermaid
erDiagram
    USERS ||--o{ CHAT_SESSIONS : starts
    STOCKS ||--o{ STOCK_PRICES : has
    STOCKS ||--o{ TECHNICAL_INDICATORS : has
    STOCKS ||--o{ FUNDAMENTALS : has
    STOCKS ||--o{ NEWS_ARTICLES : mentioned_in
    STOCKS ||--o{ DOCUMENTS : described_by
    STOCKS ||--o{ PREDICTIONS : forecast_for
    STOCKS ||--o{ ANALYSIS_RESULTS : analysed_in
    STOCKS ||--o{ CHAT_SESSIONS : context_of
    STOCKS ||--o{ REPORTS : reported_in
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : contains

    PREDICTIONS {
        text id PK
        text stock_id FK
        date prediction_date
        date target_date
        int horizon
        numeric base_price
        numeric predicted_price
        text predicted_direction
        float confidence
        text model_version
        timestamptz created_at
        numeric actual_price
        text actual_direction
        bool is_correct
        timestamptz evaluated_at
    }
    NEWS_ARTICLES {
        text id PK
        text stock_id FK
        text title
        text url UK
        text source
        timestamptz published_at
        timestamptz retrieved_at
        text sentiment
    }
    CHAT_MESSAGES {
        text id PK
        text session_id FK
        text role
        text content
        text tools_used
        timestamptz created_at
    }
```

## Indexing

* `stock_prices (stock_id, date DESC)`: time-series lookups.
* `news_articles (stock_id, published_at DESC)`: freshest news first.
* Partial index `predictions (target_date) WHERE evaluated_at IS NULL`: finds pending evaluations.
* `chat_messages (session_id, created_at)`: conversation history.

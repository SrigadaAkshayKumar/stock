"""Table definitions shared by the Excel dev store and PostgreSQL schema.

Keep this in sync with ``db/schema.sql``.
"""

TABLES = {
    "users": ["id", "email", "display_name", "created_at"],
    "stocks": ["id", "symbol", "name", "exchange", "sector", "industry", "created_at"],
    "stock_prices": ["id", "stock_id", "date", "open", "high", "low", "close", "volume"],
    "technical_indicators": ["id", "stock_id", "date", "name", "value", "created_at"],
    "fundamentals": ["id", "stock_id", "metric", "value", "source", "as_of", "created_at"],
    "news_articles": [
        "id", "stock_id", "title", "description", "url", "source",
        "published_at", "retrieved_at", "sentiment", "sentiment_score",
    ],
    "documents": [
        "id", "stock_id", "title", "source", "url", "doc_type",
        "published_at", "ingested_at", "chunk_count",
    ],
    "predictions": [
        "id", "stock_id", "prediction_date", "target_date", "horizon",
        "base_price", "predicted_price", "predicted_direction", "confidence",
        "model_version", "created_at", "actual_price", "actual_direction",
        "is_correct", "evaluated_at",
    ],
    "analysis_results": ["id", "stock_id", "summary", "outlook", "evidence_refs", "created_at"],
    "chat_sessions": ["id", "stock_id", "user_id", "created_at"],
    "chat_messages": ["id", "session_id", "role", "content", "tools_used", "created_at"],
    "reports": ["id", "stock_id", "file_name", "storage_path", "status", "created_at"],
}

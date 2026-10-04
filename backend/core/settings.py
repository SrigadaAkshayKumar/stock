"""
Centralised, environment-driven settings.

All secrets (API keys, database URLs) are read from the environment so that
nothing sensitive lives in source control. See ``backend/.env.example``.
"""

import os

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def _bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    ENV = os.getenv("APP_ENV", "development")

    # Market data
    PRICE_DATA_DIR = os.getenv("PRICE_DATA_DIR", os.path.join(BACKEND_ROOT, "services", "data"))
    LIVE_MARKET_DATA = _bool("LIVE_MARKET_DATA", False)  # use yfinance when True
    DEFAULT_EXCHANGE_SUFFIX = os.getenv("DEFAULT_EXCHANGE_SUFFIX", ".NS")

    # Storage. "excel" is the development database; "postgres" is the target
    # (see db/schema.sql) once the project is deployed to the cloud.
    DB_BACKEND = os.getenv("DB_BACKEND", "excel")
    STORAGE_DIR = os.getenv("STORAGE_DIR", os.path.join(BACKEND_ROOT, "storage"))
    EXCEL_DB_PATH = os.getenv("EXCEL_DB_PATH", os.path.join(STORAGE_DIR, "dev_database.xlsx"))
    REPORTS_DIR = os.getenv("REPORTS_DIR", os.path.join(STORAGE_DIR, "reports"))

    # RAG
    DOCUMENTS_DIR = os.getenv("DOCUMENTS_DIR", os.path.join(BACKEND_ROOT, "data", "documents"))
    RAG_CHUNK_WORDS = int(os.getenv("RAG_CHUNK_WORDS", "180"))
    RAG_CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "40"))
    RAG_FRESHNESS_HALF_LIFE_DAYS = float(os.getenv("RAG_FRESHNESS_HALF_LIFE_DAYS", "14"))
    RAG_CURRENT_WINDOW_DAYS = int(os.getenv("RAG_CURRENT_WINDOW_DAYS", "7"))

    # News
    NEWS_API_KEY = os.getenv("NEWS_API_KEY")
    NEWS_PAGE_SIZE = int(os.getenv("NEWS_PAGE_SIZE", "10"))

    # AI agent / LLM (optional - the agent works without it)
    ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-5-5")
    LLM_ENABLED = _bool("LLM_ENABLED", True)

    # ML
    MODEL_SCHEMA_VERSION = "2"
    PREDICTION_HORIZONS = [int(h) for h in os.getenv("PREDICTION_HORIZONS", "1,5").split(",")]

    # Reliability
    RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))
    HTTP_TIMEOUT_SECONDS = float(os.getenv("HTTP_TIMEOUT_SECONDS", "8"))
    WORKER_THREADS = int(os.getenv("WORKER_THREADS", "4"))
    CACHE_TTL_ANALYSIS = int(os.getenv("CACHE_TTL_ANALYSIS", "600"))


settings = Settings()

DISCLAIMER = (
    "This platform provides AI-generated market analysis for educational and informational "
    "purposes only. Predictions and analysis are based on historical data, available market "
    "information, technical indicators and retrieved news sources. They are probabilistic and "
    "may be inaccurate or change rapidly due to market conditions and new information. The "
    "platform does not guarantee returns and should not be considered personalized investment "
    "advice. Users should conduct their own research and consult a qualified financial "
    "professional before making investment decisions."
)

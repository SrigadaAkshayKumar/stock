"""Tests for NewsAPI request timeout configuration and graceful error handling (fixes #249)."""

from unittest.mock import MagicMock, patch
import pytest
import requests

from services.sentiment_service import (
    DEFAULT_NEWS_CONNECT_TIMEOUT,
    DEFAULT_NEWS_READ_TIMEOUT,
    fetch_stock_news_with_sentiment,
    get_news_timeout,
)


def test_default_news_timeout_is_finite_tuple():
    """Verify default timeout values are finite positive floats for connect and read."""
    timeout = get_news_timeout()
    assert isinstance(timeout, tuple)
    assert len(timeout) == 2
    connect_t, read_t = timeout
    assert isinstance(connect_t, float) and connect_t > 0
    assert isinstance(read_t, float) and read_t > 0
    assert connect_t == DEFAULT_NEWS_CONNECT_TIMEOUT
    assert read_t == DEFAULT_NEWS_READ_TIMEOUT


def test_news_timeout_configurable_via_env(monkeypatch):
    """Verify NewsAPI timeouts can be overridden using environment variables."""
    monkeypatch.setenv("NEWS_CONNECT_TIMEOUT", "3.5")
    monkeypatch.setenv("NEWS_READ_TIMEOUT", "7.5")

    timeout = get_news_timeout()
    assert timeout == (3.5, 7.5)


def test_news_timeout_falls_back_on_invalid_env(monkeypatch):
    """Verify get_news_timeout safely falls back to defaults when env vars are non-numeric."""
    monkeypatch.setenv("NEWS_CONNECT_TIMEOUT", "not-a-number")
    monkeypatch.setenv("NEWS_READ_TIMEOUT", "")

    timeout = get_news_timeout()
    assert timeout == (DEFAULT_NEWS_CONNECT_TIMEOUT, DEFAULT_NEWS_READ_TIMEOUT)


def test_requests_get_specifies_finite_timeout(monkeypatch):
    """Verify requests.get in fetch_stock_news_with_sentiment passes finite timeout."""
    monkeypatch.setenv("NEWS_API_KEY", "test_key_123")
    monkeypatch.setenv("NEWS_CONNECT_TIMEOUT", "4.0")
    monkeypatch.setenv("NEWS_READ_TIMEOUT", "8.0")

    mock_resp = MagicMock()
    mock_resp.json.return_value = {"status": "ok", "articles": []}

    with patch("requests.get", return_value=mock_resp) as mock_get:
        result = fetch_stock_news_with_sentiment("TCS.NS")

        assert mock_get.called
        _, kwargs = mock_get.call_args
        assert "timeout" in kwargs
        assert kwargs["timeout"] == (4.0, 8.0)
        assert result["articles"] == []
        assert result["sentiment_summary"]["total_articles"] == 0


def test_newsapi_timeout_exception_handled_gracefully(monkeypatch):
    """Verify a NewsAPI timeout returns empty fallback rather than raising an exception."""
    monkeypatch.setenv("NEWS_API_KEY", "test_key_123")

    with patch("requests.get", side_effect=requests.exceptions.Timeout("Connection timed out")):
        result = fetch_stock_news_with_sentiment("RELIANCE.NS")

        assert result is not None
        assert result["articles"] == []
        summary = result["sentiment_summary"]
        assert summary["total_articles"] == 0
        assert summary["sentiment_index"] == 0.0
        assert summary["sentiment_strength"] == "weak"


def test_newsapi_connection_error_handled_gracefully(monkeypatch):
    """Verify connection errors are caught and return the empty fallback."""
    monkeypatch.setenv("NEWS_API_KEY", "test_key_123")

    with patch("requests.get", side_effect=requests.exceptions.ConnectionError("DNS failure")):
        result = fetch_stock_news_with_sentiment("INFY.BO")

        assert result["articles"] == []
        assert result["sentiment_summary"]["total_articles"] == 0


def test_newsapi_http_error_handled_gracefully(monkeypatch):
    """Verify HTTP errors (e.g., 504 Gateway Timeout) return fallback without crashing."""
    monkeypatch.setenv("NEWS_API_KEY", "test_key_123")

    with patch("requests.get", side_effect=requests.exceptions.HTTPError("504 Gateway Timeout")):
        result = fetch_stock_news_with_sentiment("AAPL")

        assert result["articles"] == []
        assert result["sentiment_summary"]["total_articles"] == 0


def test_newsapi_successful_response_processed(monkeypatch):
    """Verify normal successful NewsAPI responses continue to be analyzed correctly."""
    monkeypatch.setenv("NEWS_API_KEY", "test_key_123")

    sample_articles = [
        {
            "title": "TCS reports record profit and massive revenue growth",
            "description": "Tech giant beats expectations with strong quarterly expansion.",
            "url": "https://example.com/tcs-growth",
            "publishedAt": "2026-10-14T08:00:00Z",
        }
    ]

    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "status": "ok",
        "articles": sample_articles,
    }

    with patch("requests.get", return_value=mock_resp):
        result = fetch_stock_news_with_sentiment("TCS")

        assert len(result["articles"]) == 1
        article = result["articles"][0]
        assert article["title"] == "TCS reports record profit and massive revenue growth"
        assert article["sentiment"] in {"positive", "neutral", "negative"}
        assert "sentiment_score" in article
        assert result["sentiment_summary"]["total_articles"] == 1


def test_newsapi_missing_api_key_returns_empty_without_request(monkeypatch):
    """Verify empty result is returned without making an HTTP request when no key is set."""
    monkeypatch.setenv("NEWS_API_KEY", "")

    with patch("requests.get") as mock_get:
        result = fetch_stock_news_with_sentiment("TCS")
        mock_get.assert_not_called()
        assert result["articles"] == []
        assert result["sentiment_summary"]["total_articles"] == 0


def test_fetch_latest_news_handles_timeout_gracefully(monkeypatch):
    """Verify services.news_service.fetch_latest_news uses timeout and handles timeout gracefully."""
    from core.settings import settings
    from services.news_service import fetch_latest_news

    monkeypatch.setattr(settings, "NEWS_API_KEY", "test_key_123")

    with patch("requests.get", side_effect=requests.exceptions.Timeout("Connection timed out")) as mock_get:
        res = fetch_latest_news("TCS")
        assert mock_get.called
        _, kwargs = mock_get.call_args
        assert "timeout" in kwargs
        assert kwargs["timeout"] == (settings.NEWS_CONNECT_TIMEOUT, settings.NEWS_READ_TIMEOUT)
        assert res["articles"] == []
        assert res["provider_available"] is False


import unittest
from unittest.mock import patch

import requests

from services.sentiment_service import fetch_stock_news_with_sentiment


class SentimentServiceTests(unittest.TestCase):
    @patch("services.sentiment_service.requests.get")
    @patch("services.sentiment_service.os.getenv", return_value="test-key")
    def test_news_request_uses_finite_timeout(self, mock_getenv, mock_get):
        mock_get.return_value.json.return_value = {"articles": [], "status": "ok"}
        mock_get.return_value.raise_for_status.return_value = None

        fetch_stock_news_with_sentiment("TCS")

        mock_get.assert_called_once()
        self.assertEqual(mock_get.call_args.kwargs["timeout"], (3, 10))
        mock_get.return_value.raise_for_status.assert_called_once()

    @patch("services.sentiment_service.requests.get")
    @patch("services.sentiment_service.os.getenv", return_value="test-key")
    def test_news_timeout_degrades_gracefully(self, mock_getenv, mock_get):
        mock_get.side_effect = requests.exceptions.Timeout()

        result = fetch_stock_news_with_sentiment("TCS")

        self.assertEqual(result["articles"], [])
        self.assertEqual(
            result["sentiment_summary"],
            {
                "total_articles": 0,
                "sentiment_distribution": {"positive": 0, "negative": 0, "neutral": 0},
                "sentiment_percentages": {"positive": 0, "negative": 0, "neutral": 0},
                "overall_sentiment": "neutral",
                "sentiment_index": 0.0,
                "average_confidence": 0.0,
                "average_financial_context": 0.0,
                "keyword_analysis": {"positive": 0, "negative": 0, "neutral": 0},
                "sentiment_strength": "weak",
            },
        )


if __name__ == "__main__":
    unittest.main()

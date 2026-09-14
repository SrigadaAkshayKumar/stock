import unittest
from unittest.mock import patch

import requests

from services.sentiment_service import fetch_stock_news_with_sentiment


class SentimentServiceTests(unittest.TestCase):
    @patch("services.sentiment_service.requests.get")
    def test_news_request_uses_finite_timeout(self, mock_get):
        mock_get.return_value.json.return_value = {"articles": [], "status": "ok"}

        fetch_stock_news_with_sentiment("TCS")

        mock_get.assert_called_once()
        self.assertEqual(mock_get.call_args.kwargs["timeout"], (3, 10))

    @patch("services.sentiment_service.requests.get")
    def test_news_timeout_degrades_gracefully(self, mock_get):
        mock_get.side_effect = requests.exceptions.Timeout()

        result = fetch_stock_news_with_sentiment("TCS")

        self.assertEqual(result["articles"], [])
        self.assertEqual(result["sentiment_summary"], {})


if __name__ == "__main__":
    unittest.main()

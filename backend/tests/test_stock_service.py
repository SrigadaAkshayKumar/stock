import unittest

import pandas as pd

from services.stock_service import filter_stock_data


class FilterStockDataTests(unittest.TestCase):
    def setUp(self):
        self.data = pd.DataFrame(
            {
                "Date": pd.to_datetime(
                    [
                        "2024-01-01",
                        "2024-01-15",
                        "2024-02-01",
                        "2024-03-01",
                        "2024-04-01",
                        "2024-05-01",
                        "2024-06-01",
                    ]
                ),
                "Close": [100, 101, 102, 103, 104, 105, 106],
            }
        )

    def test_one_day_returns_latest_row(self):
        result = filter_stock_data(self.data, "1d")

        self.assertEqual(len(result), 1)
        self.assertEqual(result.iloc[0]["Date"], pd.Timestamp("2024-06-01"))

    def test_five_days_returns_latest_five_rows(self):
        result = filter_stock_data(self.data, "5d")

        self.assertEqual(len(result), 5)
        self.assertEqual(result.iloc[0]["Date"], pd.Timestamp("2024-02-01"))
        self.assertEqual(result.iloc[-1]["Date"], pd.Timestamp("2024-06-01"))

    def test_month_period_filters_from_latest_date(self):
        result = filter_stock_data(self.data, "3mo")

        self.assertEqual(list(result["Date"]), [
            pd.Timestamp("2024-03-01"),
            pd.Timestamp("2024-04-01"),
            pd.Timestamp("2024-05-01"),
            pd.Timestamp("2024-06-01"),
        ])

    def test_year_period_returns_available_history(self):
        result = filter_stock_data(self.data, "1y")

        self.assertEqual(len(result), len(self.data))
        self.assertEqual(result.iloc[0]["Date"], self.data.iloc[0]["Date"])

    def test_ytd_starts_at_beginning_of_latest_year(self):
        result = filter_stock_data(self.data, "ytd")

        self.assertEqual(len(result), len(self.data))

    def test_max_returns_all_rows(self):
        result = filter_stock_data(self.data, "max")

        pd.testing.assert_frame_equal(result, self.data)

    def test_invalid_period_is_rejected(self):
        with self.assertRaises(ValueError):
            filter_stock_data(self.data, "2d")


if __name__ == "__main__":
    unittest.main()

import unittest

import pandas as pd

from services.stock_service import get_previous_close


class PreviousCloseTests(unittest.TestCase):
    def test_returns_close_from_immediately_previous_trading_session(self):
        data = pd.DataFrame(
            {
                "Date": pd.to_datetime(
                    ["2024-01-01", "2024-01-02", "2024-01-03"]
                ),
                "Close": [100.0, 105.0, 110.0],
            }
        )

        self.assertEqual(get_previous_close(data), 105.0)

    def test_returns_none_when_only_one_row_is_available(self):
        data = pd.DataFrame(
            {
                "Date": pd.to_datetime(["2024-01-01"]),
                "Close": [100.0],
            }
        )

        self.assertIsNone(get_previous_close(data))


if __name__ == "__main__":
    unittest.main()

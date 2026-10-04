"""
StockService / market-data layer.

Provides price history, latest price and summary metrics for a stock. By
default prices come from the local CSV dataset (``services/data``). When
``LIVE_MARKET_DATA=true`` the service first tries yfinance for live /
near-live data and falls back to the local dataset if the provider is
unavailable, so the platform keeps working offline.
"""

import json
import logging
import os
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

import pandas as pd

from core.settings import BACKEND_ROOT, settings
from core.validation import base_symbol

logger = logging.getLogger(__name__)

PERIOD_DAYS = {
    "1d": 1, "5d": 5, "1mo": 31, "3mo": 92, "6mo": 183,
    "1y": 365, "2y": 730, "5y": 1826, "10y": 3652,
}

_cache_lock = threading.Lock()
_frame_cache: Dict[str, tuple] = {}


class StockNotFoundError(LookupError):
    pass


def _load_metadata() -> Dict[str, Dict]:
    path = os.path.join(BACKEND_ROOT, "data", "stocks.json")
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


class StockService:
    def __init__(self, data_dir: str = None, live: bool = None):
        self.data_dir = data_dir or settings.PRICE_DATA_DIR
        self.live = settings.LIVE_MARKET_DATA if live is None else live
        self.metadata = _load_metadata()

    # -- discovery ----------------------------------------------------------
    def list_supported(self) -> List[Dict]:
        symbols = sorted(
            f[:-4].upper() for f in os.listdir(self.data_dir) if f.lower().endswith(".csv")
        )
        return [self.get_stock(s) for s in symbols]

    def get_stock(self, symbol: str) -> Dict:
        base = base_symbol(symbol)
        meta = self.metadata.get(base, {})
        return {
            "symbol": base,
            "name": meta.get("name", base),
            "exchange": meta.get("exchange", "NSE/BSE"),
            "sector": meta.get("sector"),
            "industry": meta.get("industry"),
        }

    # -- prices -------------------------------------------------------------
    def _load_csv(self, base: str) -> pd.DataFrame:
        path = os.path.join(self.data_dir, f"{base}.csv")
        if not os.path.exists(path):
            raise StockNotFoundError(f"No price data available for {base}")
        mtime = os.path.getmtime(path)
        with _cache_lock:
            cached = _frame_cache.get(path)
            if cached and cached[0] == mtime:
                return cached[1].copy()
        df = pd.read_csv(path)
        df["Date"] = pd.to_datetime(df["Date"], dayfirst=True, errors="coerce")
        df = df.dropna(subset=["Date"]).sort_values("Date").drop_duplicates("Date")
        for col in ("Open", "High", "Low", "Close", "Volume"):
            df[col] = pd.to_numeric(df[col], errors="coerce")
        df = df.dropna(subset=["Close"]).reset_index(drop=True)
        with _cache_lock:
            _frame_cache[path] = (mtime, df)
        return df.copy()

    def _load_live(self, base: str, period: str = "5y") -> Optional[pd.DataFrame]:
        try:
            import yfinance as yf  # optional dependency
            ticker = f"{base}{settings.DEFAULT_EXCHANGE_SUFFIX}"
            df = yf.Ticker(ticker).history(period=period, interval="1d", auto_adjust=False)
            if df is None or df.empty:
                return None
            df = df.reset_index()[["Date", "Open", "High", "Low", "Close", "Volume"]]
            df["Date"] = pd.to_datetime(df["Date"]).dt.tz_localize(None)
            return df
        except Exception as exc:  # provider down, rate limited, offline...
            logger.warning("Live market data unavailable for %s: %s", base, exc)
            return None

    def get_price_history(self, symbol: str, period: str = "max") -> pd.DataFrame:
        """Daily OHLCV sorted by date ascending, restricted to ``period``."""
        base = base_symbol(symbol)
        df = None
        source = "local_dataset"
        if self.live:
            df = self._load_live(base)
            if df is not None:
                source = "yfinance"
        if df is None:
            df = self._load_csv(base)
        df.attrs["source"] = source
        return filter_period(df, period)

    def get_live_price(self, symbol: str) -> Dict:
        df = self.get_price_history(symbol, "1mo")
        latest, prev = df.iloc[-1], (df.iloc[-2] if len(df) > 1 else df.iloc[-1])
        change = float(latest["Close"] - prev["Close"])
        return {
            "symbol": base_symbol(symbol),
            "price": round(float(latest["Close"]), 2),
            "open": round(float(latest["Open"]), 2),
            "high": round(float(latest["High"]), 2),
            "low": round(float(latest["Low"]), 2),
            "volume": int(latest["Volume"]) if pd.notna(latest["Volume"]) else None,
            "previous_close": round(float(prev["Close"]), 2),
            "change": round(change, 2),
            "change_pct": round(change / float(prev["Close"]) * 100, 2) if prev["Close"] else 0.0,
            "as_of": latest["Date"].strftime("%Y-%m-%d"),
            "source": df.attrs.get("source", "local_dataset"),
            "is_live": df.attrs.get("source") == "yfinance",
            "retrieved_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }

    def get_stock_metrics(self, symbol: str) -> Dict:
        df = self.get_price_history(symbol, "max")
        close = df["Close"]
        last_year = filter_period(df, "1y")

        def ret(days: int) -> Optional[float]:
            window = df[df["Date"] >= df["Date"].iloc[-1] - pd.Timedelta(days=days)]
            if len(window) < 2:
                return None
            return round((window["Close"].iloc[-1] / window["Close"].iloc[0] - 1) * 100, 2)

        return {
            "symbol": base_symbol(symbol),
            "last_close": round(float(close.iloc[-1]), 2),
            "high_52w": round(float(last_year["High"].max()), 2),
            "low_52w": round(float(last_year["Low"].min()), 2),
            "avg_volume_3m": int(filter_period(df, "3mo")["Volume"].mean()),
            "return_1m_pct": ret(30),
            "return_3m_pct": ret(91),
            "return_1y_pct": ret(365),
            "history_start": df["Date"].iloc[0].strftime("%Y-%m-%d"),
            "history_end": df["Date"].iloc[-1].strftime("%Y-%m-%d"),
            "trading_days": int(len(df)),
        }


def filter_period(df: pd.DataFrame, period: str) -> pd.DataFrame:
    """Restrict a price frame to a yfinance-style period relative to its last date."""
    if df.empty or period in (None, "max"):
        return df
    last = df["Date"].iloc[-1]
    if period == "ytd":
        out = df[df["Date"] >= pd.Timestamp(year=last.year, month=1, day=1)]
    elif period == "1d":
        out = df.tail(1)
    elif period == "5d":
        out = df.tail(5)
    elif period in PERIOD_DAYS:
        out = df[df["Date"] >= last - pd.Timedelta(days=PERIOD_DAYS[period])]
    else:
        return df
    out = out.copy()
    out.attrs = dict(df.attrs)
    return out


stock_service = StockService()

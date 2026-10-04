"""Technical indicator calculations (pure pandas, no external TA library)."""

from typing import Dict, List

import numpy as np
import pandas as pd


def rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).ewm(alpha=1 / period, adjust=False).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1 / period, adjust=False).mean()
    rs = gain / loss.replace(0, np.nan)
    return (100 - 100 / (1 + rs)).fillna(100)


def macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    line = close.ewm(span=fast, adjust=False).mean() - close.ewm(span=slow, adjust=False).mean()
    sig = line.ewm(span=signal, adjust=False).mean()
    return line, sig, line - sig


def bollinger(close: pd.Series, window: int = 20, k: float = 2.0):
    mid = close.rolling(window).mean()
    std = close.rolling(window).std()
    return mid + k * std, mid, mid - k * std


def atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    prev_close = df["Close"].shift()
    tr = pd.concat(
        [df["High"] - df["Low"], (df["High"] - prev_close).abs(), (df["Low"] - prev_close).abs()],
        axis=1,
    ).max(axis=1)
    return tr.ewm(alpha=1 / period, adjust=False).mean()


def compute_indicator_frame(df: pd.DataFrame) -> pd.DataFrame:
    """Return ``df`` with indicator columns appended."""
    out = df.copy()
    close = out["Close"]
    for w in (10, 20, 50, 200):
        out[f"SMA_{w}"] = close.rolling(w).mean()
    out["EMA_12"] = close.ewm(span=12, adjust=False).mean()
    out["EMA_26"] = close.ewm(span=26, adjust=False).mean()
    out["RSI_14"] = rsi(close)
    out["MACD"], out["MACD_signal"], out["MACD_hist"] = macd(close)
    out["BB_upper"], out["BB_mid"], out["BB_lower"] = bollinger(close)
    out["ATR_14"] = atr(out)
    out["VOL_20"] = close.pct_change().rolling(20).std() * np.sqrt(252)
    return out


def _round(value, digits: int = 2):
    return None if value is None or pd.isna(value) else round(float(value), digits)


def interpret(latest: pd.Series) -> List[Dict]:
    """Translate indicator values into human-readable signals."""
    signals = []
    close = latest["Close"]
    r = latest["RSI_14"]
    if pd.notna(r):
        if r >= 70:
            signals.append({"indicator": "RSI(14)", "signal": "bearish", "detail": f"RSI {r:.1f} is overbought (>70)"})
        elif r <= 30:
            signals.append({"indicator": "RSI(14)", "signal": "bullish", "detail": f"RSI {r:.1f} is oversold (<30)"})
        else:
            signals.append({"indicator": "RSI(14)", "signal": "neutral", "detail": f"RSI {r:.1f} is in the neutral zone"})
    if pd.notna(latest["MACD_hist"]):
        bullish = latest["MACD"] > latest["MACD_signal"]
        signals.append({
            "indicator": "MACD",
            "signal": "bullish" if bullish else "bearish",
            "detail": f"MACD is {'above' if bullish else 'below'} its signal line",
        })
    for w in (50, 200):
        sma = latest.get(f"SMA_{w}")
        if pd.notna(sma):
            above = close > sma
            signals.append({
                "indicator": f"SMA({w})",
                "signal": "bullish" if above else "bearish",
                "detail": f"Price is {'above' if above else 'below'} the {w}-day moving average ({sma:.2f})",
            })
    if pd.notna(latest.get("SMA_50")) and pd.notna(latest.get("SMA_200")):
        golden = latest["SMA_50"] > latest["SMA_200"]
        signals.append({
            "indicator": "Trend (50/200)",
            "signal": "bullish" if golden else "bearish",
            "detail": "50-day average is " + ("above" if golden else "below") + " the 200-day average",
        })
    if pd.notna(latest["BB_upper"]):
        if close > latest["BB_upper"]:
            signals.append({"indicator": "Bollinger", "signal": "bearish", "detail": "Price is above the upper Bollinger band (stretched)"})
        elif close < latest["BB_lower"]:
            signals.append({"indicator": "Bollinger", "signal": "bullish", "detail": "Price is below the lower Bollinger band (stretched)"})
    return signals


def get_technical_indicators(df: pd.DataFrame, series_points: int = 120) -> Dict:
    frame = compute_indicator_frame(df)
    latest = frame.iloc[-1]
    signals = interpret(latest)
    votes = {"bullish": 0, "bearish": 0, "neutral": 0}
    for s in signals:
        votes[s["signal"]] += 1
    if votes["bullish"] > votes["bearish"]:
        bias = "bullish"
    elif votes["bearish"] > votes["bullish"]:
        bias = "bearish"
    else:
        bias = "neutral"

    tail = frame.tail(series_points)
    series = {
        "dates": tail["Date"].dt.strftime("%Y-%m-%d").tolist(),
        "close": [_round(v) for v in tail["Close"]],
        "sma_20": [_round(v) for v in tail["SMA_20"]],
        "sma_50": [_round(v) for v in tail["SMA_50"]],
        "bb_upper": [_round(v) for v in tail["BB_upper"]],
        "bb_lower": [_round(v) for v in tail["BB_lower"]],
        "rsi_14": [_round(v) for v in tail["RSI_14"]],
        "macd": [_round(v, 3) for v in tail["MACD"]],
        "macd_signal": [_round(v, 3) for v in tail["MACD_signal"]],
        "volume": [int(v) if pd.notna(v) else None for v in tail["Volume"]],
    }
    return {
        "as_of": latest["Date"].strftime("%Y-%m-%d"),
        "latest": {
            "close": _round(latest["Close"]),
            "sma_20": _round(latest["SMA_20"]),
            "sma_50": _round(latest["SMA_50"]),
            "sma_200": _round(latest["SMA_200"]),
            "ema_12": _round(latest["EMA_12"]),
            "ema_26": _round(latest["EMA_26"]),
            "rsi_14": _round(latest["RSI_14"]),
            "macd": _round(latest["MACD"], 3),
            "macd_signal": _round(latest["MACD_signal"], 3),
            "macd_hist": _round(latest["MACD_hist"], 3),
            "bb_upper": _round(latest["BB_upper"]),
            "bb_lower": _round(latest["BB_lower"]),
            "atr_14": _round(latest["ATR_14"]),
            "volatility_20d_annualized": _round(latest["VOL_20"], 4),
        },
        "signals": signals,
        "technical_bias": bias,
        "series": series,
    }

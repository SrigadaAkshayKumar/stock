"""Risk metrics derived from price history plus model / sentiment context."""

from typing import Dict, List, Optional

import numpy as np
import pandas as pd


def calculate_risk(
    df: pd.DataFrame,
    prediction: Optional[Dict] = None,
    sentiment: Optional[Dict] = None,
    indicators: Optional[Dict] = None,
) -> Dict:
    window = df.tail(252)
    returns = window["Close"].pct_change().dropna()
    vol = float(returns.std() * np.sqrt(252)) if len(returns) > 1 else 0.0
    downside = returns[returns < 0]
    downside_dev = float(downside.std() * np.sqrt(252)) if len(downside) > 1 else 0.0
    var_95 = float(-np.percentile(returns, 5)) if len(returns) else 0.0
    cvar_95 = float(-returns[returns <= -var_95].mean()) if len(returns) and (returns <= -var_95).any() else var_95
    running_max = window["Close"].cummax()
    max_dd = float(((window["Close"] / running_max) - 1).min())
    ann_return = float(returns.mean() * 252) if len(returns) else 0.0
    sharpe = ann_return / vol if vol else 0.0

    if vol < 0.20:
        level = "Low"
    elif vol < 0.35:
        level = "Medium"
    else:
        level = "High"

    factors: List[str] = [
        f"Annualized volatility over the last year is {vol * 100:.1f}%.",
        f"Maximum drawdown over the last year was {max_dd * 100:.1f}%.",
        f"Historical 1-day 95% Value-at-Risk is {var_95 * 100:.2f}% of position value.",
    ]
    if indicators:
        rsi = indicators.get("latest", {}).get("rsi_14")
        if rsi is not None and rsi >= 70:
            factors.append("RSI indicates overbought conditions; pullback risk is elevated.")
        elif rsi is not None and rsi <= 30:
            factors.append("RSI indicates oversold conditions; momentum is weak.")
    if prediction:
        conf = prediction.get("confidence")
        if conf is not None and conf < 0.6:
            factors.append(f"Model confidence is limited ({conf * 100:.0f}%); the forecast is uncertain.")
        acc = (prediction.get("backtest") or {}).get("directional_accuracy")
        if acc is not None and acc < 0.55:
            factors.append(f"Historical directional accuracy is only {acc * 100:.0f}%, close to chance.")
    if sentiment:
        idx = sentiment.get("sentiment_index")
        if idx is not None and idx < -0.1:
            factors.append("Recent news sentiment is negative.")
        if not sentiment.get("total_articles"):
            factors.append("No recent news was available; event risk may be under-represented.")

    return {
        "risk_level": level,
        "annualized_volatility": round(vol, 4),
        "downside_deviation": round(downside_dev, 4),
        "max_drawdown_1y": round(max_dd, 4),
        "var_95_1d": round(var_95, 4),
        "cvar_95_1d": round(cvar_95, 4),
        "annualized_return_1y": round(ann_return, 4),
        "sharpe_ratio_1y": round(sharpe, 2),
        "risk_factors": factors,
        "as_of": df["Date"].iloc[-1].strftime("%Y-%m-%d"),
    }

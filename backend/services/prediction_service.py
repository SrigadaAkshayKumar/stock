"""
PredictionService - short-term ML forecasting with walk-forward backtesting.

Pipeline:
  prepare_features()  -> engineered features from OHLCV + indicators
  _select_model()     -> walk-forward CV over candidate models, keep the best
  predict()           -> direction, probability (confidence), expected price
  evaluate_prediction -> compare stored predictions with realised prices

Every prediction is stored with its horizon, confidence and model version so
results are reproducible and can be evaluated once the horizon has passed.
"""

import hashlib
import logging
import threading
from datetime import datetime, timezone
from typing import Dict, List

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import f1_score, mean_absolute_error, mean_squared_error, precision_score, recall_score
from sklearn.model_selection import TimeSeriesSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from core.settings import settings
from core.validation import base_symbol
from repositories import get_repository
from repositories.excel_store import utc_now
from services.indicator_service import compute_indicator_frame
from services.market_data_service import stock_service

logger = logging.getLogger(__name__)

FEATURES = [
    "ret_1", "ret_2", "ret_3", "ret_5", "ret_10", "ret_20",
    "close_sma10", "close_sma20", "close_sma50", "sma10_sma50",
    "rsi_14", "macd_hist_norm", "bb_pct", "atr_norm",
    "vol_10", "vol_20", "volume_z",
]

CLASSIFIERS = {
    "logistic_regression": lambda: make_pipeline(StandardScaler(), LogisticRegression(C=0.5, max_iter=1000)),
    "random_forest": lambda: RandomForestClassifier(
        n_estimators=150, max_depth=5, min_samples_leaf=20, random_state=42, n_jobs=-1
    ),
}
REGRESSORS = {
    "ridge": lambda: make_pipeline(StandardScaler(), Ridge(alpha=10.0)),
    "gradient_boosting": lambda: GradientBoostingRegressor(
        n_estimators=150, max_depth=2, learning_rate=0.05, subsample=0.8, random_state=42
    ),
}

_model_cache: Dict[tuple, Dict] = {}
_cache_lock = threading.Lock()


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    f = compute_indicator_frame(df)
    close = f["Close"]
    for n in (1, 2, 3, 5, 10, 20):
        f[f"ret_{n}"] = close.pct_change(n)
    f["close_sma10"] = close / f["SMA_10"] - 1
    f["close_sma20"] = close / f["SMA_20"] - 1
    f["close_sma50"] = close / f["SMA_50"] - 1
    f["sma10_sma50"] = f["SMA_10"] / f["SMA_50"] - 1
    f["rsi_14"] = f["RSI_14"] / 100
    f["macd_hist_norm"] = f["MACD_hist"] / close
    f["bb_pct"] = (close - f["BB_lower"]) / (f["BB_upper"] - f["BB_lower"])
    f["atr_norm"] = f["ATR_14"] / close
    daily = close.pct_change()
    f["vol_10"] = daily.rolling(10).std()
    f["vol_20"] = daily.rolling(20).std()
    vol_mean = f["Volume"].rolling(20).mean()
    vol_std = f["Volume"].rolling(20).std()
    f["volume_z"] = (f["Volume"] - vol_mean) / vol_std.replace(0, np.nan)
    return f.replace([np.inf, -np.inf], np.nan)


def _targets(frame: pd.DataFrame, horizon: int) -> pd.DataFrame:
    out = frame.copy()
    out["future_close"] = out["Close"].shift(-horizon)
    out["target_return"] = out["future_close"] / out["Close"] - 1
    out["target_up"] = (out["target_return"] > 0).astype(int)
    return out


def _data_fingerprint(df: pd.DataFrame) -> str:
    raw = f"{len(df)}|{df['Date'].iloc[-1]}|{df['Close'].iloc[-1]:.4f}"
    return hashlib.sha1(raw.encode()).hexdigest()[:8]


def _walk_forward(train: pd.DataFrame, horizon: int, n_splits: int = 5) -> Dict:
    """Evaluate every candidate with expanding-window time-series CV.

    A gap of ``horizon`` rows between train and test prevents label leakage.
    """
    X = train[FEATURES].values
    y_cls = train["target_up"].values
    y_reg = train["target_return"].values
    base = train["Close"].values
    actual_price = train["future_close"].values
    splitter = TimeSeriesSplit(n_splits=n_splits, gap=horizon)

    results = {}
    for name, factory in CLASSIFIERS.items():
        preds, truth = [], []
        for tr, te in splitter.split(X):
            model = factory().fit(X[tr], y_cls[tr])
            preds.extend(model.predict(X[te]))
            truth.extend(y_cls[te])
        preds, truth = np.array(preds), np.array(truth)
        results[name] = {
            "directional_accuracy": float((preds == truth).mean()),
            "precision_up": float(precision_score(truth, preds, zero_division=0)),
            "recall_up": float(recall_score(truth, preds, zero_division=0)),
            "f1_up": float(f1_score(truth, preds, zero_division=0)),
            "n_samples": int(len(truth)),
        }

    reg_results = {}
    for name, factory in REGRESSORS.items():
        pred_price, true_price, base_price = [], [], []
        for tr, te in splitter.split(X):
            model = factory().fit(X[tr], y_reg[tr])
            pred_price.extend(base[te] * (1 + model.predict(X[te])))
            true_price.extend(actual_price[te])
            base_price.extend(base[te])
        pred_price, true_price, base_price = map(np.array, (pred_price, true_price, base_price))
        reg_results[name] = {
            "mae": float(mean_absolute_error(true_price, pred_price)),
            "rmse": float(np.sqrt(mean_squared_error(true_price, pred_price))),
            "mape_pct": float(np.mean(np.abs((true_price - pred_price) / true_price)) * 100),
            "naive_mae": float(mean_absolute_error(true_price, base_price)),
        }

    # Baseline: always predict the majority class seen in each training fold.
    base_preds, base_truth = [], []
    for tr, te in splitter.split(X):
        majority = int(y_cls[tr].mean() >= 0.5)
        base_preds.extend([majority] * len(te))
        base_truth.extend(y_cls[te])
    baseline = float((np.array(base_preds) == np.array(base_truth)).mean())

    return {"classifiers": results, "regressors": reg_results, "baseline_accuracy": baseline}


class PredictionService:
    def __init__(self, repository=None):
        self._repo = repository

    @property
    def repo(self):
        return self._repo or get_repository()

    def _train(self, symbol: str, horizon: int) -> Dict:
        df = stock_service.get_price_history(symbol, "max")
        fingerprint = _data_fingerprint(df)
        key = (base_symbol(symbol), horizon, fingerprint)
        with _cache_lock:
            if key in _model_cache:
                return _model_cache[key]

        frame = _targets(prepare_features(df), horizon)
        labelled = frame.dropna(subset=FEATURES + ["future_close"])
        if len(labelled) < 200:
            raise ValueError(f"Not enough history to train a model for {symbol}")

        cv = _walk_forward(labelled, horizon)
        best_cls = max(cv["classifiers"], key=lambda n: cv["classifiers"][n]["directional_accuracy"])
        best_reg = min(cv["regressors"], key=lambda n: cv["regressors"][n]["mae"])

        X, y_cls, y_reg = labelled[FEATURES].values, labelled["target_up"].values, labelled["target_return"].values
        classifier = CLASSIFIERS[best_cls]().fit(X, y_cls)
        regressor = REGRESSORS[best_reg]().fit(X, y_reg)

        cls_metrics = cv["classifiers"][best_cls]
        reg_metrics = cv["regressors"][best_reg]
        bundle = {
            "classifier": classifier,
            "regressor": regressor,
            "frame": frame,
            "model_version": f"{best_cls}+{best_reg}-h{horizon}-v{settings.MODEL_SCHEMA_VERSION}-{fingerprint}",
            "backtest": {
                "method": "walk-forward TimeSeriesSplit (5 folds, leakage gap = horizon)",
                "classifier": best_cls,
                "regressor": best_reg,
                "directional_accuracy": round(cls_metrics["directional_accuracy"], 4),
                "baseline_accuracy": round(cv["baseline_accuracy"], 4),
                "precision_up": round(cls_metrics["precision_up"], 4),
                "recall_up": round(cls_metrics["recall_up"], 4),
                "f1_up": round(cls_metrics["f1_up"], 4),
                "mae": round(reg_metrics["mae"], 2),
                "rmse": round(reg_metrics["rmse"], 2),
                "mape_pct": round(reg_metrics["mape_pct"], 2),
                "naive_mae": round(reg_metrics["naive_mae"], 2),
                "n_samples": cls_metrics["n_samples"],
                "candidates": {
                    "classifiers": {k: round(v["directional_accuracy"], 4) for k, v in cv["classifiers"].items()},
                    "regressors": {k: round(v["mae"], 2) for k, v in cv["regressors"].items()},
                },
            },
        }
        with _cache_lock:
            _model_cache[key] = bundle
        return bundle

    def predict(self, symbol: str, horizon: int = 5, store: bool = True) -> Dict:
        bundle = self._train(symbol, horizon)
        frame = bundle["frame"]
        latest = frame.dropna(subset=FEATURES).iloc[-1]
        x = latest[FEATURES].values.reshape(1, -1).astype(float)

        prob_up = float(bundle["classifier"].predict_proba(x)[0][1])
        expected_return = float(bundle["regressor"].predict(x)[0])
        base_price = float(latest["Close"])
        direction = "up" if prob_up >= 0.5 else "down"
        confidence = max(prob_up, 1 - prob_up)
        if prob_up >= 0.55:
            outlook = "Bullish"
        elif prob_up <= 0.45:
            outlook = "Bearish"
        else:
            outlook = "Neutral"

        prediction_date = latest["Date"]
        target_date = (prediction_date + pd.tseries.offsets.BDay(horizon)).strftime("%Y-%m-%d")
        result = {
            "symbol": base_symbol(symbol),
            "horizon_trading_days": horizon,
            "prediction_date": prediction_date.strftime("%Y-%m-%d"),
            "target_date": target_date,
            "base_price": round(base_price, 2),
            "predicted_price": round(base_price * (1 + expected_return), 2),
            "expected_return_pct": round(expected_return * 100, 2),
            "predicted_direction": direction,
            "probability_up": round(prob_up, 4),
            "confidence": round(confidence, 4),
            "outlook": outlook,
            "model_version": bundle["model_version"],
            "backtest": bundle["backtest"],
            "generated_at": utc_now(),
        }
        if store:
            self._store(result)
        return result

    def predict_all(self, symbol: str) -> List[Dict]:
        return [self.predict(symbol, h) for h in settings.PREDICTION_HORIZONS]

    def _store(self, result: Dict) -> None:
        try:
            existing = self.repo.find_one(
                "predictions",
                stock_id=result["symbol"],
                prediction_date=result["prediction_date"],
                horizon=result["horizon_trading_days"],
                model_version=result["model_version"],
            )
            if existing:
                return
            self.repo.insert("predictions", {
                "stock_id": result["symbol"],
                "prediction_date": result["prediction_date"],
                "target_date": result["target_date"],
                "horizon": result["horizon_trading_days"],
                "base_price": result["base_price"],
                "predicted_price": result["predicted_price"],
                "predicted_direction": result["predicted_direction"],
                "confidence": result["confidence"],
                "model_version": result["model_version"],
            })
        except Exception as exc:  # storage must never break predictions
            logger.warning("Could not store prediction: %s", exc)

    def evaluate_prediction(self, symbol: str) -> Dict:
        """Fill in realised outcomes for stored predictions whose horizon has passed."""
        base = base_symbol(symbol)
        df = stock_service.get_price_history(base, "max").set_index("Date")
        evaluated, pending = [], 0
        for rec in self.repo.find("predictions", stock_id=base):
            if rec.get("evaluated_at"):
                evaluated.append(rec)
                continue
            target = pd.Timestamp(rec["target_date"])
            realised = df[df.index >= target]
            if realised.empty:
                pending += 1
                continue
            actual = float(realised["Close"].iloc[0])
            actual_dir = "up" if actual > float(rec["base_price"]) else "down"
            changes = {
                "actual_price": round(actual, 2),
                "actual_direction": actual_dir,
                "is_correct": actual_dir == rec["predicted_direction"],
                "evaluated_at": utc_now(),
            }
            self.repo.update("predictions", rec["id"], changes)
            evaluated.append({**rec, **changes})
        hits = [r for r in evaluated if r.get("is_correct") in (True, 1, "TRUE", "True")]
        return {
            "symbol": base,
            "evaluated": len(evaluated),
            "pending": pending,
            "live_directional_accuracy": round(len(hits) / len(evaluated), 4) if evaluated else None,
            "records": evaluated[-20:],
        }


prediction_service = PredictionService()

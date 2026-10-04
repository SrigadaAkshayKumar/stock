# ML Model Lifecycle

## Features (`prepare_features`)

Returns over 1/2/3/5/10/20 days, price relative to SMA 10/20/50, SMA10/SMA50 ratio, RSI(14),
MACD histogram normalised by price, Bollinger %B, ATR normalised by price, 10/20-day
realised volatility and volume z-score. All features use only information available at the
close of the prediction date.

## Targets

For horizon *h* trading days: `target_up = close[t+h] > close[t]` (classification) and
`target_return = close[t+h] / close[t] - 1` (regression → expected price).

## Model selection and backtesting

* Candidates: logistic regression and random forest (direction); ridge and gradient boosting
  (return).
* Validation: expanding-window `TimeSeriesSplit` with 5 folds and a gap equal to the horizon,
  so overlapping labels can't leak between train and test.
* Selection: best out-of-sample directional accuracy (classifier) and lowest MAE (regressor).
* Reported metrics: directional accuracy, majority-class baseline, precision/recall/F1 for "up",
  MAE, RMSE, MAPE and the naive no-change MAE.

> Expect short-horizon directional accuracy close to 50%. The platform shows the baseline and
> warns when accuracy is under 55%, so model output is never presented as more reliable than
> it is.

## Versioning and reproducibility

`model_version = <classifier>+<regressor>-h<horizon>-v<schema>-<data fingerprint>`. The
fingerprint hashes the row count, last date and last close, so a new data point produces a new
version. Trained models are cached in memory per (symbol, horizon, fingerprint).

## Prediction tracking and monitoring

1. Every prediction is stored in `predictions` (deduplicated by date, horizon and version).
2. `GET /api/stock/<s>/forecast/evaluation` fills in `actual_price`, `actual_direction` and
   `is_correct` once the target date has price data, and reports live directional accuracy.
3. Compare live accuracy with backtested accuracy. A sustained gap means drift and should
   trigger retraining or feature review.

## Roadmap

* Schedule evaluation in a worker and alert when live accuracy drifts.
* Add probability calibration (e.g. `CalibratedClassifierCV`) and gradient-boosted classifiers.
* Persist trained models to object storage (S3) keyed by `model_version`.

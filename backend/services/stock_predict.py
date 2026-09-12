import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from datetime import datetime
from flask import jsonify
import pandas as pd
import os

DATA_FOLDER = os.path.join(os.path.dirname(__file__), "data")


def normalize_symbol(symbol: str) -> str:
    return symbol.split(".")[0].upper()


def predict_stock_handler(symbol):
    try:
        symbol = normalize_symbol(symbol)

        file_path = os.path.join(DATA_FOLDER, f"{symbol}.csv")

        if not os.path.exists(file_path):
            return jsonify({
                "error": f"CSV data not found for {symbol}"
            }), 404

        data = pd.read_csv(file_path)

        if "Date" not in data.columns or "Close" not in data.columns:
            return jsonify({
                "error": "CSV must contain Date and Close columns"
            }), 400

        data["Date"] = pd.to_datetime(
            data["Date"],
            errors="coerce"
        )

        data["Close"] = pd.to_numeric(
            data["Close"],
            errors="coerce"
        )

        data = data.dropna(
            subset=["Date", "Close"]
        )

        data = data.sort_values("Date")

        data = data.drop_duplicates(
            subset=["Date"],
            keep="last"
        )

        data.set_index(
            "Date",
            inplace=True
        )

        if len(data) < 10:
            return jsonify({
                "error": "Not enough historical data for prediction"
            }), 400

        X = (
            data.index
            .map(datetime.toordinal)
            .values
            .reshape(-1, 1)
        )

        y = (
            data["Close"]
            .values
            .astype(float)
            .flatten()
        )

        split_index = int(len(X) * 0.80)

        split_index = max(
            1,
            min(
                split_index,
                len(X) - 2
            )
        )

        X_train = X[:split_index]
        X_test = X[split_index:]

        y_train = y[:split_index]
        y_test = y[split_index:]

        evaluation_model = LinearRegression()

        evaluation_model.fit(
            X_train,
            y_train
        )

        y_pred = evaluation_model.predict(
            X_test
        )

        mae = mean_absolute_error(
            y_test,
            y_pred
        )

        rmse = np.sqrt(
            mean_squared_error(
                y_test,
                y_pred
            )
        )

        if len(y_test) >= 2:
            r2 = r2_score(
                y_test,
                y_pred
            )
        else:
            r2 = 0.0

        actual_array = np.asarray(
            y_test,
            dtype=float
        )

        predicted_array = np.asarray(
            y_pred,
            dtype=float
        )

        non_zero = actual_array != 0

        if np.any(non_zero):
            mape = np.mean(
                np.abs(
                    (
                        actual_array[non_zero]
                        - predicted_array[non_zero]
                    )
                    / actual_array[non_zero]
                )
            ) * 100
        else:
            mape = 0.0

        if mape <= 5:
            confidence = "High"
        elif mape <= 10:
            confidence = "Medium"
        else:
            confidence = "Low"

        evaluation = {
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "r2_score": round(float(r2), 3),
            "mape": round(float(mape), 2),
            "confidence": confidence
        }

        evaluation_chart = {
            "actual": actual_array.tolist(),
            "predicted": predicted_array.tolist()
        }

        model = LinearRegression()

        model.fit(
            X,
            y
        )

        last_historical_date = data.index[-1]

        future_dates = [
            last_historical_date + pd.DateOffset(years=i)
            for i in range(1, 11)
        ]

        future_ordinals = np.array([
            d.toordinal()
            for d in future_dates
        ]).reshape(-1, 1)

        predictions = model.predict(
            future_ordinals
        )

        predicted_dates = [
            d.strftime("%Y-%m-%d")
            for d in future_dates
        ]

        stocks = [10, 20, 50, 100]

        current_price = float(y[-1])

        returns = [
            {
                "stocks_bought": stock,
                "current_price": round(
                    current_price * stock,
                    2
                ),
                "after_1_year": round(
                    float(predictions[0]) * stock,
                    2
                ),
                "after_5_years": round(
                    float(predictions[4]) * stock,
                    2
                ),
                "after_10_years": round(
                    float(predictions[9]) * stock,
                    2
                )
            }
            for stock in stocks
        ]

        test_dates = (
            data.index[split_index:]
            .strftime("%Y-%m-%d")
            .tolist()
        )

        return jsonify({
            "symbol": symbol,

            "actual": y.tolist(),

            "actual_dates": (
                data.index
                .strftime("%Y-%m-%d")
                .tolist()
            ),

            "predictions": predictions.tolist(),

            "predicted_dates": predicted_dates,

            "test_actual": y_test.tolist(),

            "test_predicted": y_pred.tolist(),

            "test_dates": test_dates,

            "metrics": {
                "mae": round(float(mae), 4),
                "rmse": round(float(rmse), 4),
                "r2": round(float(r2), 4),
                "mape": round(float(mape), 2),
                "confidence": confidence,
                "confidence_type": "Heuristic confidence based on MAPE"
            },

            "evaluation": evaluation,

            "evaluation_chart": evaluation_chart,

            "returns": returns
        })

    except Exception as e:
        return jsonify({
            "error": f"Internal Server Error: {str(e)}"
        }), 500
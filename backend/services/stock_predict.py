import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from datetime import datetime, timedelta
from flask import jsonify
import pandas as pd
import os

DATA_FOLDER = os.path.join(os.path.dirname(__file__), "data")

def normalize_symbol(symbol: str) -> str:
    """Remove exchange suffix like .NS or .BO to match CSV filenames."""
    return symbol.split(".")[0].upper()

def predict_stock_handler(symbol):
    """
    Handles prediction request based on historical stock data.
    """
    try:
        # Normalize symbol (remove .NS or .BO)
        symbol = normalize_symbol(symbol)

        # Load CSV
        file_path = os.path.join(DATA_FOLDER, f"{symbol}.csv")
        if not os.path.exists(file_path):
            return jsonify({'error': f'CSV data not found for {symbol}'}), 404

        data = pd.read_csv(file_path)

        # Expecting standard headers
        if 'Date' not in data.columns or 'Close' not in data.columns:
            return jsonify({'error': 'CSV must contain Date and Close columns'}), 400

        # Preprocess
        data['Date'] = pd.to_datetime(data['Date'])
        data = data.sort_values('Date')
        data.set_index('Date', inplace=True)

        X = data.index.map(datetime.toordinal).values.reshape(-1, 1)
        y = data['Close'].values.flatten()

        n = len(y)
        split = int(n * 0.8)
        if n >= 10 and split < n:
            check = LinearRegression()
            check.fit(X[:split], y[:split])
            holdout = check.predict(X[split:])
            mae = float(mean_absolute_error(y[split:], holdout))
            rmse = float(np.sqrt(mean_squared_error(y[split:], holdout)))
            try:
                r2 = float(r2_score(y[split:], holdout))
            except Exception:
                r2 = 0.0
            mean_price = float(np.mean(y[split:])) if len(y[split:]) else 0.0
            err_pct = round((mae / mean_price * 100) if mean_price else 0.0, 2)
            if r2 >= 0.7 and err_pct <= 5:
                confidence = "High"
            elif r2 >= 0.4 and err_pct <= 10:
                confidence = "Medium"
            else:
                confidence = "Low"
            evaluation = {
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "r2": round(r2, 3),
                "error_pct": err_pct,
                "confidence": confidence,
                "test_size": int(n - split),
            }
        else:
            evaluation = {
                "mae": 0.0,
                "rmse": 0.0,
                "r2": 0.0,
                "error_pct": 0.0,
                "confidence": "Low",
                "test_size": 0,
            }

        # Train final model on full history
        model = LinearRegression()
        model.fit(X, y)

        # Predict next 10 years
        future_dates = [datetime.now() + timedelta(days=365 * i) for i in range(1, 11)]
        future_ordinals = [d.toordinal() for d in future_dates]
        predictions = model.predict(np.array(future_ordinals).reshape(-1, 1))
        predicted_dates = [d.strftime('%Y-%m-%d') for d in future_dates]

        # Project returns
        stocks = [10, 20, 50, 100]
        current_price = y[-1]
        returns = [
            {
                'stocks_bought': stock,
                'current_price': round(current_price * stock, 2),
                'after_1_year': round(predictions[0] * stock, 2),
                'after_5_years': round(predictions[4] * stock, 2),
                'after_10_years': round(predictions[9] * stock, 2),
            }
            for stock in stocks
        ]

        return jsonify({
            'predictions': predictions.tolist(),
            'predicted_dates': predicted_dates,
            'actual': y.tolist(),
            'actual_dates': data.index.strftime('%Y-%m-%d').tolist(),
            'returns': returns,
            'evaluation': evaluation
        })

    except Exception as e:
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

import numpy as np
from sklearn.linear_model import LinearRegression
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

        # Train model
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
            'returns': returns
        })

    except Exception as e:
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

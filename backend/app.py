from flask import Flask, jsonify, request, send_file
from io import BytesIO
import yfinance as yf
import pandas as pd
import numpy as np
import plotly.express as px
from flask_cors import CORS
import json
import traceback
import plotly
from io import BytesIO
import requests
from tensorflow.keras.models import load_model  # Updated to tf.keras
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://aistockanalyzer.onrender.com"]}})

# Load the model with error handling using tf.keras
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, 'tf.keras')

try:
    model = load_model(model_path)
    print("Model loaded successfully with tf.keras.")
except Exception as e:
    print(f"Error loading model: {e}")

cleaned_data_cache = {}

def fetch_stock_data(ticker, period="1mo"):
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period=period)
        data.reset_index(inplace=True)
        data['Date'] = pd.to_datetime(data['Date'])
        data = data[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
        df = pd.DataFrame(data)
        df[['Open', 'High', 'Low', 'Close']] = df[['Open', 'High', 'Low', 'Close']].round(3)
        return df
    except Exception as e:
        return str(e)

def clean_stock_data(data):
    data = data.dropna()
    data['Date'] = pd.to_datetime(data['Date'])
    return data

def fetch_stock_info(ticker):
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period="1d")
        info = stock.info
        return {
            "name": info.get("longName", "N/A"),
            "open": round(data['Open'].iloc[0], 2) if not data.empty else "N/A",
            "close": round(data['Close'].iloc[0], 2) if not data.empty else "N/A",
            "low": round(data['Low'].iloc[0], 2) if not data.empty else "N/A",
            "high": round(data['High'].iloc[0], 2) if not data.empty else "N/A",
            "exchange": info.get("exchange", "N/A")
        }
    except Exception as e:
        return str(e)

def fetch_stock_news(ticker):
    try:
        stock = yf.Ticker(ticker)
        company_name = stock.info.get("longName", ticker)
        search_query = company_name.replace("&", "and")
        NEWS_API_KEY = os.getenv("NEWS_API_KEY")
        if not NEWS_API_KEY:
            return "No news available"
        url = f'https://newsapi.org/v2/everything?q={search_query}&apiKey={NEWS_API_KEY}'
        response = requests.get(url)
        news_data = response.json()
        
        if news_data.get("status") == "ok":
            articles = news_data.get("articles", [])[:3]
            return articles if articles else "No news available"
        else:
            return "No news available"
    except Exception as e:
        return "No news available"

@app.route('/api/stock', methods=['GET'])
def get_stock_data():
    stock = request.args.get('ticker')
    chart_period = request.args.get('chart_period', '1mo')
    table_period = request.args.get('table_period', '1mo')

    if not stock:
        return jsonify({"error": "Ticker parameter is required"}), 400

    try:
        # Fetch stock data for chart and table
        chart_data = fetch_stock_data(stock, chart_period)
        table_data = fetch_stock_data(stock, table_period)

        if isinstance(chart_data, str) or isinstance(table_data, str):
            return jsonify({"error": "Failed to fetch stock data"}), 500

        chart_data = clean_stock_data(chart_data)
        table_data = clean_stock_data(table_data)

        chart_data['Date'] = pd.to_datetime(chart_data['Date']).dt.strftime('%d-%m-%Y')
        table_data['Date'] = pd.to_datetime(table_data['Date']).dt.strftime('%d-%m-%Y')

        fig1 = px.line(chart_data, x='Date', y='Close', title=f'{stock} Stock Price Over Time', markers=True)
        fig1.update_layout(width=1200, height=600)
        fig1.update_xaxes(autorange="reversed")
        graphJSON1 = json.dumps(fig1, cls=plotly.utils.PlotlyJSONEncoder)

        fig2 = px.area(chart_data, x='Date', y='Close', title=f'{stock} Stock Price Bar Chart',markers=True)
        fig2.update_layout(width=1200, height=600)
        fig2.update_xaxes(autorange="reversed")
        graphJSON2 = json.dumps(fig2, cls=plotly.utils.PlotlyJSONEncoder)

        stock_info = fetch_stock_info(stock)
        stock_news = fetch_stock_news(stock)

        return jsonify({
            "stock_data": table_data.to_dict(orient='records'),
            "graph_data1": graphJSON1,
            "graph_data2": graphJSON2,
            "stock_info": stock_info,
            "stock_news": stock_news,
            "chart_period": chart_period,
            "table_period": table_period
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from datetime import datetime, timedelta
@app.route('/api/export/history', methods=['GET'])
def export_stock_history():
    ticker = request.args.get('ticker')
    period = request.args.get('period', '1mo')
    filetype = request.args.get('type', 'csv')  # 'csv' or 'excel'
    app.logger.info(f"Exporting stock history for {ticker}, Period: {period}, Format: {filetype}")

    if not ticker:
        return jsonify({'error': 'Ticker is required'}), 400

    data = fetch_stock_data(ticker, period)
    if isinstance(data, str):  # Error message returned
        return jsonify({'error': data}), 500

    data = clean_stock_data(data)

    # Generate in-memory file
    file_io = BytesIO()
    if filetype == 'excel':
        data.to_excel(file_io, index=False, engine='openpyxl')
        mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ext = 'xlsx'
    else:
        data.to_csv(file_io, index=False)
        mimetype = 'text/csv'
        ext = 'csv'

    file_io.seek(0)
    return send_file(
        file_io,
        mimetype=mimetype,
        as_attachment=True,
        download_name=f"{ticker}_history.{ext}"
    )

@app.route('/api/export/prediction', methods=['GET'])
def export_predictions():
    ticker = request.args.get('ticker')
    if not ticker:
        return jsonify({'error': 'Ticker is required'}), 400

    try:
        data = yf.download(ticker, period='5y')
        if data.empty:
            return jsonify({'error': 'No data found'}), 404

        data['Date'] = data.index
        data['Date'] = data['Date'].map(datetime.toordinal)
        X = data['Date'].values.reshape(-1, 1)
        y = data['Close'].values.flatten()

        model = LinearRegression()
        model.fit(X, y)

        future_dates = [datetime.now() + timedelta(days=i*365) for i in range(1, 11)]
        predictions = model.predict(np.array([d.toordinal() for d in future_dates]).reshape(-1, 1))

        df_pred = pd.DataFrame({
            'Date': [d.strftime('%Y-%m-%d') for d in future_dates],
            'Predicted Price': [round(float(p), 2) for p in predictions]
        })

        # Export to CSV
        file_io = BytesIO()
        filetype = request.args.get('type', 'csv')
        if filetype == 'excel':
            df_pred.to_excel(file_io, index=False, engine='openpyxl')
            mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ext = 'xlsx'
        else:
            df_pred.to_csv(file_io, index=False)
            mimetype = 'text/csv'
            ext = 'csv'

        file_io.seek(0)
        return send_file(
            file_io,
            mimetype=mimetype,
            as_attachment=True,
            download_name=f"{ticker}_prediction.{ext}"
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock/predict', methods=['GET', 'OPTIONS'])
def predict_stock():
    ticker = request.args.get('ticker')
    if not ticker:
        return jsonify({'error': 'Ticker symbol is required'}), 400

    try:
        # Fetch historical stock data
        data = yf.download(ticker, period='5y')
        if data.empty:
            return jsonify({'error': 'No data found for the given ticker'}), 404

        # Preprocess data
        data['Date'] = data.index
        data['Date'] = data['Date'].map(datetime.toordinal)
        X = data['Date'].values.reshape(-1, 1)
        y = data['Close'].values.flatten()  # Ensure y is a 1D array
        actual_dates = data.index.strftime('%Y-%m-%d').tolist()  # Actual dates

        # Debugging: Check the shape of y
        print(f"Shape of y: {y.shape}")

        # Train model
        model = LinearRegression()
        model.fit(X, y)

        # Predict future prices
        future_dates = [datetime.now() + timedelta(days=i*365) for i in range(1, 11)]
        future_dates_ordinal = [date.toordinal() for date in future_dates]
        predictions = model.predict(np.array(future_dates_ordinal).reshape(-1, 1))
        predicted_dates = [date.strftime('%Y-%m-%d') for date in future_dates]  # Predicted dates

        # Calculate returns
        stocks = [10, 20, 50, 100]
        returns = []
        current_price = float(y[-1])  # Convert current price to float once

        for stock in stocks:
            returns.append({
                'stocks_bought': stock,
                'current_price': round(current_price * stock, 2),
                'after_1_year': round(float(predictions[0]) * stock, 0),
                'after_5_years': round(float(predictions[4]) * stock, 0),
                'after_10_years': round(float(predictions[9]) * stock, 0)
            })


        return jsonify({
            'predictions': predictions.tolist(),
            'predicted_dates': predicted_dates,
            'actual': y.tolist(),
            'actual_dates': actual_dates,
            'returns': returns
        })
    except Exception as e:
        error_message = traceback.format_exc()
        print(f"Error during prediction: {error_message}")
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
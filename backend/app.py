from flask import Flask, jsonify, request
import yfinance as yf
import pandas as pd
import numpy as np
import plotly.express as px
from flask_cors import CORS
import json
import traceback
import plotly
import requests
from tensorflow.keras.models import load_model   # TensorFlow Keras for loading model
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
import os

# === Flask App Setup ===
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://aistockanalyzer.onrender.com"]}})

# Construct the path to the model directory/file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, 'tf.keras')

try:
    model = load_model(model_path)
    print("Model loaded successfully with tf.keras.")
except Exception as e:
    print(f"Error loading model: {e}")


# === Cache for Cleaned Data ===
cleaned_data_cache = {}

#to check if ticker has valid data
def is_valid_ticker(ticker):
    return bool(re.match(r'^[A-Za-z0-9]{1,10}$', ticker))  # Alphanumeric, 1–10 characters

# === Fetch Historical Stock Data ===
def fetch_stock_data(ticker, period="1mo"):
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period=period)

        # Format and clean data
        data.reset_index(inplace=True)
        data['Date'] = pd.to_datetime(data['Date'])
        data = data[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
        df = pd.DataFrame(data)
        df[['Open', 'High', 'Low', 'Close']] = df[['Open', 'High', 'Low', 'Close']].round(3)
        return df
    except Exception as e:
        return str(e)

# === Clean Stock Data (Drop missing values, format dates) ===
def clean_stock_data(data):
    data = data.dropna()
    data['Date'] = pd.to_datetime(data['Date'])
    return data

# === Fetch Basic Stock Info (like open, close, high, etc.) ===
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
        print("Error in fetch_stock_info():", traceback.format_exc())
        return {"error": "Failed to fetch stock info."}

# === Fetch News Articles Related to the Stock ===
def fetch_stock_news(ticker):
    try:
        stock = yf.Ticker(ticker)
        company_name = stock.info.get("longName", ticker)
        search_query = company_name.replace("&", "and")

        # Get API key from environment
        NEWS_API_KEY = os.getenv("NEWS_API_KEY")
        if not NEWS_API_KEY:
            raise EnvironmentError("Missing required environment variable: NEWS_API_KEY")
        
        url = f'https://newsapi.org/v2/everything?q={search_query}&apiKey={NEWS_API_KEY}'
        response = requests.get(url)
        news_data = response.json()
        
        # Return top 3 articles if request was successful
        if news_data.get("status") == "ok":
            return news_data.get("articles", [])[:3]
        else:
            return []
    except Exception as e:
        print("Error in fetch_stock_info():", traceback.format_exc())
        return {"error": "Failed to fetch stock info."}


# === API Endpoint: Get Stock Data + Graphs + Info + News ===
@app.route('/api/stock', methods=['GET'])
def get_stock_data():
    stock = request.args.get('ticker')
    if not stock or not is_valid_ticker(stock):
        return jsonify({"error":"invalid or missing ticker symbol"}),400
    
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
        
        #clean and format  data
        chart_data = clean_stock_data(chart_data)
        table_data = clean_stock_data(table_data)

        chart_data['Date'] = pd.to_datetime(chart_data['Date']).dt.strftime('%d-%m-%Y')
        table_data['Date'] = pd.to_datetime(table_data['Date']).dt.strftime('%d-%m-%Y')
      
        #generate graphs using plotly
        fig1 = px.line(chart_data, x='Date', y='Close', title=f'{stock} Stock Price Over Time')
        fig1.update_layout(width=1200, height=600)
        fig1.update_xaxes(autorange=True)
        graphJSON1 = json.dumps(fig1, cls=plotly.utils.PlotlyJSONEncoder)

        fig2 = px.area(chart_data, x='Date', y='Close', title=f'{stock} Stock Price Bar Chart')
        fig2.update_layout(width=1200, height=600)
        fig2.update_xaxes(autorange=True)
        graphJSON2 = json.dumps(fig2, cls=plotly.utils.PlotlyJSONEncoder)
        
        #get stock info and news
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


# api endpoint to predict future stock
@app.route('/api/stock/predict', methods=['GET', 'OPTIONS'])
def predict_stock():
    ticker = request.args.get('ticker')
    if not ticker or not is_valid_ticker(ticker):
        return jsonify({'error': 'missing or invalid ticker symbol'}), 400

    try:
        # Fetch data of past 5 years
        data = yf.download(ticker, period='5y')
        if data.empty:
            return jsonify({'error': 'No data found for the given ticker'}), 404

        # Prepare data for linear regression
        data['Date'] = data.index
        data['Date'] = data['Date'].map(datetime.toordinal)
        X = data['Date'].values.reshape(-1, 1)
        y = data['Close'].values.flatten()  # Ensure y is a 1D array
        actual_dates = data.index.strftime('%Y-%m-%d').tolist()  # Actual dates

        # Debugging: Check the shape of y
        print(f"Shape of y: {y.shape}")

        # Train linear regression model
        lr_model = LinearRegression()
        lr_model.fit(X, y)

        # Predicts data of next 10 years with intervals of 1 year
        future_dates = [datetime.now() + timedelta(days=i*365) for i in range(1, 11)]
        future_dates_ordinal = [date.toordinal() for date in future_dates]
        predictions = lr_model.predict(np.array(future_dates_ordinal).reshape(-1, 1))
        predicted_dates = [date.strftime('%Y-%m-%d') for date in future_dates]  # Predicted dates

        # Calculate returns for various stock amounts
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

#run flask app
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
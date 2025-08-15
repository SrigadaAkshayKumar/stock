"""
Service module to fetch and process stock data using yfinance and Plotly.

Provides functionality for:
- Retrieving stock price history
- Generating chart and table data
- Fetching news articles with sentiment analysis
- Returning comprehensive stock information
"""

import yfinance as yf
import pandas as pd
import json
import plotly.express as px
import plotly
from flask import jsonify
from .sentiment_service import fetch_stock_news_with_sentiment

def get_stock_data_handler(request):
    """
    Handles GET request for stock data. Returns price chart, table, news with sentiment, and stock info in JSON format.
    """
    stock = request.args.get('ticker')
    chart_period = request.args.get('chart_period', '1mo')
    table_period = request.args.get('table_period', '1mo')

    if not stock:
        return jsonify({"error": "Ticker parameter is required"}), 400

    try:
        # Fetch stock information
        ticker_obj = yf.Ticker(stock)
        stock_info = ticker_obj.info
        
        # Extract basic stock info
        stock_basic_info = {
            "name": stock_info.get("longName", stock),
            "exchange": stock_info.get("exchange", "N/A"),
            "open": stock_info.get("regularMarketOpen", 0),
            "close": stock_info.get("regularMarketPrice", 0),
            "high": stock_info.get("regularMarketDayHigh", 0),
            "low": stock_info.get("regularMarketDayLow", 0),
            "volume": stock_info.get("regularMarketVolume", 0),
            "market_cap": stock_info.get("marketCap", 0),
            "pe_ratio": stock_info.get("trailingPE", 0),
            "dividend_yield": stock_info.get("dividendYield", 0)
        }

        # Fetch historical data for chart and table separately
        chart_data = ticker_obj.history(period=chart_period).reset_index()
        table_data = ticker_obj.history(period=table_period).reset_index()

        # Format date columns
        chart_data['Date'] = pd.to_datetime(chart_data['Date']).dt.strftime('%d-%m-%Y')
        table_data['Date'] = pd.to_datetime(table_data['Date']).dt.strftime('%d-%m-%Y')

        # Generate line chart
        fig1 = px.line(chart_data, x='Date', y='Close', title=f'{stock} Stock Price Over Time', markers=True)
        fig1.update_layout(width=1200, height=600)
        fig1.update_xaxes(autorange="reversed")
        graphJSON1 = json.dumps(fig1, cls=plotly.utils.PlotlyJSONEncoder)

        # Generate area chart
        fig2 = px.area(chart_data, x='Date', y='Close', title=f'{stock} Stock Price Area Chart', markers=True)
        fig2.update_layout(width=1200, height=600)
        fig2.update_xaxes(autorange="reversed")
        graphJSON2 = json.dumps(fig2, cls=plotly.utils.PlotlyJSONEncoder)

        # Fetch news with sentiment analysis
        news_data = fetch_stock_news_with_sentiment(stock)
        
        # Return all results as JSON
        return jsonify({
            "stock_data": table_data.to_dict(orient='records'),
            "graph_data1": graphJSON1,
            "graph_data2": graphJSON2,
            "stock_info": stock_basic_info,
            "stock_news": news_data.get("articles", []),
            "sentiment_summary": news_data.get("sentiment_summary", {}),
            "chart_period": chart_period,
            "table_period": table_period
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
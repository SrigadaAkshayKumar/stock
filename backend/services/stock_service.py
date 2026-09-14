import os
import pandas as pd
import json
import plotly.express as px
import plotly
import logging
from flask import jsonify
from .sentiment_service import fetch_stock_news_with_sentiment

DATA_FOLDER = os.path.join(os.path.dirname(__file__), "data")
SUPPORTED_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"}


def normalize_symbol(symbol: str) -> str:
    """
    Removes NSE (.NS) and BSE (.BO) suffixes to match CSV filenames.
    """
    return symbol.replace(".NS", "").replace(".BO", "")


def filter_stock_data(df: pd.DataFrame, period: str) -> pd.DataFrame:
    """Return the rows covered by a supported stock-data period."""
    if period not in SUPPORTED_PERIODS:
        raise ValueError(f"Unsupported period: {period}")

    if period == "max":
        return df.copy()

    if period in {"1d", "5d"}:
        row_count = 1 if period == "1d" else 5
        return df.tail(row_count).copy()

    latest_date = df["Date"].max()
    if period == "ytd":
        start_date = pd.Timestamp(year=latest_date.year, month=1, day=1)
    elif period.endswith("mo"):
        months = int(period[:-2])
        start_date = latest_date - pd.DateOffset(months=months)
    else:
        years = int(period[:-1])
        start_date = latest_date - pd.DateOffset(years=years)

    return df.loc[df["Date"] >= start_date].copy()


def get_stock_data_handler(symbol, chart_period="1mo", table_period="1mo"):
    """
    Handles GET request for stock data from local CSV files.
    Returns price chart, table, news with sentiment, and stock info in JSON format.
    """
    try:
        if chart_period not in SUPPORTED_PERIODS or table_period not in SUPPORTED_PERIODS:
            return jsonify({
                "error": "Unsupported period. Choose from: " + ", ".join(sorted(SUPPORTED_PERIODS))
            }), 400

        # Normalize symbol to match CSV filename
        clean_symbol = normalize_symbol(symbol)

        # Path to stock CSV file
        csv_path = os.path.join(DATA_FOLDER, f"{clean_symbol}.csv")
        if not os.path.exists(csv_path):
            logging.error(f"CSV not found: {csv_path}")
            return jsonify({"error": f"No data found for ticker {clean_symbol}"}), 404

        # Load data
        df = pd.read_csv(csv_path)

        # Ensure proper datetime (dayfirst for DD-MM-YYYY format)
        if "Date" in df.columns:
            df["Date"] = pd.to_datetime(df["Date"], dayfirst=True, errors="coerce")
        else:
            return jsonify({"error": "CSV missing 'Date' column"}), 500

        # Drop invalid dates if any
        df = df.dropna(subset=["Date"]).sort_values("Date", ascending=True).reset_index(drop=True)

        if df.empty:
            return jsonify({"error": f"No valid rows found in {clean_symbol}.csv"}), 500

        # Extract latest row for stock info
        latest = df.iloc[-1]
        stock_basic_info = {
            "name": clean_symbol,
            "exchange": "Local CSV",
            "open": float(latest["Open"]) if "Open" in df.columns else 0,
            "close": float(latest["Close"]) if "Close" in df.columns else 0,
            "high": float(latest["High"]) if "High" in df.columns else 0,
            "low": float(latest["Low"]) if "Low" in df.columns else 0,
            "volume": int(latest["Volume"]) if "Volume" in df.columns else 0,
            "market_cap": 0,
            "pe_ratio": 0,
            "dividend_yield": 0
        }

        chart_data = filter_stock_data(df, chart_period)
        table_data = filter_stock_data(df, table_period)

        if chart_data.empty:
            return jsonify({
                "error": f"No stock data available for chart period '{chart_period}'"
            }), 404
        if table_data.empty:
            return jsonify({
                "error": f"No stock data available for table period '{table_period}'"
            }), 404

        # Format date for frontend
        chart_data["Date"] = chart_data["Date"].dt.strftime("%d-%m-%Y")
        table_data["Date"] = table_data["Date"].dt.strftime("%d-%m-%Y")

        # Generate line chart
        fig1 = px.line(chart_data, x="Date", y="Close",
                       title=f"{clean_symbol} Stock Price Over Time", markers=True)
        fig1.update_layout(width=1200, height=600)
        fig1.update_xaxes(autorange="reversed")
        graphJSON1 = json.dumps(fig1, cls=plotly.utils.PlotlyJSONEncoder)

        # Generate area chart
        fig2 = px.area(chart_data, x="Date", y="Close",
                       title=f"{clean_symbol} Stock Price Area Chart", markers=True)
        fig2.update_layout(width=1200, height=600)
        fig2.update_xaxes(autorange="reversed")
        graphJSON2 = json.dumps(fig2, cls=plotly.utils.PlotlyJSONEncoder)

        # Fetch news with sentiment analysis
        news_data = fetch_stock_news_with_sentiment(clean_symbol)

        return jsonify({
            "stock_data": table_data.to_dict(orient="records"),
            "graph_data1": graphJSON1,
            "graph_data2": graphJSON2,
            "stock_info": stock_basic_info,
            "stock_news": news_data.get("articles", []),
            "sentiment_summary": news_data.get("sentiment_summary", {}),
            "chart_period": chart_period,
            "table_period": table_period
        })

    except Exception as e:
        logging.exception(f"Error in get_stock_data_handler for {symbol}")
        return jsonify({"error": str(e)}), 500

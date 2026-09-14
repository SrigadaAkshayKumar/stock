import os
import pandas as pd
import json
import plotly.express as px
import plotly
import logging
from flask import jsonify
from .sentiment_service import fetch_stock_news_with_sentiment

DATA_FOLDER = os.path.join(os.path.dirname(__file__), "data")


def normalize_symbol(symbol: str) -> str:
    """
    Removes NSE (.NS) and BSE (.BO) suffixes to match CSV filenames.
    """
    return symbol.replace(".NS", "").replace(".BO", "")


def get_previous_close(df: pd.DataFrame):
    """Return the close from the trading session immediately before the latest row."""
    if len(df) < 2 or "Close" not in df.columns:
        return None

    return float(df.iloc[-2]["Close"])


def get_stock_data_handler(symbol, chart_period="1mo", table_period="1mo"):
    """
    Handles GET request for stock data from local CSV files.
    Returns price chart, table, news with sentiment, and stock info in JSON format.
    """
    try:
        clean_symbol = normalize_symbol(symbol)

        csv_path = os.path.join(DATA_FOLDER, f"{clean_symbol}.csv")
        if not os.path.exists(csv_path):
            logging.error(f"CSV not found: {csv_path}")
            return jsonify({"error": f"No data found for ticker {clean_symbol}"}), 404

        df = pd.read_csv(csv_path)

        if "Date" in df.columns:
            df["Date"] = pd.to_datetime(df["Date"], dayfirst=True, errors="coerce")
        else:
            return jsonify({"error": "CSV missing 'Date' column"}), 500

        df = df.dropna(subset=["Date"]).sort_values("Date", ascending=True).reset_index(drop=True)

        if df.empty:
            return jsonify({"error": f"No valid rows found in {clean_symbol}.csv"}), 500

        latest = df.iloc[-1]
        stock_basic_info = {
            "name": clean_symbol,
            "exchange": "Local CSV",
            "open": float(latest["Open"]) if "Open" in df.columns else 0,
            "close": float(latest["Close"]) if "Close" in df.columns else 0,
            "high": float(latest["High"]) if "High" in df.columns else 0,
            "low": float(latest["Low"]) if "Low" in df.columns else 0,
            "volume": int(latest["Volume"]) if "Volume" in df.columns else 0,
            "previous_close": get_previous_close(df),
            "market_cap": 0,
            "pe_ratio": 0,
            "dividend_yield": 0
        }

        chart_data = df.copy()
        table_data = df.copy()

        chart_data["Date"] = chart_data["Date"].dt.strftime("%d-%m-%Y")
        table_data["Date"] = table_data["Date"].dt.strftime("%d-%m-%Y")

        fig1 = px.line(chart_data, x="Date", y="Close",
                       title=f"{clean_symbol} Stock Price Over Time", markers=True)
        fig1.update_layout(width=1200, height=600)
        fig1.update_xaxes(autorange="reversed")
        graphJSON1 = json.dumps(fig1, cls=plotly.utils.PlotlyJSONEncoder)

        fig2 = px.area(chart_data, x="Date", y="Close",
                       title=f"{clean_symbol} Stock Price Area Chart", markers=True)
        fig2.update_layout(width=1200, height=600)
        fig2.update_xaxes(autorange="reversed")
        graphJSON2 = json.dumps(fig2, cls=plotly.utils.PlotlyJSONEncoder)

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

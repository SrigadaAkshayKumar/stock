

import yfinance as yf
import os

# Make sure the data folder exists
os.makedirs("data", exist_ok=True)

tickers = ['TCS.NS', 'INFY.NS', 'RELIANCE.NS', 'TCS.BO', 'INFY.BO', 'RELIANCE.BO', 'SBIN.BO', 'HDFCBANK.BO', 'ITC.BO', 'LT.BO', 'BHARTIARTL.BO', 'KOTAKBANK.BO', 'AXISBANK.BO', 'HINDUNILVR.BO', 'BAJFINANCE.BO', 'MARUTI.BO', 'SUNPHARMA.BO', 'WIPRO.BO']

for ticker in tickers:
    print(f"Downloading {ticker}...")
    data = yf.download(ticker, period='5y', interval='1d')
    csv_path = f'data/{ticker}.csv'
    data.to_csv(csv_path)
    print(f"Saved: {csv_path}")
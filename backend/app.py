"""
Main Flask application entry point.

This app initializes the Flask server, sets up CORS, and defines two main API routes:
1. /api/stock         - Returns current and historical stock data
2. /api/stock/predict - Returns future predictions using linear regression
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from app.services.stock_service import get_stock_data_handler
from app.services.stock_predict import predict_stock_handler

#
# Initialize Flask app
#
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing for frontend requests
CORS(app,resources ={r"/*": {"origins": ['https://aistockanalyzer.onrender.com']}})

# API route for fetching stock data (chart + table + news)
@app.route('/api/stock', methods=['GET'])
def get_stock_data():
    return get_stock_data_handler(request)

# API route for fetching prediction results
@app.route('/api/stock/predict', methods=['GET', 'OPTIONS'])
def predict_stock():
    return predict_stock_handler(request)

# Run the Flask development server
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
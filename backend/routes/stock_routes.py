from flask import Blueprint, request
from services.stock_service import get_stock_data_handler
from services.stock_predict import predict_stock_handler

stock_routes = Blueprint('stock_routes', __name__)

# GET /api/stock/<symbol>
@stock_routes.route('/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    chart_period = request.args.get("chart_period", "1mo")
    table_period = request.args.get("table_period", "1mo")
    # ✅ only pass 3 args (symbol, chart_period, table_period)
    return get_stock_data_handler(symbol, chart_period, table_period)

# GET /api/stock/<symbol>/predict
@stock_routes.route('/stock/<symbol>/predict', methods=['GET'])
def predict(symbol):
    # ✅ only pass symbol
    return predict_stock_handler(symbol)

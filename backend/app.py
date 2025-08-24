from flask import Flask
from flask_cors import CORS
import os
from routes.stock_routes import stock_routes
from dotenv import load_dotenv

# Load env
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://aistockanalyzer.onrender.com"]}})

# Register blueprint
app.register_blueprint(stock_routes, url_prefix="/api")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)

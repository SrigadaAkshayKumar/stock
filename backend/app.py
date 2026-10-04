from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load env before importing modules that read settings
load_dotenv()

from core.logging_config import configure_logging
from routes.stock_routes import stock_routes
from routes.analysis_routes import analysis_routes

configure_logging()

app = Flask(__name__)
allowed_origins = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,https://aistockanalyzer.onrender.com"
).split(",")
CORS(app, resources={r"/*": {"origins": [o.strip() for o in allowed_origins if o.strip()]}})

# Home route:
@app.route('/')
def home():
    return "Welcome to the Stock Analysis API"

# Register blueprints
app.register_blueprint(stock_routes, url_prefix="/api")
app.register_blueprint(analysis_routes, url_prefix="/api")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)

# Stock Analyzer – Project Setup Guide

Welcome to the Stock Analyzer project! Follow the steps below to set up the project locally and start contributing or testing.

## Prerequisites

Make sure you have the following installed on your system:

- *Python 3.11.+*
- *Node.js and npm*
- *Git*

## Project Structure


Directory structure:
└── srigadaakshaykumar-stock/
    ├── LICENSE
    ├── README.md
    ├── SETUP.md
    ├── CONTRIBUTION.md
    ├── CODE_OF_CONDUCT.md
    ├── SECURITY.md
    ├── package-lock.json
    ├── package.json
    ├── static.json
    ├── backend/
        ├──app/
        ├──data/
    │   ├── app.py
    |   ├── generate_csvs.py
    │   ├── requirements.txt
    │   ├── stock-prediction.ipynb
    │   └── tf.keras
    ├── public/
    |   ├── icon.png
    │   ├── index.html
    │   ├── manifest.json
    │   └── robots.txt
    └── src/
        ├── App.css
        ├── App.js
        ├── App.test.js
        ├── index.css
        ├── index.js
        ├── reportWebVitals.js
        ├── setupTests.js
        └── components/
            ├── About.jsx
            ├── AuthContext.jsx
            ├── BackToTopBtn.jsx
            ├── ContactForm.jsx
            ├── firebase.js
            ├── Footer.css
            ├── Footer.jsx
            ├── Header.jsx
            ├── Login.css
            ├── Login.js
            ├── Prediction.jsx
            ├── SentimentChart.jsx
            ├── SignUp.css
            ├── Signup.jsx
            ├── Stockdata.jsx
            ├── StockMetricCard.jsx
            ├── StockList.jsx
            └── data/
                └── stockData.json


1. *Fork the repository*
   Fork the project to your github account

2. *Clone the repository*

bash
git clone https://github.com/yourusername/stock.git


## Backend Setup (Flask)

Navigate to backend folder

bash
cd stock/backend


1. *Create a Virtual Environemnt*

bash
    python -m venv venv
    source venv/bin/activate   # Linux / macOS
    venv\Scripts\activate      # Windows

Note: run python --version before creating a virtual environment. The modules in requirement.txt are compatible with <=3.11 version of python.

If you're using higher versions, consider creating the virtual environement in the following way:
bash
    python -3.11 -m venv venv

Visit official website of python to download version 3.11.*

2. *Install dependencies*

bash
pip install -r requirements.txt

3. *Start the backend server*

bash
python app.py

### Optional: Enable API response caching (Redis or in-memory)

Set the following environment variables (e.g., in a `.env` next to `backend/app.py`):

```
CACHE_ENABLED=true
REDIS_URL=redis://localhost:6379/0
CACHE_TTL_STOCK=900   # seconds for stock data
CACHE_TTL_PRED=3600   # seconds for prediction endpoint
```

- If Redis is reachable, it will be used.
- If Redis is not reachable, the app falls back to a safe in-memory cache.
- Force refresh any endpoint with `?refresh=true`.
- Cache headers: the API adds `X-Cache: HIT|MISS|BYPASS` to responses.


The app will be available at http://x.x.x.x:10000. (you will find the correct url in the server console)
copy the server url to use in frontend
make sure the app in the testing during the code editing

For local testing, allow your frontend origin with the `CORS_ORIGINS` environment variable
(comma-separated, default `http://localhost:3000,https://aistockanalyzer.onrender.com`).
You no longer need to edit `app.py`.

### Optional: AI platform configuration

Copy `backend/.env.example` to `backend/.env`. Every key is optional. Without any keys the platform
runs offline on the bundled CSV data, and the AI agent uses rule-based answers.

| Variable | Effect |
|---|---|
| `NEWS_API_KEY` | Enables latest news, sentiment and news ingestion into the RAG layer |
| `ANTHROPIC_API_KEY` | The AI agent writes natural-language answers with Claude (`ANTHROPIC_MODEL`, default `claude-opus-5-5`) |
| `LIVE_MARKET_DATA=true` | Uses yfinance for live prices and fundamentals, falling back to the CSV data |
| `DB_BACKEND=excel` | Development database: `backend/storage/dev_database.xlsx` (created automatically) |

### Run the backend tests

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest -q tests
```

### Run everything with Docker

```bash
docker compose up --build   # frontend http://localhost:3000, API http://localhost:10000
```

## Frontend Setup (React)

*Install dependencies*

bash
npm install


Create a `.env` file in the project root and set the backend URL there. Both
`Stockdata.jsx` and `Prediction.jsx` already read it via `REACT_APP_API_URL`,
so you do not need to edit those files.

bash
REACT_APP_API_URL=http://localhost:10000

Use the backend server URL shown in the Flask console. Restart `npm start`
after changing `.env` so the new value is picked up.


## Create a .env and add the following:

bash
    REACT_APP_FIREBASE_API_KEY="xxxx(you credentials)"
    REACT_APP_FIREBASE_AUTH_DOMAIN="xxxx(you credentials)"
    REACT_APP_FIREBASE_DATABASE_URL="xxxx(you credentials)"
    REACT_APP_FIREBASE_PROJECT_ID="xxxx(you credentials)"
    REACT_APP_FIREBASE_STORAGE_BUCKET="xxxx(you credentials)"
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID="xxxx(you credentials)"
    REACT_APP_FIREBASE_APP_ID="xxxx(you credentials)"
    REACT_APP_FIREBASE_MEASUREMENT_ID="xxxx(you credentials)"

## How to get Firebase Credentials?

1. Go to [Firebase](https://console.firebase.google.com) Console

2. Create a Project (or use existing)

    - Click Add Project → enter a name (e.g., Stock Analyzer).
    - Configure Google Analytics (optional).
    - Project will take a few seconds to be ready.

3. Register a Web App

    - Inside your project → go to Project Overview (top-left) → Add app → choose Web (</> icon).
    - Give your app a nickname (e.g., stock-analyzer-web).
    - Click Register App.

4. Get Firebase Config Object

    - After registering, Firebase shows you code like this:
    js
    const firebaseConfig = {
        apiKey: "AIzaSyDxxxxxx",
        authDomain: "your-project-id.firebaseapp.com",
        databaseURL: "https://your-project-id.firebaseio.com",
        projectId: "your-project-id",
        storageBucket: "your-project-id.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abcdef123456",
        measurementId: "G-ABC123XYZ"
};


These values map 1:1 to the .env variables.

5. Copy them into .env

## Start the project

bash
   npm start


The app will be available at http://localhost:3000.
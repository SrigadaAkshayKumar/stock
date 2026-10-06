# AI Stock Analyzer

The **Stock Analyzer** project is an AI-powered stock market analysis platform. Pick a stock to see its price history, technical indicators, fundamentals, ML predictions with backtested accuracy, recent news and sentiment, and risk metrics in one place. You can also ask an **AI analyst** questions about the stock and download a complete **PDF analysis report**.

<div align = "center"
    
<img alt="Stars" src="https://img.shields.io/github/stars/SrigadaAkshayKumar/stock?style=flat&logo=github"/>
<img alt="Forks" src="https://img.shields.io/github/forks/SrigadaAkshayKumar/stock?style=flat&logo=github"/>
<img alt="Issues" src="https://img.shields.io/github/issues/SrigadaAkshayKumar/stock?style=flat&logo=github"/>
<img alt="Issues Closed" src="https://img.shields.io/github/issues-closed/SrigadaAkshayKumar/stock?style=flat&logo=github"/>
<img alt="Open Pull Requests" src="https://img.shields.io/github/issues-pr/SrigadaAkshayKumar/stock?style=flat&logo=github"/>
<img alt="Close Pull Requests" src="https://img.shields.io/github/issues-pr-closed/SrigadaAkshayKumar/stock?style=flat&color=green&logo=github"/>
</div>

## Live Demo

[View Deployed App on Render](https://aistockanalyzer.onrender.com)

---

OSCI 2026 contributors Please Follow this link to join [WhatsApp group](https://chat.whatsapp.com/CNiFekAmXmVGwyFsVMcncM?s=sh&p=a&mlu=4&ilr=4) to involve in the discussions Thank you. 

## Overview

### Home Page

![Home Page](Images/home.png)

### Stock Analysis View

![Stock Analysis](Images/main.png)

### Stock Predictions

## ![Stock prediction](Images/prediction.png)

## Platform Features

| Module | What it does |
|---|---|
| Stock dashboard | Price, chart, volume, technical indicators, fundamentals, news, AI analysis |
| Market data | Local historical dataset with optional live data via yfinance |
| ML prediction | Feature engineering, model selection, 1- and 5-day direction and price forecasts, walk-forward backtesting, prediction tracking |
| RAG | News and company-document ingestion, chunking, embeddings, relevance × freshness retrieval with source grounding |
| AI agent | Stock-specific chat that picks tools (price, indicators, fundamentals, news, documents, ML, risk, report) and returns evidence-backed answers with sources |
| Reports | Downloadable 14-section PDF analysis report |
| Risk & disclaimer | Volatility, drawdown, VaR, model-confidence warnings and an educational-use disclaimer |
| Scalability | Caching, background jobs, rate limiting, Docker, CI |

Design documentation: [HLD](docs/HLD.md) · [LLD](docs/LLD.md) · [API](docs/API.md) · [Database](docs/DATABASE.md) · [Model lifecycle](docs/MODEL_LIFECYCLE.md) · [AWS deployment](docs/DEPLOYMENT_AWS.md) · [Roadmap & status](docs/ROADMAP.md)

> ⚠ **Disclaimer:** This platform provides AI-generated market analysis for educational and informational purposes only. Predictions are probabilistic and may be inaccurate. It is not personalized investment advice.

## Technologies Used

- **React:** User Interface
- **Plotly.js:** Interactive visualizations
- **Axios:** API calls
- **Flask:** Backend Framework
- **yfinance:** Stock data extraction
- **Pandas:** Data manipulation
- **scikit-learn:** ML prediction and backtesting; hashed n-gram embeddings for RAG
- **Claude API (optional):** natural-language synthesis of agent answers
- **reportlab:** PDF reports
- **openpyxl:** Excel development database (PostgreSQL schema for production)
- **Redis (optional), Docker, GitHub Actions:** caching, containers, CI

---

## Directory Structure

```
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
```

---

## API Endpoints

| **Endpoint**                  | **Method** | **Description**                                   |
| ----------------------------- | ---------- | ------------------------------------------------- |
| `/api/stock/<symbol>`         | GET        | Fetch historical stock data, supports `?chart_period=`, `?table_period=` and `?refresh=true` |
| `/api/stock/<symbol>/predict` | GET        | Predict future stock prices, supports `?refresh=true` |

---

## Data Pipeline Architecture

![Home Page](Images/dataline.png)

---

## Project Status

**Stock Analyzer** is currently in the **development stage** and hosted on a free hosting service for testing purposes.

## The latest pulls are merged every Saturday.

## Future Enhancements

We have a clear roadmap for improvements:

- Allow more API calls per day
- Reduce response time for end users
- Add International stock exchanges
- Enhance the user interface for better experience
- Improve machine learning model accuracy
- Provide more insightful and interactive visualizations
- Migrate deployment from Render to Google Cloud Platform (GCP)

## Contributions

We welcome all forms of open-source contributions — whether it's a:

- Bug fix
- New feature
- Enhancement or optimization

Please make sure to:

- Review our [Contribution Guidelines](./CONTRIBUTION.md)
- Follow the [Setup Instructions](./SETUP.md) to run the project locally
- Join the [Discord](https://discord.gg/ypQSaPbsDv)

![Open Source Connect India](Images/osconnect.png)

## License

This project is licensed under the [MIT License](LICENSE).  
You’re free to use, modify, and share this software under the license terms.

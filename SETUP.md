# Stock Analyzer – Project Setup Guide

Welcome to the Stock Analyzer project! Follow the steps below to set up the project locally and start contributing or testing.

## Prerequisites

Make sure you have the following installed on your system:

- **Python 3.11.+**
- **Node.js and npm**
- **Git**


```bash
app = Flask(__name__)
CORS(app)
```

for testing environment

## Frontend Setup (React)

**Install dependencies**

```bash
npm install
```

Add server url to frontend Stockdata.jsx and Predict.jsx page

from

```bash
${process.env.REACT_APP_API_URL}
```

to

```bash
http://x.x.x.x:10000
```

## Create a .env and add the following:

```bash
    REACT_APP_FIREBASE_API_KEY="xxxx(you credentials)"
    REACT_APP_FIREBASE_AUTH_DOMAIN="xxxx(you credentials)"
    REACT_APP_FIREBASE_DATABASE_URL="xxxx(you credentials)"
    REACT_APP_FIREBASE_PROJECT_ID="xxxx(you credentials)"
    REACT_APP_FIREBASE_STORAGE_BUCKET="xxxx(you credentials)"
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID="xxxx(you credentials)"
    REACT_APP_FIREBASE_APP_ID="xxxx(you credentials)"
    REACT_APP_FIREBASE_MEASUREMENT_ID="xxxx(you credentials)"
```
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
    ```js
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
```

These values map 1:1 to the `.env` variables.

5. Copy them into `.env`

## Start the project

```bash
   npm start
```

The app will be available at http://localhost:3000.
import React from "react";
import { Link } from "react-router-dom";
import BackToTopBtn from "./BackToTopBtn";

const PrivacyPolicy = () => {
  return (
    <div className="about-container">
      <div id="Privacy">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().getFullYear()}</p>
        <p>
          Stock Analyzer respects your privacy. This page explains what we
          collect and how it is used.
        </p>

        <h3>What we collect</h3>
        <p>
          When you sign up or log in with Firebase Authentication we store
          your email address and Firebase UID so we can keep you signed in.
          If you use the watchlist while logged in, we store the symbols
          you save along with your UID in Firestore. When you are logged
          out the watchlist is kept only in your browser localStorage.
        </p>

        <h3>How we use it</h3>
        <p>
          Your account data is used only to run the app: sign in, show
          your watchlist and keep your preferences. We do not sell your
          personal data.
        </p>

        <h3>Third party services</h3>
        <p>
          We use Firebase for login and watchlist storage, and our own
          backend API for stock data and predictions. The contact form
          posts through Web3Forms. News comes from NewsAPI and is shown
          with sentiment scores.
        </p>

        <h3>Your choices</h3>
        <p>
          You can sign out at any time, clear your browser localStorage to
          remove the local watchlist, and ask us to delete your account
          data by writing to support@stockanalyzer.com.
        </p>

        <div className="button-container">
          <Link to="/">
            <button className="cta-button">Back to Home</button>
          </Link>
        </div>
      </div>
      <BackToTopBtn />
    </div>
  );
};

export default PrivacyPolicy;

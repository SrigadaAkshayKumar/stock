import React from "react";
import { Link } from "react-router-dom";
import BackToTopBtn from "./BackToTopBtn";

const Terms = () => {
  return (
    <div className="about-container">
      <div id="Terms">
        <h1>Terms of Service</h1>
        <p>Last updated: {new Date().getFullYear()}</p>
        <p>
          By using Stock Analyzer you agree to these terms. Please read
          them carefully.
        </p>

        <h3>Using the platform</h3>
        <p>
          You need a valid account to use the watchlist and other
          personal features. You are responsible for keeping your login
          safe and for activity under your account. Do not misuse the
          service or try to break it.
        </p>

        <h3>Stock data disclaimer</h3>
        <p>
          Predictions, charts and news sentiment shown here are for
          information only and are not financial advice. Markets are
          risky, always do your own research or talk to a licensed
          advisor before investing.
        </p>

        <h3>Accounts</h3>
        <p>
          Login and signup run through Firebase. We may suspend accounts
          that abuse the service or violate these terms.
        </p>

        <h3>Liability</h3>
        <p>
          The app is provided as is without warranties. To the extent
          allowed by law, we are not liable for trading losses or damages
          from using the information on this site.
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

export default Terms;

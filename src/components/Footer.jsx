import React from "react";
import { Link } from "react-router-dom";
import { LuChartCandlestick, LuGithub, LuMail } from "react-icons/lu";
import styles from "./Footer.module.css";

const REPO_URL = "https://github.com/SrigadaAkshayKumar/stock";

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.inner}>
      <div className={styles.brandCol}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logo}>
            <LuChartCandlestick />
          </span>
          <span>
            Stock<span className={styles.accent}>Analyzer</span>
          </span>
        </Link>
        <p>
          AI-powered analysis for Indian equities: ML forecasts with backtesting, technical indicators,
          source-grounded news and an AI analyst.
        </p>
      </div>

      <div>
        <h4>Product</h4>
        <ul>
          <li>
            <Link to="/">Markets</Link>
          </li>
          <li>
            <Link to="/stock/TCS.NS">Sample analysis</Link>
          </li>
          <li>
            <Link to="/watchlist">Watchlist</Link>
          </li>
        </ul>
      </div>

      <div>
        <h4>Company</h4>
        <ul>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
        </ul>
      </div>

      <div>
        <h4>Connect</h4>
        <ul>
          <li>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <LuGithub /> GitHub
            </a>
          </li>
          <li>
            <a href="mailto:support@stockanalyzer.com">
              <LuMail /> support@stockanalyzer.com
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div className={styles.bottom}>
      <span>© {new Date().getFullYear()} Stock Analyzer</span>
      <span>For educational purposes only. Not investment advice.</span>
    </div>
  </footer>
);

export default Footer;

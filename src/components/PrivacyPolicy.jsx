import React from "react";
import { Link } from "react-router-dom";
import BackToTopBtn from "./BackToTopBtn";
import styles from "./PrivacyPolicy.module.css";

export const PRIVACY_SECTIONS = [
  { id: "overview", title: "1. Overview & Scope" },
  { id: "data-collection", title: "2. Information We Collect" },
  { id: "data-usage", title: "3. How We Use Your Information" },
  { id: "third-parties", title: "4. Third-Party Services" },
  { id: "storage-security", title: "5. Data Storage & Security" },
  { id: "user-rights", title: "6. Your Rights & Choices" },
  { id: "contact", title: "7. Contact Us" },
];

const PrivacyPolicy = () => {
  return (
    <div className={styles.privacyContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last Updated: October 2026</p>
      </header>

      <section className={styles.section} id="overview">
        <h2 className={styles.sectionTitle}>1. Overview & Scope</h2>
        <p className={styles.paragraph}>
          Welcome to Stock Analyzer (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;).
          We value your privacy and are committed to protecting any personal and usage data you
          share with us while using our stock analysis platform, market indicators, and investment
          tracking tools.
        </p>
        <p className={styles.paragraph}>
          This Privacy Policy outlines the types of information we collect, how it is processed and
          protected, and your choices regarding your personal data.
        </p>
      </section>

      <section className={styles.section} id="data-collection">
        <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
        <p className={styles.paragraph}>
          We only collect information necessary to provide you with personalized stock market analysis:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <strong>Account Credentials:</strong> When you register or sign in via Firebase
            Authentication, we receive your email address, display name, and unique user ID (UID).
          </li>
          <li className={styles.listItem}>
            <strong>Watchlist & Preferences:</strong> Stocks and market tickers you save to your
            watchlist are stored locally in your browser and synced with Firebase when logged in.
          </li>
          <li className={styles.listItem}>
            <strong>Search & Interaction Data:</strong> Search queries entered for tickers (such as
            BSE or NSE symbols) and selected chart timeframes to serve real-time financial metrics.
          </li>
          <li className={styles.listItem}>
            <strong>Contact Form Messages:</strong> Any feedback, inquiries, or contact messages
            submitted through our contact page.
          </li>
        </ul>
      </section>

      <section className={styles.section} id="data-usage">
        <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
        <p className={styles.paragraph}>We utilize collected data to:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Deliver real-time stock quotes, technical indicators, and price charts.</li>
          <li className={styles.listItem}>Persist and synchronize your saved watchlist across sessions.</li>
          <li className={styles.listItem}>Authenticate users securely and protect accounts from unauthorized access.</li>
          <li className={styles.listItem}>Respond to user support inquiries and feedback submitted via the Contact form.</li>
          <li className={styles.listItem}>Maintain and improve platform reliability, security, and performance.</li>
        </ul>
      </section>

      <section className={styles.section} id="third-parties">
        <h2 className={styles.sectionTitle}>4. Third-Party Services</h2>
        <p className={styles.paragraph}>
          To provide comprehensive financial data and authentication, we integrate with trusted third-party providers:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <strong>Firebase (Google LLC):</strong> Used for secure user authentication and optional
            cloud storage of watchlist preferences.
          </li>
          <li className={styles.listItem}>
            <strong>Financial Data & News APIs:</strong> Used to fetch current market quotes, technical
            history, and news sentiment feeds.
          </li>
        </ul>
        <p className={styles.paragraph}>
          We do not sell, rent, or trade your personal information to third parties for marketing purposes.
        </p>
      </section>

      <section className={styles.section} id="storage-security">
        <h2 className={styles.sectionTitle}>5. Data Storage & Security</h2>
        <p className={styles.paragraph}>
          We implement industry-standard administrative and technical security measures to safeguard your
          data. Web traffic is served over encrypted HTTPS connections. Sensitive user credentials are
          managed securely by Firebase and are never stored in plaintext on our servers.
        </p>
      </section>

      <section className={styles.section} id="user-rights">
        <h2 className={styles.sectionTitle}>6. Your Rights & Choices</h2>
        <p className={styles.paragraph}>You have control over your data:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>You can view, add, or remove stock symbols from your watchlist at any time.</li>
          <li className={styles.listItem}>You can clear locally cached stocks directly via your browser storage settings.</li>
          <li className={styles.listItem}>You may log out or request account removal by contacting our team.</li>
        </ul>
      </section>

      <section className={styles.section} id="contact">
        <h2 className={styles.sectionTitle}>7. Contact Us</h2>
        <p className={styles.paragraph}>
          If you have questions or concerns regarding this Privacy Policy, please reach out via our{" "}
          <Link to="/contact" className={styles.link}>
            Contact Form
          </Link>{" "}
          or by email at{" "}
          <a href="mailto:support@stockanalyzer.com" className={styles.link}>
            support@stockanalyzer.com
          </a>.
        </p>
      </section>

      <BackToTopBtn />
    </div>
  );
};

export default PrivacyPolicy;

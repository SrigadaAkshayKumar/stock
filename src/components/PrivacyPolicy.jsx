// src/components/PrivacyPolicy.jsx
import React from "react";
import { useTheme } from "./ThemeContext";
import "./Privacy.css";

export default function PrivacyPolicy() {
  const { theme } = useTheme();

  return (
    <div className={`privacy-page ${theme}`}>
      <div className="privacy-box">
        <h1>Privacy Policy</h1>
        <p className="meta">Last updated: September 2025</p>

        <div className="privacy-content">
          <p>
            Your privacy is important to us. This Privacy Policy explains how our Stock
            Analyzer App collects, uses, and safeguards your information.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We may collect personal information (such as your email address) if you
            voluntarily provide it, along with technical data like device type,
            browser version, and IP address.
          </p>

          <h2>2. How We Use Information</h2>
          <ul>
            <li>To provide and improve our services.</li>
            <li>To notify you about updates and changes.</li>
            <li>To monitor usage for security and performance.</li>
          </ul>

          <h2>3. Sharing of Information</h2>
          <p>
            We do not sell your personal information. Data may be shared with trusted
            third parties only to operate our services, comply with legal obligations,
            or protect against fraud.
          </p>

          <h2>4. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your
            information. However, no method of transmission or storage is 100% secure.
          </p>

          <h2>5. Your Rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct, or
            delete your personal data. You may also opt out of communications at any
            time.
          </p>

          <h2>6. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Continued use of the app
            after updates indicates your acceptance of the revised terms.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            If you have any questions, please contact us at{" "}
            <a href="mailto:support@stockanalyzer.com">support@stockanalyzer.com</a>.
          </p>
        </div>

        <button
          className="print-btn"
          onClick={() => window.print()}
          style={{ marginTop: "2rem" }}
        >
          Print Privacy Policy
        </button>
      </div>
    </div>
  );
}

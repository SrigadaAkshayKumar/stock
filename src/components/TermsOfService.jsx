// src/components/TermsOfService.jsx
import "./TOS.css";

export default function TermsOfService({
  appName = "[App Name]",
  effectiveDate = "[Insert Effective Date]",
  lastUpdated = "[Insert Last Updated Date]",
  jurisdiction = "[Insert Governing Jurisdiction]",
  contactEmail = "[Insert Contact Email]",
}) {
  return (
    <div className="tos-page">
      <div className="tos-box">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Terms of Service</h1>
            <p className="text-sm meta mt-1">
              {appName} — Effective: <strong>{effectiveDate}</strong> • Last updated:{" "}
              <strong>{lastUpdated}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="print-btn"
            >
              Print / Save
            </button>
          </div>
        </header>

        <nav className="mt-6 border-t pt-6">
          <h2 className="text-sm font-medium">Table of contents</h2>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <li><a href="#eligibility" className="hover:underline">1. Eligibility</a></li>
            <li><a href="#no-financial-advice" className="hover:underline">2. No Financial Advice</a></li>
            <li><a href="#use-of-app" className="hover:underline">3. Use of the App</a></li>
            <li><a href="#data-accuracy" className="hover:underline">4. Data & Accuracy Disclaimer</a></li>
            <li><a href="#accounts-security" className="hover:underline">5. Accounts & Security</a></li>
            <li><a href="#intellectual-property" className="hover:underline">6. Intellectual Property</a></li>
            <li><a href="#limitation-of-liability" className="hover:underline">7. Limitation of Liability</a></li>
            <li><a href="#termination" className="hover:underline">8. Termination</a></li>
            <li><a href="#governing-law" className="hover:underline">9. Governing Law</a></li>
            <li><a href="#changes" className="hover:underline">10. Changes to Terms</a></li>
            <li><a href="#contact" className="hover:underline">11. Contact</a></li>
          </ul>
        </nav>

        <article className="tos-content mt-8">
          <section id="eligibility">
            <h3>1. Eligibility</h3>
            <p>
              You must be at least 18 years old to use {appName}. By accessing or using the App you represent and warrant that you meet this
              age requirement and that you have full power and authority to enter into these Terms.
            </p>
          </section>

          <section id="no-financial-advice">
            <h3>2. No Financial Advice</h3>
            <p>
              The App is provided for informational and educational purposes only. {appName} is not a registered financial advisor, broker,
              or investment firm. Nothing in the App constitutes financial, legal, tax, or investment advice.
            </p>
          </section>

          <section id="use-of-app">
            <h3>3. Use of the App</h3>
            <p>Prohibited uses include, but are not limited to:</p>
            <ul>
              <li>Using the App for fraudulent, illegal, or malicious activities.</li>
              <li>Reverse engineering, decompiling, or tampering with the App.</li>
              <li>Interfering with the App's operation or security.</li>
              <li>Unauthorized scraping or commercializing of data.</li>
            </ul>
          </section>

          <section id="data-accuracy">
            <h3>4. Data &amp; Accuracy Disclaimer</h3>
            <p>
              The App may rely on third-party data providers or APIs. We do not guarantee the accuracy, completeness, or timeliness of such
              data. Market data is inherently volatile and past performance is not indicative of future results.
            </p>
          </section>

          <section id="accounts-security">
            <h3>5. Accounts &amp; Security</h3>
            <p>
              If you create an account, you are responsible for maintaining the confidentiality of your credentials and all activities under
              your account.
            </p>
          </section>

          <section id="intellectual-property">
            <h3>6. Intellectual Property</h3>
            <p>
              All intellectual property rights in the App, UI, code, and content belong to {appName} or its licensors. We grant you a
              non-exclusive, non-transferable license for personal, non-commercial use.
            </p>
          </section>

          <section id="limitation-of-liability">
            <h3>7. Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {appName} AND ITS AFFILIATES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES.
            </p>
          </section>

          <section id="termination">
            <h3>8. Termination</h3>
            <p>
              We may suspend or terminate your access to the App at our discretion, including for violation of these Terms.
            </p>
          </section>

          <section id="governing-law">
            <h3>9. Governing Law</h3>
            <p>
              These Terms are governed by the laws of <strong>{jurisdiction}</strong>. Disputes must be brought in the courts located within{" "}
              <strong>{jurisdiction}</strong>.
            </p>
          </section>

          <section id="changes">
            <h3>10. Changes to Terms</h3>
            <p>
              We may update these Terms periodically. Continued use of the App after changes signifies acceptance of the revised Terms.
            </p>
          </section>

          <section id="contact">
            <h3>11. Contact</h3>
            <p>
              If you have questions, contact us at: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            </p>
          </section>

          <footer className="mt-8 border-t pt-6 text-sm meta">
            <p>
              By using {appName}, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}

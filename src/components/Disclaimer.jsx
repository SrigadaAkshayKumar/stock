import React from "react";
import styles from "./Analysis.module.css";

export const DISCLAIMER_TEXT =
  "This platform provides AI-generated market analysis for educational and informational purposes only. " +
  "Predictions and analysis are based on historical data, available market information, technical indicators " +
  "and retrieved news sources. They are probabilistic and may be inaccurate or change rapidly due to market " +
  "conditions and new information. The platform does not guarantee returns and should not be considered " +
  "personalized investment advice. Users should conduct their own research and consult a qualified financial " +
  "professional before making investment decisions.";

function Disclaimer({ compact = false }) {
  return (
    <div className={styles.disclaimer} role="note">
      <strong>⚠ Disclaimer:</strong>{" "}
      {compact
        ? "AI-generated analysis for educational purposes only — not investment advice. Predictions are probabilistic and may be wrong."
        : DISCLAIMER_TEXT}
    </div>
  );
}

export default Disclaimer;

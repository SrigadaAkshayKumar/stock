import React from "react";

const PredictionMetrics = ({ evaluation }) => {
  if (!evaluation) {
    return null;
  }

  return (
    <div className="prediction-metrics">
      <h2>Model Evaluation</h2>

      <div className="metrics-grid">

        <div className="metric-card">
          <span>MAE</span>
          <strong>{evaluation.mae}</strong>
        </div>

        <div className="metric-card">
          <span>RMSE</span>
          <strong>{evaluation.rmse}</strong>
        </div>

        <div className="metric-card">
          <span>R² Score</span>
          <strong>{evaluation.r2_score}</strong>
        </div>

        <div className="metric-card">
          <span>Average Error</span>
          <strong>{evaluation.mape}%</strong>
        </div>

      </div>

      <div
        className={`confidence-badge ${
          evaluation.confidence?.toLowerCase() || ""
        }`}
      >
        {evaluation.confidence} Confidence
      </div>
    </div>
  );
};

export default PredictionMetrics;
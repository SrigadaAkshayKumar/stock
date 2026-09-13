import React from "react";
import Plot from "react-plotly.js";

const EvaluationChart = ({ chartData }) => {
  // Do not render if chart data is missing
  if (
    !chartData ||
    !Array.isArray(chartData.actual) ||
    !Array.isArray(chartData.predicted) ||
    chartData.actual.length === 0 ||
    chartData.predicted.length === 0
  ) {
    return null;
  }

  // Create test sample numbers: 1, 2, 3, 4...
  const indexes = chartData.actual.map(
    (_, index) => index + 1
  );

  return (
    <div
      className="evaluation-chart"
      style={{
        width: "100%",
        marginTop: "30px",
      }}
    >
      <h2
        style={{
          color: "#ffffff",
          marginBottom: "20px",
        }}
      >
        Actual vs Predicted
      </h2>

      <Plot
        data={[
          {
            x: indexes,
            y: chartData.actual,
            type: "scatter",
            mode: "lines+markers",
            name: "Actual Price",
          },
          {
            x: indexes,
            y: chartData.predicted,
            type: "scatter",
            mode: "lines+markers",
            name: "Predicted Price",
          },
        ]}
        layout={{
          title: {
            text: "Actual vs Predicted Stock Price",
          },

          autosize: true,

          xaxis: {
            title: {
              text: "Test Sample",
            },
          },

          yaxis: {
            title: {
              text: "Stock Price",
            },
          },

          legend: {
            orientation: "h",
            x: 0.5,
            xanchor: "center",
            y: -0.2,
          },

          margin: {
            l: 70,
            r: 30,
            t: 60,
            b: 80,
          },
        }}
        config={{
          responsive: true,
          displaylogo: false,
        }}
        useResizeHandler={true}
        style={{
          width: "100%",
          height: "450px",
        }}
      />
    </div>
  );
};

export default EvaluationChart;
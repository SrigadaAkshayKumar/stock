import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { ClipLoader } from "react-spinners"; // Import ClipLoader
import { exportToCSV } from "../utils/exportCSV";

function Prediction({ ticker }) {
  const [predictedData, setPredictedData] = useState([]);
  const [predictedDates, setPredictedDates] = useState([]);
  const [actualData, setActualData] = useState([]);
  const [actualDates, setActualDates] = useState([]);
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPredictionData = useCallback(async () => {
    setIsLoading(true); // Start loading
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stock/${ticker}/predict` //${process.env.REACT_APP_API_URL}
      );
      setPredictedData(res.data.predictions || []);
      setPredictedDates(res.data.predicted_dates || []); // Updated
      setActualData(res.data.actual || []);
      setActualDates(res.data.actual_dates || []); // Updated
      setReturns(res.data.returns || []);
    } catch (error) {
      console.error("Error fetching prediction data:", error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  }, [ticker]);

  useEffect(() => {
    if (ticker) {
      fetchPredictionData();
    }
  }, [ticker, fetchPredictionData]);

  const handleExportPredictions = () => {
    const rows = predictedDates.map((date, idx) => ({
      Date: date,
      PredictedPrice: predictedData[idx] !== undefined ? predictedData[idx] : "",
      ActualDate: actualDates[idx] || "",
      ActualPrice: actualData[idx] !== undefined ? actualData[idx] : "",
    }));
    exportToCSV(rows, `${ticker}_predictions.csv`, ["Date", "PredictedPrice", "ActualDate", "ActualPrice"]);
  };

  return (
    <div className="predict">
      <div className="predict12">
        {isLoading ? (
          <div className="loading-spinner">
            <ClipLoader color="#36d7b7" size={50} /> {/* Loading animation */}
            <p>Loading prediction data...</p>
          </div>
        ) : (
          <>
            <div className="predict1">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h2 style={{ margin: 0 }}>Predicted vs Actual Stock Prices for {ticker}</h2>
                <button
                  onClick={handleExportPredictions}
                  style={{
                    padding: "8px 16px",
                    background: "#3B82F6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "14px"
                  }}
                >
                  📥 Export Prediction CSV
                </button>
              </div>
              <Plot
                data={[
                  {
                    x: predictedDates,
                    y: predictedData,
                    type: "scatter",
                    mode: "lines",
                    line: { color: "red", width: 2 },
                    name: "Predicted Price",
                  },
                  {
                    x: actualDates,
                    y: actualData,
                    type: "scatter",
                    mode: "lines",
                    line: { color: "green", width: 2 },
                    name: "Actual Price",
                  },
                ]}
                layout={{
                  title: `Predicted vs Actual Prices for ${ticker}`,
                  xaxis: {
                    title: {
                      text: "Year", // X-axis label
                      font: {
                        family: "Arial",
                        size: 14,
                      },
                    },
                  },
                  yaxis: {
                    title: {
                      text: "Stock Price", // Y-axis label
                      font: {
                        family: "Arial",
                        size: 14,
                      },
                    },
                  },
                  legend: {
                    orientation: "h",
                    x: 0.5,
                    xanchor: "center",
                    y: -0.2,
                  },
                }}
              />
            </div>
            <div className="predict2">
              <h2>Investment Returns</h2>
              <table border="1">
                <thead>
                  <tr>
                    <th>Stocks Bought</th>
                    <th>Current Price</th>
                    <th>After 1 Year</th>
                    <th>After 5 Years</th>
                    <th>After 10 Years</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((item, index) => (
                    <tr key={index}>
                      <td>{item.stocks_bought}</td>
                      <td>{item.current_price}</td>
                      <td>{item.after_1_year}</td>
                      <td>{item.after_5_years}</td>
                      <td>{item.after_10_years}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Prediction;

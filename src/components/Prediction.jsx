import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { LuInfo, LuTriangleAlert } from "react-icons/lu";
import Plot from "./Plot";
import { plotConfig, useChartTheme } from "./ui/chartTheme";
import { API, loadSnapshot } from "../services/snapshot";
import { formatPrice } from "../utils/format";
import styles from "./Prediction.module.css";

// Long-term linear-trend projection (the original model). Shown as an
// illustration next to the short-horizon ML forecasts in the AI Analysis tab.
function Prediction({ ticker }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const t = useChartTheme();

  const fetchPredictionData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // Use the pre-computed prediction when the stock has a snapshot.
      const snapshot = await loadSnapshot(ticker);
      setData(snapshot?.legacy_prediction || (await axios.get(`${API}/api/stock/${ticker}/predict`)).data);
    } catch {
      setError("Could not load the projection. The server may be waking up. Please try again in a minute.");
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    if (ticker) fetchPredictionData();
  }, [ticker, fetchPredictionData]);

  if (isLoading) {
    return (
      <div className={`card loading-spinner`}>
        <div className="spinner" />
        <p>Loading projection…</p>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className={`card ${styles.error}`}>
        <LuTriangleAlert /> {error || "No projection available."}
      </div>
    );
  }

  const returns = data.returns || [];
  return (
    <div className={styles.wrap}>
      <section className="card">
        <div className={styles.head}>
          <h2>10-year trend projection</h2>
          <span className="badge badge-warning">Illustrative</span>
        </div>
        <div className={styles.chart}>
          <Plot
            data={[
              {
                x: data.actual_dates,
                y: data.actual,
                type: "scatter",
                mode: "lines",
                name: "Actual close",
                line: { color: t.line, width: 2 },
              },
              {
                x: data.predicted_dates,
                y: data.predictions,
                type: "scatter",
                mode: "lines+markers",
                name: "Linear trend projection",
                line: { color: t.warning, width: 2, dash: "dash" },
                marker: { size: 6 },
              },
            ]}
            layout={t.layout({ height: 380, xaxis: { gridcolor: "rgba(0,0,0,0)", linecolor: t.grid, type: "date" } })}
            config={plotConfig}
            useResizeHandler
            style={{ width: "100%" }}
          />
        </div>
        <p className={styles.note}>
          <LuInfo /> A straight line fitted to the full price history and extended forward. It ignores
          volatility, earnings and market conditions, so use the backtested ML forecasts in the AI Analysis
          tab for short-term views.
        </p>
      </section>

      {returns.length > 0 && (
        <section className="card">
          <div className={styles.head}>
            <h2>What an investment would be worth on this trend</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Shares</th>
                  <th>Value today</th>
                  <th>After 1 year</th>
                  <th>After 5 years</th>
                  <th>After 10 years</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.stocks_bought}>
                    <td>{r.stocks_bought}</td>
                    <td>{formatPrice(r.current_price, ticker)}</td>
                    <td>{formatPrice(r.after_1_year, ticker)}</td>
                    <td>{formatPrice(r.after_5_years, ticker)}</td>
                    <td>{formatPrice(r.after_10_years, ticker)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default Prediction;

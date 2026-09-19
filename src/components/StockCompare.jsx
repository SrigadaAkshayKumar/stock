import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { ClipLoader } from "react-spinners";
import stockData from "./data/stockData.json";
import BackToTopBtn from "./BackToTopBtn";
import styles from "./StockCompare.module.css";

const StockCompare = () => {
  const allStocks = [...(stockData.BSE || []), ...(stockData.NSE || [])];

  const [ticker1, setTicker1] = useState(allStocks[0]?.symbol || "RELIANCE.BO");
  const [ticker2, setTicker2] = useState(allStocks[1]?.symbol || "TCS.BO");

  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [info1, setInfo1] = useState(null);
  const [info2, setInfo2] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState("1mo");

  const periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "max"];

  const fetchComparisonData = useCallback(async () => {
    if (!ticker1 || !ticker2) return;
    setIsLoading(true);
    const apiUrl = process.env.REACT_APP_API_URL || "";

    try {
      const [res1, res2] = await Promise.all([
        axios.get(`${apiUrl}/api/stock/${ticker1}?chart_period=${period}`),
        axios.get(`${apiUrl}/api/stock/${ticker2}?chart_period=${period}`),
      ]);

      setData1(res1.data.stock_data || []);
      setInfo1(res1.data.stock_info || {});

      setData2(res2.data.stock_data || []);
      setInfo2(res2.data.stock_info || {});
    } catch (err) {
      console.error("Error fetching comparison stock data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ticker1, ticker2, period]);

  useEffect(() => {
    fetchComparisonData();
  }, [fetchComparisonData]);

  // Extract date and price arrays for Plotly chart
  const dates1 = data1?.map((d) => d.Date) || [];
  const prices1 = data1?.map((d) => d.Close) || [];

  const dates2 = data2?.map((d) => d.Date) || [];
  const prices2 = data2?.map((d) => d.Close) || [];

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>⚖️ Stock Comparison Tool</h2>
      <p className={styles.subtitle}>
        Compare live market performance, historical trends, and price metrics side-by-side.
      </p>

      {/* Selectors */}
      <div className={styles.selectorsRow}>
        <div className={styles.selectorGroup}>
          <label>Stock 1:</label>
          <select
            value={ticker1}
            onChange={(e) => setTicker1(e.target.value)}
            className={styles.selectInput}
          >
            {allStocks.map((stock) => (
              <option key={`s1-${stock.symbol}`} value={stock.symbol}>
                {stock.symbol} ({stock.name})
              </option>
            ))}
          </select>
        </div>

        <span className={styles.vsBadge}>VS</span>

        <div className={styles.selectorGroup}>
          <label>Stock 2:</label>
          <select
            value={ticker2}
            onChange={(e) => setTicker2(e.target.value)}
            className={styles.selectInput}
          >
            {allStocks.map((stock) => (
              <option key={`s2-${stock.symbol}`} value={stock.symbol}>
                {stock.symbol} ({stock.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Selector */}
      <div className={styles.periodRow}>
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`${styles.periodBtn} ${
              period === p ? styles.activePeriodBtn : ""
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className={styles.loadingSpinner}>
          <ClipLoader color="var(--color-primary)" size={50} />
          <p>Fetching comparison data...</p>
        </div>
      ) : (
        <>
          {/* Comparison Cards */}
          <div className={styles.cardsGrid}>
            <div className={styles.metricCard}>
              <h3 className={styles.stockTitle}>{ticker1}</h3>
              <p className={styles.stockSub}>{info1?.name || ticker1}</p>

              <div className={styles.metricDetails}>
                <div className={styles.metricItem}>
                  <span>Close Price:</span>
                  <strong>₹{info1?.close ? info1.close.toFixed(2) : "N/A"}</strong>
                </div>
                <div className={styles.metricItem}>
                  <span>Open Price:</span>
                  <strong>₹{info1?.open ? info1.open.toFixed(2) : "N/A"}</strong>
                </div>
                <div className={styles.metricItem}>
                  <span>High Price:</span>
                  <strong>₹{info1?.high ? info1.high.toFixed(2) : "N/A"}</strong>
                </div>
                <div className={styles.metricItem}>
                  <span>Low Price:</span>
                  <strong>₹{info1?.low ? info1.low.toFixed(2) : "N/A"}</strong>
                </div>
              </div>
            </div>

            <div className={styles.metricCard}>
              <h3 className={styles.stockTitle}>{ticker2}</h3>
              <p className={styles.stockSub}>{info2?.name || ticker2}</p>

              <div className={styles.metricDetails}>
                <div className={styles.metricItem}>
                  <span>Close Price:</span>
                  <strong>₹{info2?.close ? info2.close.toFixed(2) : "N/A"}</strong>
                </div>
                <div className={styles.metricItem}>
                  <span>Open Price:</span>
                  <strong>₹{info2?.open ? info2.open.toFixed(2) : "N/A"}</strong>
                </div>
                <div className={styles.metricItem}>
                  <span>High Price:</span>
                  <strong>₹{info2?.high ? info2.high.toFixed(2) : "N/A"}</strong>
                </div>
                <div className={styles.metricItem}>
                  <span>Low Price:</span>
                  <strong>₹{info2?.low ? info2.low.toFixed(2) : "N/A"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className={styles.chartContainer}>
            <h3>Price Trend Comparison</h3>
            <Plot
              data={[
                {
                  x: dates1,
                  y: prices1,
                  type: "scatter",
                  mode: "lines+markers",
                  name: `${ticker1}`,
                  line: { color: "#2563EB", width: 2.5 },
                },
                {
                  x: dates2,
                  y: prices2,
                  type: "scatter",
                  mode: "lines+markers",
                  name: `${ticker2}`,
                  line: { color: "#10B981", width: 2.5 },
                },
              ]}
              layout={{
                autosize: true,
                title: `${ticker1} vs ${ticker2} (${period})`,
                margin: { t: 40, r: 20, l: 50, b: 50 },
                xaxis: { title: "Date", autorange: "reversed" },
                yaxis: { title: "Stock Price (₹)" },
                legend: { orientation: "h", y: -0.2 },
              }}
              useResizeHandler={true}
              style={{ width: "100%", height: "450px" }}
            />
          </div>
        </>
      )}

      <BackToTopBtn />
    </div>
  );
};

export default StockCompare;

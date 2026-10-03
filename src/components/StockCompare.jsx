import React, { useEffect, useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import stockData from "./data/stockData.json";
import BackToTopBtn from "./BackToTopBtn";

const allSymbols = [
  ...(stockData.BSE || []).map((s) => s.symbol),
  ...(stockData.NSE || []).map((s) => s.symbol),
].filter((v, i, a) => a.indexOf(v) === i);

const StockCompare = () => {
  const [first, setFirst] = useState("RELIANCE.BO");
  const [second, setSecond] = useState("TCS.BO");
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const base = process.env.REACT_APP_API_URL;
    if (!base) {
      setNote("Set REACT_APP_API_URL to load live comparison.");
      return;
    }
    if (first === second) {
      setNote("Pick two different tickers to compare.");
      return;
    }
    setNote("");
    setLoading(true);
    const load = async (symbol) => {
      const res = await axios.get(
        `${base}/api/stock/${symbol}?chart_period=max&table_period=5d`
      );
      return res.data;
    };
    Promise.all([load(first), load(second)])
      .then(([a, b]) => {
        setDataA(a);
        setDataB(b);
      })
      .catch(() => setNote("Could not load one or both stocks."))
      .finally(() => setLoading(false));
  }, [first, second]);

  const series = (d) => {
    if (!d?.stock_data) return { x: [], y: [] };
    const rows = d.stock_data.slice(-120);
    return { x: rows.map((r) => r.Date), y: rows.map((r) => r.Close) };
  };

  const a = series(dataA);
  const b = series(dataB);

  const card = (label, d) => (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "1rem",
        minWidth: "220px",
      }}
    >
      <h3>{label}</h3>
      {d?.stock_info ? (
        <>
          <p>Close: {d.stock_info.close}</p>
          <p>Open: {d.stock_info.open}</p>
          <p>High: {d.stock_info.high}</p>
          <p>Low: {d.stock_info.low}</p>
        </>
      ) : (
        <p>No data yet.</p>
      )}
    </div>
  );

  return (
    <div className="container" style={{ padding: "1.5rem 1rem" }}>
      <h1>Compare Stocks</h1>
      <div style={{ display: "flex", gap: "1rem", margin: "1rem 0", flexWrap: "wrap" }}>
        <label>
          First
          <select value={first} onChange={(e) => setFirst(e.target.value)}>
            {allSymbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Second
          <select value={second} onChange={(e) => setSecond(e.target.value)}>
            {allSymbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {note && <p>{note}</p>}
      {loading && <p>Loading comparison...</p>}

      {!loading && (
        <>
          <Plot
            data={[
              { x: a.x, y: a.y, type: "scatter", mode: "lines", name: first },
              { x: b.x, y: b.y, type: "scatter", mode: "lines", name: second },
            ]}
            layout={{ title: `${first} vs ${second}`, autosize: true }}
            style={{ width: "100%" }}
            config={{ responsive: true }}
          />
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
            {card(first, dataA)}
            {card(second, dataB)}
          </div>
        </>
      )}
      <BackToTopBtn />
    </div>
  );
};

export default StockCompare;

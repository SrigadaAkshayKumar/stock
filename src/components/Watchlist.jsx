import React, { useEffect, useState } from "react";
import axios from "axios";
import { getWatchlist, removeStockFromWatchlist } from "../utils/watchlistManager";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import BackToTopBtn from "./BackToTopBtn";
import styles from "./Watchlist.module.css";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({});
  const [targets, setTargets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("priceTargets") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      getWatchlist().then((data) => {
        setWatchlist(data);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (watchlist.length === 0) return;
    const base = process.env.REACT_APP_API_URL;
    if (!base) return;
    let alive = true;
    watchlist.forEach(async (stock) => {
      try {
        const res = await axios.get(`${base}/api/stock/${stock.symbol}?chart_period=5d&table_period=5d`);
        const close = Number(res.data?.stock_info?.close) || 0;
        if (alive && close) setPrices((p) => ({ ...p, [stock.symbol]: close }));
      } catch {
        // ignore, alerts just stay hidden
      }
    });
    return () => {
      alive = false;
    };
  }, [watchlist]);

  const saveTarget = (symbol, field, value) => {
    const next = { ...targets, [symbol]: { ...(targets[symbol] || {}), [field]: value } };
    setTargets(next);
    try {
      localStorage.setItem("priceTargets", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleRemove = async (symbol) => {
    const confirm = window.confirm(`Remove ${symbol} from your watchlist?`);
    if (!confirm) return;

    await removeStockFromWatchlist(symbol);
    setWatchlist((prev) => prev.filter((s) => s.symbol !== symbol));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading your watchlist...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>📈 My Watchlist</h2>
      {watchlist.length === 0 ? (
        <p className={styles.empty}>
          <span className={styles.emptyIcon}>📋</span>
          No stocks added yet.
        </p>
      ) : (
        <div className={styles.grid}>
          {watchlist.map((stock) => {
            const price = prices[stock.symbol];
            const high = parseFloat(targets[stock.symbol]?.high);
            const low = parseFloat(targets[stock.symbol]?.low);
            const hitHigh = price && !isNaN(high) && price >= high;
            const hitLow = price && !isNaN(low) && price <= low;
            return (
            <div key={stock.symbol} className={styles.card}>
              <h4>{stock.symbol}</h4>
              <p>{stock.name}</p>
              <p>{price ? `Rs. ${price.toFixed(2)}` : "Price --"}</p>
              {(hitHigh || hitLow) && (
                <p style={{ color: "#b45309", fontWeight: "600" }}>
                  {hitHigh ? `Target hit: above ${high}` : `Target hit: below ${low}`}
                </p>
              )}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  type="number"
                  placeholder="High"
                  value={targets[stock.symbol]?.high || ""}
                  onChange={(e) => saveTarget(stock.symbol, "high", e.target.value)}
                  style={{ width: "80px" }}
                />
                <input
                  type="number"
                  placeholder="Low"
                  value={targets[stock.symbol]?.low || ""}
                  onChange={(e) => saveTarget(stock.symbol, "low", e.target.value)}
                  style={{ width: "80px" }}
                />
              </div>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(stock.symbol)}
              >
                ❌ Remove
              </button>
            </div>
            );
          })}
        </div>
      )}
      <BackToTopBtn />
    </div>
  );
};


export default Watchlist;

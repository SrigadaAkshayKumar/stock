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
    let alive = true;
    const base = process.env.REACT_APP_API_URL;
    if (!base) return;
    watchlist.forEach(async (stock) => {
      try {
        const res = await axios.get(`${base}/api/stock/${stock.symbol}?chart_period=5d&table_period=5d`);
        const info = res.data?.stock_info;
        if (!info || !alive) return;
        const close = Number(info.close) || 0;
        const open = Number(info.open) || 0;
        const change = open ? ((close - open) / open) * 100 : 0;
        setPrices((prev) => ({ ...prev, [stock.symbol]: { price: close, change } }));
      } catch {
        // leave blank when backend is unreachable
      }
    });
    return () => {
      alive = false;
    };
  }, [watchlist]);

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
            const quote = prices[stock.symbol];
            const up = quote && quote.change >= 0;
            return (
            <div key={stock.symbol} className={styles.card}>
              <h4>{stock.symbol}</h4>
              <p>{stock.name}</p>
              <p>
                {quote ? `Rs. ${quote.price.toFixed(2)} ` : "Price -- "}
                {quote && (
                  <span style={{
                    color: "#fff",
                    background: up ? "#15803d" : "#b91c1c",
                    borderRadius: "10px",
                    padding: "2px 8px",
                    fontSize: "0.8rem",
                    marginLeft: "0.4rem"
                  }}>
                    {up ? "+" : ""}{quote.change.toFixed(2)}%
                  </span>
                )}
              </p>
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

import React, { useEffect, useState } from "react";
import { getWatchlist, removeStockFromWatchlist } from "../utils/watchlistManager";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import BackToTopBtn from "./BackToTopBtn";
import styles from "./Watchlist.module.css";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      getWatchlist()
        .then((data) => {
          setWatchlist(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Watchlist load failed:", err);
          setLoadError("Could not load your watchlist. Please refresh and try again.");
          setLoading(false);
        });
    });

    return () => unsubscribe();
  }, []);

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
      {loadError && <p className={styles.empty}>{loadError}</p>}
      {watchlist.length === 0 ? (
        <p className={styles.empty}>
          <span className={styles.emptyIcon}>📋</span>
          No stocks added yet.
        </p>
      ) : (
        <div className={styles.grid}>
          {watchlist.map((stock) => (
            <div key={stock.symbol} className={styles.card}>
              <h4>{stock.symbol}</h4>
              <p>{stock.name}</p>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(stock.symbol)}
              >
                ❌ Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <BackToTopBtn />
    </div>
  );
};


export default Watchlist;

import React, { useEffect, useState } from "react";
import { getWatchlist, removeStockFromWatchlist } from "../utils/watchlistManager";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import BackToTopBtn from "./BackToTopBtn";
import styles from "./Watchlist.module.css";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const raw = localStorage.getItem("watchlist");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      getWatchlist().then((data) => {
        if (!alive) return;
        // Only overwrite instant local render when we got real data
        // or when user is logged in (firebase is source of truth).
        if (currentUser || (Array.isArray(data) && data.length > 0)) {
          setWatchlist(data || []);
        }
        setLoading(false);
      }).catch(() => {
        if (alive) setLoading(false);
      });
    });

    // Fallback so spinner never sticks if auth is slow
    const timer = setTimeout(() => {
      if (alive) setLoading(false);
    }, 1500);

    return () => {
      alive = false;
      clearTimeout(timer);
      unsubscribe();
    };
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

import React, { useEffect, useState } from "react";
import { getWatchlist, removeStockFromWatchlist, toggleWatchlist } from "../utils/watchlistManager";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import BackToTopBtn from "./BackToTopBtn";
import styles from "./Watchlist.module.css";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRemoved, setLastRemoved] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      getWatchlist().then((data) => {
        setWatchlist(data);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  const handleRemove = async (symbol) => {
    const target = watchlist.find((s) => s.symbol === symbol);
    await removeStockFromWatchlist(symbol);
    setWatchlist((prev) => prev.filter((s) => s.symbol !== symbol));
    setLastRemoved(target || { symbol });
    toast.info(`${symbol} removed from watchlist`);
  };

  const handleUndo = async () => {
    if (!lastRemoved) return;
    try {
      await toggleWatchlist(lastRemoved);
      setWatchlist((prev) => [...prev, lastRemoved]);
      toast.success(`${lastRemoved.symbol} added back to watchlist`);
    } catch {
      toast.error("Could not undo remove.");
    }
    setLastRemoved(null);
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
      {lastRemoved && (
        <div style={{ marginBottom: "1rem" }}>
          <span>{lastRemoved.symbol} removed. </span>
          <button className={styles.removeBtn} onClick={handleUndo}>
            Undo
          </button>
        </div>
      )}
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

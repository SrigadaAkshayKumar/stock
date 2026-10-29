import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import { LuArrowRight, LuStar, LuTrash2 } from "react-icons/lu";
import { getWatchlist, removeStockFromWatchlist } from "../utils/watchlistManager";
import { auth } from "./firebase";
import Sparkline from "./ui/Sparkline";
import { baseSymbol, loadSnapshotSummaries } from "../services/snapshot";
import { formatPct, formatPrice } from "../utils/format";
import styles from "./Watchlist.module.css";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    loadSnapshotSummaries().then(setSummaries);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSignedIn(Boolean(user));
      getWatchlist()
        .then(setWatchlist)
        .catch(() => setWatchlist([]))
        .finally(() => setLoading(false));
    });
    return () => unsubscribe();
  }, []);

  const handleRemove = async (symbol) => {
    await removeStockFromWatchlist(symbol);
    setWatchlist((prev) => prev.filter((s) => s.symbol !== symbol));
    toast.success(`${symbol} removed from your watchlist`);
  };

  return (
    <div className="page">
      <div className={styles.head}>
        <div>
          <h1>Watchlist</h1>
          <p className="muted">
            {signedIn
              ? "Synced to your account."
              : "Saved in this browser. Sign in to sync your watchlist across devices."}
          </p>
        </div>
        {!signedIn && (
          <Link to="/login" className="btn btn-secondary">
            Sign in to sync
          </Link>
        )}
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`skeleton ${styles.skeleton}`} />
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <div className={styles.emptyIcon}>
            <LuStar />
          </div>
          <h2>Your watchlist is empty</h2>
          <p className="muted">Star stocks on the Markets page to track them here.</p>
          <Link to="/" className="btn btn-primary">
            Browse markets <LuArrowRight />
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {watchlist.map((stock) => {
            const summary = summaries[baseSymbol(stock.symbol)];
            return (
              <div key={stock.symbol} className={`card ${styles.card}`}>
                <div className={styles.cardTop}>
                  <div className={styles.avatar}>{baseSymbol(stock.symbol).slice(0, 2)}</div>
                  <div className={styles.title}>
                    <strong>{stock.symbol}</strong>
                    <span>{stock.name}</span>
                  </div>
                  <button
                    className={styles.remove}
                    onClick={() => handleRemove(stock.symbol)}
                    aria-label={`Remove ${stock.symbol}`}
                    title="Remove from watchlist"
                  >
                    <LuTrash2 />
                  </button>
                </div>
                {summary && (
                  <div className={styles.price}>
                    <div>
                      <strong>{formatPrice(summary.close, stock.symbol)}</strong>
                      <span className={summary.change_pct >= 0 ? "up" : "down"}>{formatPct(summary.change_pct)}</span>
                    </div>
                    <Sparkline values={summary.spark} />
                  </div>
                )}
                <Link to={`/stock/${stock.symbol}`} className="btn btn-secondary btn-sm">
                  Open analysis <LuArrowRight />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Watchlist;

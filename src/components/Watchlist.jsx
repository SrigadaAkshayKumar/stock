import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getWatchlist, removeStockFromWatchlist } from "../utils/watchlistManager";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import BackToTopBtn from "./BackToTopBtn";
import styles from "./Watchlist.module.css";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      getWatchlist().then(async (data) => {
        setWatchlist(data);
        setLoading(false);
        if (data && data.length > 0) {
          fetchPrices(data);
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const fetchPrices = async (items) => {
    const pricesMap = {};
    const apiUrl = process.env.REACT_APP_API_URL || "";

    await Promise.all(
      items.map(async (stock) => {
        try {
          const res = await axios.get(
            `${apiUrl}/api/stock/${stock.symbol}?chart_period=1mo`
          );
          const info = res.data?.stock_info || {};
          const close = typeof info.close === "number" ? info.close : null;
          const open = typeof info.open === "number" ? info.open : close;

          let change = null;
          let changePercent = null;
          if (close !== null && open !== null && open > 0) {
            change = close - open;
            changePercent = (change / open) * 100;
          }

          pricesMap[stock.symbol] = {
            price: close,
            open: open,
            high: info.high,
            low: info.low,
            change,
            changePercent,
            loading: false,
          };
        } catch (err) {
          pricesMap[stock.symbol] = {
            price: null,
            change: null,
            changePercent: null,
            loading: false,
            error: true,
          };
        }
      })
    );

    setStockPrices(pricesMap);
  };

  const handleRemove = async (e, symbol) => {
    e.stopPropagation();
    const confirm = window.confirm(`Remove ${symbol} from your watchlist?`);
    if (!confirm) return;

    await removeStockFromWatchlist(symbol);
    setWatchlist((prev) => prev.filter((s) => s.symbol !== symbol));
  };

  const handleCardClick = (symbol) => {
    navigate(`/stock/${symbol}`);
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
            const priceData = stockPrices[stock.symbol];
            const hasPrice = priceData && priceData.price !== null;
            const isPositive = priceData?.changePercent > 0;
            const isNegative = priceData?.changePercent < 0;

            return (
              <div
                key={stock.symbol}
                className={styles.card}
                onClick={() => handleCardClick(stock.symbol)}
              >
                <div className={styles.cardHeader}>
                  <h4>{stock.symbol}</h4>
                  <p>{stock.name}</p>
                </div>

                <div className={styles.priceContainer}>
                  {priceData ? (
                    hasPrice ? (
                      <>
                        <div className={styles.priceHeader}>
                          <span className={styles.currentPrice}>
                            ₹{priceData.price.toFixed(2)}
                          </span>
                          <span
                            className={`${styles.badge} ${
                              isPositive
                                ? styles.positiveBadge
                                : isNegative
                                ? styles.negativeBadge
                                : styles.neutralBadge
                            }`}
                          >
                            {isPositive ? "▲ +" : isNegative ? "▼ " : ""}
                            {priceData.changePercent.toFixed(2)}%
                          </span>
                        </div>
                        {priceData.high && priceData.low && (
                          <div className={styles.metricsRow}>
                            <span>H: ₹{priceData.high.toFixed(2)}</span>
                            <span>L: ₹{priceData.low.toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className={styles.noData}>Price data unavailable</span>
                    )
                  ) : (
                    <span className={styles.loadingPrice}>Loading live price...</span>
                  )}
                </div>

                <button
                  className={styles.removeBtn}
                  onClick={(e) => handleRemove(e, stock.symbol)}
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


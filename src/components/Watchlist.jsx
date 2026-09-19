import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  getWatchlist,
  removeStockFromWatchlist,
  updateStockAlerts,
} from "../utils/watchlistManager";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import BackToTopBtn from "./BackToTopBtn";
import styles from "./Watchlist.module.css";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingAlertSymbol, setEditingAlertSymbol] = useState(null);
  const [targetHighInput, setTargetHighInput] = useState("");
  const [targetLowInput, setTargetLowInput] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      getWatchlist().then(async (data) => {
        setWatchlist(data || []);
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

  const handleOpenAlertEditor = (e, stock) => {
    e.stopPropagation();
    setEditingAlertSymbol(stock.symbol);
    setTargetHighInput(
      stock.targetHigh !== undefined && stock.targetHigh !== null
        ? stock.targetHigh
        : ""
    );
    setTargetLowInput(
      stock.targetLow !== undefined && stock.targetLow !== null
        ? stock.targetLow
        : ""
    );
  };

  const handleSaveAlerts = async (e, symbol) => {
    e.stopPropagation();
    await updateStockAlerts(symbol, targetHighInput, targetLowInput);

    setWatchlist((prev) =>
      prev.map((s) => {
        if (s.symbol === symbol) {
          return {
            ...s,
            targetHigh: targetHighInput !== "" ? Number(targetHighInput) : null,
            targetLow: targetLowInput !== "" ? Number(targetLowInput) : null,
          };
        }
        return s;
      })
    );
    setEditingAlertSymbol(null);
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

            const isHighReached =
              hasPrice &&
              stock.targetHigh !== undefined &&
              stock.targetHigh !== null &&
              priceData.price >= stock.targetHigh;

            const isLowTriggered =
              hasPrice &&
              stock.targetLow !== undefined &&
              stock.targetLow !== null &&
              priceData.price <= stock.targetLow;

            return (
              <div
                key={stock.symbol}
                className={styles.card}
                onClick={() => handleCardClick(stock.symbol)}
              >
                {/* Alert Banners */}
                {isHighReached && (
                  <div className={styles.alertBannerHigh}>
                    🔔 Target High Reached! (≥ ₹{stock.targetHigh})
                  </div>
                )}
                {isLowTriggered && (
                  <div className={styles.alertBannerLow}>
                    ⚠️ Target Low Triggered! (≤ ₹{stock.targetLow})
                  </div>
                )}

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

                {/* Target Alerts Settings / Display */}
                {editingAlertSymbol === stock.symbol ? (
                  <div
                    className={styles.alertEditor}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={styles.alertInputGroup}>
                      <label>Target High (₹):</label>
                      <input
                        type="number"
                        placeholder="e.g. 2500"
                        value={targetHighInput}
                        onChange={(e) => setTargetHighInput(e.target.value)}
                        className={styles.alertInput}
                      />
                    </div>
                    <div className={styles.alertInputGroup}>
                      <label>Target Low (₹):</label>
                      <input
                        type="number"
                        placeholder="e.g. 1800"
                        value={targetLowInput}
                        onChange={(e) => setTargetLowInput(e.target.value)}
                        className={styles.alertInput}
                      />
                    </div>
                    <div className={styles.alertEditorBtns}>
                      <button
                        className={styles.saveAlertBtn}
                        onClick={(e) => handleSaveAlerts(e, stock.symbol)}
                      >
                        Save Alert
                      </button>
                      <button
                        className={styles.cancelAlertBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAlertSymbol(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.alertSummaryRow}>
                    {stock.targetHigh || stock.targetLow ? (
                      <div className={styles.activeAlertsText}>
                        {stock.targetHigh && <span>High: ₹{stock.targetHigh} </span>}
                        {stock.targetLow && <span>Low: ₹{stock.targetLow}</span>}
                      </div>
                    ) : (
                      <span className={styles.noAlertsText}>No price alerts set</span>
                    )}
                    <button
                      className={styles.setAlertBtn}
                      onClick={(e) => handleOpenAlertEditor(e, stock)}
                    >
                      ⚙️ Alerts
                    </button>
                  </div>
                )}

                <div className={styles.cardFooter}>
                  <button
                    className={styles.removeBtn}
                    onClick={(e) => handleRemove(e, stock.symbol)}
                  >
                    ❌ Remove
                  </button>
                </div>
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

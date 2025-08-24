import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";
import { toggleWatchlist } from "../utils/watchlistManager";
import { auth } from "../components/firebase";
import stockData from "./data/stockData.json";
import BackToTopBtn from "../components/BackToTopBtn";
import styles from "./StockList.module.css";

const StocksList = () => {
  const [stocks, setStocks] = useState([]);
  const [exchange, setExchange] = useState("BSE");
  const [searchTicker, setSearchTicker] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setStocks(stockData[exchange] || []);
      setIsLoading(false);
    }, 500);
  }, [exchange]);

  const handleSearch = () => {
    if (searchTicker.trim()) {
      navigate(`/stock/${searchTicker.trim()}`);
    }
  };

  const handleAddToWatchlist = async (stock) => {
    const user = auth.currentUser;

    if (user) {
      try {
        await toggleWatchlist(stock);
        alert(`${stock.symbol} added to your Firebase watchlist!`);
      } catch (err) {
        alert("Failed to add to watchlist.");
        console.error(err);
      }
    } else {
      const stored = JSON.parse(localStorage.getItem("watchlist")) || [];

      if (stored.some((item) => item.symbol === stock.symbol)) {
        alert("Stock is already in your guest watchlist!");
        return;
      }

      const updated = [...stored, stock];
      localStorage.setItem("watchlist", JSON.stringify(updated));
      alert(`${stock.symbol} added to guest watchlist!`);
    }
  };

  return (
    <motion.div
      className={styles.stocksList}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      
      {/* 🚀 Hero Section */}
      <section className={styles.hero}>
        <h1>Welcome to Stock Analyzer!</h1>
        <p>Track, analyze, and manage your favorite stocks with ease.</p>
      </section>

      {/* 🔍 Modern Search Bar */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search for stocks..."
          value={searchTicker}
          onChange={(e) => setSearchTicker(e.target.value)}
          className={styles.searchInput}
        />
        <button onClick={handleSearch} className={styles.searchButton}>
          Search
        </button>
      </div>

      {/* 🏦 Exchange Toggle */}
      <div className={styles.exchangeButtons}>
        {["BSE", "NSE"].map((exchangeName) => (
          <button
            key={exchangeName}
            onClick={() => setExchange(exchangeName)}
            className={`${styles.exchangeButton} ${
              exchange === exchangeName ? styles.activeExchange : ""
            }`}
          >
            {exchangeName}
          </button>
        ))}
      </div>

      {/* 📊 Stocks as Cards */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className={styles.loadingSpinner}>
            <ClipLoader color="var(--color-primary)" size={50} />
            <p>Loading stocks...</p>
          </div>
        ) : (
          <div className={styles.cardsContainer}>
            {stocks.map((stock, index) => (
              <motion.div
                key={stock.symbol}
                className={styles.stockCard}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
              >
                <div className={styles.stockIcon}>
                  📈
                </div>
                <h3>{stock.symbol}</h3>
                <p>{stock.name}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToWatchlist(stock);
                  }}
                  className={styles.watchlistButton}
                >
                  + Add to Watchlist
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <BackToTopBtn />
    </motion.div>
  );
};

export default StocksList;
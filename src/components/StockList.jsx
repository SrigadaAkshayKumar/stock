import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";
import { toggleWatchlist } from "../utils/watchlistManager";
import { auth } from "./firebase";
import stockData from "./data/stockData.json";
import BackToTopBtn from "./BackToTopBtn";
import styles from "./StockList.module.css";
import stockBg2 from "./images/bg.png";
import {toast} from "react-hot-toast"

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
        toast.success(`${stock.symbol} added to your Firebase watchlist!`);
      } catch (err) {
        toast.error("Failed to add to watchlist.");
        console.error(err);
      }
    } else {
      navigate("/login", {
        state: { message: "Please log in to use the watchlist." },
      });
    }
  };

  return (
    <motion.div
      className={styles.stocksList}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* 🚀 Hero Section */}
      <section
        className={styles.hero}
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(33,84,214,0.63), rgba(29,30,41,0.46)), url(${stockBg2})`,
          backgroundSize: "contain", // CHANGED from 'cover' to 'contain'
          backgroundPosition: "center bottom", // Focus lower part (the phone/hand)
          backgroundRepeat: "no-repeat",
        }}
      >
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
                <div className={styles.stockIcon}>📈</div>
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

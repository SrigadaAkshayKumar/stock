import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";
import { toggleWatchlist } from "../utils/watchlistManager";
import { auth } from "../components/firebase";
import stockData from "./data/stockData.json";
import BackToTopBtn from "../components/BackToTopBtn";
import styles from "./StockList.module.css";

// ⬇️ NEW IMPORTS for react-datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const StocksList = () => {
  const [stocks, setStocks] = useState([]);
  const [exchange, setExchange] = useState("BSE");
  const [searchTicker, setSearchTicker] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ⬇️ NEW STATE for selected date
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const tableRowVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      className={styles.stocksList}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants}>Stocks List</motion.h1>

      {/* Search Bar with DatePicker */}
      <motion.div className={styles.searchContainer} variants={itemVariants}>
        <motion.input
          type="text"
          placeholder="Enter stock ticker"
          value={searchTicker}
          onChange={(e) => setSearchTicker(e.target.value)}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className={styles.searchInput}
        />

        {/* ⬇️ NEW DatePicker field */}
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy/MM/dd"
          className={styles.searchInput}
        />

        <motion.button
          onClick={handleSearch}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={styles.searchButton}
        >
          Search
        </motion.button>
      </motion.div>

      {/* Exchange Buttons */}
      <motion.div className={styles.exchangeButtons} variants={itemVariants}>
        {["BSE", "NSE"].map((exchangeName) => (
          <motion.button
            key={exchangeName}
            onClick={() => setExchange(exchangeName)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`${styles.exchangeButton} ${
              exchange === exchangeName ? styles.activeExchange : ""
            }`}
          >
            {exchangeName}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className={styles.loadingSpinner}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <ClipLoader color="var(--color-primary)" size={50} />
            <motion.p
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Please wait while loading...
            </motion.p>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              It takes less than a minute
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            className={styles.tableContainer}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {stocks.map((stock, index) => (
                    <motion.tr
                      key={`${stock.symbol}-${index}`}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{
                        backgroundColor: "var(--color-card-hover)",
                      }}
                      custom={index}
                      transition={{ delay: index * 0.05 }}
                      className={styles.tableRow}
                    >
                      <td
                        onClick={() => navigate(`/stock/${stock.symbol}`)}
                        style={{ cursor: "pointer" }}
                      >
                        {stock.symbol}
                      </td>
                      <td
                        onClick={() => navigate(`/stock/${stock.symbol}`)}
                        style={{ cursor: "pointer" }}
                      >
                        {stock.name}
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToWatchlist(stock);
                          }}
                          className={styles.actionButton}
                        >
                          + Watchlist
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      <BackToTopBtn />
    </motion.div>
  );
};

export default StocksList;

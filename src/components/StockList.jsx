import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { auth } from "../components/firebase";
import { useNotification } from "../utils/notifications";
import { toggleWatchlist } from "../utils/watchlistManager";
import stockData from "./data/stockData.json";

const StocksList = () => {
  const [stocks, setStocks] = useState([]);
  const [exchange, setExchange] = useState("BSE");
  const [searchTicker, setSearchTicker] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

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
        showNotification(
          `${stock.symbol} added to your Firebase watchlist!`,
          "success"
        );
      } catch (err) {
        showNotification("Failed to add to watchlist.", "error");
        console.error(err);
      }
    } else {
      const stored = JSON.parse(localStorage.getItem("watchlist")) || [];

      if (stored.some((item) => item.symbol === stock.symbol)) {
        showNotification(
          "Stock is already in your guest watchlist!",
          "warning"
        );
        return;
      }

      const updated = [...stored, stock];
      localStorage.setItem("watchlist", JSON.stringify(updated));
      showNotification(`${stock.symbol} added to guest watchlist!`, "success");
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
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
    hover: {
      scale: 1.02,
      backgroundColor: "#e3f2fd",
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      className="stocks-list"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants}>Stocks List</motion.h1>

      {/* Search Bar */}
      <motion.div variants={itemVariants}>
        <motion.input
          type="text"
          placeholder="Enter stock ticker"
          value={searchTicker}
          onChange={(e) => setSearchTicker(e.target.value)}
          whileFocus={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        />
        <motion.button
          onClick={handleSearch}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Search
        </motion.button>
      </motion.div>

      {/* Exchange Buttons */}
      <motion.div className="exchange-buttons" variants={itemVariants}>
        {["BSE", "NSE"].map((exchangeName) => (
          <motion.button
            key={exchangeName}
            onClick={() => setExchange(exchangeName)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              backgroundColor:
                exchange === exchangeName ? "#0056b3" : "#007bff",
            }}
          >
            {exchangeName}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className="loading-spinner"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <ClipLoader color="#36d7b7" size={50} />
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
            className="table-container"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Actions</th> {/* New column */}
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
                      whileHover="hover"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                      custom={index}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td>{stock.symbol}</td>
                      <td>{stock.name}</td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToWatchlist(stock);
                          }}
                          style={{
                            padding: "4px 10px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Add to Watchlist
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
    </motion.div>
  );
};

export default StocksList;

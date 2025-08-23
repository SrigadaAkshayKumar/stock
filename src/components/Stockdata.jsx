import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Prediction from "./Prediction";
import { ClipLoader } from "react-spinners";
import { StockMetricsCard } from "./StockMetricsCard";
import SentimentChart from "./SentimentChart";

function Stockdata() {
  const { ticker } = useParams();
  const [stockData, setStockData] = useState([]);
  const [graphData1, setGraphData1] = useState({});
  const [stockInfo, setStockInfo] = useState({});
  const [news, setNews] = useState([]);
  const [sentimentSummary, setSentimentSummary] = useState({});
  const [chartPeriod, setChartPeriod] = useState("1mo");
  const [tablePeriod, setTablePeriod] = useState("1mo");
  const [isLoading, setIsLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);

  const periods = [
    "1d",
    "5d",
    "1mo",
    "3mo",
    "6mo",
    "1y",
    "2y",
    "5y",
    "10y",
    "ytd",
    "max",
  ];

  // ✅ useCallback to stabilize fetchStockInfo
  const fetchStockInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `http://127.0.0.1:10000/api/stock/predict?ticker=${ticker}`
      );

      setStockData(res.data.stock_data);
      setGraphData1(JSON.parse(res.data.graph_data1));
      setStockInfo(res.data.stock_info);
      setNews(Array.isArray(res.data.stock_news) ? res.data.stock_news : []);
      setSentimentSummary(res.data.sentiment_summary || {});
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  // ✅ Only re-run when fetchStockInfo changes
  useEffect(() => {
    fetchStockInfo();
  }, [fetchStockInfo, chartPeriod, tablePeriod]);

  const handleShowMore = () => {
    setShowMore(!showMore);
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
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 },
    },
  };

  const slideInLeft = {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.6 },
    },
  };

  const slideInRight = {
    hidden: { x: 100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.6 },
    },
  };

  const chartConfig = {
    ...graphData1,
    layout: {
      ...graphData1.layout,
      transition: {
        duration: 500,
        easing: "cubic-in-out",
      },
    },
  };

  return (
    <div
      className="container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1 variants={itemVariants}>Stock Analyzer</h1>
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
          <p
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            please wait while Loading...
          </p>
          <p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            It takes less than a minute
          </p>
        </motion.div>
      ) : (
        <div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <section className="section2" variants={itemVariants}>
            <div className="stock-info" variants={slideInLeft}>
              <div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <h2
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {ticker} - {stockInfo.name || "Stock"}
                </h2>

                <StockMetricsCard
                  open={stockInfo.open}
                  close={stockInfo.close}
                  high={stockInfo.high}
                  low={stockInfo.low}
                  previousClose={stockData[0]?.Close}
                />
                <h1 className="exchange-badge">
                  Exchange : {stockInfo.exchange || "N/A"}
                </h1>
              </div>

              <div className="period-buttons" variants={itemVariants}>
                <h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Select Period:
                </h3>
                {periods.map((period, index) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      backgroundColor:
                        chartPeriod === period ? "#0056b3" : "#007bff",
                    }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {period}
                  </button>
                ))}
              </div>

              <div
                className="visualization"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="vis2">
                  {graphData1.data && graphData1.layout ? (
                    <Plot
                      data={graphData1.data}
                      layout={chartConfig.layout}
                      config={{
                        displayModeBar: true,
                        responsive: true,
                        toImageButtonOptions: {
                          format: "png",
                          filename: `${ticker}_chart`,
                          height: 500,
                          width: 900,
                          scale: 1,
                        },
                      }}
                    />
                  ) : (
                    <p
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Loading visualization...
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="news" variants={slideInRight}>
              <h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Latest news about {ticker}
              </h2>

              {/* Sentiment Analysis Charts */}
              {news.length > 0 && sentimentSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  style={{ marginBottom: "20px" }}
                >
                  <SentimentChart sentimentSummary={sentimentSummary} />
                </motion.div>
              )}

              <AnimatePresence>
                {news.length > 0 ? (
                  news.map((article, index) => (
                    <motion.div
                      key={index}
                      className="news-item"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "14px",
                        marginBottom: "12px",
                        background: "white",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                        position: "relative",
                      }}
                    >
                      {/* Sentiment Tag */}
                      {article.sentiment && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: index * 0.1 + 0.2,
                            duration: 0.3,
                          }}
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "600",
                            color: "white",
                            background:
                              article.sentiment === "positive"
                                ? "#10B981"
                                : article.sentiment === "negative"
                                ? "#EF4444"
                                : "#6B7280",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          }}
                        >
                          {article.sentiment?.charAt(0).toUpperCase() +
                            article.sentiment?.slice(1)}
                        </motion.div>
                      )}

                      <h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "16px",
                          color: "#1f2937",
                          paddingRight: article.sentiment ? "70px" : "0",
                          lineHeight: "1.3",
                        }}
                      >
                        {article.title}
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginBottom: "8px",
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        <span>
                          <strong>Source:</strong>{" "}
                          {article.source?.name || "N/A"}
                        </span>
                        <span>
                          <strong>Date:</strong>{" "}
                          {article.publishedAt || "N/A"}
                        </span>
                      </div>

                      <p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{
                          margin: "0 0 12px 0",
                          lineHeight: "1.4",
                          color: "#374151",
                          fontSize: "13px",
                          maxHeight: "50px",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: "2",
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {article.description
                          ? article.description.length > 100
                            ? article.description.substring(0, 100) + "..."
                            : article.description
                          : "No summary available."}
                      </p>

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          background: "#3b82f6",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Read more
                      </a>
                    </motion.div>
                  ))
                ) : (
                  <p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    No news available.
                  </p>
                )}
              </AnimatePresence>
            </div>
          </section>

          <div className="period-buttons" variants={itemVariants}>
            <h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Select Period:
            </h3>
            {periods.map((period, index) => (
              <button
                key={period}
                onClick={() => setTablePeriod(period)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  backgroundColor:
                    tablePeriod === period ? "#0056b3" : "#007bff",
                }}
                transition={{ delay: index * 0.05 }}
              >
                {period}
              </button>
            ))}
          </div>

          <h2 variants={itemVariants}>Stock Data</h2>

          <div className="table" variants={itemVariants}>
            <div
              className="table-container"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Close</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData
                    .slice(0, showMore ? stockData.length : 15)
                    .map((entry, index) => (
                      <tr
                        key={`${entry.Date}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                        whileHover={{
                          scale: 1.01,
                          backgroundColor: "#e3f2fd",
                        }}
                      >
                        <td>{entry.Date}</td>
                        <td>{entry.Open}</td>
                        <td>{entry.High}</td>
                        <td>{entry.Low}</td>
                        <td>{entry.Close}</td>
                        <td>{entry.Volume}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {stockData.length > 15 && (
              <button
                onClick={handleShowMore}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {showMore ? "Show Less" : "Show More"}
              </button>
            )}
          </div>

          <button
            onClick={() => setShowPrediction(!showPrediction)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variants={itemVariants}
          >
            {showPrediction ? "Hide Prediction" : "Show Prediction"}
          </button>
          {showPrediction && (
            <div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Prediction ticker={ticker} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Stockdata;

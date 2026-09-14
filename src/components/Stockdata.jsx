import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Prediction from "./Prediction";
import { ClipLoader } from "react-spinners";
import { StockMetricsCard } from "./StockMetricsCard";
import BackToTopBtn from "./BackToTopBtn";

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

  const fetchStockInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stock/${ticker}?chart_period=${chartPeriod}&table_period=${tablePeriod}`,
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
  }, [ticker, chartPeriod, tablePeriod]);

  useEffect(() => {
    fetchStockInfo();
  }, [fetchStockInfo]);

  console.log("Stock Data:", stockData);
  console.log("API Call sent successfully");

  console.log(`API call sent successfully`);
  const handleShowMore = () => {
    setShowMore(!showMore);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <motion.div
      className="stock-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* existing content continues */}
      <motion.div variants={itemVariants}>
        <motion.div
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
                  previousClose={stockInfo.previous_close}
                />
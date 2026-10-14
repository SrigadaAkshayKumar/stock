// Helper to resolve appropriate currency symbol based on ticker or exchange
export const getCurrencySymbol = (ticker = "", exchange = "") => {
  const upperTicker = (ticker || "").toUpperCase();
  const upperExchange = (exchange || "").toUpperCase();

  // Non-Indian US market tickers or exchanges
  if (
    upperExchange.includes("NASDAQ") ||
    upperExchange.includes("NYSE") ||
    (!upperTicker.endsWith(".NS") &&
     !upperTicker.endsWith(".BO") &&
     ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA"].includes(upperTicker))
  ) {
    return "$";
  }

  // Indian stocks (NSE, BSE, or default Indian market platform)
  return "₹";
};

// StockMetricsCard component to display stock metrics
export const StockMetricsCard = ({
  open,
  close,
  high,
  low,
  previousClose,
  currency,
  ticker,
}) => {
  const currencySymbol = currency || getCurrencySymbol(ticker);
  const PrevClose = previousClose ?? "N/A";
  const Open = open ?? "N/A";
  const Close = close ?? "N/A";
  const Low = low ?? "N/A";
  const High = high ?? "N/A";

  // Formatting the value with currency symbol
  const formatValue = (value) => {
    if (value === "N/A" || value === null || value === undefined || isNaN(Number(value))) {
      return "N/A";
    }
    return `${currencySymbol}${Number(value).toFixed(2)}`;
  };

  // Arrow indicator to check trends
  const getTrend = (current, compareWith) => {
    const cur = Number(current);
    const comp = Number(compareWith);
    if (isNaN(cur) || isNaN(comp)) {
      return <span className="trend-neutral">—</span>;
    }
    if (cur > comp) {
      return <span className="trend-up">▲</span>;
    } else if (cur < comp) {
      return <span className="trend-down">▼</span>;
    }
    return <span className="trend-neutral">—</span>;
  };

  return (
    <div className="stock-card">
      <div className="stock-card-header">
        {["OPEN", "CLOSE", "LOW", "HIGH"].map((label) => (
          <div key={label} className="stock-card-header-cell">
            {label}
          </div>
        ))}
      </div>

      <div className="stock-card-body">

        {/* OPEN */}
        <div className="stock-card-cell">
          <span className="stock-value">{formatValue(Open)}</span>
          {getTrend(Open, PrevClose)}
        </div>

        {/* CLOSE */}
        <div className="stock-card-cell">
          <span className="stock-value">{formatValue(Close)}</span>
          {getTrend(Close, Open)}
        </div>

        {/* LOW */}
        <div className="stock-card-cell">
          <span className="stock-value">{formatValue(Low)}</span>
        </div>

        {/* HIGH */}
        <div className="stock-card-cell">
          <span className="stock-value">{formatValue(High)}</span>
        </div>
      </div>
    </div>
  );
};

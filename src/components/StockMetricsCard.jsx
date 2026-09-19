// StockMetricsCard component to display stock metrics
export const StockMetricsCard = ({
  open,
  close,
  high,
  low,
  previousClose
}) => {

  const PrevClose = previousClose ?? "N/A";
  const Open = open ?? "N/A";
  const Close = close ?? "N/A";
  const Low = low ?? "N/A";
  const High = high ?? "N/A";

  // Formatting the value
  const formatValue = (value) => `$${Number(value).toFixed(2)}`;

  // Arrow indicator to check trends
  const getTrend = (current, compareWith) => {
    if (current > compareWith) {
      return <span className="trend-up">▲</span>;
    } else if (current < compareWith) {
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

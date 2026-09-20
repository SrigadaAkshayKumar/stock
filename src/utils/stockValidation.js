import stockData from "../components/data/stockData.json";

/**
 * Validates a searched ticker symbol or stock name against available stock data.
 *
 * Rules:
 * - Empty or whitespace-only query is not valid (returns isValid: false, error: null).
 * - Matches full symbol (e.g. "RELIANCE.BO", "TCS.NS") case-insensitively.
 * - Matches base symbol without exchange extension (e.g. "RELIANCE", "TCS", "INFY") case-insensitively.
 * - Matches company name (e.g. "Reliance Industries", "Tata Consultancy Services") case-insensitively.
 * - Unrecognized tickers return isValid: false with a user-facing error message.
 *
 * @param {string} query - The search query entered by the user.
 * @param {object} [data] - The stock data dictionary (defaults to stockData.json).
 * @returns {{ isValid: boolean, stock: object | null, error: string | null }}
 */
export const validateStockTicker = (query, data = stockData) => {
  if (!query || typeof query !== "string" || !query.trim()) {
    return { isValid: false, stock: null, error: null };
  }

  const trimmed = query.trim();
  const queryUpper = trimmed.toUpperCase();
  const allStocks = Object.values(data || {}).flat();

  // 1. Exact match with full symbol (e.g. "RELIANCE.BO", "TCS.NS")
  const exactMatch = allStocks.find(
    (stock) => stock.symbol && stock.symbol.toUpperCase() === queryUpper
  );
  if (exactMatch) {
    return { isValid: true, stock: exactMatch, error: null };
  }

  // 2. Base symbol match if query does not contain an exchange suffix (e.g. "RELIANCE", "TCS")
  if (!queryUpper.includes(".")) {
    const baseMatch = allStocks.find((stock) => {
      const baseSymbol = (stock.symbol || "").split(".")[0].toUpperCase();
      return baseSymbol === queryUpper;
    });
    if (baseMatch) {
      return { isValid: true, stock: baseMatch, error: null };
    }
  }

  // 3. Company name match (e.g. "Reliance Industries")
  const nameMatch = allStocks.find(
    (stock) => stock.name && stock.name.toUpperCase() === queryUpper
  );
  if (nameMatch) {
    return { isValid: true, stock: nameMatch, error: null };
  }

  // Unsupported ticker
  return {
    isValid: false,
    stock: null,
    error: "Ticker not found. Please select a valid stock symbol.",
  };
};

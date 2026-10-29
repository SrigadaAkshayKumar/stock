// Display helpers shared across pages. Listed stocks trade on NSE/BSE, so prices are in rupees.

export const currencySymbol = (ticker = "") =>
  /\.(NS|BO)$/i.test(ticker) || !ticker.includes(".") ? "₹" : "";

export function formatPrice(value, ticker) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${currencySymbol(ticker)}${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("en-IN", { maximumFractionDigits: digits });
}

// Fixed two decimals without a currency symbol (table cells).
export function formatFixed(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// "up"/"down" class for a signed number; nothing when the value is missing.
export const toneOf = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? "" : v >= 0 ? "up" : "down");

export function formatCompact(value) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

export function formatPct(value, digits = 2, { signed = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const v = Number(value);
  return `${signed && v > 0 ? "+" : ""}${v.toFixed(digits)}%`;
}

// Ratio (0.523) -> "52.3%"
export const ratioPct = (v, digits = 1) =>
  v === null || v === undefined ? "—" : `${(v * 100).toFixed(digits)}%`;

export const exchangeOf = (ticker = "") =>
  /\.BO$/i.test(ticker) ? "BSE" : /\.NS$/i.test(ticker) ? "NSE" : "";

export function formatDate(iso, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", opts);
}

// Valuation metrics from the data provider, e.g. market cap -> "₹10.54 lakh crore", ROE 0.11 -> "11.0%".
export const METRIC_LABELS = {
  market_cap: "Market cap",
  pe_ratio: "P/E",
  forward_pe: "Forward P/E",
  price_to_book: "P/B",
  dividend_yield: "Dividend yield",
  return_on_equity: "ROE",
  debt_to_equity: "Debt / equity",
  profit_margin: "Profit margin",
  revenue_growth: "Revenue growth",
  earnings_growth: "Earnings growth",
  beta: "Beta",
};
const FRACTION_METRICS = new Set(["return_on_equity", "profit_margin", "revenue_growth", "earnings_growth"]);

export function formatMetricValue(key, value) {
  const v = Number(value);
  if (value === null || value === undefined || Number.isNaN(v)) return "—";
  if (key === "market_cap") {
    const crore = v / 1e7;
    return crore >= 1e5
      ? `₹${(crore / 1e5).toFixed(2)} lakh crore`
      : `₹${crore.toLocaleString("en-IN", { maximumFractionDigits: 0 })} crore`;
  }
  if (FRACTION_METRICS.has(key)) return `${(v * 100).toFixed(1)}%`;
  if (key === "dividend_yield") return `${v.toFixed(2)}%`;
  return v.toFixed(2);
}

export const metricLabel = (key) => METRIC_LABELS[key] || key.replace(/_/g, " ");

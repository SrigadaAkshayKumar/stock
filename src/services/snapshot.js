// Pre-computed backend output shipped with the frontend (public/snapshots).
// Built by backend/scripts/build_snapshots.py, so pages render instantly
// without waiting for the API to wake up. Missing snapshots return null and
// callers fall back to the live API.

export const API = process.env.REACT_APP_API_URL;
const BASE = process.env.PUBLIC_URL || "";

const snapshots = new Map();
let index = null;

export const baseSymbol = (ticker) => (ticker || "").toUpperCase().split(".")[0];

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    // A static host may answer a missing file with index.html; only accept JSON.
    if (!res.ok || !(res.headers.get("content-type") || "").includes("json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function loadSnapshotIndex() {
  if (!index) {
    index = fetchJson(`${BASE}/snapshots/index.json`).then((d) => new Set(d?.symbols || []));
  }
  return index;
}

export function loadSnapshot(ticker) {
  const symbol = baseSymbol(ticker);
  if (!snapshots.has(symbol)) {
    snapshots.set(
      symbol,
      loadSnapshotIndex().then((available) =>
        available.has(symbol) ? fetchJson(`${BASE}/snapshots/${symbol}.json`) : null
      )
    );
  }
  return snapshots.get(symbol);
}

export const reportUrl = (snapshot) => `${BASE}/${snapshot.report_url}`;

// Free-tier hosts sleep when idle; ping once so live features are warm later.
let warmed = false;
export function warmBackend() {
  if (warmed || !API) return;
  warmed = true;
  fetch(`${API}/api/health`).catch(() => {});
}

const PERIOD_DAYS = { "1mo": 31, "3mo": 92, "6mo": 183, "1y": 365, "2y": 730, "5y": 1826, "10y": 3652 };

// Same rules as filter_period() in backend/services/market_data_service.py.
export function filterPeriod(prices, period) {
  const n = prices.date.length;
  let start = 0;
  if (period === "1d") start = n - 1;
  else if (period === "5d") start = n - 5;
  else if (period === "ytd") {
    const year = prices.date[n - 1].slice(0, 4);
    start = prices.date.findIndex((d) => d.startsWith(year));
  } else if (PERIOD_DAYS[period]) {
    const cutoff = new Date(prices.date[n - 1]);
    cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[period]);
    const iso = cutoff.toISOString().slice(0, 10);
    start = prices.date.findIndex((d) => d >= iso);
  }
  start = Math.max(0, start);
  const pick = (arr) => arr.slice(start);
  return {
    date: pick(prices.date),
    open: pick(prices.open),
    high: pick(prices.high),
    low: pick(prices.low),
    close: pick(prices.close),
    volume: pick(prices.volume),
  };
}

const ddmmyyyy = (iso) => `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;

// Rows in the shape (and oldest-first order) the legacy /api/stock/<symbol> endpoint returned.
export function toTableRows(prices) {
  return prices.date.map((d, i) => ({
    Date: ddmmyyyy(d),
    Open: prices.open[i],
    High: prices.high[i],
    Low: prices.low[i],
    Close: prices.close[i],
    Volume: prices.volume[i],
  }));
}

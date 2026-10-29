import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LuArrowRight,
  LuChevronRight,
  LuFileText,
  LuNewspaper,
  LuRefreshCw,
  LuSparkles,
  LuStar,
} from "react-icons/lu";
import Plot from "./Plot";
import Prediction from "./Prediction";
import AnalysisDashboard from "./AnalysisDashboard";
import AgentChat from "./AgentChat";
import Disclaimer from "./Disclaimer";
import BackToTopBtn from "./BackToTopBtn";
import stockList from "./data/stockData.json";
import { plotConfig, useChartTheme } from "./ui/chartTheme";
import { API, baseSymbol, filterPeriod, loadSnapshot, reportUrl } from "../services/snapshot";
import { getWatchlistSymbols, toggleWatchlist } from "../utils/watchlistManager";
import {
  exchangeOf,
  formatCompact,
  formatDate,
  formatFixed,
  formatPct,
  formatPrice,
  ratioPct,
  toneOf,
} from "../utils/format";
import styles from "./Stockdata.module.css";

const PERIODS = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"];
const TABLE_PERIODS = ["5d", "1mo", "3mo", "6mo", "1y", "max"];
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "analysis", label: "AI Analysis" },
  { id: "ask", label: "Ask the AI Analyst" },
  { id: "history", label: "Historical Data" },
  { id: "projection", label: "Long-term Projection" },
];

const NAMES = Object.fromEntries([...stockList.BSE, ...stockList.NSE].map((s) => [s.symbol, s.name]));

const toIso = (ddmmyyyy) => {
  const [d, m, y] = String(ddmmyyyy).split("-");
  return y && y.length === 4 ? `${y}-${m}-${d}` : ddmmyyyy;
};

// Legacy /api/stock/<symbol> rows -> the column arrays the snapshot uses.
function rowsToPrices(rows) {
  return {
    date: rows.map((r) => toIso(r.Date)),
    open: rows.map((r) => r.Open),
    high: rows.map((r) => r.High),
    low: rows.map((r) => r.Low),
    close: rows.map((r) => r.Close),
    volume: rows.map((r) => r.Volume),
  };
}

function normaliseNews(articles = []) {
  return articles.map((a) => ({
    title: a.title,
    url: a.url,
    source: typeof a.source === "string" ? a.source : a.source?.name,
    published_at: a.published_at || a.publishedAt,
    sentiment: a.sentiment,
    description: a.description,
  }));
}

function PriceChart({ prices, ticker }) {
  const t = useChartTheme();
  if (!prices?.date.length) return <div className={styles.chartEmpty}>No price data for this period.</div>;
  const up = prices.close[prices.close.length - 1] >= prices.close[0];
  const color = up ? t.success : t.danger;
  return (
    <Plot
      data={[
        {
          x: prices.date,
          y: prices.close,
          type: "scatter",
          mode: prices.date.length < 30 ? "lines+markers" : "lines",
          name: "Close",
          line: { color, width: 2, shape: "spline", smoothing: 0.3 },
          marker: { size: 5 },
          fill: "tozeroy",
          fillcolor: up ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          hovertemplate: `%{x|%d %b %Y}<br>Close %{y:,.2f}<extra></extra>`,
        },
      ]}
      layout={t.layout({
        height: 360,
        showlegend: false,
        yaxis: {
          gridcolor: t.grid,
          zeroline: false,
          tickformat: ",.0f",
          tickprefix: ticker.includes(".") ? "₹" : "",
          range: [Math.min(...prices.low.filter(Boolean)) * 0.98, Math.max(...prices.high.filter(Boolean)) * 1.02],
        },
        xaxis: { gridcolor: "rgba(0,0,0,0)", linecolor: t.grid, type: "date" },
      })}
      config={plotConfig}
      useResizeHandler
      style={{ width: "100%" }}
    />
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
    </div>
  );
}

function Outlook({ value }) {
  const cls = value === "Bullish" ? "badge-success" : value === "Bearish" ? "badge-danger" : "badge-warning";
  return <span className={`badge ${cls}`}>{value || "n/a"}</span>;
}

function Stockdata() {
  const { ticker } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((x) => x.id === searchParams.get("tab")) ? searchParams.get("tab") : "overview";
  const setTab = (id) => setSearchParams(id === "overview" ? {} : { tab: id }, { replace: true });

  const [snapshot, setSnapshot] = useState(undefined); // undefined = loading, null = none
  const [live, setLive] = useState(null); // legacy API payload when there is no snapshot
  const [liveState, setLiveState] = useState({ loading: false, error: "" });
  const [chartPeriod, setChartPeriod] = useState("6mo");
  const [tablePeriod, setTablePeriod] = useState("1mo");
  const [rowsShown, setRowsShown] = useState(15);
  const [starred, setStarred] = useState(false);

  const name = snapshot?.company?.name || NAMES[ticker] || baseSymbol(ticker);
  const exchange = exchangeOf(ticker);

  useEffect(() => {
    let active = true;
    setSnapshot(undefined);
    setLive(null);
    loadSnapshot(ticker).then((s) => active && setSnapshot(s));
    getWatchlistSymbols()
      .then((symbols) => active && setStarred(symbols.includes(ticker)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [ticker]);

  // No snapshot: one legacy API call returns the full history for both chart and table.
  const fetchLive = useCallback(async () => {
    setLiveState({ loading: true, error: "" });
    try {
      const res = await axios.get(`${API}/api/stock/${ticker}?chart_period=max&table_period=max`);
      setLive(res.data);
      setLiveState({ loading: false, error: "" });
    } catch (error) {
      setLiveState({
        loading: false,
        error:
          error.response?.status === 404
            ? `No price data is available for ${ticker} yet.`
            : "Could not reach the data server. It may be waking up. Please try again in a minute.",
      });
    }
  }, [ticker]);

  useEffect(() => {
    if (snapshot === null) fetchLive();
  }, [snapshot, fetchLive]);

  const prices = useMemo(() => {
    if (snapshot) return snapshot.prices;
    if (live?.stock_data?.length) return rowsToPrices(live.stock_data);
    return null;
  }, [snapshot, live]);

  const news = useMemo(
    () => normaliseNews(snapshot ? snapshot.analysis.news?.articles : live?.stock_news),
    [snapshot, live]
  );

  const chartPrices = useMemo(() => prices && filterPeriod(prices, chartPeriod), [prices, chartPeriod]);
  const tableRows = useMemo(() => {
    if (!prices) return [];
    const p = filterPeriod(prices, tablePeriod);
    return p.date.map((d, i) => ({ d, o: p.open[i], h: p.high[i], l: p.low[i], c: p.close[i], v: p.volume[i] })).reverse();
  }, [prices, tablePeriod]);

  const toggleStar = async () => {
    try {
      await toggleWatchlist({ symbol: ticker, name });
      setStarred((s) => !s);
      toast.success(`${ticker} ${starred ? "removed from" : "added to"} your watchlist`);
    } catch {
      toast.error("Could not update the watchlist.");
    }
  };

  const loading = snapshot === undefined || (snapshot === null && liveState.loading && !live);
  const n = prices?.close.length || 0;
  const last = n ? prices.close[n - 1] : null;
  const prev = n > 1 ? prices.close[n - 2] : null;
  const change = last != null && prev ? last - prev : null;
  const changePct = change != null ? (change / prev) * 100 : null;
  const periodChange =
    chartPrices?.close.length > 1
      ? (chartPrices.close[chartPrices.close.length - 1] / chartPrices.close[0] - 1) * 100
      : null;

  const analysis = snapshot?.analysis;
  const metrics = analysis?.fundamentals?.price_metrics || {};
  const primary = analysis?.primary_prediction;
  const pdfHref = snapshot ? reportUrl(snapshot) : API ? `${API}/api/stock/${ticker}/report.pdf` : null;

  return (
    <div className="page">
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/">Markets</Link>
        <LuChevronRight />
        <span>{baseSymbol(ticker)}</span>
      </nav>

      <header className={styles.header}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{baseSymbol(ticker).slice(0, 2)}</div>
          <div>
            <h1>{name}</h1>
            <div className={styles.tags}>
              <span className={styles.symbol}>{ticker}</span>
              {exchange && <span className="badge">{exchange}</span>}
              {snapshot && (
                <span className="badge badge-success">
                  <LuSparkles /> AI analysis ready
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.quote}>
          {loading ? (
            <div className={`skeleton ${styles.quoteSkeleton}`} />
          ) : last != null ? (
            <>
              <div className={styles.price}>{formatPrice(last, ticker)}</div>
              <div className={`${styles.change} ${change >= 0 ? "up" : "down"}`}>
                {change >= 0 ? "+" : ""}
                {formatFixed(change)} ({formatPct(changePct)})
              </div>
              <div className={styles.asOf}>Last close · {formatDate(prices.date[n - 1])}</div>
            </>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button className="btn btn-secondary" onClick={toggleStar} aria-pressed={starred}>
            <LuStar className={starred ? styles.starOn : ""} />
            {starred ? "In watchlist" : "Add to watchlist"}
          </button>
          {pdfHref && (
            <a className="btn btn-primary" href={pdfHref} target="_blank" rel="noopener noreferrer">
              <LuFileText /> PDF report
            </a>
          )}
        </div>
      </header>

      <Disclaimer compact />

      <div className={styles.tabs} role="tablist" aria-label="Stock sections">
        {TABS.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            className={tab === x.id ? styles.tabActive : ""}
            onClick={() => setTab(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>

      {liveState.error && !prices && (
        <div className={`card ${styles.errorCard}`}>
          <p>{liveState.error}</p>
          <button className="btn btn-secondary btn-sm" onClick={fetchLive}>
            <LuRefreshCw /> Retry
          </button>
        </div>
      )}

      {tab === "overview" && (
        <div className={styles.overview}>
          <section className={`card ${styles.chartCard}`}>
            <div className={styles.cardHead}>
              <div>
                <h2>Price</h2>
                {periodChange != null && (
                  <span className={periodChange >= 0 ? "up" : "down"}>
                    {formatPct(periodChange)} <span className="muted">over {chartPeriod}</span>
                  </span>
                )}
              </div>
              <div className="segmented" role="tablist" aria-label="Chart period">
                {PERIODS.map((p) => (
                  <button key={p} className={chartPeriod === p ? "active" : ""} onClick={() => setChartPeriod(p)}>
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <div className={`skeleton ${styles.chartSkeleton}`} /> : <PriceChart prices={chartPrices} ticker={ticker} />}
          </section>

          <aside className={styles.side}>
            <section className="card">
              <div className={styles.cardHeadSimple}>
                <h2>Key statistics</h2>
              </div>
              <div className={styles.stats}>
                <Stat label="Open" value={formatPrice(prices?.open[n - 1], ticker)} />
                <Stat label="Prev. close" value={formatPrice(prev, ticker)} />
                <Stat label="Day high" value={formatPrice(prices?.high[n - 1], ticker)} />
                <Stat label="Day low" value={formatPrice(prices?.low[n - 1], ticker)} />
                <Stat label="Volume" value={formatCompact(prices?.volume[n - 1])} />
                <Stat label="Avg vol. (3M)" value={formatCompact(metrics.avg_volume_3m)} />
                <Stat label="52W high" value={formatPrice(metrics.high_52w, ticker)} />
                <Stat label="52W low" value={formatPrice(metrics.low_52w, ticker)} />
                <Stat
                  label="1M return"
                  value={formatPct(metrics.return_1m_pct)}
                  tone={toneOf(metrics.return_1m_pct)}
                />
                <Stat
                  label="1Y return"
                  value={formatPct(metrics.return_1y_pct)}
                  tone={toneOf(metrics.return_1y_pct)}
                />
              </div>
            </section>

            <section className={`card ${styles.aiCard}`}>
              <div className={styles.cardHeadSimple}>
                <h2>
                  <LuSparkles /> AI snapshot
                </h2>
              </div>
              {analysis ? (
                <>
                  <div className={styles.aiRows}>
                    <div>
                      <span>5-day ML outlook</span>
                      <Outlook value={primary?.outlook} />
                    </div>
                    <div>
                      <span>Probability of rise</span>
                      <strong>{ratioPct(primary?.probability_up, 0)}</strong>
                    </div>
                    <div>
                      <span>Technical bias</span>
                      <strong className={styles.capitalize}>{analysis.indicators?.technical_bias || "—"}</strong>
                    </div>
                    <div>
                      <span>Risk level</span>
                      <strong>{analysis.risk?.risk_level || "—"}</strong>
                    </div>
                    <div>
                      <span>Backtest accuracy</span>
                      <strong>{ratioPct(primary?.backtest?.directional_accuracy)}</strong>
                    </div>
                  </div>
                  <div className={styles.aiActions}>
                    <button className="btn btn-primary btn-sm" onClick={() => setTab("analysis")}>
                      Full analysis <LuArrowRight />
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTab("ask")}>
                      Ask the AI
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.aiEmpty}>
                  <p className="muted">The AI analysis for this stock runs on the live backend.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setTab("analysis")}>
                    Run AI analysis <LuArrowRight />
                  </button>
                </div>
              )}
            </section>
          </aside>

          <section className={`card ${styles.newsCard}`}>
            <div className={styles.cardHeadSimple}>
              <h2>
                <LuNewspaper /> Latest news
              </h2>
              {analysis?.news?.sentiment_summary?.overall_sentiment && news.length > 0 && (
                <span className="badge">Sentiment: {analysis.news.sentiment_summary.overall_sentiment}</span>
              )}
            </div>
            {news.length ? (
              <ul className={styles.newsList}>
                {news.slice(0, 6).map((a) => (
                  <li key={a.url || a.title}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer">
                      {a.title}
                    </a>
                    <div className={styles.newsMeta}>
                      {a.source && <span>{a.source}</span>}
                      {a.published_at && <span>{formatDate(a.published_at)}</span>}
                      {a.sentiment && (
                        <span
                          className={`badge ${
                            a.sentiment === "positive" ? "badge-success" : a.sentiment === "negative" ? "badge-danger" : ""
                          }`}
                        >
                          {a.sentiment}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyText}>
                No recent news is available for this stock. News appears here when a news API key is configured.
              </p>
            )}
          </section>
        </div>
      )}

      {tab === "analysis" && <AnalysisDashboard ticker={ticker} />}
      {tab === "ask" && <AgentChat ticker={ticker} />}

      {tab === "history" && (
        <section className="card">
          <div className={`${styles.cardHead} ${styles.padded}`}>
            <h2>Historical prices</h2>
            <div className="segmented" aria-label="Table period">
              {TABLE_PERIODS.map((p) => (
                <button
                  key={p}
                  className={tablePeriod === p ? "active" : ""}
                  onClick={() => {
                    setTablePeriod(p);
                    setRowsShown(15);
                  }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Open</th>
                  <th>High</th>
                  <th>Low</th>
                  <th>Close</th>
                  <th>Change</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(0, rowsShown).map((r, i) => {
                  const prevClose = tableRows[i + 1]?.c;
                  const chg = prevClose ? (r.c / prevClose - 1) * 100 : null;
                  return (
                    <tr key={r.d}>
                      <td>{formatDate(r.d)}</td>
                      <td>{formatFixed(r.o)}</td>
                      <td>{formatFixed(r.h)}</td>
                      <td>{formatFixed(r.l)}</td>
                      <td>
                        <strong>{formatFixed(r.c)}</strong>
                      </td>
                      <td className={toneOf(chg) || "muted"}>{formatPct(chg)}</td>
                      <td>{formatCompact(r.v)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {tableRows.length > rowsShown && (
            <div className={styles.tableFooter}>
              <span className="muted">
                Showing {rowsShown} of {tableRows.length} sessions
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setRowsShown((r) => r + 30)}>
                Show more
              </button>
            </div>
          )}
        </section>
      )}

      {tab === "projection" && <Prediction ticker={ticker} />}

      <Disclaimer />
      <BackToTopBtn />
    </div>
  );
}

export default Stockdata;

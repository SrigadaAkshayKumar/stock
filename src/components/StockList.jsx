import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LuArrowRight,
  LuBot,
  LuBrainCircuit,
  LuDatabase,
  LuFileText,
  LuNewspaper,
  LuSearch,
  LuSparkles,
  LuStar,
} from "react-icons/lu";
import stockData from "./data/stockData.json";
import Sparkline from "./ui/Sparkline";
import { getWatchlistSymbols, toggleWatchlist } from "../utils/watchlistManager";
import { baseSymbol, loadSnapshot, loadSnapshotSummaries } from "../services/snapshot";
import { formatPct, formatPrice } from "../utils/format";
import styles from "./StockList.module.css";

const ALL_STOCKS = [...stockData.BSE, ...stockData.NSE];

const STEPS = [
  {
    icon: LuDatabase,
    title: "Market data",
    text: "Daily OHLCV history from the local dataset or live from Yahoo Finance, with technical indicators: SMA/EMA, RSI, MACD, Bollinger Bands, ATR.",
  },
  {
    icon: LuBrainCircuit,
    title: "ML forecasts",
    text: "Model selection across classifiers and regressors for 1- and 5-day direction and price, validated by walk-forward backtesting against a baseline.",
  },
  {
    icon: LuNewspaper,
    title: "RAG over news & filings",
    text: "News and company documents are chunked, embedded and ranked by relevance × freshness, with every source kept for attribution.",
  },
  {
    icon: LuBot,
    title: "AI analyst & reports",
    text: "An agent picks from 9 tools to answer questions with evidence and sources, and exports a 14-section PDF report.",
  },
];

function StockCard({ stock, summary, starred, onStar }) {
  const navigate = useNavigate();
  const exchange = stock.symbol.endsWith(".BO") ? "BSE" : "NSE";
  const open = () => navigate(`/stock/${stock.symbol}`);
  return (
    <div
      className={styles.card}
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
      onMouseEnter={() => summary && loadSnapshot(stock.symbol)}
    >
      <div className={styles.cardTop}>
        <div className={styles.avatar}>{baseSymbol(stock.symbol).slice(0, 2)}</div>
        <div className={styles.cardTitle}>
          <strong>{baseSymbol(stock.symbol)}</strong>
          <span>{stock.name}</span>
        </div>
        <button
          className={`${styles.star} ${starred ? styles.starred : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onStar(stock);
          }}
          aria-label={starred ? `Remove ${stock.symbol} from watchlist` : `Add ${stock.symbol} to watchlist`}
          title={starred ? "Remove from watchlist" : "Add to watchlist"}
        >
          <LuStar />
        </button>
      </div>

      {summary ? (
        <div className={styles.cardPrice}>
          <div>
            <div className={styles.price}>{formatPrice(summary.close, stock.symbol)}</div>
            <div className={summary.change_pct >= 0 ? "up" : "down"}>{formatPct(summary.change_pct)}</div>
          </div>
          <Sparkline values={summary.spark} />
        </div>
      ) : (
        <div className={styles.cardPlaceholder}>Live data on request</div>
      )}

      <div className={styles.cardFooter}>
        <span className="badge">{exchange}</span>
        {summary ? (
          <span className="badge badge-success">
            <LuSparkles /> AI analysis ready
          </span>
        ) : (
          <span className="badge">Live API</span>
        )}
        <LuArrowRight className={styles.arrow} />
      </div>
    </div>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const boxRef = useRef(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_STOCKS.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  const go = (symbol) => {
    setQuery("");
    navigate(`/stock/${symbol}`);
  };

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    go(matches[0]?.symbol || q.toUpperCase());
  };

  return (
    <form className={styles.search} onSubmit={submit} ref={boxRef}>
      <LuSearch className={styles.searchIcon} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Search a company or ticker, e.g. Infosys or TCS"
        aria-label="Search stocks"
      />
      <button type="submit" className="btn btn-primary">
        Analyze
      </button>
      {focused && matches.length > 0 && (
        <ul className={styles.suggestions} role="listbox">
          {matches.map((s) => (
            <li key={s.symbol}>
              <button type="button" onMouseDown={() => go(s.symbol)}>
                <strong>{s.symbol}</strong>
                <span>{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

const StocksList = () => {
  const [exchange, setExchange] = useState("NSE");
  const [summaries, setSummaries] = useState({});
  const [watchlist, setWatchlist] = useState(new Set());

  useEffect(() => {
    loadSnapshotSummaries().then(setSummaries);
    getWatchlistSymbols()
      .then((symbols) => setWatchlist(new Set(symbols)))
      .catch(() => {});
    // Load the stock page code in the background so the first click is fast.
    import("./Stockdata");
  }, []);

  const stocks = useMemo(() => {
    const list = stockData[exchange] || [];
    const ready = (s) => Boolean(summaries[baseSymbol(s.symbol)]);
    return [...list.filter(ready), ...list.filter((s) => !ready(s))];
  }, [exchange, summaries]);

  const readyCount = Object.keys(summaries).length;
  const featured = stocks.find((s) => summaries[baseSymbol(s.symbol)]);

  const handleStar = async (stock) => {
    const had = watchlist.has(stock.symbol);
    try {
      await toggleWatchlist(stock);
      setWatchlist((prev) => {
        const next = new Set(prev);
        had ? next.delete(stock.symbol) : next.add(stock.symbol);
        return next;
      });
      toast.success(`${stock.symbol} ${had ? "removed from" : "added to"} your watchlist`);
    } catch {
      toast.error("Could not update the watchlist. Please try again.");
    }
  };

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.pill}>
            <LuSparkles /> ML · RAG · AI agent
          </span>
          <h1>
            AI-powered analysis for <span>Indian equities</span>
          </h1>
          <p>
            Forecasts validated by backtesting, technical signals, source-grounded news and an AI analyst that
            explains its reasoning. Everything for a stock, on one page.
          </p>
          <SearchBox />
          <div className={styles.heroActions}>
            {featured && (
              <Link to={`/stock/${featured.symbol}`} className="btn btn-secondary">
                View sample analysis: {baseSymbol(featured.symbol)} <LuArrowRight />
              </Link>
            )}
            <a href="#how-it-works" className="btn btn-ghost">
              How it works
            </a>
          </div>
        </div>

        <div className={styles.stats}>
          <div>
            <strong>{ALL_STOCKS.length / 2}</strong>
            <span>NSE & BSE large caps</span>
          </div>
          <div>
            <strong>1D · 5D</strong>
            <span>backtested ML horizons</span>
          </div>
          <div>
            <strong>9</strong>
            <span>tools for the AI analyst</span>
          </div>
          <div>
            <strong>14</strong>
            <span>sections in each PDF report</span>
          </div>
        </div>
      </section>

      <section className="page" aria-labelledby="markets-title">
        <div className={styles.sectionHead}>
          <div>
            <h2 id="markets-title">Markets</h2>
            <p className="muted">
              {readyCount
                ? `${readyCount} stocks have full AI analysis ready instantly. The rest load from the live API.`
                : "Select a stock to open its analysis."}
            </p>
          </div>
          <div className="segmented" role="tablist" aria-label="Exchange">
            {["NSE", "BSE"].map((ex) => (
              <button
                key={ex}
                role="tab"
                aria-selected={exchange === ex}
                className={exchange === ex ? "active" : ""}
                onClick={() => setExchange(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {stocks.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              summary={summaries[baseSymbol(stock.symbol)]}
              starred={watchlist.has(stock.symbol)}
              onStar={handleStar}
            />
          ))}
        </div>
      </section>

      <section id="how-it-works" className={`page ${styles.how}`} aria-labelledby="how-title">
        <span className="eyebrow">How it works</span>
        <h2 id="how-title">From raw prices to an explained answer</h2>
        <div className={styles.steps}>
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className={styles.step}>
              <div className={styles.stepIcon}>
                <Icon />
              </div>
              <span className={styles.stepNum}>0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <div className={styles.reportCta}>
          <LuFileText />
          <div>
            <strong>Every analysis exports to a PDF report</strong>
            <span>
              Executive summary, price, indicators, fundamentals, news, ML forecast, risk and sources, with
              a disclaimer.
            </span>
          </div>
          {featured && (
            <Link to={`/stock/${featured.symbol}`} className="btn btn-primary">
              Try it <LuArrowRight />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default StocksList;

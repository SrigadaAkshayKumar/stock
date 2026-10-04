import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { ClipLoader } from "react-spinners";
import styles from "./Analysis.module.css";
import RichText from "./RichText";
import SourcesPanel from "./SourcesPanel";

const API = process.env.REACT_APP_API_URL;

const pct = (v, digits = 1) =>
  v === null || v === undefined ? "n/a" : `${(v * 100).toFixed(digits)}%`;
const num = (v, digits = 2) =>
  v === null || v === undefined
    ? "n/a"
    : Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });

function Metric({ label, value, hint }) {
  return (
    <div className={styles.metric} title={hint}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  );
}

function OutlookBadge({ outlook }) {
  const cls =
    outlook === "Bullish" ? styles.bullish : outlook === "Bearish" ? styles.bearish : styles.neutral;
  return <span className={`${styles.outlook} ${cls}`}>{outlook || "n/a"}</span>;
}

function AnalysisDashboard({ ticker }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `${API}/api/stock/${ticker}/analysis${refresh ? "?refresh=true" : ""}`
        );
        setAnalysis(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Could not load the AI analysis.");
      } finally {
        setLoading(false);
      }
    },
    [ticker]
  );

  useEffect(() => {
    if (ticker) load();
  }, [ticker, load]);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const res = await axios.get(`${API}/api/stock/${ticker}/report.pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${ticker}_analysis_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Report generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !analysis) {
    return (
      <div className={styles.card}>
        <div className={styles.loading}>
          <ClipLoader color="#36d7b7" size={36} />
          <p>Running ML models, indicators, news and document retrieval…</p>
        </div>
      </div>
    );
  }
  if (error && !analysis) {
    return (
      <div className={styles.card}>
        <p className={styles.error}>{error}</p>
        <button className={styles.button} onClick={() => load(true)}>
          Retry
        </button>
      </div>
    );
  }
  if (!analysis) return null;

  const { predictions = [], primary_prediction: primary, indicators = {}, risk = {}, fundamentals = {} } =
    analysis;
  const bt = primary?.backtest || {};
  const series = indicators.series || {};
  const metrics = fundamentals.price_metrics || {};
  const news = analysis.news || {};

  return (
    <section className={styles.dashboard} aria-label="AI analysis">
      <div className={styles.header}>
        <div>
          <h2>AI Analysis — {analysis.company?.name || ticker}</h2>
          <p className={styles.subtle}>
            Data as of {analysis.price?.as_of} ({analysis.price?.source}) · generated{" "}
            {new Date(analysis.generated_at).toLocaleString()}
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.buttonSecondary} onClick={() => load(true)} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button className={styles.button} onClick={downloadReport} disabled={downloading}>
            {downloading ? "Generating PDF…" : "Download full report (PDF)"}
          </button>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        {/* ML prediction */}
        <div className={styles.card}>
          <h3>ML Prediction</h3>
          {predictions.map((p) => (
            <div key={p.horizon_trading_days} className={styles.predictionRow}>
              <div>
                <strong>Next {p.horizon_trading_days} trading day{p.horizon_trading_days > 1 ? "s" : ""}</strong>
                <div className={styles.subtle}>Target {p.target_date}</div>
              </div>
              <OutlookBadge outlook={p.outlook} />
              <Metric label="P(up)" value={pct(p.probability_up)} />
              <Metric label="Confidence" value={pct(p.confidence)} />
              <Metric label="Expected price" value={num(p.predicted_price)} />
            </div>
          ))}
          {primary && (
            <div className={styles.backtest}>
              <h4>Backtest (walk-forward, out-of-sample)</h4>
              <div className={styles.metricRow}>
                <Metric label="Directional accuracy" value={pct(bt.directional_accuracy)} />
                <Metric label="Baseline" value={pct(bt.baseline_accuracy)} hint="Always predicting the majority class" />
                <Metric label="MAE" value={num(bt.mae)} />
                <Metric label="RMSE" value={num(bt.rmse)} />
              </div>
              {bt.directional_accuracy !== undefined && bt.directional_accuracy < 0.55 && (
                <p className={styles.warning}>
                  Historical accuracy is close to chance — treat this signal as weak evidence.
                </p>
              )}
              <p className={styles.subtle}>Model: {primary.model_version}</p>
            </div>
          )}
        </div>

        {/* Risk */}
        <div className={styles.card}>
          <h3>
            Risk Assessment <span className={`${styles.badge} ${styles["risk" + risk.risk_level]}`}>{risk.risk_level}</span>
          </h3>
          <div className={styles.metricRow}>
            <Metric label="Volatility (ann.)" value={pct(risk.annualized_volatility)} />
            <Metric label="Max drawdown 1Y" value={pct(risk.max_drawdown_1y)} />
            <Metric label="VaR 95% (1D)" value={pct(risk.var_95_1d, 2)} />
            <Metric label="Sharpe 1Y" value={num(risk.sharpe_ratio_1y)} />
          </div>
          <ul className={styles.list}>
            {(risk.risk_factors || []).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        {/* Technicals */}
        <div className={`${styles.card} ${styles.wide}`}>
          <h3>
            Technical Indicators{" "}
            <span className={`${styles.badge} ${styles[indicators.technical_bias] || ""}`}>
              {indicators.technical_bias}
            </span>
          </h3>
          <div className={styles.metricRow}>
            <Metric label="RSI (14)" value={num(indicators.latest?.rsi_14, 1)} />
            <Metric label="MACD" value={num(indicators.latest?.macd, 2)} />
            <Metric label="SMA 50" value={num(indicators.latest?.sma_50)} />
            <Metric label="SMA 200" value={num(indicators.latest?.sma_200)} />
            <Metric label="ATR (14)" value={num(indicators.latest?.atr_14)} />
          </div>
          {series.dates && (
            <Plot
              data={[
                { x: series.dates, y: series.close, type: "scatter", mode: "lines", name: "Close", line: { color: "#2563eb" } },
                { x: series.dates, y: series.sma_20, type: "scatter", mode: "lines", name: "SMA 20", line: { color: "#f59e0b", width: 1 } },
                { x: series.dates, y: series.sma_50, type: "scatter", mode: "lines", name: "SMA 50", line: { color: "#10b981", width: 1 } },
                { x: series.dates, y: series.bb_upper, type: "scatter", mode: "lines", name: "Bollinger upper", line: { color: "#94a3b8", dash: "dot", width: 1 } },
                { x: series.dates, y: series.bb_lower, type: "scatter", mode: "lines", name: "Bollinger lower", line: { color: "#94a3b8", dash: "dot", width: 1 } },
                { x: series.dates, y: series.rsi_14, type: "scatter", mode: "lines", name: "RSI 14", yaxis: "y2", line: { color: "#a855f7", width: 1 } },
              ]}
              layout={{
                autosize: true,
                height: 420,
                margin: { l: 50, r: 50, t: 20, b: 40 },
                legend: { orientation: "h", y: -0.15 },
                yaxis: { title: { text: "Price" }, domain: [0.3, 1] },
                yaxis2: { title: { text: "RSI" }, domain: [0, 0.22], range: [0, 100] },
                paper_bgcolor: "rgba(0,0,0,0)",
                plot_bgcolor: "rgba(0,0,0,0)",
              }}
              useResizeHandler
              style={{ width: "100%" }}
              config={{ displayModeBar: false, responsive: true }}
            />
          )}
          <ul className={styles.signals}>
            {(indicators.signals || []).map((s) => (
              <li key={s.indicator} className={styles[s.signal]}>
                <strong>{s.indicator}:</strong> {s.detail}
              </li>
            ))}
          </ul>
        </div>

        {/* Fundamentals */}
        <div className={styles.card}>
          <h3>Fundamentals & Performance</h3>
          <p className={styles.subtle}>
            {analysis.company?.sector} · {analysis.company?.industry}
          </p>
          <div className={styles.metricRow}>
            <Metric label="52W high" value={num(metrics.high_52w)} />
            <Metric label="52W low" value={num(metrics.low_52w)} />
            <Metric label="1M return" value={`${num(metrics.return_1m_pct)}%`} />
            <Metric label="1Y return" value={`${num(metrics.return_1y_pct)}%`} />
          </div>
          {fundamentals.provider_available ? (
            <div className={styles.metricRow}>
              {Object.entries(fundamentals.provider_metrics).map(([k, v]) => (
                <Metric key={k} label={k.replace(/_/g, " ")} value={num(v, 3)} />
              ))}
            </div>
          ) : (
            <p className={styles.subtle}>{fundamentals.note}</p>
          )}
        </div>

        {/* News sentiment */}
        <div className={styles.card}>
          <h3>News & Sentiment</h3>
          {news.articles?.length ? (
            <>
              <p>
                Overall sentiment: <strong>{news.sentiment_summary?.overall_sentiment}</strong> across{" "}
                {news.articles.length} articles.
              </p>
              <ul className={styles.list}>
                {news.articles.slice(0, 5).map((a) => (
                  <li key={a.url}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer">
                      {a.title}
                    </a>{" "}
                    <span className={styles.subtle}>
                      ({a.source}, {a.sentiment})
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={styles.subtle}>
              No recent news available{news.provider_available === false ? " (news provider not configured)" : ""}.
            </p>
          )}
        </div>

        {/* AI conclusion */}
        <div className={`${styles.card} ${styles.wide}`}>
          <h3>AI-Generated Analysis</h3>
          <div className={styles.aiText}>
            <RichText text={analysis.ai_conclusion} />
          </div>
          <SourcesPanel sources={analysis.sources} />
        </div>
      </div>
    </section>
  );
}

export default AnalysisDashboard;

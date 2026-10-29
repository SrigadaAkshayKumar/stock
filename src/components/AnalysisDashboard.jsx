import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  LuActivity,
  LuBrainCircuit,
  LuBuilding2,
  LuFileText,
  LuNewspaper,
  LuRefreshCw,
  LuShieldAlert,
  LuSparkles,
  LuTriangleAlert,
} from "react-icons/lu";
import Plot from "./Plot";
import styles from "./Analysis.module.css";
import RichText from "./RichText";
import SourcesPanel from "./SourcesPanel";
import { plotConfig, useChartTheme } from "./ui/chartTheme";
import { API, loadSnapshot, reportUrl } from "../services/snapshot";
import {
  formatDate,
  formatMetricValue,
  formatNumber,
  formatPct,
  formatPrice,
  metricLabel,
  ratioPct,
  toneOf,
} from "../utils/format";

function Metric({ label, value, hint, tone }) {
  return (
    <div className={styles.metric} title={hint}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={`${styles.metricValue} ${tone || ""}`}>{value}</span>
    </div>
  );
}

const toneClass = (v) =>
  ({ Bullish: "badge-success", bullish: "badge-success", Bearish: "badge-danger", bearish: "badge-danger" }[v] ||
  "badge-warning");

const riskClass = (v) => ({ Low: "badge-success", Medium: "badge-warning", High: "badge-danger" }[v] || "");

function CardTitle({ icon: Icon, children, badge }) {
  return (
    <div className={styles.cardTitle}>
      <h3>
        <Icon /> {children}
      </h3>
      {badge}
    </div>
  );
}

function IndicatorChart({ series }) {
  const t = useChartTheme();
  return (
    <Plot
      data={[
        { x: series.dates, y: series.bb_upper, type: "scatter", mode: "lines", name: "Bollinger upper", line: { color: t.muted, dash: "dot", width: 1 } },
        { x: series.dates, y: series.bb_lower, type: "scatter", mode: "lines", name: "Bollinger lower", line: { color: t.muted, dash: "dot", width: 1 }, fill: "tonexty", fillcolor: t.fill },
        { x: series.dates, y: series.close, type: "scatter", mode: "lines", name: "Close", line: { color: t.line, width: 2 } },
        { x: series.dates, y: series.sma_20, type: "scatter", mode: "lines", name: "SMA 20", line: { color: t.warning, width: 1.25 } },
        { x: series.dates, y: series.sma_50, type: "scatter", mode: "lines", name: "SMA 50", line: { color: t.success, width: 1.25 } },
        { x: series.dates, y: series.rsi_14, type: "scatter", mode: "lines", name: "RSI 14", yaxis: "y2", line: { color: t.purple, width: 1.25 } },
      ]}
      layout={t.layout({
        height: 440,
        margin: { l: 56, r: 16, t: 8, b: 40 },
        yaxis: { title: { text: "Price" }, domain: [0.32, 1], gridcolor: t.grid, zeroline: false, tickformat: ",.0f" },
        yaxis2: {
          title: { text: "RSI" },
          domain: [0, 0.22],
          range: [0, 100],
          gridcolor: t.grid,
          zeroline: false,
          tickvals: [30, 70],
        },
        shapes: [30, 70].map((y) => ({
          type: "line", xref: "paper", x0: 0, x1: 1, yref: "y2", y0: y, y1: y,
          line: { color: t.muted, width: 1, dash: "dash" },
        })),
        xaxis: { gridcolor: "rgba(0,0,0,0)", linecolor: t.grid, type: "date" },
      })}
      config={plotConfig}
      useResizeHandler
      style={{ width: "100%" }}
    />
  );
}

function AnalysisDashboard({ ticker }) {
  const [analysis, setAnalysis] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError("");
      // Pre-computed analysis renders instantly; "Re-run live" re-runs it on the backend.
      if (!refresh) {
        const snap = await loadSnapshot(ticker);
        setSnapshot(snap);
        if (snap) {
          setAnalysis(snap.analysis);
          setLoading(false);
          return;
        }
      }
      try {
        const res = await axios.get(`${API}/api/stock/${ticker}/analysis${refresh ? "?refresh=true" : ""}`);
        setAnalysis(res.data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            "We couldn't load the analysis for this stock right now. Please try again in a minute."
        );
      } finally {
        setLoading(false);
      }
    },
    [ticker]
  );

  useEffect(() => {
    setAnalysis(null);
    if (ticker) load();
  }, [ticker, load]);

  const pdfHref = snapshot ? reportUrl(snapshot) : `${API}/api/stock/${ticker}/report.pdf`;

  if (loading && !analysis) {
    return (
      <div className={`card ${styles.state}`}>
        <div className="spinner" />
        <p>Running the ML models, indicators, news and document retrieval…</p>
        <p className="muted">This can take up to a minute.</p>
      </div>
    );
  }
  if (error && !analysis) {
    return (
      <div className={`card ${styles.state}`}>
        <LuTriangleAlert className={styles.stateIcon} />
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => load(true)}>
          <LuRefreshCw /> Retry
        </button>
      </div>
    );
  }
  if (!analysis) return null;

  const { predictions = [], primary_prediction: primary, indicators = {}, risk = {}, fundamentals = {} } = analysis;
  const bt = primary?.backtest || {};
  const series = indicators.series || {};
  const metrics = fundamentals.price_metrics || {};
  const news = analysis.news || {};
  const weak = bt.directional_accuracy !== undefined && bt.directional_accuracy < 0.55;

  return (
    <section className={styles.dashboard} aria-label="AI analysis">
      <div className={styles.toolbar}>
        <p className="muted">
          Market data as of {formatDate(analysis.price?.as_of)} · analysis generated{" "}
          {new Date(analysis.generated_at).toLocaleString("en-IN")}
        </p>
        <div className={styles.toolbarActions}>
          <a className="btn btn-primary btn-sm" href={pdfHref} target="_blank" rel="noopener noreferrer">
            <LuFileText /> Open PDF report
          </a>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}

      {/* AI conclusion first: the answer, then the evidence */}
      <div className={`card ${styles.summary}`}>
        <CardTitle icon={LuSparkles}>AI-generated analysis</CardTitle>
        <div className={styles.aiText}>
          <RichText text={analysis.ai_conclusion} />
        </div>
        <SourcesPanel sources={analysis.sources} />
      </div>

      <div className={styles.grid}>
        <div className="card">
          <CardTitle icon={LuBrainCircuit}>ML prediction</CardTitle>
          <div className={styles.body}>
            {predictions.map((p) => (
              <div key={p.horizon_trading_days} className={styles.predictionRow}>
                <div className={styles.predictionHead}>
                  <strong>
                    Next {p.horizon_trading_days} trading day{p.horizon_trading_days > 1 ? "s" : ""}
                  </strong>
                  <span className={`badge ${toneClass(p.outlook)}`}>{p.outlook}</span>
                </div>
                <div className={styles.metricRow}>
                  <Metric label="P(up)" value={ratioPct(p.probability_up)} />
                  <Metric label="Confidence" value={ratioPct(p.confidence)} />
                  <Metric label="Expected price" value={formatPrice(p.predicted_price, ticker)} />
                </div>
                <span className={styles.subtle}>Target date {formatDate(p.target_date)}</span>
              </div>
            ))}
            {primary && (
              <div className={styles.backtest}>
                <h4>Walk-forward backtest (out-of-sample)</h4>
                <div className={styles.metricRow}>
                  <Metric label="Directional accuracy" value={ratioPct(bt.directional_accuracy)} />
                  <Metric label="Baseline" value={ratioPct(bt.baseline_accuracy)} hint="Always predicting the majority class" />
                  <Metric label="MAE" value={formatNumber(bt.mae)} />
                  <Metric label="RMSE" value={formatNumber(bt.rmse)} />
                </div>
                {weak && (
                  <p className={styles.warning}>
                    <LuTriangleAlert /> Historical accuracy is close to chance, so treat this signal as weak evidence.
                  </p>
                )}
                <code className={styles.version}>{primary.model_version}</code>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <CardTitle
            icon={LuShieldAlert}
            badge={risk.risk_level && <span className={`badge ${riskClass(risk.risk_level)}`}>{risk.risk_level} risk</span>}
          >
            Risk assessment
          </CardTitle>
          <div className={styles.body}>
            <div className={styles.metricGrid}>
              <Metric label="Volatility (ann.)" value={ratioPct(risk.annualized_volatility)} />
              <Metric label="Max drawdown 1Y" value={ratioPct(risk.max_drawdown_1y)} tone="down" />
              <Metric label="VaR 95% (1D)" value={ratioPct(risk.var_95_1d, 2)} />
              <Metric label="Sharpe 1Y" value={formatNumber(risk.sharpe_ratio_1y)} />
            </div>
            <ul className={styles.list}>
              {(risk.risk_factors || []).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`card ${styles.wide}`}>
          <CardTitle
            icon={LuActivity}
            badge={
              indicators.technical_bias && (
                <span className={`badge ${toneClass(indicators.technical_bias)}`}>
                  {indicators.technical_bias} bias
                </span>
              )
            }
          >
            Technical indicators
          </CardTitle>
          <div className={styles.body}>
            <div className={styles.metricRow}>
              <Metric label="RSI (14)" value={formatNumber(indicators.latest?.rsi_14, 1)} />
              <Metric label="MACD" value={formatNumber(indicators.latest?.macd)} />
              <Metric label="SMA 50" value={formatNumber(indicators.latest?.sma_50)} />
              <Metric label="SMA 200" value={formatNumber(indicators.latest?.sma_200)} />
              <Metric label="ATR (14)" value={formatNumber(indicators.latest?.atr_14)} />
            </div>
            {series.dates && <IndicatorChart series={series} />}
            <ul className={styles.signals}>
              {(indicators.signals || []).map((s) => (
                <li key={s.indicator} className={styles[s.signal]}>
                  <strong>{s.indicator}</strong> {s.detail}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card">
          <CardTitle icon={LuBuilding2}>Fundamentals & performance</CardTitle>
          <div className={styles.body}>
            <p className={styles.subtle}>
              {analysis.company?.sector} · {analysis.company?.industry}
            </p>
            <div className={styles.metricGrid}>
              <Metric label="52W high" value={formatPrice(metrics.high_52w, ticker)} />
              <Metric label="52W low" value={formatPrice(metrics.low_52w, ticker)} />
              <Metric label="1M return" value={formatPct(metrics.return_1m_pct)} tone={toneOf(metrics.return_1m_pct)} />
              <Metric label="1Y return" value={formatPct(metrics.return_1y_pct)} tone={toneOf(metrics.return_1y_pct)} />
            </div>
            {fundamentals.provider_available ? (
              <div className={styles.metricGrid}>
                {Object.entries(fundamentals.provider_metrics).map(([k, v]) => (
                  <Metric key={k} label={metricLabel(k)} value={formatMetricValue(k, v)} />
                ))}
              </div>
            ) : (
              <p className={styles.note}>{fundamentals.note}</p>
            )}
          </div>
        </div>

        <div className="card">
          <CardTitle icon={LuNewspaper}>News & sentiment</CardTitle>
          <div className={styles.body}>
            {news.articles?.length ? (
              <>
                <p>
                  Overall sentiment <strong>{news.sentiment_summary?.overall_sentiment}</strong> across{" "}
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
              <p className={styles.note}>
                No recent news articles were found for this stock.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AnalysisDashboard;

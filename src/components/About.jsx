import React from "react";
import { Link } from "react-router-dom";
import {
  LuArrowRight,
  LuBot,
  LuBrainCircuit,
  LuChartLine,
  LuDatabase,
  LuEye,
  LuFileText,
  LuGauge,
  LuNewspaper,
  LuShieldCheck,
  LuTarget,
} from "react-icons/lu";
import BackToTopBtn from "./BackToTopBtn";
import styles from "./About.module.css";

const CAPABILITIES = [
  { icon: LuChartLine, title: "Market data & indicators", text: "Price history with SMA/EMA, RSI, MACD, Bollinger Bands and ATR, each translated into a plain-English signal." },
  { icon: LuBrainCircuit, title: "Backtested ML forecasts", text: "1- and 5-day direction and price forecasts. Walk-forward backtests report accuracy against a baseline, and weak signals are flagged." },
  { icon: LuNewspaper, title: "RAG over news & documents", text: "News and company documents are chunked, embedded and ranked by relevance and freshness, with sources kept for every claim." },
  { icon: LuBot, title: "AI analyst", text: "A stock-specific agent selects from nine tools, answers with evidence, separates facts from model output, and cites its sources." },
  { icon: LuGauge, title: "Risk assessment", text: "Volatility, maximum drawdown, Value-at-Risk and Sharpe ratio, combined with model confidence into a risk level." },
  { icon: LuFileText, title: "PDF reports", text: "A 14-section analysis report covering price, technicals, fundamentals, news, forecasts, risk and sources." },
];

const STACK = [
  { group: "Frontend", items: ["React", "React Router", "Plotly", "CSS Modules"] },
  { group: "Backend", items: ["Python", "Flask", "pandas", "scikit-learn"] },
  { group: "AI", items: ["Claude (Anthropic)", "RAG pipeline", "Tool-using agent"] },
  { group: "Data & infra", items: ["yfinance", "NewsAPI", "Excel → PostgreSQL", "Redis", "Docker", "GitHub Actions"] },
];

const PRINCIPLES = [
  { icon: LuShieldCheck, title: "Evidence first", text: "Every answer is built from tool outputs and retrieved sources, never from the model's memory alone." },
  { icon: LuEye, title: "Honest about accuracy", text: "Backtest results are shown next to every forecast, including when they are close to chance." },
  { icon: LuTarget, title: "Education, not advice", text: "Analysis is probabilistic and for learning. A disclaimer accompanies every prediction and report." },
];

const AboutComponent = () => (
  <div className={styles.about}>
    <section className={styles.hero}>
      <span className="eyebrow">About</span>
      <h1>Stock research that shows its work</h1>
      <p>
        Stock Analyzer brings market data, machine learning, retrieval-augmented generation and an AI agent
        together, so anyone can understand what is driving a stock and how confident the analysis really is.
      </p>
    </section>

    <div className="page">
      <section className={styles.mv}>
        <div className="card">
          <h2>Our mission</h2>
          <p>
            To deliver reliable, data-driven stock analysis that empowers investors, learners and financial
            professionals with transparent, accurate and easy-to-use insights for smarter decisions.
          </p>
        </div>
        <div className="card">
          <h2>Our vision</h2>
          <p>
            To be a trusted platform for stock market analysis, where innovation, transparency and accessibility
            help every individual and organisation make better long-term financial decisions.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2>What the platform does</h2>
        <div className={styles.grid}>
          {CAPABILITIES.map(({ icon: Icon, title, text }) => (
            <div key={title} className={`card ${styles.feature}`}>
              <div className={styles.icon}>
                <Icon />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Principles</h2>
        <div className={styles.principles}>
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <div key={title} className={styles.principle}>
              <Icon />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Built with</h2>
        <div className={`card ${styles.stack}`}>
          {STACK.map(({ group, items }) => (
            <div key={group}>
              <h3>
                <LuDatabase /> {group}
              </h3>
              <div className={styles.tags}>
                {items.map((i) => (
                  <span key={i} className="badge">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <div>
          <h2>See it on a real stock</h2>
          <p className="muted">Open a full analysis with forecasts, risk, sources and the AI analyst.</p>
        </div>
        <Link to="/stock/TCS.NS" className="btn btn-primary btn-lg">
          Open TCS analysis <LuArrowRight />
        </Link>
      </section>
    </div>
    <BackToTopBtn />
  </div>
);

export default AboutComponent;

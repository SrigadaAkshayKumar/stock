// In-browser version of the backend AgentService (backend/services/agent/agent_service.py).
// Intent detection and tool routing use the backend's own tables (shipped in the
// snapshot); tools read the evidence the backend pipeline pre-computed, and the
// answer is assembled with the same rule-based synthesis. Keep in step with the
// Python implementation.

import { reportUrl } from "./snapshot";
import { formatMetricValue, metricLabel } from "../utils/format";

const SOURCE_LABELS = { local_dataset: "historical market dataset", yfinance: "Yahoo Finance" };

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const signed = (v) => `${v >= 0 ? "+" : ""}${Number(v).toFixed(2)}`;

export function detectIntent(question, keywords) {
  const q = ` ${question.toLowerCase()} `;
  const intents = Object.entries(keywords)
    .filter(([, words]) => words.some((w) => new RegExp(`(?<![a-z])${escapeRe(w)}(?![a-z])`).test(q)))
    .map(([intent]) => intent);
  return intents.length ? intents : ["overview"];
}

export function selectTools(intents, intentTools, toolOrder) {
  const selected = new Set(intents.flatMap((i) => intentTools[i] || []));
  return toolOrder.filter((t) => selected.has(t));
}

function executeTools(snapshot, toolNames, intents) {
  const evidence = snapshot.agent.tools;
  const results = {};
  const trace = [];
  for (const name of toolNames) {
    const start = performance.now();
    let value = evidence[name];
    if (name === "retrieve_company_documents") {
      // Retrieval results were pre-computed per intent; use the first matching one.
      value = value[intents.find((i) => value[i]) || "overview"];
    }
    if (name === "generate_report") {
      value = { ...value, download_url: reportUrl(snapshot) };
    }
    results[name] = value ?? { error: "not available" };
    trace.push({
      tool: name,
      status: value && !value.error ? "ok" : "error",
      duration_ms: Math.round((performance.now() - start) * 10) / 10,
    });
  }
  return { results, trace };
}

function structure(results) {
  const pred = results.run_ml_prediction || {};
  const ind = results.get_technical_indicators || {};
  const news = results.search_latest_news || {};
  const risk = results.calculate_risk || {};
  return {
    short_term_outlook: pred.outlook,
    prediction_horizon: pred.horizon_trading_days ? `${pred.horizon_trading_days} trading sessions` : null,
    model_confidence: pred.confidence,
    probability_up: pred.probability_up,
    predicted_price: pred.predicted_price,
    backtest_directional_accuracy: pred.backtest?.directional_accuracy,
    model_version: pred.model_version,
    technical_bias: ind.technical_bias,
    key_technical_signals: (ind.signals || []).map((s) => s.detail).slice(0, 5),
    news_sentiment: news.sentiment_summary?.overall_sentiment,
    risk_level: risk.risk_level,
    risk_factors: risk.risk_factors || [],
  };
}

function sources(results) {
  const out = [];
  for (const s of results.retrieve_company_documents?.sources || []) {
    out.push({ ...s, kind: "retrieved_document" });
  }
  for (const a of (results.search_latest_news?.articles || []).slice(0, 5)) {
    out.push({
      kind: "news",
      title: a.title,
      source: a.source,
      url: a.url,
      published_at: a.published_at,
      retrieved_at: a.retrieved_at,
    });
  }
  const price = results.get_live_price;
  if (price?.as_of) {
    out.push({
      kind: "market_data",
      title: "Market price data",
      source: price.source,
      published_at: price.as_of,
      retrieved_at: price.retrieved_at,
    });
  }
  const pred = results.run_ml_prediction;
  if (pred?.model_version) {
    out.push({ kind: "model_output", title: "ML prediction model", source: pred.model_version, published_at: pred.generated_at });
  }
  return out;
}

function conclusion(s) {
  const votes = [];
  if (s.short_term_outlook && (s.model_confidence || 0) >= 0.55) votes.push(["ML model", s.short_term_outlook.toLowerCase()]);
  if (s.technical_bias) votes.push(["technicals", s.technical_bias]);
  if (s.news_sentiment === "positive" || s.news_sentiment === "negative") {
    votes.push(["news sentiment", s.news_sentiment === "positive" ? "bullish" : "bearish"]);
  }
  if (!votes.length) return "";
  const directions = new Set(votes.map(([, d]) => d).filter((d) => d !== "neutral"));
  const detail = votes.map(([name, d]) => `${name}: ${d}`).join(", ");
  let view;
  if (directions.size === 1) view = `the available evidence leans **${[...directions][0]}** (${detail})`;
  else if (!directions.size) view = `the available evidence is **neutral** (${detail})`;
  else view = `the signals are **mixed** (${detail}), so there is no clear short-term edge`;
  const risk = s.risk_level ? ` Risk level: ${s.risk_level}.` : "";
  return `**Conclusion:** ${view}.${risk} This is probabilistic, not a recommendation, and can change quickly with new information.`;
}

function ruleBasedAnswer(symbol, s, results) {
  const lines = [];
  const price = results.get_live_price || {};
  if (price.price !== undefined) {
    lines.push(
      `**Market data:** ${symbol} last closed at ${price.price} on ${price.as_of} ` +
        `(${signed(price.change_pct)}% vs previous close; source: ${SOURCE_LABELS[price.source] || price.source}).`
    );
  }
  const hist = results.get_historical_prices || {};
  if (hist.change_pct !== undefined) {
    lines.push(`Over the last ${hist.period} the price moved ${signed(hist.change_pct)}% (range ${hist.low}–${hist.high}).`);
  }
  if (s.technical_bias) {
    lines.push(`**Technical signals (${s.technical_bias}):** ${s.key_technical_signals.join("; ")}.`);
  }
  const fund = results.get_fundamentals || {};
  if (fund.company) {
    const c = fund.company;
    const m = fund.price_metrics || {};
    lines.push(
      `**Company:** ${c.name} (${c.sector || "sector n/a"}). ` +
        `52-week range ${m.low_52w}–${m.high_52w}, 1-year return ${m.return_1y_pct}%.`
    );
    if (fund.provider_metrics && Object.keys(fund.provider_metrics).length) {
      lines.push(
        `Valuation: ${Object.entries(fund.provider_metrics)
          .map(([k, v]) => `${metricLabel(k).replace(/^(?!P\/|ROE)\w/, (c) => c.toLowerCase())} ${formatMetricValue(k, v)}`)
          .join(", ")}.`
      );
    } else if (fund.note) {
      lines.push(fund.note);
    }
  }
  const news = results.search_latest_news;
  if (news) {
    if (news.articles?.length) {
      lines.push(
        `**News:** ${news.articles.length} recent articles, overall sentiment ${s.news_sentiment || "n/a"}. ` +
          `Latest: "${news.articles[0].title}".`
      );
    } else {
      lines.push("**News:** no recent articles were available from the news provider.");
    }
  }
  const docs = results.retrieve_company_documents?.sources || [];
  if (docs.length) {
    lines.push(`**Retrieved context:** ${docs.slice(0, 3).map((d) => `[${d.id}] ${d.title} (${d.recency})`).join("; ")}.`);
    lines.push(`> ${docs[0].excerpt.slice(0, 300)}…`);
  }
  if (s.short_term_outlook) {
    const acc = s.backtest_directional_accuracy;
    lines.push(
      `**ML model:** ${s.short_term_outlook} over ${s.prediction_horizon} — probability of a rise ` +
        `${(s.probability_up * 100).toFixed(0)}%, expected price ≈ ${s.predicted_price}. ` +
        `Backtested directional accuracy: ${(acc * 100).toFixed(1)}%.` +
        (acc != null && acc < 0.55 ? " This is close to chance, so treat the signal as weak." : "")
    );
  }
  if (s.risk_level) lines.push(`**Risk (${s.risk_level}):** ${s.risk_factors.slice(0, 4).join(" ")}`);
  const report = results.generate_report;
  if (report) lines.push(`**Report:** ${report.message} Use the download link below.`);
  const c = conclusion(s);
  if (c) lines.push(c);
  if (!lines.length) lines.push("I could not gather enough evidence to answer that question.");
  return lines.join("\n\n");
}

export function askLocalAgent(snapshot, question) {
  const { intent_keywords, intent_tools, tool_order } = snapshot.agent;
  const intents = detectIntent(question, intent_keywords);
  const toolNames = selectTools(intents, intent_tools, tool_order);
  const { results, trace } = executeTools(snapshot, toolNames, intents);
  const analysis = structure(results);
  return {
    symbol: snapshot.symbol,
    question,
    answer: ruleBasedAnswer(snapshot.symbol, analysis, results),
    answer_mode: "in_browser",
    intents,
    analysis,
    sources: sources(results),
    tool_trace: trace,
    report_url: results.generate_report?.download_url,
    disclaimer: snapshot.analysis.disclaimer,
    generated_at: new Date().toISOString(),
  };
}

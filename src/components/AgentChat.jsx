import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./Analysis.module.css";
import RichText from "./RichText";
import SourcesPanel from "./SourcesPanel";
import { LuBot, LuFileText, LuSendHorizontal } from "react-icons/lu";
import { API, loadSnapshot } from "../services/snapshot";
import { askLocalAgent } from "../services/localAgent";

const MODE_LABEL = {
  llm: "AI-written",
  rule_based: null,
  in_browser: null,
};

const SUGGESTIONS = [
  "Will the stock decrease over the next few days?",
  "What do the technical indicators say?",
  "What are the main risks right now?",
  "What is the latest news and sentiment?",
  "Tell me about the company's business.",
];

function AgentChat({ ticker }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const messagesRef = useRef(null);

  // A new stock starts a new conversation: the selected stock is the agent's context.
  useEffect(() => {
    let active = true;
    setMessages([]);
    setSessionId(null);
    setSnapshot(null);
    loadSnapshot(ticker).then((s) => active && setSnapshot(s));
    return () => {
      active = false;
    };
  }, [ticker]);

  // Scroll only the message list (not the page). For a new answer, bring its question to the
  // top so the start of the answer is visible; otherwise follow the bottom.
  useEffect(() => {
    const el = messagesRef.current;
    if (!el || !messages.length) return;
    const last = el.lastElementChild;
    const question = last?.previousElementSibling;
    const answered = !busy && messages[messages.length - 1].role === "assistant";
    el.scrollTop = answered && question ? question.offsetTop - 12 : el.scrollHeight;
  }, [messages, busy]);

  const ask = async (question) => {
    const q = (question ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    if (snapshot) {
      const res = askLocalAgent(snapshot, q);
      setMessages((m) => [...m, { role: "assistant", ...res, content: res.answer }]);
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(`${API}/api/stock/${ticker}/agent/chat`, {
        question: q,
        session_id: sessionId,
      });
      setSessionId(res.data.session_id);
      const report = res.data.tool_trace?.some((t) => t.tool === "generate_report");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          ...res.data,
          content: res.data.answer,
          report_url: report ? `${API}/api/stock/${ticker}/report.pdf` : undefined,
        },
      ]);
    } catch (err) {
      const msg =
        err.response?.status === 429
          ? "You're sending questions too quickly. Please wait a moment."
          : err.response?.data?.error ||
            "The analyst is unavailable right now. Please try again in a minute.";
      setMessages((m) => [...m, { role: "assistant", content: msg, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`card ${styles.chat}`} aria-label="AI stock analysis agent">
      <div className={styles.chatHeader}>
        <div className={styles.botIcon}>
          <LuBot />
        </div>
        <div>
          <h3>AI Analyst · {ticker}</h3>
          <p className="muted">
            Answers from market data, technical indicators, the ML model, news and retrieved documents, with
            sources.
          </p>
        </div>
      </div>

      <div className={styles.messages} ref={messagesRef}>
        {messages.length === 0 && (
          <div className={styles.welcome}>
            <p>Ask anything about {ticker}. Try one of these:</p>
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className={styles.chip} onClick={() => ask(s)} disabled={busy}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className={styles.userMsg}>
              {m.content}
            </div>
          ) : (
            <div key={i} className={`${styles.agentMsg} ${m.error ? styles.agentError : ""}`}>
              {!m.error && (
                <div className={styles.msgMeta}>
                  {m.analysis?.short_term_outlook && (
                    <span className="badge badge-primary">Outlook: {m.analysis.short_term_outlook}</span>
                  )}
                  {m.analysis?.model_confidence != null && (
                    <span className="badge">Confidence {(m.analysis.model_confidence * 100).toFixed(0)}%</span>
                  )}
                  {m.analysis?.risk_level && <span className="badge">Risk: {m.analysis.risk_level}</span>}
                  {MODE_LABEL[m.answer_mode] && (
                    <span className={`badge ${styles.modeBadge}`}>{MODE_LABEL[m.answer_mode]}</span>
                  )}
                </div>
              )}
              <div className={styles.answer}>
                <RichText text={m.content} />
              </div>
              {m.report_url && (
                <a className="btn btn-primary btn-sm" href={m.report_url} target="_blank" rel="noopener noreferrer">
                  <LuFileText /> Open PDF report
                </a>
              )}
              {m.tool_trace && (
                <details className={styles.trace}>
                  <summary>Tools used ({m.tool_trace.length})</summary>
                  <ul>
                    {m.tool_trace.map((t) => (
                      <li key={t.tool}>
                        <code>{t.tool}()</code>
                        <span className={t.status === "ok" ? "up" : "down"}>{t.status}</span>
                        <span className="muted">{t.duration_ms} ms</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {m.sources && <SourcesPanel sources={m.sources} title="Supporting sources" />}
            </div>
          )
        )}
        {busy && (
          <div className={`${styles.agentMsg} ${styles.typing}`}>
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <form
        className={styles.chatForm}
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${ticker}…`}
          maxLength={1000}
          aria-label="Question for the AI analyst"
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !input.trim()} aria-label="Send">
          <LuSendHorizontal />
        </button>
      </form>
    </section>
  );
}

export default AgentChat;

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./Analysis.module.css";
import RichText from "./RichText";
import SourcesPanel from "./SourcesPanel";

const API = process.env.REACT_APP_API_URL;

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
  const endRef = useRef(null);

  // A new stock starts a new conversation: the selected stock is the agent's context.
  useEffect(() => {
    setMessages([]);
    setSessionId(null);
  }, [ticker]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  const ask = async (question) => {
    const q = (question ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setBusy(true);
    try {
      const res = await axios.post(`${API}/api/stock/${ticker}/agent/chat`, {
        question: q,
        session_id: sessionId,
      });
      setSessionId(res.data.session_id);
      setMessages((m) => [...m, { role: "assistant", ...res.data, content: res.data.answer }]);
    } catch (err) {
      const msg =
        err.response?.status === 429
          ? "You're sending questions too quickly. Please wait a moment."
          : err.response?.data?.error || "The analysis agent is unavailable right now.";
      setMessages((m) => [...m, { role: "assistant", content: msg, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`${styles.card} ${styles.chat}`} aria-label="AI stock analysis agent">
      <h3>Ask the AI Analyst about {ticker}</h3>
      <p className={styles.subtle}>
        The agent uses live market data, technical indicators, the ML model, news and retrieved documents
        for {ticker}, and shows the sources behind its answer.
      </p>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className={styles.chip} onClick={() => ask(s)} disabled={busy}>
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? styles.userMsg : styles.agentMsg}>
            {m.role === "assistant" && !m.error && (
              <div className={styles.msgMeta}>
                {m.analysis?.short_term_outlook && (
                  <span className={styles.badge}>Outlook: {m.analysis.short_term_outlook}</span>
                )}
                {m.analysis?.model_confidence != null && (
                  <span className={styles.badge}>
                    Confidence: {(m.analysis.model_confidence * 100).toFixed(0)}%
                  </span>
                )}
                {m.analysis?.risk_level && <span className={styles.badge}>Risk: {m.analysis.risk_level}</span>}
                <span className={styles.badge}>{m.answer_mode === "llm" ? "LLM synthesis" : "Rule-based synthesis"}</span>
              </div>
            )}
            <div className={m.error ? styles.error : undefined}>
              <RichText text={m.content} />
            </div>
            {m.tool_trace && (
              <details className={styles.trace}>
                <summary>Tools used ({m.tool_trace.length})</summary>
                <ul>
                  {m.tool_trace.map((t) => (
                    <li key={t.tool}>
                      {t.tool}() — {t.status} · {t.duration_ms} ms
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {m.sources && <SourcesPanel sources={m.sources} title="Supporting sources" />}
          </div>
        ))}
        {busy && <div className={styles.agentMsg}>Analysing {ticker}…</div>}
        <div ref={endRef} />
      </div>

      <form
        className={styles.chatForm}
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${ticker}…`}
          maxLength={1000}
          aria-label="Question for the AI analyst"
        />
        <button className={styles.button} type="submit" disabled={busy || !input.trim()}>
          Ask
        </button>
      </form>
      <p className={styles.subtle}>AI-generated analysis for educational purposes only — not investment advice.</p>
    </section>
  );
}

export default AgentChat;

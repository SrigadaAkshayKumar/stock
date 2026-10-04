import React from "react";
import styles from "./Analysis.module.css";

const KIND_LABEL = {
  retrieved_document: "Document",
  news: "News",
  market_data: "Market data",
  model_output: "Model output",
};

function formatDate(value) {
  if (!value) return "undated";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function SourcesPanel({ sources = [], title = "Sources & evidence" }) {
  if (!sources.length) return null;
  return (
    <div className={styles.sources}>
      <h4>{title}</h4>
      <ul>
        {sources.map((s, i) => (
          <li key={`${s.kind}-${s.title}-${i}`}>
            <span className={styles.sourceKind}>{KIND_LABEL[s.kind] || s.kind}</span>
            {s.recency && <span className={`${styles.badge} ${styles[s.recency] || ""}`}>{s.recency}</span>}
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title}
              </a>
            ) : (
              <span>{s.title}</span>
            )}
            <div className={styles.sourceMeta}>
              {s.source && <span>{s.source}</span>}
              <span>Published: {formatDate(s.published_at)}</span>
              {s.retrieved_at && <span>Retrieved: {formatDate(s.retrieved_at)}</span>}
              {s.flagged_untrusted_content && (
                <span className={styles.flagged}>instruction-like text removed</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SourcesPanel;

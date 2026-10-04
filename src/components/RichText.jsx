import React from "react";

// Renders plain text with **bold** segments and blank-line paragraphs,
// without using dangerouslySetInnerHTML (agent output is untrusted).
function renderInline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    )
  );
}

function RichText({ text }) {
  if (!text) return null;
  return text.split(/\n{2,}/).map((para, i) => {
    const trimmed = para.trim();
    if (trimmed.startsWith(">")) {
      return <blockquote key={i}>{renderInline(trimmed.replace(/^>\s?/, ""), i)}</blockquote>;
    }
    return <p key={i}>{renderInline(trimmed, i)}</p>;
  });
}

export default RichText;

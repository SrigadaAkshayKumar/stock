import React, { useEffect, useState } from "react";
import { LuArrowUp } from "react-icons/lu";

const style = {
  position: "fixed",
  right: 24,
  bottom: 24,
  zIndex: 40,
  width: 44,
  height: 44,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  boxShadow: "var(--shadow)",
  display: "grid",
  placeItems: "center",
  fontSize: 18,
};

const BackToTopBtn = ({ threshold = 400 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = null;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        setVisible(window.scrollY > threshold);
        frame = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  if (!visible) return null;
  return (
    <button
      style={style}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      title="Back to top"
    >
      <LuArrowUp />
    </button>
  );
};

export default BackToTopBtn;

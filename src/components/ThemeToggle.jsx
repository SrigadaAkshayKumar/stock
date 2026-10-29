import React from "react";
import { LuMoon, LuSun } from "react-icons/lu";
import { useTheme } from "./ThemeContext";

const style = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-2)",
  display: "grid",
  placeItems: "center",
  fontSize: 17,
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = `Switch to ${isDark ? "light" : "dark"} mode`;
  return (
    <button style={style} onClick={toggleTheme} aria-label={label} title={label}>
      {isDark ? <LuSun /> : <LuMoon />}
    </button>
  );
};

export default ThemeToggle;

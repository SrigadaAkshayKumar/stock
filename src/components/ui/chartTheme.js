import { useMemo } from "react";
import { useTheme } from "../ThemeContext";

// Plotly needs concrete colours. These mirror the tokens in styles/global.css.
const PALETTES = {
  light: {
    text: "#334155",
    muted: "#64748b",
    grid: "#e2e8f0",
    line: "#2563eb",
    fill: "rgba(37, 99, 235, 0.08)",
    success: "#059669",
    danger: "#dc2626",
    warning: "#d97706",
    purple: "#7c3aed",
    surface: "#ffffff",
    border: "#e2e8f0",
  },
  dark: {
    text: "#c3cde0",
    muted: "#8b99b3",
    grid: "#22314d",
    line: "#4f8cff",
    fill: "rgba(79, 140, 255, 0.12)",
    success: "#34d399",
    danger: "#f87171",
    warning: "#fbbf24",
    purple: "#a78bfa",
    surface: "#111a2c",
    border: "#22314d",
  },
};

export function useChartTheme() {
  const { theme } = useTheme();
  return useMemo(() => {
    const t = { ...(PALETTES[theme] || PALETTES.light) };
    t.layout = (overrides = {}) => ({
      autosize: true,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "Inter, system-ui, sans-serif", size: 12, color: t.muted },
      margin: { l: 56, r: 16, t: 12, b: 36 },
      hovermode: "x unified",
      hoverlabel: { bgcolor: t.surface, bordercolor: t.border, font: { color: t.text } },
      xaxis: { gridcolor: t.grid, linecolor: t.grid, zeroline: false },
      yaxis: { gridcolor: t.grid, linecolor: t.grid, zeroline: false, tickformat: ",.0f" },
      legend: { orientation: "h", y: -0.2, font: { color: t.text } },
      ...overrides,
    });
    return t;
  }, [theme]);
}

export const plotConfig = { displayModeBar: false, responsive: true };

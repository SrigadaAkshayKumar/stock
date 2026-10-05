import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { StockMetricsCard } from "./StockMetricsCard";

const renderStockMetricsCard = (props) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<StockMetricsCard {...props} />);
  });

  return { container, root };
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("StockMetricsCard", () => {
  test("formats Indian stock prices with INR symbol", () => {
    const { container, root } = renderStockMetricsCard({
      open: 2084.907471,
      close: 2095.25,
      low: 2070.12,
      high: 2110.8,
      previousClose: 2080.5,
    });

    const values = container.querySelectorAll(".stock-value");
    expect(Array.from(values).map((value) => value.textContent)).toEqual([
      "₹2084.91",
      "₹2095.25",
      "₹2070.12",
      "₹2110.80",
    ]);

    act(() => root.unmount());
  });
});

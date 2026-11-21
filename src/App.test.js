import React, { act } from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "./App";
import * as snapshotService from "./services/snapshot";
import * as watchlistManager from "./utils/watchlistManager";

describe("App Component", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "Test", "/");

    jest.spyOn(snapshotService, "warmBackend").mockImplementation(() => {});
    jest.spyOn(snapshotService, "loadSnapshotSummaries").mockResolvedValue({
      TCS: {
        close: 3500.5,
        change_pct: 1.25,
        spark: [3400, 3450, 3500.5],
        as_of: "2025-01-01",
        outlook: "Bullish",
      },
    });
    jest.spyOn(snapshotService, "loadSnapshot").mockResolvedValue(null);
    jest.spyOn(snapshotService, "loadSnapshotIndex").mockResolvedValue(new Set(["TCS"]));
    jest.spyOn(watchlistManager, "getWatchlistSymbols").mockResolvedValue([]);
  });

  test("renders header with branding and main navigation links", async () => {
    await act(async () => {
      render(<App />);
    });

    // Check brand logo and title
    const headerBrand = screen.getByLabelText(/Stock Analyzer home/i);
    expect(headerBrand).toBeInTheDocument();
    expect(headerBrand).toHaveTextContent(/Stock/i);
    expect(headerBrand).toHaveTextContent(/Analyzer/i);

    // Check primary navigation items in header
    const mainNav = screen.getByRole("navigation", { name: /^main$/i });
    expect(mainNav).toBeInTheDocument();
    expect(within(mainNav).getByRole("link", { name: /^markets$/i })).toBeInTheDocument();
    expect(within(mainNav).getByRole("link", { name: /^watchlist$/i })).toBeInTheDocument();
    expect(within(mainNav).getByRole("link", { name: /^about$/i })).toBeInTheDocument();
    expect(within(mainNav).getByRole("link", { name: /^contact$/i })).toBeInTheDocument();

    // Check sign in link and theme toggle button
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /switch to (dark|light) mode/i })
    ).toBeInTheDocument();
  });

  test("renders home markets hero section and stock search", async () => {
    await act(async () => {
      render(<App />);
    });

    expect(
      screen.getByRole("heading", { name: /AI-powered analysis for Indian equities/i })
    ).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      /search a company or ticker, e.g\. Infosys or TCS/i
    );
    expect(searchInput).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /^markets$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^NSE$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^BSE$/i })).toBeInTheDocument();
  });

  test("renders footer with disclaimer and product links", async () => {
    await act(async () => {
      render(<App />);
    });

    expect(
      screen.getByText(/For educational purposes only\. Not investment advice\./i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/AI-powered analysis for Indian equities: ML forecasts with backtesting/i)
    ).toBeInTheDocument();
  });

  test("navigates to About page when clicking About nav link", async () => {
    await act(async () => {
      render(<App />);
    });

    const aboutLinks = screen.getAllByRole("link", { name: /^about$/i });
    await act(async () => {
      fireEvent.click(aboutLinks[0]);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Stock research that shows its work/i })
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Our mission/i)).toBeInTheDocument();
    expect(screen.getByText(/Our vision/i)).toBeInTheDocument();
  });

  test("navigates to Contact page when clicking Contact nav link", async () => {
    await act(async () => {
      render(<App />);
    });

    const contactLinks = screen.getAllByRole("link", { name: /^contact$/i });
    await act(async () => {
      fireEvent.click(contactLinks[0]);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Let's talk about smart investing/i })
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send message/i })).toBeInTheDocument();
  });

  test("navigates to Login page when clicking Sign in button", async () => {
    await act(async () => {
      render(<App />);
    });

    const signInLink = screen.getByRole("link", { name: /sign in/i });
    await act(async () => {
      fireEvent.click(signInLink);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Welcome back/i })
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Sign in to sync your watchlist\./i)).toBeInTheDocument();
  });

  test("toggles between light and dark theme", async () => {
    await act(async () => {
      render(<App />);
    });

    const themeToggleBtn = screen.getByRole("button", {
      name: /switch to (dark|light) mode/i,
    });
    const initialLabel = themeToggleBtn.getAttribute("aria-label");

    await act(async () => {
      fireEvent.click(themeToggleBtn);
    });

    const updatedLabel = themeToggleBtn.getAttribute("aria-label");
    expect(updatedLabel).not.toEqual(initialLabel);
  });

  test("switches between exchange tabs on the home page", async () => {
    await act(async () => {
      render(<App />);
    });

    const bseTab = screen.getByRole("tab", { name: /^BSE$/i });
    const nseTab = screen.getByRole("tab", { name: /^NSE$/i });

    expect(nseTab).toHaveClass("active");
    expect(bseTab).not.toHaveClass("active");

    await act(async () => {
      fireEvent.click(bseTab);
    });

    expect(bseTab).toHaveClass("active");
    expect(nseTab).not.toHaveClass("active");
  });
});

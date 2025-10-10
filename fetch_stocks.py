#!/usr/bin/env python3
"""
fetch_stocks.py

Fetch stock price data for multiple tickers using yfinance while minimizing rate-limit errors.

Features:
- Batch downloads instead of one-by-one
- 1–2 second randomized delay between batch requests
- Retries with exponential backoff on failures (including probable rate limits)
- Per-ticker CSV caching; only refresh if cache is older than 24 hours
- Errors logged to logs/errors.log

Usage examples:
- python fetch_stocks.py --tickers AAPL MSFT GOOGL AMZN
- python fetch_stocks.py --tickers-file tickers.txt --batch-size 10 --period 1y --interval 1d

Dependencies:
- yfinance (pip install yfinance)
- pandas (pip install pandas)

This script is Windows-friendly and ready for use in GSSOC 2025 projects.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
import random
import logging
from datetime import datetime, timedelta
from typing import Iterable, List, Sequence

try:
    import pandas as pd
except Exception as e:
    print("pandas is required. Install with: pip install pandas", file=sys.stderr)
    raise

try:
    import yfinance as yf
except Exception as e:
    print("yfinance is required. Install with: pip install yfinance", file=sys.stderr)
    raise


FRESHNESS_SECONDS = 24 * 60 * 60  # 24 hours


def setup_logging(log_dir: str = "logs") -> logging.Logger:
    os.makedirs(log_dir, exist_ok=True)
    logger = logging.getLogger("stock_fetcher")
    logger.setLevel(logging.INFO)

    # Avoid duplicate handlers if script is re-run within same interpreter
    if logger.handlers:
        return logger

    # Console handler (info and above)
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))

    # Error file handler (errors only)
    err_path = os.path.join(log_dir, "errors.log")
    fh_err = logging.FileHandler(err_path, mode="a", encoding="utf-8")
    fh_err.setLevel(logging.ERROR)
    fh_err.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(name)s:%(lineno)d - %(message)s")
    )

    logger.addHandler(ch)
    logger.addHandler(fh_err)
    return logger


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Batch fetch stock data with caching and retries")
    p.add_argument(
        "--tickers",
        nargs="*",
        default=None,
        help="Space-separated list of ticker symbols (e.g., AAPL MSFT GOOGL)",
    )
    p.add_argument(
        "--tickers-file",
        type=str,
        default=None,
        help="Path to a file containing ticker symbols (one per line, # for comments)",
    )
    p.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Number of tickers per batch request (default: 10)",
    )
    p.add_argument(
        "--period",
        type=str,
        default="1y",
        help="yfinance period (e.g., 1mo, 3mo, 6mo, 1y, 2y, max). Default: 1y",
    )
    p.add_argument(
        "--interval",
        type=str,
        default="1d",
        help="yfinance interval (e.g., 1d, 1wk, 1mo). Default: 1d",
    )
    p.add_argument(
        "--data-dir",
        type=str,
        default="data",
        help="Directory where per-ticker CSVs will be stored. Default: data",
    )
    p.add_argument(
        "--max-retries",
        type=int,
        default=3,
        help="Max retries per batch on failure. Default: 3",
    )
    p.add_argument(
        "--backoff-base",
        type=float,
        default=1.5,
        help="Base seconds for exponential backoff. Default: 1.5",
    )
    p.add_argument(
        "--backoff-max",
        type=float,
        default=30.0,
        help="Max seconds to sleep between retries. Default: 30",
    )
    return p.parse_args()


def load_tickers(args: argparse.Namespace) -> List[str]:
    tickers: List[str] = []

    if args.tickers_file:
        if not os.path.exists(args.tickers_file):
            raise FileNotFoundError(f"Tickers file not found: {args.tickers_file}")
        with open(args.tickers_file, "r", encoding="utf-8") as f:
            for line in f:
                s = line.strip()
                if not s or s.startswith("#"):
                    continue
                tickers.append(s.upper())

    if args.tickers:
        tickers.extend([t.upper() for t in args.tickers])

    # Fallback defaults if user provided none
    if not tickers:
        tickers = ["AAPL", "MSFT", "GOOGL", "AMZN"]

    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for t in tickers:
        if t not in seen:
            deduped.append(t)
            seen.add(t)
    return deduped


def ensure_dirs(*paths: str) -> None:
    for p in paths:
        os.makedirs(p, exist_ok=True)


def is_cache_fresh(path: str, freshness_seconds: int = FRESHNESS_SECONDS) -> bool:
    if not os.path.exists(path):
        return False
    age = time.time() - os.path.getmtime(path)
    return age < freshness_seconds


def chunked(seq: Sequence[str], size: int) -> Iterable[List[str]]:
    for i in range(0, len(seq), size):
        yield list(seq[i : i + size])


def looks_like_rate_limit(err: Exception) -> bool:
    msg = str(err).lower()
    # Common signals: HTTP 429, Too Many Requests, rate limit
    return ("429" in msg) or ("too many request" in msg) or ("rate limit" in msg)


def download_batch_with_retries(
    tickers: List[str],
    period: str,
    interval: str,
    max_retries: int,
    backoff_base: float,
    backoff_max: float,
    logger: logging.Logger,
) -> pd.DataFrame:
    attempt = 0
    last_exc: Exception | None = None

    while attempt <= max_retries:
        try:
            # threads=False to be gentler on rate limits
            df = yf.download(
                tickers=tickers,
                period=period,
                interval=interval,
                group_by="ticker",  # easier to split per ticker
                auto_adjust=False,
                threads=False,
                progress=False,
            )
            if df is None or (isinstance(df, pd.DataFrame) and df.empty):
                raise ValueError(f"Empty data returned for batch: {tickers}")
            return df
        except Exception as e:
            last_exc = e
            attempt += 1
            if attempt > max_retries:
                # Log at error on final failure
                logger.error(
                    "Batch failed after %d retries for %s | error=%s",
                    max_retries,
                    ",".join(tickers),
                    repr(e),
                )
                break

            # Warn and backoff with jitter
            kind = "rate-limit" if looks_like_rate_limit(e) else "error"
            sleep_for = min(backoff_base * (2 ** (attempt - 1)) + random.uniform(0, 0.5), backoff_max)
            logger.warning(
                "Batch %s on attempt %d/%d for %s; backing off %.2fs | error=%s",
                kind,
                attempt,
                max_retries,
                ",".join(tickers),
                sleep_for,
                repr(e),
            )
            time.sleep(sleep_for)
    # If we reach here, all retries failed
    if last_exc:
        raise last_exc
    raise RuntimeError("download_batch_with_retries failed for unknown reasons")


def save_per_ticker_csv(
    df: pd.DataFrame,
    tickers: List[str],
    data_dir: str,
    logger: logging.Logger,
) -> None:
    """Save DataFrame to per-ticker CSVs. Handles both single and multi-ticker shapes."""
    # Shape 1: group_by="ticker" with multiple tickers -> columns MultiIndex (level 0=ticker, level 1=fields)
    if isinstance(df.columns, pd.MultiIndex) and df.columns.nlevels == 2:
        level0 = df.columns.get_level_values(0)
        present = set(level0.unique())
        for t in tickers:
            if t not in present:
                logger.warning("Ticker %s not present in returned data; skipping save", t)
                continue
            tdf = df[t]
            tdf = tdf.dropna(how="all")
            if tdf.empty:
                logger.warning("Ticker %s resulted in empty frame after dropna; skipping", t)
                continue
            out_path = os.path.join(data_dir, f"{t}.csv")
            tdf.to_csv(out_path, index=True)
            logger.info("Saved %s (%d rows) -> %s", t, len(tdf), out_path)
        return

    # Shape 2: single ticker or non-MultiIndex
    tdf = df.dropna(how="all")
    if not tdf.empty:
        # If we can infer a single ticker name from columns, use it; otherwise use a generic name
        inferred = None
        # Try common column names to infer ticker from name; yfinance sometimes sets df.columns.name
        if getattr(df.columns, "name", None):
            inferred = str(df.columns.name)
        # Fallback: if only one ticker requested, use that
        if len(tickers) == 1:
            inferred = tickers[0]
        # Absolute fallback
        if not inferred:
            inferred = "ticker"
        out_path = os.path.join(data_dir, f"{inferred}.csv")
        tdf.to_csv(out_path, index=True)
        logger.info("Saved %s (%d rows) -> %s", inferred, len(tdf), out_path)
    else:
        logger.warning("Download returned empty DataFrame; nothing saved")


def main() -> None:
    args = parse_args()
    logger = setup_logging()

    ensure_dirs(args.data_dir, "logs")

    tickers = load_tickers(args)
    logger.info("Total tickers requested: %d", len(tickers))

    # Filter tickers that actually need an update (cache older than 24h)
    to_update: List[str] = []
    for t in tickers:
        out_path = os.path.join(args.data_dir, f"{t}.csv")
        if is_cache_fresh(out_path, FRESHNESS_SECONDS):
            logger.info("Up-to-date (<=24h): %s", t)
        else:
            to_update.append(t)

    if not to_update:
        logger.info("All tickers are up-to-date. Nothing to fetch.")
        return

    logger.info("Tickers to update: %d", len(to_update))

    # Process in batches
    for batch_num, batch in enumerate(chunked(to_update, args.batch_size), start=1):
        logger.info("Fetching batch %d: %s", batch_num, ",".join(batch))
        try:
            df = download_batch_with_retries(
                tickers=batch,
                period=args.period,
                interval=args.interval,
                max_retries=args.max_retries,
                backoff_base=args.backoff_base,
                backoff_max=args.backoff_max,
                logger=logger,
            )
            save_per_ticker_csv(df, batch, args.data_dir, logger)
        except Exception as e:
            # Already logged inside retries; ensure an error log exists as well
            logger.error("Failed batch %d for %s | error=%s", batch_num, ",".join(batch), repr(e))
        finally:
            # Polite delay between batches to reduce rate-limit hits
            delay = random.uniform(1.0, 2.0)
            logger.info("Sleeping %.2fs before next batch...", delay)
            time.sleep(delay)

    logger.info("Done.")


if __name__ == "__main__":
    main()


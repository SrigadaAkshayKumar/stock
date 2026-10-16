"""Unit tests verifying README.md API endpoint accuracy against backend Flask routes (fixes #267)."""

import os
import re
import sys
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
README_PATH = os.path.join(REPO_ROOT, "README.md")
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


def test_readme_file_exists():
    """Verify README.md exists in repository root."""
    assert os.path.isfile(README_PATH), "README.md must exist in root directory"


def test_obsolete_endpoints_removed_from_readme():
    """Verify obsolete non-matching endpoints are removed from README.md (fixes #267)."""
    with open(README_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Old incorrect routes documented prior to fix
    assert "/api/stocks/<ticker>" not in content, (
        "README.md should not contain obsolete endpoint '/api/stocks/<ticker>'"
    )
    assert "/api/predict/<ticker>" not in content, (
        "README.md should not contain obsolete endpoint '/api/predict/<ticker>'"
    )


def test_correct_endpoints_present_in_readme():
    """Verify correct backend endpoints are documented in README.md (fixes #267)."""
    with open(README_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Core routes matching backend/routes/stock_routes.py
    assert "/api/stock/<symbol>" in content, (
        "README.md must document '/api/stock/<symbol>'"
    )
    assert "/api/stock/<symbol>/predict" in content, (
        "README.md must document '/api/stock/<symbol>/predict'"
    )
    assert "/api/stocks" in content, (
        "README.md must document '/api/stocks'"
    )


def test_documented_endpoints_match_flask_routes():
    """Verify that every documented endpoint corresponds to an active Flask route."""
    from app import app

    # Collect all registered Flask route rules
    registered_rules = {rule.rule for rule in app.url_map.iter_rules()}

    with open(README_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract all endpoints in `/api/...` format from README markdown tables
    documented_endpoints = re.findall(r"`(/api/[^`]+)`", content)
    assert documented_endpoints, "Must find documented endpoints under /api in README.md"

    for endpoint in documented_endpoints:
        # Strip query parameters if present, e.g. `/api/stock/<symbol>/history?period=1y`
        clean_endpoint = endpoint.split("?")[0]
        # In Flask rules, `<symbol>` is `<symbol>`
        # Check that this rule exists in registered_rules
        assert clean_endpoint in registered_rules, (
            f"Documented endpoint '{clean_endpoint}' does not match any registered Flask route rule: {registered_rules}"
        )


def test_readme_query_params_documented():
    """Verify key query parameters are documented for stock data endpoint."""
    with open(README_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    assert "chart_period" in content, "README.md should document chart_period query parameter"
    assert "table_period" in content, "README.md should document table_period query parameter"
    assert "refresh=true" in content, "README.md should document refresh query parameter"

"""Unit tests verifying About page text correctness and typo fixes (fixes #235)."""

import os
import re
import pytest

FRONTEND_SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src"))
ABOUT_JSX_PATH = os.path.join(FRONTEND_SRC, "components", "About.jsx")


def test_about_jsx_file_exists():
    """Verify About.jsx exists in src/components/."""
    assert os.path.isfile(ABOUT_JSX_PATH), "About.jsx must exist"


def test_about_page_typo_fixed():
    """Verify 'evry' typo is replaced with 'every' (fixes #235)."""
    with open(ABOUT_JSX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # The typo 'evry' must not exist as a word in About.jsx
    assert not re.search(r"\bevry\b", content, re.IGNORECASE), "About.jsx must not contain the typo 'evry'"

    # The corrected phrase must be present
    assert "every individual and organization" in content, (
        "About.jsx must contain 'every individual and organization'"
    )


def test_about_page_grammar_and_punctuation():
    """Verify punctuation spacing in mission statement."""
    with open(ABOUT_JSX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify no dangling space before comma
    assert "transparent , accurate" not in content, "About.jsx should not have space before comma"
    assert "transparent, accurate" in content, "About.jsx should have properly formatted comma"


def test_about_page_sections():
    """Verify About component contains all essential sections and CTA link."""
    with open(ABOUT_JSX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    assert "Our Mission" in content
    assert "Our Vision" in content
    assert "What we offer" in content
    assert "Why Choose Stock Analyzer?" in content
    assert 'to="/stocks"' in content
    assert "BackToTopBtn" in content

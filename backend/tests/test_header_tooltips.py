import os
from pathlib import Path


def test_header_icon_tooltips_and_accessibility():
    header_path = Path(__file__).resolve().parent.parent.parent / "src" / "components" / "Header.jsx"
    assert header_path.is_file(), f"File {header_path} should exist"
    content = header_path.read_text(encoding="utf-8")

    # User dashboard account icon
    assert 'aria-label="User account menu"' in content
    assert 'title="User account menu"' in content
    assert 'role="button"' in content
    assert "tabIndex={0}" in content
    assert 'onKeyDown=' in content

    # Mobile menu toggle icon
    assert 'aria-label={isMenuOpen ? "Close menu" : "Open menu"}' in content
    assert 'title={isMenuOpen ? "Close menu" : "Open menu"}' in content


def test_theme_toggle_tooltips():
    toggle_path = Path(__file__).resolve().parent.parent.parent / "src" / "components" / "ThemeToggle.jsx"
    assert toggle_path.is_file(), f"File {toggle_path} should exist"
    content = toggle_path.read_text(encoding="utf-8")

    # Unmounted fallback button has title
    assert 'title="Toggle theme"' in content
    assert 'aria-label="Toggle theme"' in content

    # Mounted button has dynamic title and aria-label
    assert 'title={`Switch to ${isDark ? \'light\' : \'dark\'} mode`}' in content
    assert 'aria-label={`Switch to ${isDark ? \'light\' : \'dark\'} mode`}' in content


def test_header_css_focus_visible():
    css_path = Path(__file__).resolve().parent.parent.parent / "src" / "components" / "Header.css"
    assert css_path.is_file(), f"File {css_path} should exist"
    content = css_path.read_text(encoding="utf-8")

    assert ".user-dashboard:focus-visible" in content
    assert ".menu-icon:focus-visible" in content

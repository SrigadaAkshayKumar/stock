"""Unit tests for Privacy Policy route, component structure, and disclosures (fixes #242)."""

import os
import re
import pytest

FRONTEND_SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src"))


def test_privacy_policy_file_exists():
    """Verify PrivacyPolicy component file and styles exist."""
    jsx_path = os.path.join(FRONTEND_SRC, "components", "PrivacyPolicy.jsx")
    css_path = os.path.join(FRONTEND_SRC, "components", "PrivacyPolicy.module.css")
    assert os.path.isfile(jsx_path), "PrivacyPolicy.jsx must exist"
    assert os.path.isfile(css_path), "PrivacyPolicy.module.css must exist"


def test_privacy_route_registered_in_app():
    """Verify /privacy route is imported and registered in App.js."""
    app_js_path = os.path.join(FRONTEND_SRC, "App.js")
    with open(app_js_path, "r", encoding="utf-8") as f:
        app_content = f.read()

    # Verify component import
    assert re.search(r'import\s+PrivacyPolicy\s+from\s+["\']./components/PrivacyPolicy["\']', app_content), (
        "App.js must import PrivacyPolicy component"
    )

    # Verify route element registration
    assert re.search(r'<Route\s+path=["\']/privacy["\']\s+element=\{<PrivacyPolicy\s*/>\}\s*/>', app_content), (
        "App.js must declare <Route path=\"/privacy\" element={<PrivacyPolicy />} />"
    )


def test_footer_contains_privacy_link():
    """Verify Footer.jsx links to /privacy."""
    footer_path = os.path.join(FRONTEND_SRC, "components", "Footer.jsx")
    with open(footer_path, "r", encoding="utf-8") as f:
        footer_content = f.read()

    assert 'to="/privacy"' in footer_content, "Footer.jsx must contain a Link to /privacy"


def test_privacy_policy_sections_and_disclosures():
    """Verify PrivacyPolicy.jsx contains all required sections from issue #242."""
    jsx_path = os.path.join(FRONTEND_SRC, "components", "PrivacyPolicy.jsx")
    with open(jsx_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Required sections based on issue #242 specifications:
    # 1. Firebase Auth data (email, UID)
    assert "Firebase" in content
    assert "email" in content.lower()
    assert "uid" in content.lower()

    # 2. Watchlist data collection and storage
    assert "watchlist" in content.lower()

    # 3. Third-party services used
    assert "Third-Party Services" in content or "third-parties" in content

    # 4. User rights and contact information
    assert "Rights" in content
    assert "support@stockanalyzer.com" in content
    assert 'to="/contact"' in content

    # 5. BackToTopBtn inclusion for UX consistency
    assert "BackToTopBtn" in content

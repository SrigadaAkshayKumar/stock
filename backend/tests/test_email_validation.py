"""Unit tests for email address validation accepting leading digits (fixes #251)."""

import pytest
from core.validation import ValidationError, clean_email, is_valid_email


@pytest.mark.parametrize(
    "email",
    [
        "1alice@example.com",
        "999trader@domain.com",
        "007agent@mi6.gov.uk",
        "42@galaxy.org",
        "123.456@numbers.co",
        "1a_b-c%d+e@domain.io",
    ],
)
def test_valid_emails_starting_with_digits(email):
    """Verify email addresses starting with digits are accepted."""
    assert is_valid_email(email) is True
    assert clean_email(email) == email.lower()


@pytest.mark.parametrize(
    "email",
    [
        "alice@example.com",
        "john.doe@company.org",
        "trader+tag@analytics.finance",
        "support@stockanalyzer.com",
        "A@EXAMPLE.COM",
    ],
)
def test_valid_standard_emails(email):
    """Verify standard valid email addresses are accepted."""
    assert is_valid_email(email) is True
    assert clean_email(email) == email.lower()


@pytest.mark.parametrize(
    "invalid_email",
    [
        "aliceexample.com",          # missing @
        "@example.com",              # missing local part
        "alice@",                    # missing domain
        "alice@example",             # missing TLD
        "alice@example.c",           # TLD too short (needs at least 2 chars)
        "1alice @example.com",       # space in local part
        "1alice@ example.com",       # space after @
        "1alice@example .com",       # space in domain
        "alice@.com",                # missing domain name
        "",                          # empty string
        "   ",                       # whitespace only
        None,                        # None value
        12345,                       # non-string
    ],
)
def test_invalid_email_rejection(invalid_email):
    """Verify malformed email formats continue to be properly rejected."""
    assert is_valid_email(invalid_email) is False
    with pytest.raises(ValidationError):
        clean_email(invalid_email)

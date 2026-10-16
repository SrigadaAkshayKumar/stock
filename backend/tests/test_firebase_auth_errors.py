"""Unit tests verifying Firebase auth error mapping and domain authorization fixes (fixes #286)."""

import json
import os
import subprocess
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_DIR = os.path.join(REPO_ROOT, "src")
AUTH_ERRORS_PATH = os.path.join(SRC_DIR, "utils", "authErrors.js")
SIGNUP_JS_PATH = os.path.join(SRC_DIR, "components", "Signup.js")
LOGIN_JS_PATH = os.path.join(SRC_DIR, "components", "Login.js")


def test_auth_errors_file_exists():
    """Verify that src/utils/authErrors.js exists."""
    assert os.path.isfile(AUTH_ERRORS_PATH), "src/utils/authErrors.js must exist"


def test_signup_and_login_files_exist():
    """Verify that Signup.js and Login.js exist."""
    assert os.path.isfile(SIGNUP_JS_PATH), "src/components/Signup.js must exist"
    assert os.path.isfile(LOGIN_JS_PATH), "src/components/Login.js must exist"


def test_signup_imports_and_uses_auth_errors():
    """Verify Signup.js imports getAuthErrorMessage and uses it for email and Google signup."""
    with open(SIGNUP_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    assert 'import { getAuthErrorMessage } from "../utils/authErrors"' in content, (
        "Signup.js must import getAuthErrorMessage from ../utils/authErrors"
    )
    assert 'setError(getAuthErrorMessage(err, "sign-up"))' in content, (
        "Signup.js must use getAuthErrorMessage(err, 'sign-up') for error handling"
    )
    # Ensure raw err.code === "auth/popup-closed-by-user" is delegated to helper
    assert 'setError("Sign-up cancelled by user")' not in content, (
        "Signup.js should delegate popup error handling to getAuthErrorMessage"
    )


def test_login_imports_and_uses_auth_errors():
    """Verify Login.js imports getAuthErrorMessage and uses it for email and Google login."""
    with open(LOGIN_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    assert 'import { getAuthErrorMessage } from "../utils/authErrors"' in content, (
        "Login.js must import getAuthErrorMessage from ../utils/authErrors"
    )
    assert 'setError(getAuthErrorMessage(err, "sign-in"))' in content, (
        "Login.js must use getAuthErrorMessage(err, 'sign-in') for error handling"
    )
    # Ensure raw err.code === "auth/popup-closed-by-user" is delegated to helper
    assert 'setError("Sign-in cancelled by user")' not in content, (
        "Login.js should delegate popup error handling to getAuthErrorMessage"
    )


def test_unauthorized_domain_error_mapped_via_node():
    """Execute getAuthErrorMessage in Node.js to verify actual runtime behavior (fixes #286)."""
    node_eval_script = """
    const { getAuthErrorMessage } = require('./src/utils/authErrors.js');
    """
    # Since authErrors.js uses ES modules ('export function'), execute with dynamic import in Node
    node_script = """
    (async () => {
      const { getAuthErrorMessage } = await import('./src/utils/authErrors.js');
      
      const tests = [
        {
          input: { code: 'auth/unauthorized-domain', message: 'Firebase: Error (auth/unauthorized-domain).' },
          context: 'sign-up',
          expected: 'This domain is not authorized for OAuth operations. Please add this domain to the authorized domains list in Firebase Console.'
        },
        {
          input: { message: 'Firebase: Error (auth/unauthorized-domain).' },
          context: 'sign-in',
          expected: 'This domain is not authorized for OAuth operations. Please add this domain to the authorized domains list in Firebase Console.'
        },
        {
          input: { code: 'auth/popup-closed-by-user' },
          context: 'sign-up',
          expected: 'Sign-up cancelled by user'
        },
        {
          input: { code: 'auth/popup-closed-by-user' },
          context: 'sign-in',
          expected: 'Sign-in cancelled by user'
        },
        {
          input: { code: 'auth/popup-blocked' },
          context: 'sign-in',
          expected: 'Popup blocked by browser. Please allow popups and try again.'
        },
        {
          input: { code: 'auth/account-exists-with-different-credential' },
          context: 'sign-up',
          expected: 'An account already exists with this email. Try signing in instead.'
        },
        {
          input: { code: 'auth/operation-not-allowed' },
          context: 'sign-in',
          expected: 'This sign-in provider is disabled in Firebase Console. Please enable it in Authentication settings.'
        },
        {
          input: { code: 'auth/invalid-api-key' },
          context: 'sign-in',
          expected: 'Invalid Firebase API key. Please check your Firebase configuration in environment variables.'
        },
        {
          input: { code: 'auth/email-already-in-use' },
          context: 'sign-up',
          expected: 'An account with this email already exists. Try signing in instead.'
        },
        {
          input: { code: 'auth/weak-password' },
          context: 'sign-up',
          expected: 'Password is too weak. Please use at least 6 characters.'
        },
        {
          input: { code: 'auth/invalid-email' },
          context: 'sign-in',
          expected: 'Please enter a valid email address.'
        },
        {
          input: { code: 'auth/invalid-credential' },
          context: 'sign-in',
          expected: 'Invalid email or password. Please try again.'
        },
        {
          input: { code: 'auth/network-request-failed' },
          context: 'sign-in',
          expected: 'Network error. Please check your internet connection and try again.'
        },
        {
          input: null,
          context: 'sign-in',
          expected: 'An unexpected authentication error occurred. Please try again.'
        }
      ];

      for (const t of tests) {
        const actual = getAuthErrorMessage(t.input, t.context);
        if (actual !== t.expected) {
          console.error(`Mismatch for ${JSON.stringify(t.input)}: expected "${t.expected}", got "${actual}"`);
          process.exit(1);
        }
      }
      console.log('ALL_AUTH_ERROR_TESTS_PASSED');
    })();
    """

    res = subprocess.run(
        ["node", "--input-type=module", "-e", node_script],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0, f"Node eval failed:\nSTDOUT: {res.stdout}\nSTDERR: {res.stderr}"
    assert "ALL_AUTH_ERROR_TESTS_PASSED" in res.stdout

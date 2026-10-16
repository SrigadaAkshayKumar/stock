/**
 * Utility functions for mapping Firebase authentication errors into clear,
 * user-friendly error messages (fixes #286).
 */

/**
 * Returns a human-friendly error message for Firebase Auth errors.
 *
 * @param {Object|string} err - The error object or string thrown by Firebase.
 * @param {"sign-up"|"sign-in"} [context="sign-in"] - The authentication context.
 * @returns {string} User-friendly error message.
 */
export function getAuthErrorMessage(err, context = "sign-in") {
  if (!err) {
    return "An unexpected authentication error occurred. Please try again.";
  }

  const code = (typeof err === "object" && err?.code ? String(err.code) : "").toLowerCase();
  const rawMessage = (typeof err === "object" && err?.message ? String(err.message) : String(err)).toLowerCase();

  // Domain not authorized in Firebase Console (fixes #286)
  if (
    code === "auth/unauthorized-domain" ||
    rawMessage.includes("auth/unauthorized-domain") ||
    rawMessage.includes("unauthorized-domain")
  ) {
    return "This domain is not authorized for OAuth operations. Please add this domain to the authorized domains list in Firebase Console.";
  }

  // Popup lifecycle & browser blocking
  if (
    code === "auth/popup-closed-by-user" ||
    rawMessage.includes("auth/popup-closed-by-user") ||
    rawMessage.includes("popup-closed-by-user")
  ) {
    return context === "sign-up"
      ? "Sign-up cancelled by user"
      : "Sign-in cancelled by user";
  }

  if (
    code === "auth/popup-blocked" ||
    rawMessage.includes("auth/popup-blocked") ||
    rawMessage.includes("popup-blocked")
  ) {
    return "Popup blocked by browser. Please allow popups and try again.";
  }

  // Account exists with different provider
  if (
    code === "auth/account-exists-with-different-credential" ||
    rawMessage.includes("auth/account-exists-with-different-credential") ||
    rawMessage.includes("account-exists-with-different-credential")
  ) {
    return "An account already exists with this email. Try signing in instead.";
  }

  // Operation / provider disabled in Firebase Console
  if (
    code === "auth/operation-not-allowed" ||
    rawMessage.includes("auth/operation-not-allowed") ||
    rawMessage.includes("operation-not-allowed")
  ) {
    return "This sign-in provider is disabled in Firebase Console. Please enable it in Authentication settings.";
  }

  // Invalid or missing API key
  if (
    code === "auth/api-key-not-valid" ||
    code === "auth/invalid-api-key" ||
    rawMessage.includes("api-key-not-valid") ||
    rawMessage.includes("invalid-api-key")
  ) {
    return "Invalid Firebase API key. Please check your Firebase configuration in environment variables.";
  }

  // Email / Password specific errors
  if (
    code === "auth/email-already-in-use" ||
    rawMessage.includes("auth/email-already-in-use") ||
    rawMessage.includes("email-already-in-use")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (
    code === "auth/weak-password" ||
    rawMessage.includes("auth/weak-password") ||
    rawMessage.includes("weak-password")
  ) {
    return "Password is too weak. Please use at least 6 characters.";
  }

  if (
    code === "auth/invalid-email" ||
    rawMessage.includes("auth/invalid-email") ||
    rawMessage.includes("invalid-email")
  ) {
    return "Please enter a valid email address.";
  }

  if (
    code === "auth/user-not-found" ||
    code === "auth/wrong-password" ||
    code === "auth/invalid-credential" ||
    rawMessage.includes("auth/invalid-credential") ||
    rawMessage.includes("auth/user-not-found") ||
    rawMessage.includes("auth/wrong-password")
  ) {
    return "Invalid email or password. Please try again.";
  }

  if (
    code === "auth/network-request-failed" ||
    rawMessage.includes("auth/network-request-failed") ||
    rawMessage.includes("network-request-failed")
  ) {
    return "Network error. Please check your internet connection and try again.";
  }

  // Clean fallback: remove raw Firebase wrapper syntax if present
  if (typeof err === "object" && err?.message) {
    const cleaned = err.message
      .replace(/^Firebase:\s*/i, "")
      .replace(/^Error\s*\((.*?)\)\.?/i, "$1")
      .trim();
    if (cleaned) {
      return cleaned;
    }
  }

  return "An authentication error occurred. Please try again.";
}

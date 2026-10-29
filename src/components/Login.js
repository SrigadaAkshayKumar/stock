import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate, Link } from "react-router-dom";
import { syncLocalToFirebase } from "../utils/watchlistManager";
import { LuChartCandlestick, LuFileText, LuSparkles, LuStar } from "react-icons/lu";
import styles from "./Auth.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Firebase authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Sync local data to Firebase after login
      await syncLocalToFirebase(userCredential.user);

      navigate("/"); // redirect to home page
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Sync local data to Firebase after Google login
      await syncLocalToFirebase(result.user);
      navigate("/"); // redirect to home page
    } catch (err) {
      const errorCode = err.code;

      if (errorCode === "auth/popup-closed-by-user") {
        setError("Sign-in cancelled by user");
      } else if (errorCode === "auth/popup-blocked") {
        setError(
          "Popup blocked by browser. Please allow popups and try again."
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={`card ${styles.shell}`}>
      <aside className={styles.brandPanel}>
        <div className={styles.brandLogo}>
          <LuChartCandlestick />
        </div>
        <h2>Your AI stock research workspace</h2>
        <ul>
          <li>
            <LuStar /> Sync your watchlist across devices
          </li>
          <li>
            <LuSparkles /> AI analysis with sources for every stock
          </li>
          <li>
            <LuFileText /> Downloadable PDF research reports
          </li>
        </ul>
      </aside>
        <section className={styles.formPanel}>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to sync your watchlist.</p>

          <button onClick={handleGoogleLogin} disabled={loading} className={`btn btn-secondary btn-lg ${styles.google}`} type="button">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          <div className={styles.divider}>
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            <label className={styles.field}>
              <span>Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="email" />
            </label>
            <label className={styles.field}>
              <span>Password</span>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} autoComplete="current-password" />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className={styles.switch}>
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;

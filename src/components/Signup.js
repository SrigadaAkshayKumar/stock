import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, realtimeDb as database } from "./firebase";
import { ref, set } from "firebase/database";
import { useNavigate, Link } from "react-router-dom";
import { syncLocalToFirebase } from "../utils/watchlistManager";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./AuthContext";
import { LuChartCandlestick, LuFileText, LuSparkles, LuStar } from "react-icons/lu";
import styles from "./Auth.module.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useAuth(); // अगर AuthContext यूज कर रहे हैं तो
  const navigate = useNavigate();

  // अगर user पहले से logged in है तो redirect कर दें
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firebase Realtime Database में user data सेव करें
      await set(ref(database, `users/${user.uid}`), {
        email: user.email,
        createdAt: new Date().toISOString(),
      });

      // Local watchlist Firebase में sync करें
      await syncLocalToFirebase(user);

      toast.success("Signup successful!");
      navigate("/"); // Signup के बाद home page पर redirect करें
    } catch (err) {
      setError(err.message);
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await set(ref(database, `users/${user.uid}`), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
      });

      await syncLocalToFirebase(user);

      toast.success("Signup successful with Google!");
      navigate("/"); // Google signup के बाद redirect
    } catch (err) {
      const errorCode = err.code;

      if (errorCode === "auth/popup-closed-by-user") {
        setError("Sign-up cancelled by user");
      } else if (errorCode === "auth/popup-blocked") {
        setError("Popup blocked by browser. Please allow popups and try again.");
      } else if (errorCode === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email. Try signing in instead.");
      } else {
        setError(err.message);
      }
      console.error("Google Signup error:", err);
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
        <h2>Start your AI stock research workspace</h2>
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
          <h1>Create your account</h1>
          <p className="muted">Free, and takes less than a minute.</p>

          <button onClick={handleGoogleSignup} disabled={loading} className={`btn btn-secondary btn-lg ${styles.google}`} type="button">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            {loading ? "Signing up…" : "Sign up with Google"}
          </button>

          <div className={styles.divider}>
            <span>or sign up with email</span>
          </div>

          <form onSubmit={handleSignup} className={styles.form}>
            <label className={styles.field}>
              <span>Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="email" />
            </label>
            <label className={styles.field}>
              <span>Password</span>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onPaste={(e) => e.preventDefault()} required disabled={loading} minLength={6} autoComplete="new-password" />
            </label>
            <label className={styles.field}>
              <span>Confirm password</span>
              <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onPaste={(e) => e.preventDefault()} required disabled={loading} minLength={6} autoComplete="new-password" />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className={styles.switch}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Signup;

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
import "./Signup.css";

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
    <div className="login-page">
      <div className="login-container">
        <h2>Sign Up</h2>

        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="google-login-btn"
          type="button"
        >
          {loading ? "Signing up..." : "Sign up with Google"}
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSignup} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            required
            disabled={loading}
            minLength={6}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            required
            disabled={loading}
            minLength={6}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

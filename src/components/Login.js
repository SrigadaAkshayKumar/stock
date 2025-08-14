import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../components/firebase";
import { useNavigate, Link } from "react-router-dom";
import { syncLocalToFirebase } from "../utils/watchlistManager";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/", { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!auth) {
      setError("Auth not initialized");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Try sync, but do not block navigation on failure
      try {
        await syncLocalToFirebase();
      } catch (syncErr) {
        console.warn("Watchlist sync failed:", syncErr);
      }

      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      const msg =
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/user-not-found"
          ? "Invalid email or password"
          : err.message || "Login failed";
      setError(msg);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit">Login</button>
      </form>
      <p>
        Don’t have an account? <Link to="/signup">Signup</Link>
      </p>
    </div>
  );
};

export default Login;

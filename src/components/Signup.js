import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, database } from "./firebase";
import { ref, set } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css"; 
console.log("Login component rendered");
const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    alert("Signup successful!");
    navigate("/login");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Signup</h2>
        <form onSubmit={handleSignup} className="login-form">
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
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit">Signup</button>
        </form>
        import { Link } from "react-router-dom";

<p>
  Already have an account? <Link to="/login">Login</Link>
</p>

      </div>
    </div>
  );
};

export default Signup;

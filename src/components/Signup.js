import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, database } from "./firebase";
import { ref, set } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await set(ref(database, "Users/" + user.uid), {
        email: user.email,
        points: 0,
      });

      alert("Signup successful! Welcome");
      navigate("/");
    } catch (err) {
      setError("Signup failed: " + err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Signup</h2>
      <form onSubmit={handleSignup} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit">Signup</button>
      </form>
      <p>
        Already have an account?
        <Link to="/login" className="nav-link1">
          Login
        </Link>
      </p>
    </div>
  );
};

export default Signup;

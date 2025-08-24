import React, { useState } from "react";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../components/firebase";
import { useNavigate, Link } from "react-router-dom";
import { syncLocalToFirebase } from "../utils/watchlistManager";
import "./Login.css";

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
        <div className="login-page">
            <div className="login-container">
                <h2>Login</h2>

                {/* Google Sign-In Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="google-login-btn"
                    type="button"
                >
                    {loading ? "Signing in..." : "Sign in with Google"}
                </button>

                <div className="divider">
                    <span>or</span>
                </div>

                <form onSubmit={handleLogin} className="login-form">
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
                        required
                        disabled={loading}
                    />
                    {error && <p className="login-error">{error}</p>}
                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p>
                    Don't have an account? <Link to="/signup">Signup</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;

import React, { useContext } from "react";
import { AuthContext } from "./AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { Link } from "react-router-dom";

const Header = () => {
  const { currentUser } = useContext(AuthContext);

  const handleLogout = () => {
    signOut(auth);
  };

  // Extract name from email
  const getUsername = (email) => {
    return email?.split("@")[0];
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">Stock Analyzer</h1>
        <nav className="header-nav">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/" className="nav-link">
            About
          </Link>
          <Link to="/" className="nav-link">
            Contact
          </Link>

          {currentUser ? (
            <>
              <span className="nav-link">{getUsername(currentUser.email)}</span>
              <button onClick={handleLogout} className="nav-link">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

// src/components/Header.jsx
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { FaChartLine, FaBars, FaTimes } from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import { SlSpeech } from "react-icons/sl";
import { MdContactSupport } from "react-icons/md";
import { CiBoxList, CiLogin, CiLogout } from "react-icons/ci";
import ThemeToggle from "./ThemeToggle";
import "./Header.css";

const Header = () => {
  const { user: currentUser } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut(auth);
    setIsMenuOpen(false);
  };

  // Function to close the menu when a link is clicked
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const getUsername = (email) => {
    if (!email) return "User";
    return email.split("@")[0];
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo" onClick={closeMenu}>
          <FaChartLine className="logo-icon" />
          <span className="logo-text">Stock Analyzer</span>
        </Link>

        <div className="menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <nav className={`nav-links ${isMenuOpen ? "nav-open" : ""}`}>
          <div className="nav-section">
            <NavLink to="/" className="nav-link" onClick={closeMenu} end>
              <div className="nav-icon">
                
                <span>Home</span>
              </div>
            </NavLink>

            <NavLink to="/about" className="nav-link" onClick={closeMenu}>
              <div className="nav-icon">
                
                <span>About</span>
              </div>
            </NavLink>

            <NavLink to="/contact" className="nav-link" onClick={closeMenu}>
              <div className="nav-icon">
                
                <span>Contact</span>
              </div>
            </NavLink>

            <NavLink to="/watchlist" className="nav-link" onClick={closeMenu}>
              <div className="nav-icon">
                
                <span>Watchlist</span>
              </div>
            </NavLink>
          </div>

          <div className="nav-actions">
            <div className="theme-toggle-container">
              <ThemeToggle />
            </div>
            
            {currentUser ? (
              <div className="user-section">
                <span className="welcome-message">
                  Hi, {getUsername(currentUser.email)}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="logout-button"
                  aria-label="Logout"
                >
                  
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <NavLink 
                to="/login" 
                className="login-button"
                onClick={closeMenu}
              >
                
                <span>Login</span>
              </NavLink>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;

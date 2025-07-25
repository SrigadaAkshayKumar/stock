// src/components/Header.js
import React, { useContext, useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom"; // Use NavLink for active styles
import { AuthContext } from "./AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "./firebase"; // Ensure this path is correct
import { FaChartLine, FaBars, FaTimes } from "react-icons/fa";

const Header = () => {
  const { currentUser } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    signOut(auth);
    setIsMenuOpen(false); // Close menu on logout
  };

  // Function to close the menu when a link is clicked
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const getUsername = (email) => {
    if (!email) return "User";
    return email.split("@")[0];
  };

  const authContent = currentUser ? (
    <>
      <span className="nav-link-welcome">
        Hi, {getUsername(currentUser.email)}
      </span>
      <button onClick={handleLogout} className="nav-link-button">
        Logout
      </button>
    </>
  ) : (
    <NavLink to="/login" className="nav-link" onClick={closeMenu}>
      Login
    </NavLink>
  );

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo" onClick={closeMenu}>
          <FaChartLine className="logo-icon" />
          <span className="logo-text">Stock Analyzer</span>
        </Link>

        <nav className={`nav-links ${isMenuOpen ? "nav-open" : ""}`}>
          <NavLink to="/" className="nav-link" onClick={closeMenu}>
            Home
          </NavLink>

          {/* === ADDED LINKS START HERE === */}
          <NavLink to="/about" className="nav-link" onClick={closeMenu}>
            About
          </NavLink>
          <NavLink to="/contact" className="nav-link" onClick={closeMenu}>
            Contact
          </NavLink>
          {/* === ADDED LINKS END HERE === */}

          {!isMobile && authContent}
        </nav>

        {isMobile && (
          <div className="header-right">
            {authContent}
            <div className="menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
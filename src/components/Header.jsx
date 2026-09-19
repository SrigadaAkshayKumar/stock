import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import {
  LuChartLine,
  LuLayoutDashboard,
  LuInfo,
  LuMail,
  LuClipboardList,
  LuLogIn,
  LuLogOut,
  LuMenu,
  LuX,
} from "react-icons/lu";
import { FaRegUserCircle, FaUserAlt } from "react-icons/fa";
import "./Header.css";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const { user: currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dashBoardOpen, setDashBoardOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDashBoardOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    signOut(auth);
    setIsMenuOpen(false);
    setDashBoardOpen(false); // close dropdown on logout
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const getUsername = (email) => email?.split("@")[0] || "User";

  return (
    <header className={`header ${isMenuOpen ? "header-open" : ""}`}>
      <div className="header-content">
        {/* Logo */}
        <Link to="/" className="logo" onClick={closeMenu}>
          <LuChartLine className="logo-icon" />
          <span className="logo-text">Stock Analyzer</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <div className="nav-section">
            <NavLink to="/" className="nav-link" onClick={closeMenu} end>
              <div className="nav-icon"><LuLayoutDashboard /><span>Home</span></div>
            </NavLink>
            <NavLink to="/about" className="nav-link" onClick={closeMenu}>
              <div className="nav-icon"><LuInfo /><span>About</span></div>
            </NavLink>
            <NavLink to="/contact" className="nav-link" onClick={closeMenu}>
              <div className="nav-icon"><LuMail /><span>Contact</span></div>
            </NavLink>
            <NavLink to="/watchlist" className="nav-link" onClick={closeMenu}>
              <div className="nav-icon"><LuClipboardList /><span>Watchlist</span></div>
            </NavLink>
          </div>

          {/* User Dashboard */}
          <div className="nav-actions" ref={dropdownRef}>
            <ThemeToggle className="toggle-theme" />
            <div className="user-dashboard">
              <FaRegUserCircle onClick={() => setDashBoardOpen(prev => !prev)} />
            </div>
            <div className={`user-section ${dashBoardOpen ? "show" : ""}`}>
              {currentUser ? (
                <>
                  <span className="welcome-message">{getUsername(currentUser.email).toUpperCase()}</span>
                  <NavLink
                    to="/profile"
                    className="user-profile"
                    onClick={() => setDashBoardOpen(false)}
                  >
                    <FaUserAlt /><span>Profile</span>
                  </NavLink>
                  <NavLink
                    onClick={handleLogout}
                    className="logout-button"
                  >
                    <LuLogOut className="logout-icon" /><span>Logout</span>
                  </NavLink>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="login-button"
                  onClick={() => { closeMenu(); setDashBoardOpen(false); }}
                >
                  <LuLogIn className="login-icon" /><span>Login</span>
                </NavLink>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="mobile-nav">
          <ThemeToggle />
          <div className="menu-icon" onClick={toggleMenu}>
            {isMenuOpen ? <LuX /> : <LuMenu />}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <nav className={`mobile-menu ${isMenuOpen ? "mobile-menu-open" : ""}`}>
          {currentUser && (
            <h1 className="nav-link-email">{getUsername(currentUser?.email).toUpperCase()}</h1>
          )}

          <NavLink to="/" className="nav-link" onClick={closeMenu} end>
            <div className="nav-icon"><LuLayoutDashboard /><span>Home</span></div>
          </NavLink>
          <NavLink to="/about" className="nav-link" onClick={closeMenu}>
            <div className="nav-icon"><LuInfo /><span>About</span></div>
          </NavLink>
          <NavLink to="/contact" className="nav-link" onClick={closeMenu}>
            <div className="nav-icon"><LuMail /><span>Contact</span></div>
          </NavLink>
          <NavLink to="/watchlist" className="nav-link" onClick={closeMenu}>
            <div className="nav-icon"><LuClipboardList /><span>Watchlist</span></div>
          </NavLink>

          {currentUser ? (
            <>
              <NavLink
                to="/profile"
                className="nav-link"
                onClick={() => { closeMenu(); setDashBoardOpen(false); }}
              >
                <div className="nav-icon"><FaUserAlt /><span>Profile</span></div>
              </NavLink>
              <NavLink
                onClick={() => { handleLogout(); closeMenu(); setDashBoardOpen(false); }}
                className="logout-button"
              >
                <div className="nav-icon"><LuLogOut /><span>Logout</span></div>
              </NavLink>
            </>
          ) : (
            <NavLink
              to="/login"
              className="logout-button"
              onClick={() => { closeMenu(); setDashBoardOpen(false); }}
            >
              <div className="nav-icon"><LuLogIn /><span>Login</span></div>
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

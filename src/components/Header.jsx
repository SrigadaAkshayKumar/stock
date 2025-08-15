import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../components/firebase";
import { FaChartLine, FaBars, FaTimes } from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import { SlSpeech } from "react-icons/sl";
import { MdContactSupport } from "react-icons/md";
import { CiBoxList, CiLogin, CiLogout } from "react-icons/ci";
import "./Header.css";

const Header = () => {
  const { user: currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShrink, setIsShrink] = useState(false);

  const handleLogout = () => {
    signOut(auth);
    setIsMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const getUsername = (email) => {
    if (!email) return "User";
    return email.split("@")[0];
  };

  // Scroll listener for shrink effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsShrink(true);
      } else {
        setIsShrink(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`header ${isShrink ? "shrink" : ""}`}>
      <div className="header-content">
        <Link to="/" className="logo" onClick={closeMenu}>
          <FaChartLine className="logo-icon" />
          <span className="logo-text">Stock Analyzer</span>
        </Link>

        <div className="menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <nav className={`nav-links ${isMenuOpen ? "nav-open" : ""}`}>
          <NavLink to="/" className="nav-link" onClick={closeMenu}>
            <div className="icons">
              <IoHome />
              <p>Home</p>
            </div>
          </NavLink>

          <NavLink to="/about" className="nav-link" onClick={closeMenu}>
            <div className="icons">
              <SlSpeech />
              <p>About</p>
            </div>
          </NavLink>

          <NavLink to="/contact" className="nav-link" onClick={closeMenu}>
            <div className="icons">
              <MdContactSupport />
              <p>Contact</p>
            </div>
          </NavLink>

          <NavLink to="/watchlist" className="nav-link" onClick={closeMenu}>
            <div className="icons">
              <CiBoxList />
              <p>My Watchlist</p>
            </div>
          </NavLink>

          {currentUser ? (
            <>
              <span className="nav-link-welcome">
                Hi, {getUsername(currentUser.email)}
              </span>
              <div className="icons">
                <button onClick={handleLogout} className="nav-link-button">
                  <CiLogout />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <NavLink to="/login" className="nav-link" onClick={closeMenu}>
              <div className="icons">
                <CiLogin />
                <p>Login</p>
              </div>
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

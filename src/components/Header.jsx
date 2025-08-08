// src/components/Header.js
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom"; 
import { useAuth } from "./AuthContext"; 
import { signOut } from "firebase/auth";
import { auth } from "../components/firebase";
import { FaChartLine, FaBars, FaTimes } from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import { SlSpeech } from "react-icons/sl";
import { MdContactSupport } from "react-icons/md";
import { CiBoxList } from "react-icons/ci";
import { CiLogin } from "react-icons/ci";
import { CiLogout } from "react-icons/ci";


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
          <NavLink to="/" className="nav-link" onClick={closeMenu}>
            <div><IoHome /><p>Home</p></div>
          </NavLink>

          {/* === ADDED LINKS START HERE === */}
         <NavLink to="/about" className="nav-link" onClick={closeMenu}>
<div><SlSpeech /> <p>About</p></div> 
</NavLink>
<NavLink to="/contact" className="nav-link" onClick={closeMenu}>
<div><MdContactSupport /><p>Contact</p></div>
</NavLink>
<NavLink to="/watchlist" className="nav-link" onClick={closeMenu}>
  <div><CiBoxList /><p>My Watchlist</p></div>
</NavLink>

          {/* === ADDED LINKS END HERE === */}

          {currentUser ? (
            <>
              <span className="nav-link-welcome">
                Hi, {getUsername(currentUser.email)}
              </span>
              <button onClick={handleLogout} className="nav-link-button">
                <CiLogout />Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="nav-link" onClick={closeMenu}>
              <div><CiLogin /><p>Login</p></div>
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
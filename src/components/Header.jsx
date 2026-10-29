import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { LuChartCandlestick, LuLogIn, LuLogOut, LuMenu, LuX, LuUser } from "react-icons/lu";
import { useAuth } from "./AuthContext";
import { auth } from "./firebase";
import ThemeToggle from "./ThemeToggle";
import styles from "./Header.module.css";

const NAV = [
  { to: "/", label: "Markets", end: true },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const navClass = ({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`;

const Header = () => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const location = useLocation();

  // Close menus when navigating.
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const username = user?.displayName || user?.email?.split("@")[0] || "Account";

  const logout = () => {
    signOut(auth);
    setAccountOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="Stock Analyzer home">
          <span className={styles.logo}>
            <LuChartCandlestick />
          </span>
          <span className={styles.brandText}>
            Stock<span>Analyzer</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          {user ? (
            <div className={styles.account} ref={accountRef}>
              <button
                className={styles.avatar}
                onClick={() => setAccountOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                title={username}
              >
                {username.charAt(0).toUpperCase()}
              </button>
              {accountOpen && (
                <div className={styles.dropdown} role="menu">
                  <div className={styles.dropdownHeader}>
                    <strong>{username}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link to="/watchlist" className={styles.dropdownItem} role="menuitem">
                    <LuUser /> My watchlist
                  </Link>
                  <button className={styles.dropdownItem} onClick={logout} role="menuitem">
                    <LuLogOut /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={`btn btn-primary btn-sm ${styles.signIn}`}>
              <LuLogIn /> Sign in
            </Link>
          )}
          <button
            className={styles.menuButton}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <LuX /> : <LuMenu />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className={styles.mobileNav} aria-label="Mobile">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
              {n.label}
            </NavLink>
          ))}
          {user ? (
            <button className={styles.link} onClick={logout}>
              Sign out
            </button>
          ) : (
            <NavLink to="/login" className={navClass}>
              Sign in
            </NavLink>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { LuMoon, LuSun } from 'react-icons/lu';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = theme === 'dark';

  // Only render on client-side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    console.log('Theme toggle clicked. Current theme:', theme);
    toggleTheme();
  };

  if (!mounted) {
    return (
      <button className={`theme-toggle ${className}`} aria-label="Toggle theme">
        <div className="theme-toggle-track">
          <div className="theme-toggle-thumb" />
        </div>
      </button>
    );
  }

  return (
    <button 
      className={`theme-toggle ${className} ${isDark ? 'dark' : 'light'}`}
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="sr-only">
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
      {isDark ? (
        <LuSun className="theme-icon sun-icon" />
      ) : (
        <LuMoon className="theme-icon moon-icon" />
      )}
    </button>
  );
};

export default ThemeToggle;

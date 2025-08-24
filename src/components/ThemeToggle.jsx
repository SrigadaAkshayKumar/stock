import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { LuMoon, LuSun } from 'react-icons/lu';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = theme === 'dark';

  // Only render on client-side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="theme-toggle" aria-label="Toggle theme">
        <div className="theme-toggle-track">
          <div className="theme-toggle-thumb" />
        </div>
      </button>
    );
  }

  return (
    <button 
  className="theme-toggle" 
  onClick={toggleTheme}
  aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
>
  <span className="sr-only">
    {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  </span>
  {isDark ? (
    <LuSun className="theme-icon" />
  ) : (
    <LuMoon className="theme-icon" />
  )}
</button>
  );
};

export default ThemeToggle;

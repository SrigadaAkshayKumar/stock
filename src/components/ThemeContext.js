import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
      setTheme(initialTheme);
      
      // Apply theme immediately
      applyTheme(initialTheme);
      setIsInitialized(true);
      
    } catch (error) {
      console.warn('Could not initialize theme:', error);
      setTheme('light');
      applyTheme('light');
      setIsInitialized(true);
    }
  }, []);

  // Apply theme class and save preference
  useEffect(() => {
    if (!isInitialized) return;
    
    applyTheme(theme);
    
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  }, [theme, isInitialized]);

  const applyTheme = (themeName) => {
    try {
      const root = document.documentElement;
      const body = document.body;
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
      body.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
      
      // Add new theme classes
      root.classList.add(themeName, `theme-${themeName}`);
      body.classList.add(themeName, `theme-${themeName}`);
      
      // Set data-theme attribute for CSS selectors
      root.setAttribute('data-theme', themeName);
      body.setAttribute('data-theme', themeName);
      
      // Force re-computation of CSS variables
      root.style.setProperty('--current-theme', themeName);
      
    } catch (error) {
      console.warn('Could not apply theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

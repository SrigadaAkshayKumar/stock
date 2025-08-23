// App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import "./styles/global.css";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import StocksList from "./components/StockList";
import Stockdata from "./components/Stockdata";
import AboutComponent from "./components/About";
import ContactForm from "./components/ContactForm";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Watchlist from "./components/Watchlist";
import { AuthProvider } from "./components/AuthContext";

// Theme
import { ThemeProvider, useTheme } from "./components/ThemeContext";

// ✅ Backend API URL constant
export const API_URL = "http://127.0.0.1:10000";

// Global styles for smooth transitions
const GlobalStyles = () => {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.remove("no-js");
    document.documentElement.classList.add("js");

    document.body.className = `theme-${theme}`;

    const timer = setTimeout(() => {
      document.documentElement.classList.add("theme-transition-ready");
    }, 100);

    return () => clearTimeout(timer);
  }, [theme]);

  return null;
};

const App = () => {
  return (
    <ThemeProvider>
      <GlobalStyles />
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Header />
            <div className="content">
              <Routes>
                <Route path="/" element={<StocksList />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/stock/:ticker" element={<Stockdata />} />
                <Route path="/about" element={<AboutComponent />} />
                <Route path="/stocks" element={<StocksList />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/contact" element={<ContactForm />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

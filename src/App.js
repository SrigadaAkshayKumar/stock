// App.js
import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/global.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import StocksList from "./components/StockList";
import AboutComponent from "./components/About";
import ContactForm from "./components/ContactForm";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Watchlist from "./components/Watchlist";
import { AuthProvider } from "./components/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Theme
import { ThemeProvider, useTheme } from "./components/ThemeContext";
import { warmBackend } from "./services/snapshot";

// The stock page carries the charting library; load it separately so the home page opens fast.
const Stockdata = lazy(() => import("./components/Stockdata"));

// Global styles for smooth transitions
const GlobalStyles = () => {
  const { theme } = useTheme();
  
  useEffect(() => {
    // Remove the no-js class if JavaScript is enabled
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('js');
    
    // Set theme class on body for easier targeting
    document.body.className = `theme-${theme}`;
    
    // Add transition class after initial render
    const timer = setTimeout(() => {
      document.documentElement.classList.add('theme-transition-ready');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [theme]);
  
  return null;
};

const App = () => {
  useEffect(() => {
    warmBackend();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GlobalStyles />
        <AuthProvider>
          <Router>
            <div className="app-container">
              <Header />
              <div className="content">
                <Routes>
                  <Route
                    path="/"
                    element={<StocksList />}
                  />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route
                    path="/stock/:ticker"
                    element={
                      <Suspense
                        fallback={
                          <div className="loading-spinner">
                            <div className="spinner" />
                          </div>
                        }
                      >
                        <Stockdata />
                      </Suspense>
                    }
                  />
                  <Route path="/about" element={<AboutComponent />} />
                  <Route path="/stocks" element={<StocksList />} />
                  <Route path="/watchlist" element={<Watchlist />} />
                  <Route path="/contact" element={<ContactForm />} />
                </Routes>
              </div>
              <Footer />
              <ToastContainer position="bottom-right" autoClose={2500} hideProgressBar theme="colored" />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

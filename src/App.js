// App.js
import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import StocksList from "./components/StockList";
import Stockdata from "./components/Stockdata";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Signup from "./components/Signup";
import AboutComponent from "./components/About";
import { AuthProvider } from "./components/AuthContext";
import Watchlist from "./pages/Watchlist";
import ContactForm from "./components/ContactForm";

const App = () => {
  return (
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
        </div>
      </Router>
    </AuthProvider>
  );
};


export default App;

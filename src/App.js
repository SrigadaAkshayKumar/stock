import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import StocksList from "./components/StockList";
import Stockdata from "./components/Stockdata";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import About from "./components/About";
import Signup from "./components/Signup";
import { AuthProvider } from "./components/AuthContext"; // import AuthProvider

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
              <Route path="/about" element={<About />} />
              <Route path="/stock/:ticker" element={<Stockdata />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;

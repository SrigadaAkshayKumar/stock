import { Route, HashRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./components/AuthContext";
import ContactForm from "./components/ContactForm";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Login from "./components/Login";
import Signup from "./components/Signup";
import StocksList from "./components/StockList";
import Stockdata from "./components/Stockdata";
import Watchlist from "./pages/Watchlist";
import { NotificationProvider } from "./utils/notifications";

const App = () => {
  return (
    <NotificationProvider>
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
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/contact" element={<ContactForm />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;

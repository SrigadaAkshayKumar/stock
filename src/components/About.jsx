import React from "react";
import { FaChartLine, FaClock, FaRobot } from "react-icons/fa";
import { MdOutlineDesignServices } from "react-icons/md";
import { FiRefreshCcw } from "react-icons/fi";
import { Link } from "react-router-dom";
import "../App.css";
import BackToTopBtn from "./BackToTopBtn";

const AboutComponent = () => {
  const iconColor = "var(--color-primary)";
  const headingStyle = { color: "var(--color-primary)" };
  
  return (
    <div className="about-container">
      <div id="About">
        <h1>About Us</h1>
        <h3>Welcome to our AI Stock Analyzer</h3>
        <p>Your personal companion for real-time stock insights.</p>
        <p>
          Our app offers real-time stock data, user-friendly interfaces, and
          secure authentication to ensure a seamless trading experience.
        </p>
        <p>
          Whether you are a beginner or an experienced trader, our platform is
          designed to help you make informed decisions and manage your
          investments effectively.
        </p>
        
        {/* mission & vision  */}
         <div className="mission-vision">
          <div className="mission">
            <h2 style={headingStyle}>Our Mission</h2>
            <p>
              To deliver reliable and data-driven stock analysis through innovative tools and insights, we are committed to empowering investors, learners and financial professionals with transparent , accurate and user-friendly solutions that support smarter investment decisions.
            </p>
          </div>
          <div className="vision">
            <h2 style={headingStyle}>Our Vision</h2>
            <p>
              To be recognized as a leading global platform for stock market analysis - where innovation, trust, and accessibility come together to help evry individual and organization achieve long-term financial success.
            </p>
          </div>
        </div>
         
         {/* what we offer  */}
        <div>
          <h2 style={headingStyle}>What we offer</h2>
          <div className="grid-container">
          <div className="grid-item">
            <FaChartLine size={40} color={iconColor} />
            <h2 style={headingStyle}>Real-Time Data</h2>
            <p>
              Access live stock prices and market trends to stay ahead in your
              trading journey.
            </p>
          </div>
          <div className="grid-item">
            <MdOutlineDesignServices size={40} color={iconColor} />
            <h2 style={headingStyle}>User-Friendly Interface</h2>
            <p>
              Navigate through our intuitive design that makes trading easy and
              efficient.
            </p>
          </div>
          <div className="grid-item">
            <FaRobot size={40} color={iconColor} />
            <h2 style={headingStyle}>AI-Powered Predictions</h2>
            <p>Accurate forecasts using Machine Learning and AI models.</p>
          </div>
          <div className="grid-item">
            <FaChartLine size={40} color={iconColor} />
            <h2 style={headingStyle}>Market Trend Analysis</h2>
            <p>Clear visuals to show current and future trends.</p>
          </div>
          <div className="grid-item">
            <FiRefreshCcw size={40} color={iconColor} />
            <h2 style={headingStyle}>Continuous Updates</h2>
            <p>
              We are constantly improving our app to provide you with the best
              trading experience.
            </p>
          </div>
          <div className="grid-item">
            <FaClock size={40} color={iconColor} />
            <h2 style={headingStyle}>24/7 Data Monitoring</h2>
            <p>Constant tracking for updated insights.</p>
          </div>
        </div>
        </div>
        
        {/* why choose stock analyzer  */}
        <div className="about-section why-choose">
          <h2 style={headingStyle}>Why Choose Stock Analyzer?</h2>
          <ul>
            <li>✅ Trusted by over 500,000 users worldwide</li>
            <li>✅ Backed by a team of expert analysts and engineers</li>
            <li>✅ Secure, fast, and reliable platform</li>
            <li>✅ Continuous innovation and feature updates</li>
          </ul>
        </div>

        <div className="button-container">
          <Link to="/stocks">
            <button className="cta-button">Get Started Now</button>
          </Link>
        </div>
      </div>
      <BackToTopBtn />
    </div>
  );
};

export default AboutComponent;

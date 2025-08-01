import React from 'react';
import '../App.css';

const About = () => {
  return (
    <div className="about-container" style={{ animation: 'fadeIn 1s ease-in-out' }}>
      <div className="about-header">
        <h1>About AI Stock Analyzer</h1>
      </div>
      
      <div className="about-content">
        <section className="about-section">
          <h2>Project Overview</h2>
          <p>
            AI Stock Analyzer is a sophisticated stock market analysis tool that combines 
            the power of machine learning with intuitive user interface design. Our platform 
            enables users to make data-driven investment decisions through advanced stock 
            trend analysis and predictive modeling.
          </p>
        </section>

        <section className="about-section">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Stock Symbol Analysis</h3>
              <p>Enter any stock symbol and get detailed historical data and trends</p>
            </div>
            <div className="feature-card">
              <h3>Interactive Charts</h3>
              <p>Visualize stock performance with dynamic, interactive Plotly.js charts</p>
            </div>
            <div className="feature-card">
              <h3>ML Predictions</h3>
              <p>Access future stock price predictions powered by machine learning models</p>
            </div>
            <div className="feature-card">
              <h3>Date Range Selection</h3>
              <p>Analyze stock performance across custom time periods</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Technology Stack</h2>
          <div className="tech-stack">
            <div className="tech-category">
              <h3>Frontend</h3>
              <ul>
                <li>React.js</li>
                <li>Plotly.js</li>
                <li>Axios</li>
                <li>CSS3</li>
              </ul>
            </div>
            <div className="tech-category">
              <h3>Backend</h3>
              <ul>
                <li>Flask</li>
                <li>yfinance</li>
                <li>Pandas</li>
                <li>Scikit-learn</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>How It Works</h2>
          <div className="workflow">
            <div className="workflow-step">
              <span className="step-number">1</span>
              <p>Enter a stock symbol and select your desired date range</p>
            </div>
            <div className="workflow-step">
              <span className="step-number">2</span>
              <p>View historical stock data through interactive visualizations</p>
            </div>
            <div className="workflow-step">
              <span className="step-number">3</span>
              <p>Access ML-powered predictions for future stock performance</p>
            </div>
            <div className="workflow-step">
              <span className="step-number">4</span>
              <p>Make informed investment decisions based on comprehensive analysis</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
import React from 'react';
import { motion } from 'framer-motion';

const SentimentChart = ({ sentimentSummary }) => {
  // Provide default values to prevent undefined errors
  const defaultSummary = {
    total_articles: 0,
    sentiment_distribution: { positive: 0, negative: 0, neutral: 0 },
    sentiment_percentages: { positive: 0, negative: 0, neutral: 0 },
    overall_sentiment: 'neutral',
    sentiment_index: 0
  };

  // Use default values if sentimentSummary is undefined or null
  const safeSummary = sentimentSummary || defaultSummary;
  
  if (!safeSummary || safeSummary.total_articles === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="sentiment-container"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          margin: '16px 0'
        }}
      >
        <div className="sentiment-header">
          <h3 style={{ color: '#1e293b', fontSize: '1.1rem', fontWeight: '600', margin: '0 0 8px 0' }}>
            📊 News Sentiment Analysis
          </h3>
         
        </div>
      </motion.div>
    );
  }

  const { 
    sentiment_distribution = { positive: 0, negative: 0, neutral: 0 }, 
    sentiment_percentages = { positive: 0, negative: 0, neutral: 0 }, 
    overall_sentiment = 'neutral', 
    sentiment_index = 0 
  } = safeSummary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sentiment-container"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        margin: '12px 0'
      }}
    >
      <div className="sentiment-header" style={{ marginBottom: '16px', textAlign: 'center' }}>
        <h3 style={{ color: '#1e293b', fontSize: '1rem', fontWeight: '600', margin: '0 0 6px 0' }}>
          📊 News Sentiment Analysis
        </h3>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '12px' }}>
          Analysis of top news articles
        </p>
      </div>

      <div className="sentiment-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Left Column - Overall Sentiment */}
        <div style={{ 
          background: 'white', 
          borderRadius: '6px', 
          padding: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>
            Overall Sentiment
          </h4>
          <div style={{ 
            border: `2px solid ${
              overall_sentiment === 'positive' ? '#10B981' : 
              overall_sentiment === 'negative' ? '#EF4444' : '#6B7280'
            }`,
            borderRadius: '6px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: '600',
                color: 'white',
                background: overall_sentiment === 'positive' ? '#10B981' : 
                           overall_sentiment === 'negative' ? '#EF4444' : '#6B7280'
              }}>
                {overall_sentiment.charAt(0).toUpperCase() + overall_sentiment.slice(1)}
              </span>
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: overall_sentiment === 'positive' ? '#10B981' : 
                     overall_sentiment === 'negative' ? '#EF4444' : '#6B7280',
              marginBottom: '6px'
            }}>
              {sentiment_index.toFixed(3)}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              Sentiment Index Score
            </div>
          </div>
        </div>

        {/* Right Column - Sentiment Breakdown */}
        <div style={{ 
          background: 'white', 
          borderRadius: '6px', 
          padding: '12px', 
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '12px', fontWeight: '600' }}>
            📈 Sentiment Breakdown
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Positive */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '500' }}>Positive</span>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#10B981' }}>
                {sentiment_percentages.positive}%
              </span>
            </div>
            <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${sentiment_percentages.positive}%`, 
                  background: '#10B981',
                  borderRadius: '2px',
                  transition: 'width 0.6s ease'
                }} 
              />
            </div>

            {/* Negative */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: '500' }}>Negative</span>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#EF4444' }}>
                {sentiment_percentages.negative}%
              </span>
            </div>
            <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${sentiment_percentages.negative}%`, 
                  background: '#EF4444',
                  borderRadius: '2px',
                  transition: 'width 0.6s ease'
                }} 
              />
            </div>

            {/* Neutral */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500' }}>Neutral</span>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280' }}>
                {sentiment_percentages.neutral}%
              </span>
            </div>
            <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${sentiment_percentages.neutral}%`, 
                  background: '#6B7280',
                  borderRadius: '2px',
                  transition: 'width 0.6s ease'
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Design */}
      <style jsx>{`
        @media (max-width: 768px) {
          .sentiment-content {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          .sentiment-container {
            padding: 16px !important;
            margin: 12px 0 !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default SentimentChart;

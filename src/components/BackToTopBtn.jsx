import React, { useState, useEffect } from 'react';
import { FaAnglesUp } from "react-icons/fa6";

// Simple throttle utility
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

const BackToTopBtn = ({ 
  threshold = 300, 
  className = "",
  showTooltip = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Throttled scroll handler for better performance
  const toggleVisibility = throttle(() => {
    setIsVisible(window.scrollY > threshold);
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [toggleVisibility]);

  // Smooth scroll to top with animation state
  const scrollToTop = () => {
    setIsAnimating(true);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Reset animation state after scroll completes
    setTimeout(() => setIsAnimating(false), 1000);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className="group"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999
      }}
    >
      <button
        onClick={scrollToTop}
        onKeyDown={handleKeyDown}
        className={`
          p-3 rounded-full 
          bg-blue-600 text-white shadow-lg 
          transition-all duration-300 ease-out
          transform hover:scale-110 hover:bg-blue-700 
          hover:shadow-xl
          focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
          active:scale-95
          ${isAnimating ? 'animate-pulse' : ''}
          ${className}
        `}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '18px'
        }}
        aria-label="Scroll back to top of page"
        title={showTooltip ? "Back to top" : undefined}
      >
        <FaAnglesUp />
      </button>
      
      {showTooltip && (
        <div 
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '0',
            fontSize: '12px',
            backgroundColor: '#1f2937',
            color: '#ffffff',
            borderRadius: '4px',
            padding: '6px 10px',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          className="group-hover:opacity-100"
        >
          Back to top
        </div>
      )}
    </div>
  );
};

export default BackToTopBtn;
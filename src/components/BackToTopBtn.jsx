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
  }, []);

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
    <div className="fixed bottom-6 right-6 z-50 group">
      <button
        onClick={scrollToTop}
        onKeyDown={handleKeyDown}
        className={`
          flex items-center justify-center p-3 rounded-full 
          bg-blue-600 text-white shadow-lg 
          transition-all duration-300 ease-out
          transform hover:scale-110 hover:bg-blue-700 
          hover:shadow-blue-500/50 hover:shadow-xl
          focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
          active:scale-95
          animate-in fade-in slide-in-from-bottom-4 duration-300
          ${isAnimating ? 'animate-pulse' : ''}
          ${className}
        `}
        aria-label="Scroll back to top of page"
        title={showTooltip ? "Back to top" : undefined}
      >
        <FaAnglesUp />
      </button>
      
      {showTooltip && (
        <div className="
          absolute bottom-full right-0 mb-2 px-2 py-1 
          bg-gray-900 text-white text-sm rounded 
          opacity-0 group-hover:opacity-100 
          transition-opacity duration-200
          pointer-events-none whitespace-nowrap
        ">
          Back to top
        </div>
      )}
    </div>);
};

export default BackToTopBtn;

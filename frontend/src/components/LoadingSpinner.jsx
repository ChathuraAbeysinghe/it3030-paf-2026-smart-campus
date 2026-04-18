import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-slate-50">
      <div className="loading-container">
        <div className="loading-logo">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <polygon points="50,15 85,85 15,85" stroke="#475569" strokeWidth="5" fill="none" />
          </svg>
        </div>
        <div className="loading-text">Loading SmartCampus...</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;

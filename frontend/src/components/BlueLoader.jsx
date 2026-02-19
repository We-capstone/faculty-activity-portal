import React from 'react';

const BlueLoader = ({ size = 'md', fullScreen = false, className = '' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-14 w-14 border-4'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  const containerClass = fullScreen
    ? 'min-h-screen flex items-center justify-center'
    : 'w-full flex items-center justify-center py-8';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className={`${spinnerSize} rounded-full border-blue-600 border-t-transparent animate-spin`} aria-label="Loading" />
    </div>
  );
};

export default BlueLoader;

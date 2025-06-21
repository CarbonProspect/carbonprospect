import React from 'react';

/**
 * A reusable loading indicator component with configurable size and color
 */
const LoadingIndicator = ({ size = 'medium', color = 'green', text = 'Loading...' }) => {
  // Determine size class
  const sizeClass = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  }[size] || 'h-8 w-8';
  
  // Determine color class
  const colorClass = {
    green: 'border-green-500',
    blue: 'border-blue-500',
    red: 'border-red-500',
    gray: 'border-gray-400',
  }[color] || 'border-green-500';
  
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full ${sizeClass} border-2 border-b-transparent ${colorClass}`}></div>
      {text && <p className="mt-2 text-gray-500 text-sm">{text}</p>}
    </div>
  );
};

export default LoadingIndicator;
import React from 'react';

const PlaceholderImage = ({ width = 600, height = 300, text = "Blog Image", className = "" }) => {
  const gradients = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-green-400 to-green-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600',
    'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-600',
    'from-teal-400 to-teal-600'
  ];
  
  // Use a simple hash of the text to consistently pick a gradient
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const gradientIndex = Math.abs(hash) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <div
      className={`bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="text-center">
        <div className="text-base md:text-lg opacity-90">{text}</div>
        <div className="text-xs md:text-sm opacity-70 mt-1">{width} × {height}</div>
      </div>
    </div>
  );
};

export default PlaceholderImage;

import React from 'react';

const PlaceholderImage = ({ width = 600, height = 300, text = "Blog Image", className = "", showInProduction = true }) => {
  // Option to hide placeholder images in production
  if (!showInProduction && process.env.NODE_ENV === 'production') {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center text-gray-500 relative overflow-hidden ${className}`}
        style={{
          aspectRatio: `${width}/${height}`,
          minHeight: '200px',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        <div className="text-center px-4">
          <div className="text-sm opacity-70">Image Coming Soon</div>
        </div>
      </div>
    );
  }
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
      className={`bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold relative overflow-hidden ${className}`}
      style={{
        aspectRatio: `${width}/${height}`,
        minHeight: '200px',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    >
      <div className="text-center px-4 z-10">
        <div className="text-sm md:text-base opacity-90 font-medium">{text}</div>
        <div className="text-xs opacity-70 mt-1">{width} × {height}</div>
      </div>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
      </div>
    </div>
  );
};

export default PlaceholderImage;

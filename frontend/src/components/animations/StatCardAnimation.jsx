import React from 'react';
import { motion } from 'framer-motion';

const StatCardAnimation = ({ 
  children, 
  delay = 0, 
  index = 0,
  className = '',
  ...props 
}) => {
  // Calculate staggered delay based on index
  const staggerDelay = delay + (index * 0.1);

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 30,
        scale: 0.95
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1
      }}
      transition={{
        duration: 0.6,
        delay: staggerDelay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{
        y: -5,
        scale: 1.02,
        transition: {
          duration: 0.2,
          ease: "easeOut"
        }
      }}
      whileTap={{
        scale: 0.98,
        transition: {
          duration: 0.1
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Number counting animation for stat values
export const CountUpAnimation = ({ 
  value, 
  duration = 2, 
  delay = 0,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const startValue = 0;
      const endValue = typeof value === 'string' ? parseInt(value.replace(/[^\d]/g, '')) : value;
      
      const animate = () => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
        
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [value, duration, delay]);

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

// Pulse animation for loading states
export const PulseAnimation = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default StatCardAnimation;

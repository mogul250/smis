import React from 'react';
import { motion } from 'framer-motion';

const FadeInAnimation = ({ 
  children, 
  delay = 0, 
  duration = 0.6, 
  direction = 'up',
  distance = 20,
  className = '',
  ...props 
}) => {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {}
  };

  const initial = {
    opacity: 0,
    ...directions[direction]
  };

  const animate = {
    opacity: 1,
    x: 0,
    y: 0
  };

  const transition = {
    duration,
    delay,
    ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth animation
  };

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Stagger children animation for lists/grids
export const StaggerContainer = ({ children, staggerDelay = 0.1, className = '', ...props }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Individual stagger item
export const StaggerItem = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default FadeInAnimation;

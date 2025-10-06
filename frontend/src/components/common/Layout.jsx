import React from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({
  children,
  className = '',
  maxWidth = 'max-w-full',
  padding = 'p-4 sm:p-6 lg:p-8',
  enableAnimation = true,
  animationDelay = 0
}) => {
  const content = (
    <div className={`${padding} ${maxWidth} overflow-hidden ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="lg:pl-64 pt-16 min-h-screen">
        {enableAnimation ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: animationDelay,
              ease: "easeOut"
            }}
          >
            {content}
          </motion.div>
        ) : (
          content
        )}
      </main>
    </div>
  );
};

export default Layout;

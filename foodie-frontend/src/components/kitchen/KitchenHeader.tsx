import React from 'react';
import { motion } from 'framer-motion';

export const KitchenHeader = () => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 pb-2"
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        {getGreeting()}, Chef
      </h1>
      <p className="text-muted text-sm mt-1">
        Your kitchen is looking organized today.
      </p>
    </motion.div>
  );
};

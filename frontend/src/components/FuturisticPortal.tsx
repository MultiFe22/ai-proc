import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FuturisticPortalProps {
  onAnimationComplete: () => void;
}

export function FuturisticPortal({ onAnimationComplete }: FuturisticPortalProps) {
  const [showText, setShowText] = useState(false);
  
  useEffect(() => {
    // Show text after portal animation begins
    const timer = setTimeout(() => setShowText(true), 600);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Portal ring animation */}
      <div className="relative w-96 h-96">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-cyan-400 opacity-70"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.7 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-cyan-500 opacity-80"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ duration: 1.3, ease: "easeOut", delay: 0.2 }}
        />
        
        {/* Inner circle - grows to fill screen */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-900"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 10, opacity: 1 }}
          transition={{ duration: 1.8, ease: [0.19, 1, 0.22, 1], delay: 1 }}
          onAnimationComplete={onAnimationComplete}
        />
        
        {/* Digital particles effect */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                delay: Math.random() * 1.5,
                repeat: Infinity,
                repeatDelay: Math.random() * 3
              }}
            />
          ))}
        </div>
        
        {/* Text */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center text-white text-xl font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: showText ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <span>Generating results...</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

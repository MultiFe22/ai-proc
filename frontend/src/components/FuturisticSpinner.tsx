import { motion } from 'framer-motion';

interface FuturisticSpinnerProps {
  size?: number;
  color?: string;
}

export const FuturisticSpinner = ({ 
  size = 40, 
  color = 'cyan' 
}: FuturisticSpinnerProps) => {
  // Color variants
  const colors = {
    cyan: '#22d3ee',
    purple: '#a855f7',
    green: '#22c55e',
    amber: '#f59e0b',
    white: '#ffffff',
  };

  const selectedColor = colors[color as keyof typeof colors] || colors.cyan;
  
  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 1.5
  };
  
  const pulseTransition = {
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut",
    duration: 0.8
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid rgba(255, 255, 255, 0.05)`,
          boxShadow: `0 0 15px 1px ${selectedColor}40`
        }}
      />
      
      {/* Spinning ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid transparent`,
          borderTopColor: selectedColor,
          borderLeftColor: selectedColor,
        }}
        animate={{ rotate: 360 }}
        transition={spinTransition}
      />
      
      {/* Inner dot */}
      <motion.div
        className="absolute rounded-full"
        style={{ 
          width: size * 0.2,
          height: size * 0.2,
          top: size * 0.4,
          left: size * 0.4,
          backgroundColor: selectedColor,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={pulseTransition}
      />
      
      {/* Light gleam effect */}
      <motion.div
        className="absolute rounded-full"
        style={{ 
          width: size * 0.7,
          height: size * 0.7,
          top: size * 0.15,
          left: size * 0.15,
          background: `radial-gradient(circle at 30% 30%, ${selectedColor}30, transparent 70%)`,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={pulseTransition}
      />
    </div>
  );
};

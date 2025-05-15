import { motion } from 'framer-motion';
import { FuturisticSpinner } from './FuturisticSpinner';

interface FuturisticLoaderProps {
  message?: string;
  isVisible: boolean;
  progress?: number;
  isError?: boolean;
  onRetry?: () => void;
}

export const FuturisticLoader = ({
  message = 'Processing your request...',
  isVisible,
  progress,
  isError = false,
  onRetry
}: FuturisticLoaderProps) => {
  // Animation variants
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const childVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/80 backdrop-blur-md"
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={containerVariants}
      exit="hidden"
    >
      <motion.div variants={childVariants} className="mb-8">
        <FuturisticSpinner size={60} color={isError ? "amber" : "cyan"} />
      </motion.div>
      
      <motion.div 
        variants={childVariants}
        className={`text-lg mb-4 ${isError ? 'text-amber-300' : 'text-cyan-300'}`}
      >
        {message}
      </motion.div>
      
      {!isError && typeof progress === 'number' && (
        <motion.div 
          variants={childVariants}
          className="w-64 relative h-1 bg-gray-800 rounded-full overflow-hidden"
        >
          <motion.div 
            className="absolute h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </motion.div>
      )}
      
      {isError && onRetry && (
        <motion.button
          variants={childVariants}
          className="mt-4 px-6 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-sm font-medium transition-colors"
          onClick={onRetry}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Retry
        </motion.button>
      )}
      
      {/* Futuristic dot animations in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-500 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0],
              x: Math.random() > 0.5 ? [0, 100] : [0, -100],
              y: Math.random() > 0.5 ? [0, 100] : [0, -100],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

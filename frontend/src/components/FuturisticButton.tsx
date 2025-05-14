import { motion } from 'framer-motion';
import { FuturisticSpinner } from './FuturisticSpinner';

interface FuturisticButtonProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
}

export const FuturisticButton = ({ 
  type = 'button', 
  onClick, 
  children, 
  isLoading = false,
  disabled = false
}: FuturisticButtonProps) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className="relative overflow-hidden group py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full w-full disabled:opacity-50 disabled:cursor-not-allowed"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100"
        animate={{ opacity: disabled ? 0 : undefined }}
        transition={{ duration: 0.3 }}
      />
      
      <div className="relative z-10 flex items-center justify-center space-x-2">
        {isLoading && (
          <div className="mr-2">
            <FuturisticSpinner size={18} color="white" />
          </div>
        )}
        <span>{children}</span>
      </div>
      
      <motion.div
        className="absolute inset-0 border-2 border-white rounded-full opacity-0 group-hover:opacity-30"
        initial={{ scale: 0.8 }}
        animate={{ scale: disabled ? 0.8 : 1, opacity: disabled ? 0 : undefined }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
};

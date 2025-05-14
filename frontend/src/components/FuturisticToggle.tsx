import { motion } from 'framer-motion';

interface FuturisticToggleProps {
  id: string;
  label: string;
  isChecked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  color?: 'cyan' | 'purple' | 'green' | 'amber';
}

export const FuturisticToggle = ({
  id,
  label,
  isChecked,
  onChange,
  color = 'cyan'
}: FuturisticToggleProps) => {
  // Color variants
  const colorVariants = {
    cyan: {
      bg: 'bg-cyan-600',
      border: 'border-cyan-500',
      glow: 'shadow-cyan-500/50',
    },
    purple: {
      bg: 'bg-purple-600',
      border: 'border-purple-500',
      glow: 'shadow-purple-500/50',
    },
    green: {
      bg: 'bg-green-600',
      border: 'border-green-500',
      glow: 'shadow-green-500/50',
    },
    amber: {
      bg: 'bg-amber-600',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/50',
    },
  };

  const selectedColor = colorVariants[color];

  return (
    <div className="flex items-center mb-4">
      <label
        htmlFor={id}
        className="flex items-center cursor-pointer group"
      >
        <div className="relative">
          <input
            id={id}
            type="checkbox"
            className="sr-only"
            checked={isChecked}
            onChange={onChange}
          />
          <motion.div
            className={`block w-14 h-8 rounded-full ${isChecked ? selectedColor.bg : 'bg-gray-700'} 
            transition-colors duration-300 ${isChecked ? 'border ' + selectedColor.border : 'border-gray-600'}`}
            animate={{
              boxShadow: isChecked ? `0 0 10px 1px rgba(0, 0, 0, 0.2), 0 0 15px ${color === 'cyan' ? '#06b6d4' : color === 'purple' ? '#a855f7' : color === 'green' ? '#22c55e' : '#f59e0b'}40` : 'none',
            }}
          />
          <motion.div
            className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isChecked ? 'border-gray-200' : 'border-gray-400'}`}
            animate={{
              translateX: isChecked ? '6rem' : 0,
              scale: isChecked ? 1.05 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25
            }}
          />
        </div>
        <div className="ml-3 text-gray-300 group-hover:text-white transition-colors">
          {label}
        </div>
      </label>
    </div>
  );
};

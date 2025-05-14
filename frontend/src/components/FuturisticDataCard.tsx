import { motion } from 'framer-motion';

interface FuturisticDataCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  highlight?: boolean;
  className?: string;
}

export const FuturisticDataCard = ({
  title,
  value,
  icon,
  color = 'cyan',
  highlight = false,
  className = '',
}: FuturisticDataCardProps) => {
  // Color variants
  const colorVariants = {
    cyan: {
      bgGlow: 'after:bg-cyan-500/10',
      border: 'border-cyan-500/30',
      textHighlight: 'text-cyan-400',
    },
    purple: {
      bgGlow: 'after:bg-purple-500/10',
      border: 'border-purple-500/30',
      textHighlight: 'text-purple-400',
    },
    green: {
      bgGlow: 'after:bg-green-500/10',
      border: 'border-green-500/30',
      textHighlight: 'text-green-400',
    },
    amber: {
      bgGlow: 'after:bg-amber-500/10',
      border: 'border-amber-500/30',
      textHighlight: 'text-amber-400',
    },
  };

  const selectedColor = colorVariants[color as keyof typeof colorVariants] || colorVariants.cyan;

  return (
    <motion.div
      className={`
        relative overflow-hidden bg-black/30 backdrop-blur-md p-4 rounded-lg 
        border ${selectedColor.border} 
        ${highlight ? 'after:absolute after:inset-0 after:opacity-30 ' + selectedColor.bgGlow : ''} 
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}
    >
      <div className="flex items-center mb-2">
        {icon && <div className={`mr-2 ${selectedColor.textHighlight}`}>{icon}</div>}
        <p className="text-gray-400 text-sm">{title}</p>
      </div>
      <p className={`text-xl md:text-2xl font-light ${highlight ? selectedColor.textHighlight : 'text-white'}`}>
        {value}
      </p>
    </motion.div>
  );
};

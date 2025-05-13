import { useState } from 'react';
import { motion } from 'framer-motion';

interface FuturisticInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export const FuturisticInput = ({ id, label, value, onChange, placeholder }: FuturisticInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="relative mb-6">
      <motion.label 
        htmlFor={id}
        className={`absolute left-3 pointer-events-none text-sm transition-all duration-300 ${
          isFocused || value 
            ? 'text-cyan-400 -top-6 text-xs'
            : 'text-gray-400 top-3'
        }`}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: isFocused ? 1 : 0.8 }}
      >
        {label}
      </motion.label>
      
      <motion.input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? placeholder : ''}
        className="w-full bg-transparent border-b-2 border-gray-600 py-2 px-3 text-white focus:outline-none transition-all duration-300"
        initial={{ borderColor: 'rgba(75, 85, 99, 0.6)' }}
        animate={{ 
          borderColor: isFocused ? 'rgba(34, 211, 238, 0.8)' : 'rgba(75, 85, 99, 0.6)',
          boxShadow: isFocused ? '0 4px 6px -1px rgba(34, 211, 238, 0.1)' : 'none'
        }}
      />
      
      <motion.div 
        className="absolute bottom-0 left-0 h-0.5 bg-cyan-400"
        initial={{ width: 0 }}
        animate={{ width: isFocused ? '100%' : 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
};

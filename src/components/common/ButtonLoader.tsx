import React from 'react';
import { motion } from 'framer-motion';

interface ButtonLoaderProps {
  color?: string;
  size?: number;
  className?: string;
}

const ButtonLoader: React.FC<ButtonLoaderProps> = ({ 
  color = 'white', 
  size = 20,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className="flex items-center"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 24 24" 
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-spin"
        >
          <path 
            d="M12 2.5V5.5" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.5"
          />
          <path 
            d="M12 18.5V21.5" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.5"
          />
          <path 
            d="M4.93 4.93L7.05 7.05" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.6"
          />
          <path 
            d="M16.95 16.95L19.07 19.07" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.6"
          />
          <path 
            d="M2.5 12H5.5" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.7"
          />
          <path 
            d="M18.5 12H21.5" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.7"
          />
          <path 
            d="M4.93 19.07L7.05 16.95" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.8"
          />
          <path 
            d="M16.95 7.05L19.07 4.93" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            opacity="0.8"
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default ButtonLoader; 
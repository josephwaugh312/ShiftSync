import React from 'react';
import { motion } from 'framer-motion';

interface BrandedSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

const BrandedSpinner: React.FC<BrandedSpinnerProps> = ({ 
  size = 'medium', 
  color = 'primary',
  text
}) => {
  // Size mapping
  const sizeMap = {
    small: { outer: 'h-6 w-6', inner: 'h-3 w-3', text: 'text-xs' },
    medium: { outer: 'h-10 w-10', inner: 'h-5 w-5', text: 'text-sm' },
    large: { outer: 'h-16 w-16', inner: 'h-8 w-8', text: 'text-base' },
  };

  // Color mapping
  const colorMap = {
    primary: 'border-primary-200 border-t-primary-600',
    success: 'border-success-200 border-t-success-600',
    warning: 'border-warning-200 border-t-warning-600',
    danger: 'border-danger-200 border-t-danger-600',
  };

  // Check if the passed color is a theme color or a direct hex/rgb value
  const borderColor = colorMap[color as keyof typeof colorMap] || `border-gray-200 border-t-[${color}]`;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        {/* Outer spinning circle */}
        <motion.div
          className={`${sizeMap[size].outer} rounded-full border-4 ${borderColor} animate-spin`}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear"
          }}
        />
        
        {/* Inner pulsing circle */}
        <motion.div 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${sizeMap[size].inner} bg-current rounded-full`}
          initial={{ opacity: 0.4, scale: 0.8 }}
          animate={{ 
            opacity: [0.4, 0.8, 0.4],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{ 
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ color: color in colorMap ? undefined : color }}
        />
      </div>
      
      {text && (
        <p className={`mt-2 ${sizeMap[size].text} font-medium text-gray-600 dark:text-gray-300`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default BrandedSpinner; 
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface CustomToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CustomToggle: React.FC<CustomToggleProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  id = `toggle-${Math.random().toString(36).substring(2, 11)}`,
  size = 'md'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { playSound } = useSoundEffects();

  const sizeMap = {
    sm: {
      toggle: { width: '36px', height: '20px' },
      circle: { size: '14px' },
      translate: 16
    },
    md: {
      toggle: { width: '48px', height: '24px' },
      circle: { size: '18px' },
      translate: 24
    },
    lg: {
      toggle: { width: '60px', height: '30px' },
      circle: { size: '22px' },
      translate: 30
    }
  };

  const selectedSize = sizeMap[size];

  const handleToggle = () => {
    if (disabled) return;
    
    // Play sound
    playSound('toggle');
    
    // Then change the state
    onChange(!checked);
  };

  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className={`mr-3 ${disabled ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}
        >
          {label}
        </label>
      )}
      
      <motion.button
        id={id}
        role="switch"
        aria-checked={checked}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={selectedSize.toggle}
        className={`relative inline-flex flex-shrink-0 rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
        } ${
          isFocused 
            ? 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-dark-800' 
            : ''
        } ${
          checked 
            ? 'bg-primary-500' 
            : 'bg-gray-200 dark:bg-dark-600'
        }`}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        <span className="sr-only">{label}</span>
        
        <motion.span
          style={{ width: selectedSize.circle.size, height: selectedSize.circle.size }}
          className={`pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
          initial={false}
          animate={{
            x: checked ? selectedSize.translate : 3,
            y: 3,
            scale: [null, checked ? 1.2 : 0.8, 1],
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
            scale: {
              duration: 0.2,
              ease: "easeInOut"
            }
          }}
        />
        
        {/* Additional visual feedback for checked state */}
        {checked && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-end pr-1.5"
          >
            <svg 
              width="10" 
              height="10" 
              viewBox="0 0 10 10" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path 
                d="M8.5 2L3.5 7L1.5 5" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </motion.span>
        )}
      </motion.button>
    </div>
  );
};

export default CustomToggle; 
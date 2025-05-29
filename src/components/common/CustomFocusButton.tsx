import React, { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface CustomFocusButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'disabled' | 'className'> {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  sound?: 'click' | 'success' | 'error' | 'notification' | 'complete' | 'toggle' | 'delete';
  withRipple?: boolean;
  preventFormSubmit?: boolean;
}

const CustomFocusButton = forwardRef<HTMLButtonElement, CustomFocusButtonProps>(({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  sound = 'click',
  withRipple = true,
  preventFormSubmit = false,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const [showRipple, setShowRipple] = useState(false);
  const { playSound } = useSoundEffects();

  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    outline: 'bg-transparent border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-opacity-10',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-3 px-6'
  };

  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!withRipple || disabled) return;
    
    try {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      
      // Calculate ripple position relative to button
      setRipplePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      
      setShowRipple(true);
      
      // Remove ripple after animation completes
      setTimeout(() => {
        setShowRipple(false);
      }, 600);
    } catch (error) {
      // If getBoundingClientRect fails, skip the ripple effect
      console.warn('Failed to calculate ripple position:', error);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // Prevent default behavior if needed
    if (preventFormSubmit || type === 'button') {
      e.preventDefault();
    }
    
    handleRipple(e);
    playSound(sound);
    
    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // Prevent default mousedown behavior for buttons inside forms to avoid form submission
    if (preventFormSubmit) {
      e.preventDefault();
    }
    
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    if (disabled) return;
    setIsPressed(false);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      className={`relative overflow-hidden rounded-md transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClass} ${className}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      animate={{
        boxShadow: isFocused 
          ? '0 0 0 3px rgba(99, 102, 241, 0.4)'
          : isPressed
          ? 'inset 0 3px 5px rgba(0, 0, 0, 0.2)'
          : '0 1px 2px rgba(0, 0, 0, 0.1)'
      }}
      {...rest}
    >
      <motion.span
        animate={{
          y: isPressed ? 2 : 0,
          opacity: isPressed ? 0.9 : 1
        }}
        className="relative z-10 flex items-center justify-center"
      >
        {children}
      </motion.span>
      
      {/* Focus ring */}
      <motion.span
        className="absolute inset-0 rounded-md pointer-events-none"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ 
          opacity: isFocused ? 1 : 0,
          scale: isFocused ? 1 : 0.85
        }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Ripple effect */}
      {showRipple && withRipple && (
        <motion.span
          className="absolute rounded-full bg-white bg-opacity-30 pointer-events-none"
          style={{
            left: ripplePosition.x,
            top: ripplePosition.y,
            marginLeft: -100,
            marginTop: -100,
            width: 200,
            height: 200
          }}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.button>
  );
});

// Add display name for debugging
CustomFocusButton.displayName = 'CustomFocusButton';

export default CustomFocusButton; 
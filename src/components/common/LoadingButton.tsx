import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ButtonLoader from './ButtonLoader';
import { useSoundEffects } from '../../hooks/useSoundEffects';

type ButtonType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
type SoundType = 'click' | 'success' | 'error' | 'notification' | 'complete' | 'toggle';

interface LoadingButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  buttonType?: ButtonType;
  variant?: string;
  loadingText?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  soundEffect?: SoundType;
  sound?: string;
  withRipple?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  isLoading = false,
  buttonType = 'primary',
  variant,
  loadingText,
  icon,
  className = '',
  disabled,
  soundEffect = 'click',
  sound,
  withRipple = true,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const [showRipple, setShowRipple] = useState(false);
  const { playSound } = useSoundEffects();

  // Map button type to tailwind class
  const buttonClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'bg-warning-500 hover:bg-warning-600 text-dark-900 focus:ring-warning-500 btn',
  };

  // Use variant if provided, otherwise use buttonType
  const buttonClass = variant 
    ? `btn bg-${variant}-600 hover:bg-${variant}-700 text-white focus:ring-${variant}-500`
    : buttonClasses[buttonType] || buttonClasses.primary;
  
  // Get button text color for the loader
  const loaderColor = ['primary', 'success', 'danger'].includes(buttonType) || variant === 'primary' 
    ? 'white' 
    : 'currentColor';
  
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!withRipple || disabled || isLoading) return;
    
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
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    
    handleRipple(e);
    
    // Use sound prop if provided, otherwise use soundEffect
    if (sound) {
      playSound(sound as any);
    } else {
      playSound(soundEffect);
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseDown = () => {
    if (disabled || isLoading) return;
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    if (disabled || isLoading) return;
    setIsPressed(false);
  };
  
  return (
    <motion.div
      className={`relative overflow-hidden flex items-center justify-center shadow-md font-medium ${buttonClass} ${className}`}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
      animate={{
        boxShadow: isFocused 
          ? '0 0 0 3px rgba(99, 102, 241, 0.4)'
          : isPressed
          ? 'inset 0 3px 5px rgba(0, 0, 0, 0.2)'
          : '0 1px 2px rgba(0, 0, 0, 0.1)'
      }}
    >
      <button
        type={type}
        disabled={isLoading || disabled}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsPressed(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="relative z-10 w-full h-full"
        aria-label={ariaLabel}
      >
        <motion.span
          animate={{
            y: isPressed ? 2 : 0,
            opacity: isPressed ? 0.9 : 1
          }}
          className="flex items-center justify-center"
        >
          {isLoading ? (
            <div className="flex items-center">
              <ButtonLoader color={loaderColor} size={18} className="mr-2" />
              <span>{loadingText || 'Loading...'}</span>
            </div>
          ) : (
            <>
              {icon && <span className="mr-2">{icon}</span>}
              {children}
            </>
          )}
        </motion.span>
      </button>
      
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
    </motion.div>
  );
};

export default LoadingButton; 
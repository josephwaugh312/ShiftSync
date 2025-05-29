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

// Export button type class mapping for testing
export const getButtonClasses = (): Record<ButtonType, string> => {
  return {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'bg-warning-500 hover:bg-warning-600 text-dark-900 focus:ring-warning-500 btn',
  };
};

// Export button class selection logic for testing
export const getButtonClass = (
  buttonType: ButtonType = 'primary',
  variant?: string
): string => {
  const buttonClasses = getButtonClasses();
  
  // Use variant if provided, otherwise use buttonType
  return variant 
    ? `btn bg-${variant}-600 hover:bg-${variant}-700 text-white focus:ring-${variant}-500`
    : buttonClasses[buttonType] || buttonClasses.primary;
};

// Export loader color determination logic for testing
export const getLoaderColor = (
  buttonType: ButtonType = 'primary',
  variant?: string
): string => {
  // Get button text color for the loader
  return ['primary', 'success', 'danger'].includes(buttonType) || variant === 'primary' 
    ? 'white' 
    : 'currentColor';
};

// Export ripple position calculation for testing
export const calculateRipplePosition = (
  e: React.MouseEvent<HTMLButtonElement>
): { x: number; y: number } => {
  const button = e.currentTarget;
  const rect = button.getBoundingClientRect();
  
  // Calculate ripple position relative to button
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

// Export sound effect selection logic for testing
export const getSoundToPlay = (sound?: string, soundEffect: SoundType = 'click'): string => {
  // Use sound prop if provided, otherwise use soundEffect
  return sound || soundEffect;
};

// Export button state validation for testing
export const shouldBlockInteraction = (disabled?: boolean, isLoading?: boolean): boolean => {
  return Boolean(disabled || isLoading);
};

// Export ripple configuration for testing
export const getRippleConfig = () => {
  return {
    marginOffset: -100,
    size: 200,
    duration: 0.6
  };
};

// Export button animation scale logic for testing
export const getButtonScale = (disabled?: boolean, isLoading?: boolean): number => {
  return shouldBlockInteraction(disabled, isLoading) ? 1 : 0.95;
};

// Round 2 extractions: Animation and rendering logic

// Export box shadow animation logic for testing
export const getBoxShadowAnimation = (isFocused: boolean, isPressed: boolean): string => {
  if (isFocused) {
    return '0 0 0 3px rgba(99, 102, 241, 0.4)';
  }
  if (isPressed) {
    return 'inset 0 3px 5px rgba(0, 0, 0, 0.2)';
  }
  return '0 1px 2px rgba(0, 0, 0, 0.1)';
};

// Export focus ring animation configuration for testing
export const getFocusRingAnimation = (isFocused: boolean) => {
  return {
    opacity: isFocused ? 1 : 0,
    scale: isFocused ? 1 : 0.85
  };
};

// Export focus ring transition configuration for testing
export const getFocusRingTransition = () => {
  return { duration: 0.2 };
};

// Export motion span animation props for testing
export const getMotionSpanProps = (isPressed: boolean) => {
  return {
    y: isPressed ? 2 : 0,
    opacity: isPressed ? 0.9 : 1
  };
};

// Export loading text content logic for testing
export const getLoadingTextContent = (loadingText?: string): string => {
  return loadingText || 'Loading...';
};

// Export ripple display logic for testing
export const shouldShowRipple = (showRipple: boolean, withRipple: boolean): boolean => {
  return showRipple && withRipple;
};

// Export ripple styles calculation for testing
export const getRippleStyles = (
  ripplePosition: { x: number; y: number },
  rippleConfig: { marginOffset: number; size: number; duration: number }
) => {
  return {
    left: ripplePosition.x,
    top: ripplePosition.y,
    marginLeft: rippleConfig.marginOffset,
    marginTop: rippleConfig.marginOffset,
    width: rippleConfig.size,
    height: rippleConfig.size
  };
};

// Export ripple animation props for testing
export const getRippleAnimationProps = () => {
  return {
    initial: { scale: 0, opacity: 0.5 },
    animate: { scale: 2, opacity: 0 }
  };
};

// Export main container class construction for testing
export const getMainClassName = (buttonClass: string, className: string): string => {
  return `relative overflow-hidden flex items-center justify-center shadow-md font-medium ${buttonClass} ${className}`;
};

// Export button element attributes for testing
export const getButtonAttributes = (
  type: 'button' | 'submit' | 'reset',
  isLoading?: boolean,
  disabled?: boolean,
  ariaLabel?: string
) => {
  return {
    type,
    disabled: Boolean(isLoading) || Boolean(disabled),
    className: "relative z-10 w-full h-full",
    'aria-label': ariaLabel
  };
};

// Export timeout calculation for ripple cleanup for testing
export const calculateRippleTimeout = (duration: number): number => {
  return duration * 1000;
};

// Export state setter helpers for testing
export const createStateSetter = <T extends unknown>(setState: React.Dispatch<React.SetStateAction<T>>) => {
  return (value: T) => setState(value);
};

// Round 3 extractions: Event handlers, state management, and rendering logic

// Export initial state values for testing
export const getInitialButtonState = () => {
  return {
    isFocused: false,
    isPressed: false,
    ripplePosition: { x: 0, y: 0 },
    showRipple: false
  };
};

// Export ripple handler logic for testing
export const executeRippleHandler = (
  e: React.MouseEvent<HTMLButtonElement>,
  withRipple: boolean,
  setRipplePosition: (pos: { x: number; y: number }) => void,
  setShowRipple: (show: boolean) => void,
  rippleConfig: { duration: number },
  disabled?: boolean,
  isLoading?: boolean
) => {
  if (!withRipple || shouldBlockInteraction(disabled, isLoading)) return;
  
  setRipplePosition(calculateRipplePosition(e));
  setShowRipple(true);
  
  // Return cleanup function for testing
  return setTimeout(() => {
    setShowRipple(false);
  }, calculateRippleTimeout(rippleConfig.duration));
};

// Export click handler logic for testing
export const executeClickHandler = (
  e: React.MouseEvent<HTMLButtonElement>,
  sound?: string,
  soundEffect: SoundType = 'click',
  disabled?: boolean,
  isLoading?: boolean,
  playSound?: (sound: any) => void,
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void,
  handleRipple?: (e: React.MouseEvent<HTMLButtonElement>) => void
) => {
  if (shouldBlockInteraction(disabled, isLoading)) return;
  
  if (handleRipple) {
    handleRipple(e);
  }
  
  const soundToPlay = getSoundToPlay(sound, soundEffect);
  if (playSound) {
    playSound(soundToPlay as any);
  }
  
  if (onClick) {
    onClick(e);
  }
};

// Export mouse down handler logic for testing
export const executeMouseDownHandler = (
  disabled?: boolean,
  isLoading?: boolean,
  setIsPressed?: (pressed: boolean) => void
) => {
  if (shouldBlockInteraction(disabled, isLoading)) return;
  if (setIsPressed) {
    setIsPressed(true);
  }
};

// Export mouse up handler logic for testing
export const executeMouseUpHandler = (
  disabled?: boolean,
  isLoading?: boolean,
  setIsPressed?: (pressed: boolean) => void
) => {
  if (shouldBlockInteraction(disabled, isLoading)) return;
  if (setIsPressed) {
    setIsPressed(false);
  }
};

// Export focus handler logic for testing
export const executeFocusHandler = (setIsFocused?: (focused: boolean) => void) => {
  if (setIsFocused) {
    setIsFocused(true);
  }
};

// Export blur handler logic for testing
export const executeBlurHandler = (setIsFocused?: (focused: boolean) => void) => {
  if (setIsFocused) {
    setIsFocused(false);
  }
};

// Export mouse leave handler logic for testing
export const executeMouseLeaveHandler = (setIsPressed?: (pressed: boolean) => void) => {
  if (setIsPressed) {
    setIsPressed(false);
  }
};

// Export loading content rendering logic for testing
export const renderLoadingContent = (loaderColor: string, loadingText?: string) => {
  return {
    loader: { color: loaderColor, size: 18, className: "mr-2" },
    text: getLoadingTextContent(loadingText)
  };
};

// Export normal content rendering logic for testing
export const renderNormalContent = (icon?: React.ReactNode, children?: React.ReactNode) => {
  return {
    hasIcon: Boolean(icon),
    icon: icon,
    children: children
  };
};

// Export should render icon logic for testing
export const shouldRenderIcon = (icon?: React.ReactNode): boolean => {
  return Boolean(icon);
};

// Export loading state check for testing
export const isInLoadingState = (isLoading?: boolean): boolean => {
  return Boolean(isLoading);
};

// Export computed values extraction for testing
export const extractComputedValues = (
  buttonType: ButtonType = 'primary',
  variant?: string,
  className: string = '',
  type: 'button' | 'submit' | 'reset' = 'button',
  isLoading?: boolean,
  disabled?: boolean,
  ariaLabel?: string
) => {
  const buttonClass = getButtonClass(buttonType, variant);
  const loaderColor = getLoaderColor(buttonType, variant);
  const rippleConfig = getRippleConfig();
  const mainClassName = getMainClassName(buttonClass, className);
  const buttonAttributes = getButtonAttributes(type, isLoading, disabled, ariaLabel);
  
  return {
    buttonClass,
    loaderColor,
    rippleConfig,
    mainClassName,
    buttonAttributes
  };
};

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
  // Initialize state using extracted utilities
  const initialState = getInitialButtonState();
  const [isFocused, setIsFocused] = useState(initialState.isFocused);
  const [isPressed, setIsPressed] = useState(initialState.isPressed);
  const [ripplePosition, setRipplePosition] = useState(initialState.ripplePosition);
  const [showRipple, setShowRipple] = useState(initialState.showRipple);
  
  // Use sound effects hook
  const { playSound } = useSoundEffects();

  // Extract computed values using utility
  const computedValues = extractComputedValues(buttonType, variant, className, type, isLoading, disabled, ariaLabel);

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    executeRippleHandler(e, withRipple, setRipplePosition, setShowRipple, computedValues.rippleConfig, disabled, isLoading);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    executeClickHandler(e, sound, soundEffect, disabled, isLoading, playSound, onClick, handleRipple);
  };

  const handleMouseDown = () => {
    executeMouseDownHandler(disabled, isLoading, setIsPressed);
  };

  const handleMouseUp = () => {
    executeMouseUpHandler(disabled, isLoading, setIsPressed);
  };

  const handleFocus = () => {
    executeFocusHandler(setIsFocused);
  };

  const handleBlur = () => {
    executeBlurHandler(setIsFocused);
  };

  const handleMouseLeave = () => {
    executeMouseLeaveHandler(setIsPressed);
  };
  
  return (
    <motion.div
      className={computedValues.mainClassName}
      whileTap={{ scale: getButtonScale(disabled, isLoading) }}
      animate={{
        boxShadow: getBoxShadowAnimation(isFocused, isPressed)
      }}
    >
      <button
        {...computedValues.buttonAttributes}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <motion.span
          animate={getMotionSpanProps(isPressed)}
          className="flex items-center justify-center"
        >
          {isInLoadingState(isLoading) ? (
            <div className="flex items-center">
              <ButtonLoader 
                color={computedValues.loaderColor} 
                size={18} 
                className="mr-2" 
              />
              <span>{getLoadingTextContent(loadingText)}</span>
            </div>
          ) : (
            <>
              {shouldRenderIcon(icon) && <span className="mr-2">{icon}</span>}
              {children}
            </>
          )}
        </motion.span>
      </button>
      
      {/* Focus ring */}
      <motion.span
        className="absolute inset-0 rounded-md pointer-events-none"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={getFocusRingAnimation(isFocused)}
        transition={getFocusRingTransition()}
      />
      
      {/* Ripple effect */}
      {shouldShowRipple(showRipple, withRipple) && (
        <motion.span
          className="absolute rounded-full bg-white bg-opacity-30 pointer-events-none"
          style={getRippleStyles(ripplePosition, computedValues.rippleConfig)}
          {...getRippleAnimationProps()}
          transition={{ duration: computedValues.rippleConfig.duration }}
        />
      )}
    </motion.div>
  );
};

export default LoadingButton; 
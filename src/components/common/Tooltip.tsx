import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  shortcut,
  position = 'bottom',
  delay = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);

  // Get position classes based on position prop
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'transform -translate-x-1/2 -translate-y-full mb-2';
      case 'bottom':
        return 'transform -translate-x-1/2 mt-2';
      case 'left':
        return 'transform -translate-y-1/2 -translate-x-full mr-2';
      case 'right':
        return 'transform -translate-y-1/2 ml-2';
      default:
        return 'transform -translate-x-1/2 mt-2';
    }
  };

  // Get arrow position classes based on position prop
  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-[-6px] left-1/2 transform -translate-x-1/2 border-t-gray-700 dark:border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent';
      case 'bottom':
        return 'top-[-6px] left-1/2 transform -translate-x-1/2 border-b-gray-700 dark:border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'right-[-6px] top-1/2 transform -translate-y-1/2 border-l-gray-700 dark:border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'left-[-6px] top-1/2 transform -translate-y-1/2 border-r-gray-700 dark:border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent';
      default:
        return 'top-[-6px] left-1/2 transform -translate-x-1/2 border-b-gray-700 dark:border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent';
    }
  };

  // Calculate tooltip position based on child element's position
  const calculatePosition = () => {
    if (childRef.current) {
      try {
        const rect = childRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        // Calculate position based on specified direction
        switch (position) {
          case 'top':
            top = rect.top;
            left = rect.left + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom;
            left = rect.left + rect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right;
            break;
          default:
            top = rect.bottom;
            left = rect.left + rect.width / 2;
        }

        setTooltipPosition({ top, left });
      } catch (error) {
        // If getBoundingClientRect fails, don't show the tooltip
        console.warn('Failed to calculate tooltip position:', error);
        return false;
      }
    }
    return true;
  };

  // Handle mouse enter
  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Calculate position before showing - only proceed if successful
    const positionCalculated = calculatePosition();
    if (!positionCalculated) {
      return; // Don't show tooltip if position calculation failed
    }
    
    // Set a timeout to show the tooltip after the delay
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Hide the tooltip
    setIsVisible(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsMounted(false);
    };
  }, []);

  // Handle keyboard shortcut display
  const formattedShortcut = shortcut?.split('+').map(key => {
    // Format the key for display
    let formattedKey = key.trim();
    
    // Capitalize first letter if key length > 1
    if (formattedKey.length > 1) {
      formattedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
    }
    
    // Handle special keys - with Mac-specific symbols
    switch (formattedKey.toLowerCase()) {
      case 'alt':
        return '⌥';  // Option symbol for Mac
      case 'ctrl':
        return '⌃';  // Control symbol for Mac
      case 'shift':
        return '⇧';  // Shift symbol for Mac
      case 'cmd':
      case 'meta':
        return '⌘';  // Command symbol for Mac
      case 'esc':
        return 'Esc';
      case 'left':
        return '←';
      case 'right':
        return '→';
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return formattedKey;
    }
  }).join(' + ');

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} ref={childRef}>
      {children}
      
      {isMounted && isVisible && (
        <div 
          ref={tooltipRef}
          className={`fixed px-3 py-2 text-sm font-medium text-white bg-gray-700 dark:bg-gray-800 rounded shadow-lg whitespace-nowrap max-w-xs ${getPositionClasses()}`}
          role="tooltip"
          style={{ 
            pointerEvents: 'none',
            zIndex: 9999,
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          <div className={`absolute border-4 ${getArrowClasses()}`} />
          <div>
            {content}
            {shortcut && (
              <div className="mt-1 flex items-center justify-center">
                <span className="text-xs bg-gray-600 dark:bg-gray-900 px-1.5 py-0.5 rounded font-mono">
                  {formattedShortcut}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip; 
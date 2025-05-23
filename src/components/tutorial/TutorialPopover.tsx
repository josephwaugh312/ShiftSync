import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TutorialStep, tutorialSteps } from '../../data/tutorialSteps';
import { useTutorial } from '../../contexts/TutorialContext';

interface TutorialPopoverProps {
  step: TutorialStep;
  targetElement: HTMLElement | null;
}

const TutorialPopover: React.FC<TutorialPopoverProps> = ({ step, targetElement }) => {
  const { 
    nextStep, 
    prevStep, 
    skipTutorial, 
    currentStep, 
    endTutorial, 
    checkRequiredAction,
    progress,
    viewedSteps
  } = useTutorial();
  
  const canProceed = checkRequiredAction();
  
  // Check if we're on mobile - properly handle SSR/hydration
  const [isMobile, setIsMobile] = useState(false);
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 0;
      setIsMobile(width <= 768);
      setIsVerySmallScreen(width <= 350); // Increased threshold for better coverage
      console.log('Screen width:', width, 'isVerySmallScreen:', width <= 350);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Calculate position based on the target element
  const getPopoverPosition = () => {
    // Force center positioning for problematic steps on mobile
    if (isMobile && (step.id === 'employee-management' || step.id === 'shift-templates' || step.id === 'insights')) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw', // Ensure it fits on mobile screens
        width: '320px'
      };
    }
    
    if (!targetElement || step.position === 'center') {
      // Special handling for the calendar step
      if (step.id === 'calendar') {
        return {
          top: '30%',  // Position it more towards the top
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: isMobile ? '90vw' : '400px',  // Make it responsive
          width: isMobile ? '320px' : undefined
        };
      }
      
      // Special handling for add-shift step
      if (step.id === 'add-shift') {
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: isMobile ? '90vw' : '450px',  // Make it responsive
          width: isMobile ? '320px' : undefined
        };
      }
      
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: isMobile ? '90vw' : undefined,
        width: isMobile ? '320px' : undefined
      };
    }
    
    // Handle center-bottom position
    if (step.position === 'center-bottom') {
      return {
        bottom: isMobile ? '120px' : '100px', // Account for mobile navbar height
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: isMobile ? '90vw' : (step.id === 'calendar' ? '450px' : undefined),
        width: isMobile ? '320px' : undefined
      };
    }
    
    const rect = targetElement.getBoundingClientRect();
    
    // Special handling for help button to prevent off-screen rendering
    if (step.id === 'help') {
      if (isMobile) {
        // On mobile, center the tooltip
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '90vw',
          width: '320px'
        };
      }
      return {
        top: `${rect.bottom + 10}px`,
        left: `${rect.left - 200}px`,  // Move it significantly to the left
        transform: 'translateY(0)'
      };
    }
    
    // Special handling for other steps to ensure they're visible
    if (step.id === 'shift-templates' || 
        step.id === 'recurring-shifts' || 
        step.id === 'insights') {
      
      if (isMobile) {
        // On mobile, center these tooltips to prevent off-screen issues
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '90vw',
          width: '320px'
        };
      }
      
      // Position it at the bottom of the button, centered
      return {
        top: `${rect.bottom + 20}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)'
      };
    }
    
    // Special handling for steps with pointing fingers
    if (step.showPointer) {
      // Add extra margin to avoid covering the finger
      const extraMargin = isMobile ? 60 : 100; // Reduce margin on mobile
      
      switch (step.position) {
        case 'top':
          return {
            top: `${rect.top - (isMobile ? 120 : 170)}px`, // Reduce space on mobile
            left: `${rect.left + rect.width / 2}px`,
            transform: 'translate(-50%, -100%)',
            maxWidth: isMobile ? '90vw' : undefined,
            width: isMobile ? '320px' : undefined
          };
        case 'bottom':
          return {
            top: `${rect.bottom + extraMargin}px`,
            left: `${rect.left + rect.width / 2}px`,
            transform: 'translate(-50%, 0)',
            maxWidth: isMobile ? '90vw' : undefined,
            width: isMobile ? '320px' : undefined
          };
        case 'left':
          if (isMobile) {
            // On mobile, avoid left positioning which often goes off-screen
            return {
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '90vw',
              width: '320px'
            };
          }
          return {
            top: `${rect.top + rect.height / 2}px`,
            left: `${rect.left - 170}px`,
            transform: 'translate(-100%, -50%)'
          };
        case 'right':
          if (isMobile) {
            // On mobile, avoid right positioning which often goes off-screen
            return {
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '90vw',
              width: '320px'
            };
          }
          return {
            top: `${rect.top + rect.height / 2}px`,
            left: `${rect.right + extraMargin}px`,
            transform: 'translate(0, -50%)'
          };
      }
    }
    
    // Default positioning logic for non-finger steps
    switch (step.position) {
      case 'top':
        return {
          top: `${rect.top - 10}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
          maxWidth: isMobile ? '90vw' : undefined,
          width: isMobile ? '320px' : undefined
        };
      case 'bottom':
        return {
          top: `${rect.bottom + 10}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, 0)',
          maxWidth: isMobile ? '90vw' : undefined,
          width: isMobile ? '320px' : undefined
        };
      case 'left':
        if (isMobile) {
          return {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            width: '320px'
          };
        }
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 10}px`,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        if (isMobile) {
          return {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            width: '320px'
          };
        }
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 10}px`,
          transform: 'translate(0, -50%)'
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: isMobile ? '90vw' : undefined,
          width: isMobile ? '320px' : undefined
        };
    }
  };
  
  // Function to ensure popover stays within viewport - enhanced for mobile
  const constrainToViewport = (position: any) => {
    // Create a shallow copy of the position object
    const constrained = { ...position };
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Assume popover is approximately 320px wide on mobile, larger on desktop
    const popoverWidth = isMobile ? 320 : 400;
    const popoverHeight = isMobile ? 200 : 250;
    const margin = isMobile ? 10 : 20;
    
    // Parse position values if they're strings with px units
    let left = typeof constrained.left === 'string' && constrained.left.endsWith('px') 
      ? parseInt(constrained.left, 10) 
      : null;
    
    let top = typeof constrained.top === 'string' && constrained.top.endsWith('px')
      ? parseInt(constrained.top, 10)
      : null;
    
    // Constrain left position if it's a pixel value
    if (left !== null) {
      // If popover would go off right edge
      if (left + popoverWidth > viewportWidth - margin) {
        constrained.left = `${viewportWidth - popoverWidth - margin}px`;
      }
      
      // If popover would go off left edge
      if (left < margin) {
        constrained.left = `${margin}px`;
      }
    }
    
    // Constrain top position if it's a pixel value
    if (top !== null) {
      // If popover would go off bottom edge
      if (top + popoverHeight > viewportHeight - margin) {
        constrained.top = `${viewportHeight - popoverHeight - margin}px`;
      }
      
      // If popover would go off top edge
      if (top < margin) {
        constrained.top = `${margin}px`;
      }
    }
    
    return constrained;
  };
  
  const rawPosition = getPopoverPosition();
  const popoverPosition = constrainToViewport(rawPosition);
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;
  
  // Debug logging
  console.log('Rendering progress bar - isVerySmallScreen:', isVerySmallScreen, 'showing progress bar:', !isVerySmallScreen);
  
  // Remove all hover effects from the tutorial-interactive class
  useEffect(() => {
    // Add a style element to disable hover transformations
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .tutorial-interactive:hover {
        transform: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  return (
    <motion.div
      className={`absolute z-[9999] bg-white dark:bg-dark-800 rounded-lg shadow-xl p-5 ${isMobile ? 'max-w-[90vw]' : 'max-w-sm'}`}
      style={{
        ...popoverPosition,
        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 10px 15px -3px rgba(0, 0, 0, 0.3)'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress bar - always show */}
      <div className="w-full bg-gray-200 dark:bg-dark-600 h-1 mb-4 rounded-full overflow-hidden">
        <div 
          className="bg-primary-500 h-full rounded-full" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{step.content}</p>
      
      {step.keyboardShortcut && !isMobile && (
        <div className="mb-4 p-2 rounded bg-gray-100 dark:bg-dark-700 text-sm">
          <span className="font-bold">Keyboard shortcut: </span>
          <kbd className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-dark-600 rounded border border-gray-300 dark:border-gray-500 shadow">
            {step.keyboardShortcut}
          </kbd>
        </div>
      )}
      
      {step.requireAction && !canProceed && (
        <div className="mb-4 p-2 rounded bg-amber-100 text-amber-800 text-sm">
          You need to visit the {step.title} page to continue.
        </div>
      )}
      
      <div className="flex justify-between items-center mt-6">
        <div className="flex items-center space-x-2 mr-2">
          <button
            onClick={skipTutorial}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Skip tutorial
          </button>
          
          {/* Step indicator with viewed status - hide on very small screens */}
          {!isVerySmallScreen && (
            <div className="flex items-center">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {currentStep + 1}/{tutorialSteps.length}
              </span>
              <div className="ml-2 flex space-x-1">
                {tutorialSteps.map((tutorialStep, idx) => (
                  <div 
                    key={tutorialStep.id}
                    className={`w-1.5 h-1.5 rounded-full ${
                      idx === currentStep 
                        ? 'bg-primary-500' 
                        : viewedSteps.includes(tutorialStep.id)
                          ? 'bg-gray-400 dark:bg-gray-600' 
                          : 'bg-gray-200 dark:bg-gray-800'
                    }`}
                    title={tutorialStep.title}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 flex-shrink-0">
          {!isFirstStep && (
            <button
              onClick={prevStep}
              className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-600"
            >
              Back
            </button>
          )}
          
          <button
            onClick={isLastStep ? endTutorial : nextStep}
            disabled={step.requireAction && !canProceed}
            className={`px-3 py-1 text-sm rounded-md ${
              step.requireAction && !canProceed
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TutorialPopover; 
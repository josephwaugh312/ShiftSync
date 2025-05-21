import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface ProgressIndicatorProps {
  steps: number;
  currentStep: number;
  labels?: string[];
  className?: string;
  onStepComplete?: (step: number) => void;
  onComplete?: () => void;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  labels = [],
  className = '',
  onStepComplete,
  onComplete
}) => {
  const { playSound } = useSoundEffects();
  const progress = (currentStep / steps) * 100;
  
  // Play sound when step changes
  useEffect(() => {
    if (currentStep > 0) {
      if (currentStep === steps) {
        playSound('complete');
        onComplete?.();
      } else {
        playSound('click');
        onStepComplete?.(currentStep);
      }
    }
  }, [currentStep, steps, playSound, onComplete, onStepComplete]);

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar */}
      <div className="relative w-full h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-primary-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        />
      </div>
      
      {/* Step indicators */}
      <div className="relative flex justify-between mt-2">
        {Array.from({ length: steps }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep - 1;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <motion.div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-primary-500 text-white'
                    : isCurrent
                    ? 'border-2 border-primary-500 bg-white dark:bg-dark-700'
                    : 'border border-gray-300 dark:border-dark-500 bg-white dark:bg-dark-700'
                }`}
                initial={{ scale: 1 }}
                animate={{ 
                  scale: isCurrent ? [1, 1.1, 1] : 1,
                  backgroundColor: isCompleted ? '#4F46E5' : isCurrent ? '#FFFFFF' : '#FFFFFF'
                }}
                transition={{ 
                  scale: { 
                    duration: 0.3,
                    repeat: isCurrent ? 1 : 0,
                    repeatType: 'reverse'
                  } 
                }}
              >
                {isCompleted ? (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </motion.div>
              
              {labels[index] && (
                <span className={`text-xs mt-1 ${
                  isCurrent ? 'font-medium text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {labels[index]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator; 
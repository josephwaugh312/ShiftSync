import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  message: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: JSX.Element;
  isCompact?: boolean;
  tips?: string[];
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  description,
  actionLabel,
  onAction,
  icon,
  isCompact = false,
  tips
}) => {
  const defaultIcon = (
    <svg 
      className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} text-gray-400 dark:text-gray-600`} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1.5} 
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
      />
    </svg>
  );

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center ${isCompact ? 'py-3' : 'py-8'} text-center`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {icon || defaultIcon}
      <h3 className={`mt-2 ${isCompact ? 'text-base' : 'text-lg'} font-medium text-gray-900 dark:text-white`}>
        {message}
      </h3>
      
      {description && (
        <p className={`mt-1 ${isCompact ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 max-w-sm`}>
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <motion.button
          className={`
            mt-3 inline-flex items-center px-4 py-2 
            border border-transparent rounded-md shadow-sm 
            text-sm font-medium text-white bg-primary-600 
            hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 
            ${isCompact ? 'text-xs px-3 py-1.5' : ''}
          `}
          onClick={onAction}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isCompact ? actionLabel : (
            <>
              <svg 
                className="-ml-1 mr-2 h-4 w-4" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {actionLabel}
            </>
          )}
        </motion.button>
      )}
      
      {tips && tips.length > 0 && !isCompact && (
        <div className="mt-4 max-w-md">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Tips:</h4>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-primary-500">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState; 
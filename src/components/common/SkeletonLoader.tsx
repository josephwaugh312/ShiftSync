import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'line' | 'circle' | 'rectangle' | 'card' | 'table';
  width?: string;
  height?: string;
  className?: string;
  repeat?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'line', 
  width, 
  height, 
  className = '',
  repeat = 1 
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 relative overflow-hidden';
  
  // Generate skeleton based on type
  const getSkeletonByType = () => {
    switch (type) {
      case 'circle':
        return (
          <div 
            className={`${baseClasses} rounded-full ${className}`} 
            style={{ 
              width: width || '40px', 
              height: height || '40px' 
            }}
          >
            <Shimmer />
          </div>
        );
      
      case 'rectangle':
        return (
          <div 
            className={`${baseClasses} rounded-md ${className}`} 
            style={{ 
              width: width || '100%', 
              height: height || '100px' 
            }}
          >
            <Shimmer />
          </div>
        );
      
      case 'card':
        return (
          <div className={`${baseClasses} rounded-lg ${className}`} style={{ width: width || '100%' }}>
            <div className="p-4">
              <div className="flex items-center mb-4">
                <div className={`${baseClasses} rounded-full w-12 h-12`}>
                  <Shimmer />
                </div>
                <div className="ml-3 flex-1">
                  <div className={`${baseClasses} h-4 rounded mb-2 w-3/4`}>
                    <Shimmer />
                  </div>
                  <div className={`${baseClasses} h-3 rounded w-1/2`}>
                    <Shimmer />
                  </div>
                </div>
              </div>
              <div className={`${baseClasses} h-24 rounded-md mb-3`}>
                <Shimmer />
              </div>
              <div className="flex justify-between">
                <div className={`${baseClasses} h-8 w-24 rounded`}>
                  <Shimmer />
                </div>
                <div className={`${baseClasses} h-8 w-16 rounded`}>
                  <Shimmer />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'table':
        return (
          <div className={`${baseClasses} rounded-lg overflow-hidden ${className}`} style={{ width: width || '100%' }}>
            <div className={`${baseClasses} h-12`}>
              <Shimmer />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex border-b border-gray-300 dark:border-gray-600">
                <div className={`${baseClasses} h-10 w-1/4 p-2`}>
                  <Shimmer />
                </div>
                <div className={`${baseClasses} h-10 w-1/4 p-2`}>
                  <Shimmer />
                </div>
                <div className={`${baseClasses} h-10 w-1/4 p-2`}>
                  <Shimmer />
                </div>
                <div className={`${baseClasses} h-10 w-1/4 p-2`}>
                  <Shimmer />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'line':
      default:
        return (
          <div 
            className={`${baseClasses} rounded ${className}`} 
            style={{ 
              width: width || '100%', 
              height: height || '16px' 
            }}
          >
            <Shimmer />
          </div>
        );
    }
  };
  
  // Generate a shimmer effect
  const Shimmer = () => (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-gray-600/30 to-transparent"
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
    />
  );
  
  // Generate multiple skeletons if repeat > 1
  if (repeat > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: repeat }).map((_, index) => (
          <React.Fragment key={index}>
            {getSkeletonByType()}
          </React.Fragment>
        ))}
      </div>
    );
  }
  
  return getSkeletonByType();
};

export default SkeletonLoader; 
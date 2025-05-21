import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandedSpinner from './BrandedSpinner';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  transparent?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  message = 'Loading...',
  transparent = false,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`fixed inset-0 z-[9000] flex items-center justify-center ${
            transparent ? 'bg-white/70 dark:bg-dark-800/70' : 'bg-white dark:bg-dark-800'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <BrandedSpinner size="large" color="primary" text={message} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay; 
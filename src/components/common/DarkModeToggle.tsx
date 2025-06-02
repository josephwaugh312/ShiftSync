import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode } from '../../store/uiSlice';
import { RootState } from '../../store';
import { motion } from 'framer-motion';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const DarkModeToggle: React.FC = () => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state: RootState) => state.ui);
  const { playSound } = useSoundEffects();

  const handleDarkModeToggle = () => {
    playSound('toggle');
    dispatch(toggleDarkMode());
  };
  
  // Icon transition variants
  const sunIconVariants = {
    visible: { opacity: 1, rotate: 0, scale: 1 },
    hidden: { opacity: 0, rotate: 45, scale: 0.3 }
  };

  const moonIconVariants = {
    visible: { opacity: 1, rotate: 0, scale: 1 },
    hidden: { opacity: 0, rotate: -45, scale: 0.3 }
  };

  return (
    <motion.button
      onClick={handleDarkModeToggle}
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      whileTap={{ scale: 0.9 }}
    >
      <div className="relative h-6 w-6">
        <motion.svg 
          className="absolute h-6 w-6" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          variants={sunIconVariants}
          animate={darkMode ? "hidden" : "visible"}
          transition={{ duration: 0.7 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </motion.svg>
        <motion.svg 
          className="absolute h-6 w-6" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          variants={moonIconVariants}
          animate={darkMode ? "visible" : "hidden"}
          transition={{ duration: 0.7 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </motion.svg>
      </div>
    </motion.button>
  );
};

export default DarkModeToggle; 
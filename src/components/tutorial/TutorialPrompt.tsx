import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { setModalOpen } from '../../store/uiSlice';

const TutorialPrompt: React.FC = () => {
  const [show, setShow] = useState(false);
  const dispatch = useDispatch();
  const { playSound } = useSoundEffects();

  useEffect(() => {
    // Function to handle the custom event
    const handleShowTutorialPrompt = () => {
      console.log('Tutorial prompt triggered');
      setShow(true);
      playSound('notification');
    };

    // Add event listener
    document.addEventListener('showTutorialPrompt', handleShowTutorialPrompt);

    // Clean up the event listener when component unmounts
    return () => {
      document.removeEventListener('showTutorialPrompt', handleShowTutorialPrompt);
    };
  }, [playSound]);

  const handleStartTutorial = () => {
    // Mark the onboarding as completed in localStorage
    localStorage.setItem('shiftsync_onboarding_completed', 'true');
    
    // Trigger the tutorial mode
    document.dispatchEvent(new CustomEvent('toggleTutorial'));
    
    // Close this prompt
    setShow(false);
    
    // Play a sound
    playSound('success');
  };

  const handleSkipTutorial = () => {
    // Mark the onboarding as completed and dismissed in localStorage
    localStorage.setItem('shiftsync_onboarding_completed', 'true');
    localStorage.setItem('shiftsync_onboarding_dismissed', 'true');
    
    // Close this prompt
    setShow(false);
    
    // Play a sound
    playSound('click');
  };

  const handleAdvancedFeatures = () => {
    // Open the templates modal to show advanced features
    dispatch(setModalOpen({ modal: 'templates', isOpen: true }));
    
    // Close this prompt
    setShow(false);
    
    // Play a sound
    playSound('click');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShow(false)}
        >
          <motion.div
            className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full p-6"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-primary-100 dark:bg-primary-900">
                <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Congratulations!
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You've created your first shift. Would you like to explore some advanced features of ShiftSync?
              </p>
              
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={handleStartTutorial}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Start Interactive Tutorial
                </button>
                
                <button
                  type="button"
                  onClick={handleAdvancedFeatures}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Show Advanced Features
                </button>
                
                <button
                  type="button"
                  onClick={handleSkipTutorial}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-dark-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TutorialPrompt; 
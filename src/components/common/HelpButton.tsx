import React, { useState, useRef, useEffect } from 'react';
import { useTutorial } from '../../contexts/TutorialContext';

const HelpButton: React.FC = () => {
  const { startTutorial, resumeTutorial, isActive } = useTutorial();
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [hasLastStep, setHasLastStep] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Check if user has seen tutorial and has a last completed step
  useEffect(() => {
    const seen = localStorage.getItem('hasSeenTutorial') === 'true';
    const lastStep = localStorage.getItem('lastCompletedStep');
    setHasSeenTutorial(seen);
    setHasLastStep(lastStep !== null);
  }, []);
  
  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        className="help-button p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-dark-700 transition-colors relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Help"
        title="Help"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-dark-800 ring-1 ring-black ring-opacity-5 z-30">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {isActive ? (
              <div className="px-4 py-2 text-sm text-amber-600 dark:text-amber-400">
                Tutorial in progress...
              </div>
            ) : (
              <>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                  role="menuitem"
                  onClick={() => {
                    startTutorial();
                    setIsOpen(false);
                  }}
                >
                  Start Tutorial
                </button>
                
                {hasSeenTutorial && hasLastStep && (
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                    role="menuitem"
                    onClick={() => {
                      resumeTutorial();
                      setIsOpen(false);
                    }}
                  >
                    Resume Tutorial
                  </button>
                )}
              </>
            )}
            
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
              role="menuitem"
              onClick={() => {
                window.open('https://shiftsync-docs.example.com', '_blank');
                setIsOpen(false);
              }}
            >
              Documentation
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
              role="menuitem"
              onClick={() => {
                // Show keyboard shortcuts
                document.dispatchEvent(new CustomEvent('showKeyboardShortcuts'));
                setIsOpen(false);
              }}
            >
              Keyboard Shortcuts
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
              role="menuitem"
              onClick={() => {
                window.open('mailto:support@shiftsync.example.com', '_blank');
                setIsOpen(false);
              }}
            >
              Contact Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpButton; 
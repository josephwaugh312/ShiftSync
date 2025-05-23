import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from './Tooltip';

const KeyboardShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Define keyboard shortcut groups - only include implemented shortcuts
  const shortcuts = [
    {
      title: 'Navigation',
      items: [
        { key: 'Shift + ←', description: 'Previous Week' },
        { key: 'Shift + →', description: 'Next Week' },
        { key: 'Shift + H', description: 'Go to Home' },
        { key: 'Shift + E', description: 'Go to Employees' },
      ],
    },
    {
      title: 'Actions',
      items: [
        { key: 'Shift + N', description: 'Add New Shift' },
        { key: 'Shift + P', description: 'Publish Schedule' },
        { key: 'Shift + I', description: 'View Insights' },
        { key: 'Shift + M', description: 'Open Templates' },
        { key: 'Esc', description: 'Close Modal' },
      ],
    },
    {
      title: 'Help & Tutorial',
      items: [
        { key: 'Shift + T', description: 'Toggle Tutorial' },
        { key: 'Shift + /', description: 'Show Keyboard Shortcuts' },
        { key: '?', description: 'Show Keyboard Shortcuts' },
      ],
    },
  ];

  // Listen for the keyboard shortcut to show the help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open on ? (shift + /)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen(true);
      }
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleShowShortcuts = () => {
      setIsOpen(true);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('showKeyboardShortcuts', handleShowShortcuts);

    // Make this function available globally
    // @ts-ignore
    window.showKeyboardShortcutsHelp = () => setIsOpen(true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('showKeyboardShortcuts', handleShowShortcuts);
      // @ts-ignore
      delete window.showKeyboardShortcutsHelp;
    };
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-4xl mx-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-600 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Keyboard Shortcuts
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {shortcuts.map((group) => (
                      <div key={group.title} className="space-y-3">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-dark-700 pb-2">
                          {group.title}
                        </h3>
                        <div className="space-y-2">
                          {group.items.map((item) => (
                            <div key={item.key} className="flex justify-between">
                              <div className="text-gray-600 dark:text-gray-300">{item.description}</div>
                              <div className="flex space-x-1">
                                {item.key.split(' + ').map((k, i) => (
                                  <React.Fragment key={i}>
                                    {i > 0 && <span className="text-gray-400 dark:text-gray-500">+</span>}
                                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 dark:bg-dark-700 dark:text-gray-200 border border-gray-200 dark:border-dark-600 rounded">
                                      {k}
                                    </kbd>
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-dark-600 px-6 py-4 flex justify-end">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default KeyboardShortcutsHelp; 
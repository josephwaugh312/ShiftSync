import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Shortcut {
  key: string;
  description: string;
}

const ShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  // Format shortcut key for display
  const formatShortcutKey = (key: string): string => {
    return key.split('+').map(part => {
      const trimmed = part.trim();
      switch (trimmed.toLowerCase()) {
        case 'alt':
          return 'Alt';
        case 'ctrl':
          return 'Ctrl';
        case 'shift':
          return 'Shift';
        case 'cmd':
        case 'meta':
          return '⌘';
        case 'esc':
          return 'Esc';
        case 'left':
        case 'arrowleft':
          return '←';
        case 'right':
        case 'arrowright':
          return '→';
        case 'up':
        case 'arrowup':
          return '↑';
        case 'down':
        case 'arrowdown':
          return '↓';
        case '/':
          return '/';
        default:
          return trimmed.length > 1 
            ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
            : trimmed;
      }
    }).join(' + ');
  };

  // Listen for the showKeyboardShortcuts event
  useEffect(() => {
    const handleShowShortcuts = () => {
      console.log('ShowKeyboardShortcuts event received');
      setIsOpen(true);
    };

    document.addEventListener('showKeyboardShortcuts', handleShowShortcuts);

    return () => {
      document.removeEventListener('showKeyboardShortcuts', handleShowShortcuts);
    };
  }, []);

  // Get keyboard shortcuts from window object
  useEffect(() => {
    // @ts-ignore
    if (window.keyboardShortcuts) {
      // @ts-ignore
      const shortcutsObj = window.keyboardShortcuts;
      const shortcutsList = Object.entries(shortcutsObj).map(([key, description]) => ({
        key,
        description: description as string,
      }));

      console.log('Loaded shortcuts:', shortcutsList);
      setShortcuts(shortcutsList);
    } else {
      console.log('No keyboard shortcuts found in window object');
    }
  }, [isOpen]);

  // Handle escape key to close the dialog
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  // Debug logging for isOpen state changes
  useEffect(() => {
    console.log('ShortcutsHelp isOpen state changed:', isOpen);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-[9999] overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</div>

              <motion.div
                className="inline-block align-bottom bg-white dark:bg-dark-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <div className="bg-white dark:bg-dark-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                        Keyboard Shortcuts
                      </h3>
                      <div className="mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          {shortcuts.length > 0 ? (
                            shortcuts.map((shortcut) => (
                              <div key={shortcut.key} className="py-2">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  {shortcut.description}
                                </div>
                                <div className="mt-1">
                                  <code className="bg-gray-100 dark:bg-dark-600 px-2 py-1 rounded text-sm font-mono text-primary-600 dark:text-primary-400">
                                    {formatShortcutKey(shortcut.key)}
                                  </code>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-4">
                              No keyboard shortcuts available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-dark-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="btn-primary sm:ml-3"
                    onClick={() => setIsOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShortcutsHelp; 
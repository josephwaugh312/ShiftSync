import React, { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setModalOpen } from '../../store/uiSlice';
import { shouldPreventKeyboardShortcut, isUserTypingInInputField } from '../../utils/keyboardShortcuts';

interface ShortcutAction {
  key: string;
  description: string;
  action: () => void;
}

const KeyboardShortcuts: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Create a function to show keyboard shortcuts
  const showKeyboardShortcuts = () => {
    // Try both ways to maximize compatibility
    document.dispatchEvent(new CustomEvent('showKeyboardShortcuts'));
    
    // Also try with a slight delay as a fallback
    setTimeout(() => {
      document.dispatchEvent(new Event('showKeyboardShortcuts'));
    }, 100);
  };

  // Define available shortcuts - using shift+ for better compatibility
  const shortcuts: ShortcutAction[] = [
    {
      key: 'shift+n',
      description: 'Add new shift',
      action: () => {
        // Navigate to calendar if not already there
        if (location.pathname !== '/') {
          navigate('/');
        }
        dispatch(setModalOpen({ modal: 'addShift', isOpen: true }));
      },
    },
    {
      key: 'shift+p',
      description: 'Publish schedule',
      action: () => {
        // This will be used to trigger the publish schedule function
        // Will be implemented through the global event system
        document.dispatchEvent(new CustomEvent('publishSchedule'));
      },
    },
    {
      key: 'shift+i',
      description: 'View insights dashboard',
      action: () => {
        dispatch(setModalOpen({ modal: 'insights', isOpen: true }));
      },
    },
    {
      key: 'shift+m',
      description: 'Open templates',
      action: () => {
        dispatch(setModalOpen({ modal: 'templates', isOpen: true }));
      },
    },
    {
      key: 'shift+s',
      description: 'Go to settings',
      action: () => {
        navigate('/settings');
      },
    },
    {
      key: 'shift+e',
      description: 'Go to employees',
      action: () => {
        navigate('/employees');
      },
    },
    {
      key: 'shift+h',
      description: 'Go to home/calendar',
      action: () => {
        navigate('/');
      },
    },
    {
      key: 'shift+arrowleft',
      description: 'Previous week',
      action: () => {
        document.dispatchEvent(new CustomEvent('navigatePreviousWeek'));
      },
    },
    {
      key: 'shift+arrowright',
      description: 'Next week',
      action: () => {
        document.dispatchEvent(new CustomEvent('navigateNextWeek'));
      },
    },
    {
      key: 'esc',
      description: 'Close modal/popup',
      action: () => {
        // This will attempt to close any open modal
        dispatch(setModalOpen({ modal: 'addShift', isOpen: false }));
        dispatch(setModalOpen({ modal: 'editShift', isOpen: false }));
        dispatch(setModalOpen({ modal: 'deleteConfirm', isOpen: false }));
      },
    },
    {
      key: 'shift+/',
      description: 'Show keyboard shortcuts',
      action: showKeyboardShortcuts,
    },
    {
      key: 'shift+t',
      description: 'Toggle tutorial',
      action: () => {
        // Dispatch a custom event that the TutorialContext will listen for
        document.dispatchEvent(new CustomEvent('toggleTutorial'));
      },
    },
  ];

  // Register all hotkeys individually with proper input field detection
  useHotkeys(
    shortcuts[0].key,
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      shortcuts[0].action();
    },
    { 
      enableOnFormTags: false, // Disable to prevent conflicts with input fields
      keyup: false,
      keydown: true,
    },
    [location.pathname, navigate, dispatch]
  );

  useHotkeys(
    shortcuts[1].key,
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      shortcuts[1].action();
    },
    { 
      enableOnFormTags: false,
      keyup: false,
      keydown: true,
    },
    [dispatch]
  );

  useHotkeys(
    shortcuts[2].key,
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      shortcuts[2].action();
    },
    { 
      enableOnFormTags: false,
      keyup: false,
      keydown: true,
    },
    [dispatch]
  );

  useHotkeys(
    shortcuts[3].key,
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      shortcuts[3].action();
    },
    { 
      enableOnFormTags: false,
      keyup: false,
      keydown: true,
    },
    [dispatch]
  );

  useHotkeys(
    shortcuts[4].key,
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      shortcuts[4].action();
    },
    { 
      enableOnFormTags: false,
      keyup: false,
      keydown: true,
    },
    [navigate]
  );

  useHotkeys(
    shortcuts[5].key,
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      shortcuts[5].action();
    },
    { 
      enableOnFormTags: false,
      keyup: false,
      keydown: true,
    },
    [navigate]
  );

  useHotkeys(
    shortcuts[6].key,
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      shortcuts[6].action();
    },
    { 
      enableOnFormTags: false,
      keyup: false,
      keydown: true,
    },
    [navigate]
  );

  useHotkeys(
    shortcuts[7].key,
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      shortcuts[7].action();
    },
    { 
      enableOnFormTags: false,
      keyup: false,
      keydown: true,
    },
    []
  );

  useHotkeys(
    shortcuts[8].key,
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      shortcuts[8].action();
    },
    { 
      enableOnFormTags: false,
      keyup: false,
      keydown: true,
    },
    [dispatch]
  );

  useHotkeys(
    shortcuts[9].key,
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      shortcuts[9].action();
    },
    { 
      enableOnFormTags: false,
      keyup: false,
      keydown: true,
    },
    []
  );

  // Also register '?' key directly as an alternative for shift+/
  useHotkeys(
    '?',
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      showKeyboardShortcuts();
    },
    { 
      enableOnFormTags: false,
      keyup: false,
      keydown: true,
    },
    []
  );

  useHotkeys(
    shortcuts[10].key,
    (event) => {
      if (shouldPreventKeyboardShortcut(event)) return;
      event.preventDefault();
      shortcuts[10].action();
    },
    { 
      enableOnFormTags: false,
      keyup: false,
      keydown: true,
    },
    []
  );

  // Register special keyboard event listener for question mark key with improved input detection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Use the comprehensive input field detection
      if (isUserTypingInInputField(event)) {
        return; // Don't trigger shortcuts when typing in input fields
      }
      
      // Only trigger shortcuts if NOT in an input field
      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        event.preventDefault();
        showKeyboardShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Extra event listener for Shift+H and Shift+T with improved input detection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Use the comprehensive input field detection
      if (isUserTypingInInputField(event)) {
        return; // Don't trigger shortcuts when typing in input fields
      }
      
      // Extra check for Shift+H
      if (event.shiftKey && (event.key === 'h' || event.key === 'H')) {
        event.preventDefault();
        navigate('/');
      }
      
      // Extra check for Shift+T
      if (event.shiftKey && (event.key === 't' || event.key === 'T')) {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent('toggleTutorial'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  // Export shortcut information to window for tooltips
  useEffect(() => {
    // Create a properly typed interface for window
    interface CustomWindow extends Window {
      keyboardShortcuts?: Record<string, string>;
      showKeyboardShortcutsHelp?: () => void;
    }

    // Type assertion for window
    const customWindow = window as CustomWindow;
    
    // Create a properly typed record
    const shortcutsRecord: Record<string, string> = {};
    
    // Populate the record
    shortcuts.forEach(shortcut => {
      shortcutsRecord[shortcut.key] = shortcut.description;
    });
    
    // Add the standalone ? shortcut too
    shortcutsRecord['?'] = 'Show keyboard shortcuts';
    
    // Assign to window
    customWindow.keyboardShortcuts = shortcutsRecord;
    
    // Also provide the function to show shortcuts directly
    customWindow.showKeyboardShortcutsHelp = showKeyboardShortcuts;

    return () => {
      // Clean up
      delete customWindow.keyboardShortcuts;
      delete customWindow.showKeyboardShortcutsHelp;
    };
  }, []);

  return null; // This component doesn't render anything
};

export default KeyboardShortcuts; 
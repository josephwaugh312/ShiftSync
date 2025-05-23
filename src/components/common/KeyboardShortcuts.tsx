import React, { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setModalOpen } from '../../store/uiSlice';

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
    console.log('Dispatching showKeyboardShortcuts event');
    // Try both ways to maximize compatibility
    document.dispatchEvent(new CustomEvent('showKeyboardShortcuts'));
    
    // Also try with a slight delay as a fallback
    setTimeout(() => {
      console.log('Dispatching delayed showKeyboardShortcuts event');
      document.dispatchEvent(new Event('showKeyboardShortcuts'));
    }, 100);
  };

  // Define available shortcuts - using shift+ for better compatibility
  const shortcuts: ShortcutAction[] = [
    {
      key: 'shift+n',
      description: 'Add new shift',
      action: () => {
        console.log('Executing shortcut: Add new shift');
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
        console.log('Executing shortcut: Publish schedule');
        // This will be used to trigger the publish schedule function
        // Will be implemented through the global event system
        document.dispatchEvent(new CustomEvent('publishSchedule'));
      },
    },
    {
      key: 'shift+i',
      description: 'View insights dashboard',
      action: () => {
        console.log('Executing shortcut: View insights dashboard');
        dispatch(setModalOpen({ modal: 'insights', isOpen: true }));
      },
    },
    {
      key: 'shift+m',
      description: 'Open templates',
      action: () => {
        console.log('Executing shortcut: Open templates');
        dispatch(setModalOpen({ modal: 'templates', isOpen: true }));
      },
    },
    {
      key: 'shift+s',
      description: 'Go to settings',
      action: () => {
        console.log('Executing shortcut: Go to settings');
        navigate('/settings');
      },
    },
    {
      key: 'shift+e',
      description: 'Go to employees',
      action: () => {
        console.log('Executing shortcut: Go to employees');
        navigate('/employees');
      },
    },
    {
      key: 'shift+h',
      description: 'Go to home/calendar',
      action: () => {
        console.log('Executing shortcut: Go to home/calendar');
        navigate('/');
      },
    },
    {
      key: 'shift+arrowleft',
      description: 'Previous week',
      action: () => {
        console.log('Executing shortcut: Previous week');
        document.dispatchEvent(new CustomEvent('navigatePreviousWeek'));
      },
    },
    {
      key: 'shift+arrowright',
      description: 'Next week',
      action: () => {
        console.log('Executing shortcut: Next week');
        document.dispatchEvent(new CustomEvent('navigateNextWeek'));
      },
    },
    {
      key: 'esc',
      description: 'Close modal/popup',
      action: () => {
        console.log('Executing shortcut: Close modals');
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
        console.log('Executing shortcut: Toggle tutorial');
        // Dispatch a custom event that the TutorialContext will listen for
        document.dispatchEvent(new CustomEvent('toggleTutorial'));
      },
    },
  ];

  // Register all hotkeys individually
  useHotkeys(
    shortcuts[0].key,
    (event) => {
      event.preventDefault();
      shortcuts[0].action();
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    [location.pathname, navigate, dispatch]
  );

  useHotkeys(
    shortcuts[1].key,
    (event) => {
      event.preventDefault();
      shortcuts[1].action();
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    [dispatch]
  );

  useHotkeys(
    shortcuts[2].key,
    (event) => {
      event.preventDefault();
      shortcuts[2].action();
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    [dispatch]
  );

  useHotkeys(
    shortcuts[3].key,
    (event) => {
      event.preventDefault();
      shortcuts[3].action();
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    [dispatch]
  );

  useHotkeys(
    shortcuts[4].key,
    (event) => {
      event.preventDefault();
      shortcuts[4].action();
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    [navigate]
  );

  useHotkeys(
    shortcuts[5].key,
    (event) => {
      event.preventDefault();
      shortcuts[5].action();
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    [navigate]
  );

  useHotkeys(
    shortcuts[6].key,
    (event) => {
      event.preventDefault();
      shortcuts[6].action();
      console.log('Executing Shift+H shortcut via useHotkeys');
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    [navigate]
  );

  useHotkeys(
    shortcuts[7].key,
    (event) => {
      event.preventDefault();
      shortcuts[7].action();
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    []
  );

  useHotkeys(
    shortcuts[8].key,
    (event) => {
      event.preventDefault();
      shortcuts[8].action();
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    [dispatch]
  );

  useHotkeys(
    shortcuts[9].key,
    (event) => {
      event.preventDefault();
      console.log('Shift+/ shortcut triggered');
      shortcuts[9].action();
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    []
  );

  // Also register '?' key directly as an alternative for shift+/
  useHotkeys(
    '?',
    (event) => {
      event.preventDefault();
      console.log('? shortcut triggered');
      showKeyboardShortcuts();
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    []
  );

  useHotkeys(
    shortcuts[10].key,
    (event) => {
      event.preventDefault();
      shortcuts[10].action();
    },
    { 
      enableOnFormTags: true,
      keyup: false,
      keydown: true,
    },
    []
  );

  // Register special keyboard event listener for question mark key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for plain ? key (Shift + /)
      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        console.log('Question mark key detected via raw event listener');
        event.preventDefault();
        showKeyboardShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Extra event listener for Shift+H to ensure it works
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Extra check for Shift+H
      if (event.shiftKey && (event.key === 'h' || event.key === 'H')) {
        console.log('Shift+H detected via raw event listener');
        event.preventDefault();
        console.log('Executing shortcut: Go to home/calendar');
        navigate('/');
      }
      
      // Extra check for Shift+T
      if (event.shiftKey && (event.key === 't' || event.key === 'T')) {
        console.log('Shift+T detected via raw event listener');
        event.preventDefault();
        console.log('Executing shortcut: Toggle tutorial');
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
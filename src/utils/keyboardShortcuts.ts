import { store } from '../store';
import { setCurrentView, toggleDarkMode, toggleHighContrastMode, toggleDyslexicFontMode, setModalOpen } from '../store/uiSlice';
import { setSelectedDate } from '../store/shiftsSlice';

/**
 * Register global keyboard shortcuts for the application
 * This is a simplified version meant to complement the KeyboardShortcuts component
 */
export const registerKeyboardShortcuts = (): void => {
  // Write to console for debugging
  console.log('Registering global keyboard shortcuts from utils/keyboardShortcuts.ts');
  
  // Register document-level event listeners without overriding React hotkeys
  document.addEventListener('navigatePreviousWeek', () => {
    console.log('Custom event: navigatePreviousWeek received');
    // This event will be handled by respective components
  });
  
  document.addEventListener('navigateNextWeek', () => {
    console.log('Custom event: navigateNextWeek received');
    // This event will be handled by respective components
  });
  
  document.addEventListener('publishSchedule', () => {
    console.log('Custom event: publishSchedule received');
    // This event will be handled by respective components
  });
  
  document.addEventListener('showKeyboardShortcuts', () => {
    console.log('Custom event: showKeyboardShortcuts received');
    // This event will be handled by the KeyboardShortcutsHelp component
  });
  
  console.log('Global keyboard shortcuts registered successfully');
};

/**
 * Helper function to format a date to YYYY-MM-DD string
 */
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}; 
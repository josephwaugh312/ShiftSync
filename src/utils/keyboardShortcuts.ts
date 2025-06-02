import { store } from '../store';
import { setCurrentView, toggleDarkMode, toggleHighContrastMode, toggleDyslexicFontMode, setModalOpen } from '../store/uiSlice';
import { setSelectedDate } from '../store/shiftsSlice';

/**
 * Check if the user is currently typing in an input field
 * This is especially important for employee name fields to prevent keyboard shortcuts
 * from triggering when users are capitalizing letters in names
 */
export const isUserTypingInInputField = (event?: Event | KeyboardEvent): boolean => {
  // Get the target element from the event or the currently focused element
  const target = (event?.target as HTMLElement) || document.activeElement as HTMLElement;
  
  if (!target) return false;
  
  // Check various ways an element could be an input field
  const isInputField = (
    // Direct input elements
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    
    // Contenteditable elements
    target.isContentEditable ||
    target.getAttribute('contenteditable') === 'true' ||
    
    // Elements with input roles
    target.getAttribute('role') === 'textbox' ||
    target.getAttribute('role') === 'combobox' ||
    
    // Elements inside input containers (for complex input components)
    target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"]') !== null ||
    
    // Specific checks for employee name fields and other form inputs
    target.getAttribute('name')?.includes('employee') ||
    target.getAttribute('name')?.includes('name') ||
    target.getAttribute('placeholder')?.toLowerCase().includes('employee') ||
    target.getAttribute('placeholder')?.toLowerCase().includes('name') ||
    target.getAttribute('aria-label')?.toLowerCase().includes('employee') ||
    target.getAttribute('aria-label')?.toLowerCase().includes('name') ||
    
    // Check parent elements for form context
    target.closest('.employee-form, .shift-form, .template-form, form') !== null
  );
  
  // Additional check: if we're in a React DatePicker or similar component
  const isInDatePicker = target.closest('.react-datepicker, .react-datepicker__input-container') !== null;
  
  return isInputField || isInDatePicker;
};

/**
 * Enhanced keyboard event handler that respects input field focus
 * Returns true if the event should be prevented/ignored, false if it should proceed
 */
export const shouldPreventKeyboardShortcut = (event: KeyboardEvent): boolean => {
  // Always allow ESC key to work (for closing modals)
  if (event.key === 'Escape') {
    return false;
  }
  
  // Check if user is typing in an input field
  if (isUserTypingInInputField(event)) {
    console.log('Keyboard shortcut prevented: User is typing in input field', {
      target: event.target,
      tagName: (event.target as HTMLElement)?.tagName,
      name: (event.target as HTMLElement)?.getAttribute('name'),
      placeholder: (event.target as HTMLElement)?.getAttribute('placeholder')
    });
    return true;
  }
  
  return false;
};

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
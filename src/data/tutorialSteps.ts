export interface TutorialStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'center-bottom';
  action?: () => void; // Optional function to trigger on step completion
  showPointer?: boolean; // Whether to show a pointing finger icon
  requireAction?: boolean; // Whether to require an action to proceed to next step
  keyboardShortcut?: string; // Optional keyboard shortcut to display
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    target: 'body', // Initially target the whole page
    title: 'Welcome to ShiftSync!',
    content: 'This tutorial will guide you through the key features to help you schedule shifts efficiently. Press Alt+T anytime to toggle the tutorial on/off.',
    position: 'center',
    keyboardShortcut: 'Alt+T',
  },
  {
    id: 'calendar',
    target: 'main .overflow-y-auto, main > div', // More specific target for calendar container
    title: 'Calendar View',
    content: 'This is your main schedule view where you can see all shifts organized by day or week. Use the navigation controls to move between dates or change the view.',
    position: 'center-bottom', // Position at bottom center to avoid hiding behind the calendar
    keyboardShortcut: 'Alt+C',
  },
  {
    id: 'employee-management',
    target: 'a[href="/employees"]',
    title: 'Employee Management',
    content: 'Before adding shifts, you\'ll need to add employees to your team. This page allows you to manage staff members, roles, and contact information.',
    position: 'right',
    showPointer: true,
    keyboardShortcut: 'Alt+E',
  },
  {
    id: 'add-shift',
    target: 'button[aria-label="Add shift"], button[aria-label="Add Shift"]',
    title: 'Add New Shifts',
    content: 'Click any of the highlighted "Add Shift" buttons to create a new shift. You can assign an employee to a specific time slot along with their role and other important details.',
    position: 'center',
    showPointer: true,
    keyboardShortcut: 'Alt+A',
  },
  {
    id: 'recurring-shifts',
    target: 'div[class*="rounded-full"] svg[viewBox="0 0 24 24"][stroke="currentColor"]',
    title: 'Recurring Shifts',
    content: 'Need the same shift repeated? Use the recurring feature to create daily, weekly, or monthly patterns. This saves time when scheduling regular shifts.',
    position: 'center',
    showPointer: true,
    keyboardShortcut: 'Alt+R',
  },
  {
    id: 'shift-templates',
    target: 'button[aria-label="Shift templates"]',
    title: 'Shift Templates',
    content: 'Create templates for common shifts with predefined roles, hours, and break times. Apply templates with just a few clicks to quickly schedule your team.',
    position: 'bottom',
    showPointer: true,
    keyboardShortcut: 'Alt+T',
  },
  {
    id: 'insights',
    target: 'button[aria-label="View insights"]',
    title: 'Insights Dashboard',
    content: 'View analytics about your scheduling patterns, staffing levels, and employee hours. Use these insights to optimize your scheduling and labor costs.',
    position: 'bottom',
    keyboardShortcut: 'Alt+I',
  },
  {
    id: 'help',
    target: 'button[aria-label="Help"]',
    title: 'Need Help?',
    content: 'You can restart this tutorial anytime from the Help menu. We\'ve also included tooltips and keyboard shortcuts throughout the app to help you work faster.',
    position: 'bottom', // Changed from 'left' to 'bottom' to prevent rendering off-screen
    keyboardShortcut: 'Alt+H',
  },
  {
    id: 'finish',
    target: 'body',
    title: 'You\'re All Set!',
    content: 'You\'ve completed the tutorial! Now you can start scheduling your team efficiently with ShiftSync. Remember, you can restart the tutorial anytime from the Help menu.',
    position: 'center-bottom',
  },
]; 
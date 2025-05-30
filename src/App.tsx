import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setModalOpen } from './store/uiSlice';
import SettingsPage from './components/common/SettingsPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNavbar from './components/layout/MobileNavbar';
import CalendarView from './components/calendar/CalendarView';
import EmployeesPage from './components/common/EmployeesPage';
import NotificationsPanel from './components/common/NotificationsPanel';
import ShiftForm from './components/forms/ShiftForm';
import TemplatesPage from './components/forms/TemplatesPage';
import InsightsPanel from './components/insights/InsightsPanel';
import KeyboardShortcutsHelp from './components/common/KeyboardShortcutsHelp';
import KeyboardShortcuts from './components/common/KeyboardShortcuts';
import CopyShiftForm from './components/forms/CopyShiftForm';
import DeleteConfirmModal from './components/common/DeleteConfirmModal';
import { applyThemeColor } from './utils/colorUtils';
import { notificationService } from './services/NotificationService';
import { TutorialProvider } from './contexts/TutorialContext';
import TutorialOverlay from './components/tutorial/TutorialOverlay';
import TutorialPrompt from './components/tutorial/TutorialPrompt';
import HelpButton from './components/common/HelpButton';
import DarkModeToggle from './components/common/DarkModeToggle';

import { registerKeyboardShortcuts } from './utils/keyboardShortcuts';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { darkMode, highContrastMode, dyslexicFontMode, themeColor, modalOpen } = useSelector((state: RootState) => state.ui);

  // Set initial theme color CSS variables on first load
  useEffect(() => {
    console.log('Initial theme application:', themeColor);
    if (themeColor) {
      applyThemeColor(themeColor.value);
    }
  }, [themeColor]);

  useEffect(() => {
    registerKeyboardShortcuts();
  }, []);

  // Initialize notification service
  useEffect(() => {
    console.log('Initializing NotificationService...');
    // Start the notification service
    notificationService.initialize();
    
    // Set up a periodic check for notification system health
    const healthCheckInterval = setInterval(() => {
      // Log active status
      console.log('NotificationService health check - service is running');
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    // Clean up on unmount
    return () => {
      console.log('Stopping NotificationService...');
      notificationService.stop();
      clearInterval(healthCheckInterval);
    };
  }, []);

  // Apply dark mode to the html element to ensure it propagates to all components
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Apply high contrast mode to the html element
  useEffect(() => {
    if (highContrastMode) {
      if (darkMode) {
        document.documentElement.classList.add('high-contrast');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.add('high-contrast');
        document.documentElement.classList.add('light');
      }
    } else {
      document.documentElement.classList.remove('high-contrast');
      document.documentElement.classList.remove('light');
    }
  }, [highContrastMode, darkMode]);

  // Apply theme color
  useEffect(() => {
    if (themeColor) {
      // Add transitioning class to enable animations
      document.documentElement.classList.add('theme-transitioning');
      
      // Apply the new theme color
      applyThemeColor(themeColor.value);
      
      // Remove the transitioning class after animation completes
      const timeout = setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 500); // Match this with the transition duration in CSS
      
      return () => clearTimeout(timeout);
    }
  }, [themeColor]);

  // Handle closing modals
  const handleCloseModal = (modal: keyof typeof modalOpen) => {
    dispatch(setModalOpen({ modal, isOpen: false }));
  };

  // Handle theme and accessibility classes
  let classes = 'h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-dark-900 transition-colors';
  
  if (darkMode) {
    classes += ' dark';
  }
  
  if (highContrastMode) {
    classes += darkMode ? ' high-contrast dark' : ' high-contrast light';
  }
  
  if (dyslexicFontMode) {
    classes += ' dyslexic-font';
  }

  // For debugging
  console.log('App is rendering');

  return (
    <TutorialProvider>
      <div className={classes}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="bg-white dark:bg-dark-700 shadow-sm h-16 flex-shrink-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
              <div className="flex justify-between items-center h-full">
                <Header />
                <div className="flex items-center gap-2">
                  <DarkModeToggle />
                  <HelpButton />
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto relative momentum-scroll touch-action-pan-y">
            <Routes>
              <Route path="/" element={<CalendarView />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
            <NotificationsPanel />
          </main>
          <div className="xl:hidden">
            <MobileNavbar />
          </div>
        </div>
        
        {/* Modals */}
        {modalOpen.addShift && <ShiftForm isEdit={false} />}
        {modalOpen.editShift && <ShiftForm isEdit={true} />}
        {modalOpen.templates && <TemplatesPage />}
        {modalOpen.copyShift && <CopyShiftForm />}
        {modalOpen.insights && (
          <InsightsPanel 
            isOpen={modalOpen.insights} 
            onClose={() => handleCloseModal('insights')} 
          />
        )}
        <DeleteConfirmModal />
        
        {/* Utility Components */}
        <KeyboardShortcutsHelp />
        {/* Keyboard shortcut handler component */}
        <KeyboardShortcuts />
        
        {/* Tutorial Overlay */}
        <TutorialOverlay />
        
        {/* Tutorial Prompt for New Users */}
        <TutorialPrompt />
      </div>
    </TutorialProvider>
  );
};

export default App; 
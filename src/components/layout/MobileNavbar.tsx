import React from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { setModalOpen } from '../../store/uiSlice';
import GestureDetector from '../mobile/GestureDetector';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const MobileNavbar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { playSound } = useSoundEffects();

  // Haptic feedback function (if available)
  const triggerHapticFeedback = () => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(15); // Short vibration for feedback
      }
    } catch (error) {
      // Silently handle haptic feedback errors
      console.debug('Haptic feedback not available:', error);
    }
  };

  const safePlaySound = (sound: string, volume?: number) => {
    try {
      playSound(sound, volume);
    } catch (error) {
      // Silently handle sound playback errors
      console.debug('Sound playback failed:', error);
    }
  };

  const safeNavigate = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      // Silently handle navigation errors
      console.debug('Navigation failed:', error);
    }
  };

  const handleAddShift = () => {
    // Trigger haptic feedback
    triggerHapticFeedback();
    
    // Play sound effect
    safePlaySound('click');
    
    // If not on the calendar page, navigate to it first
    if (location.pathname !== '/') {
      safeNavigate('/');
    }
    
    // Then open the add shift modal
    dispatch(setModalOpen({ modal: 'addShift', isOpen: true }));
  };

  const handleSwipeLeft = () => {
    // Play swipe sound
    safePlaySound('notification', 0.3);
    
    // Go to next page in sequence
    if (location.pathname === '/') {
      safeNavigate('/employees');
    } else if (location.pathname === '/employees') {
      safeNavigate('/settings');
    }
  };

  const handleSwipeRight = () => {
    // Play swipe sound
    safePlaySound('notification', 0.3);
    
    // Go to previous page in sequence
    if (location.pathname === '/settings') {
      safeNavigate('/employees');
    } else if (location.pathname === '/employees') {
      safeNavigate('/');
    }
  };

  const handleNavClick = () => {
    triggerHapticFeedback();
    safePlaySound('click');
  };

  return (
    <GestureDetector
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
    >
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-700 shadow-lg border-t border-gray-200 dark:border-dark-600 h-20 px-4 flex items-start justify-between z-50 pt-2">
        <NavLink
          to="/"
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 p-2 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`
          }
          end
          onClick={handleNavClick}
        >
          <div className="flex flex-col items-center">
            <svg className="h-6 w-6 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Calendar</span>
          </div>
        </NavLink>

        <NavLink
          to="/employees"
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 p-2 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`
          }
          onClick={handleNavClick}
        >
          <div className="flex flex-col items-center">
            <svg className="h-6 w-6 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs font-medium">Employees</span>
          </div>
        </NavLink>

        <button
          onClick={handleAddShift}
          className="flex-1 flex flex-col items-center justify-start p-1 text-primary-600 dark:text-primary-400 pt-1"
        >
          <div className="flex flex-col items-center">
            <div className="bg-primary-600 rounded-full p-1.5 shadow-lg">
              <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-xs font-bold mt-1">Add Shift</span>
          </div>
        </button>

        <NavLink
          to="/settings"
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 p-2 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`
          }
          onClick={handleNavClick}
        >
          <div className="flex flex-col items-center">
            <svg className="h-6 w-6 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium">Settings</span>
          </div>
        </NavLink>
      </div>
    </GestureDetector>
  );
};

export default MobileNavbar; 
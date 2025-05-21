import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Shift } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import GestureDetector from './GestureDetector';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface TodayGlanceWidgetProps {
  className?: string;
}

const TodayGlanceWidget: React.FC<TodayGlanceWidgetProps> = ({ className = '' }) => {
  const { shifts } = useSelector((state: RootState) => state.shifts);
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [widgetHeight, setWidgetHeight] = useState(0);
  const { playSound } = useSoundEffects();

  // Get today's date in YYYY-MM-DD format exactly as the store does
  const getTodayDateString = (): string => {
    const dateString = new Date().toISOString().split('T')[0];
    // Clean any spaces from the string to match store format
    return dateString.replace(/\s+/g, '');
  };

  // Trigger haptic feedback if available
  const triggerHapticFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  useEffect(() => {
    // Filter shifts for today
    const today = getTodayDateString();
    
    const filteredShifts = shifts.filter(shift => shift.date === today);
    
    // Sort by start time
    const sortedShifts = filteredShifts.sort((a, b) => {
      const aTime = a.startTime.split(':').map(Number);
      const bTime = b.startTime.split(':').map(Number);
      
      // Compare hours first
      if (aTime[0] !== bTime[0]) return aTime[0] - bTime[0];
      
      // Then compare minutes
      return aTime[1] - bTime[1];
    });
    
    setTodayShifts(sortedShifts);
    
    // Show widget if there are shifts for today
    if (window.innerWidth < 768) {
      setIsVisible(sortedShifts.length > 0);
    }
  }, [shifts]);
  
  // Measure and update widget height when visibility changes
  useEffect(() => {
    // Using a timeout to wait for the animation to complete
    if (isVisible) {
      const timer = setTimeout(() => {
        const widgetElement = document.getElementById('today-glance-content');
        if (widgetElement) {
          setWidgetHeight(widgetElement.offsetHeight + 40); // Add header height
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setWidgetHeight(40); // Header height only when collapsed
    }
  }, [isVisible, todayShifts]);
  
  // Toggle widget visibility with haptic feedback
  const toggleVisibility = () => {
    triggerHapticFeedback();
    playSound(isVisible ? 'toggle' : 'click');
    setIsVisible(!isVisible);
  };

  // Listen for swipe gestures to hide/show widget
  const handleSwipeUp = () => {
    if (!isVisible) {
      toggleVisibility();
    }
  };

  const handleSwipeDown = () => {
    if (isVisible) {
      toggleVisibility();
    }
  };

  // Play a sound when opening/loading the widget for the first time
  useEffect(() => {
    if (todayShifts && todayShifts.length > 0) {
      playSound('notification', 0.3);
    }
  }, [todayShifts, playSound]);

  // Only display on mobile devices
  if (typeof window !== 'undefined' && window.innerWidth >= 768) return null;

  // Determine if we have any shifts to show
  const hasShifts = todayShifts && todayShifts.length > 0;

  return (
    <>
      {/* This div provides spacing for the content below the widget */}
      <div style={{ height: `${widgetHeight}px` }} className="w-full" />
      
      <GestureDetector
        onSwipeUp={handleSwipeUp}
        onSwipeDown={handleSwipeDown}
      >
        <div className={`${className} absolute top-16 left-0 right-0 z-30`}>
          <motion.button 
            className="w-full flex items-center justify-center py-2 bg-white dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600 shadow-sm"
            onClick={toggleVisibility}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              Today at a Glance
            </span>
            <svg 
              className={`ml-1 h-4 w-4 text-gray-500 transform transition-transform ${isVisible ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
          
          <AnimatePresence>
            {isVisible && (
              <motion.div
                id="today-glance-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full bg-white dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600 shadow-md overflow-hidden"
              >
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Today's Schedule
                  </h2>
                  
                  {!hasShifts ? (
                    <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                      <svg className="mx-auto h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>No shifts scheduled for today</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {todayShifts.map(shift => (
                        <motion.div
                          key={shift.id}
                          whileTap={{ scale: 0.98 }}
                          className="bg-gray-50 dark:bg-dark-600 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-dark-500 active:scale-95 transition-transform"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">{shift.employeeName}</h3>
                              <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  shift.role === 'Manager' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                                  shift.role === 'Server' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100' :
                                  shift.role === 'Cook' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                                  shift.role === 'Front Desk' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                                }`}>
                                  {shift.role}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{shift.timeRange}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {shift.status === 'Confirmed' && (
                                  <span className="inline-flex items-center text-green-600 dark:text-green-400">
                                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {shift.status}
                                  </span>
                                )}
                                {shift.status === 'Pending' && (
                                  <span className="inline-flex items-center text-yellow-600 dark:text-yellow-400">
                                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {shift.status}
                                  </span>
                                )}
                                {shift.status === 'Canceled' && (
                                  <span className="inline-flex items-center text-red-600 dark:text-red-400">
                                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    {shift.status}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GestureDetector>
    </>
  );
};

export default TodayGlanceWidget;

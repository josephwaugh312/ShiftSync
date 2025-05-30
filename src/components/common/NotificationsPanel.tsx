import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../../store';
import { removeNotification, markNotificationAsRead } from '../../store/uiSlice';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const NotificationsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications, notificationPreferences } = useSelector((state: RootState) => state.ui);
  const { playSound } = useSoundEffects();

  // Play sound when a new notification arrives
  useEffect(() => {
    if (notifications.length === 0) return;

    // Get the latest notification
    const latestNotification = notifications[notifications.length - 1];
    
    // Only play sound if enabled in preferences
    if (notificationPreferences.enabled && notificationPreferences.sound.enabled) {
      const volume = notificationPreferences.sound.volume;
      playSound('notification', volume);
    }
  }, [notifications.length, notificationPreferences.enabled, 
      notificationPreferences.sound.enabled, notificationPreferences.sound.volume, playSound]);

  // Auto-dismiss notifications based on user preferences
  useEffect(() => {
    if (notifications.length === 0) return;
    if (!notificationPreferences.enabled) return;
    
    // Don't auto-dismiss if duration is set to 0 (manual dismiss only)
    if (notificationPreferences.visual.duration === 0) return;

    // Get the latest notification
    const latestNotification = notifications[notifications.length - 1];
    
    // Set a timeout to remove this notification based on user preference
    const timeout = setTimeout(() => {
      dispatch(removeNotification(latestNotification.id));
    }, notificationPreferences.visual.duration);

    // Clean up the timeout when component unmounts or when notifications change
    return () => clearTimeout(timeout);
  }, [notifications, dispatch, notificationPreferences.enabled, notificationPreferences.visual.duration]);

  // Handle manual dismiss
  const handleDismiss = (id: string) => {
    dispatch(removeNotification(id));
  };

  // Handle notification click
  const handleNotificationClick = (id: string) => {
    dispatch(markNotificationAsRead(id));
  };

  // Filter notifications based on user preferences
  const filteredNotifications = notifications.filter(notification => {
    if (!notificationPreferences.enabled) return false;
    
    // Filter by notification category if specified
    if (notification.category) {
      return notificationPreferences.types[notification.category as keyof typeof notificationPreferences.types];
    }
    
    return true;
  });

  // Don't render anything if notifications are disabled
  if (!notificationPreferences.enabled || filteredNotifications.length === 0) {
    return null;
  }

  // Get icon for notification type
  const getNotificationIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Get category icon if color coding is enabled
  const getCategoryIcon = (category?: string): JSX.Element | null => {
    if (!category || !notificationPreferences.visual.colorCoded) return null;

    switch (category) {
      case 'shifts':
        return (
          <svg className="h-4 w-4 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'scheduleChanges':
        return (
          <svg className="h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'reminders':
        return (
          <svg className="h-4 w-4 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case 'timeOff':
        return (
          <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
      case 'publication':
        return (
          <svg className="h-4 w-4 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'shiftSwap':
        return (
          <svg className="h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'general':
        return (
          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get background color based on notification type
  const getNotificationBg = (type: string, category?: string): string => {
    // Base styles based on notification type
    let baseStyle = '';
    switch (type) {
      case 'success':
        baseStyle = 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-700';
        break;
      case 'error':
        baseStyle = 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700';
        break;
      case 'warning':
        baseStyle = 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-700';
        break;
      default:
        baseStyle = 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-700';
    }

    // Add category-specific styling if color coding is enabled
    if (category && notificationPreferences.visual.colorCoded) {
      switch (category) {
        case 'shifts':
          return 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 dark:border-primary-700';
        case 'scheduleChanges':
          return 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-700';
        case 'reminders':
          return 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-700';
        case 'timeOff':
          return 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-700';
        case 'publication':
          return 'bg-teal-50 dark:bg-teal-900/20 border-teal-400 dark:border-teal-700';
        case 'shiftSwap':
          return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-700';
        case 'general':
          return 'bg-gray-50 dark:bg-gray-900/20 border-gray-400 dark:border-gray-700';
        default:
          return baseStyle;
      }
    }

    return baseStyle;
  };

  // Get style variants based on user preference
  const getStyleVariants = () => {
    switch (notificationPreferences.visual.style) {
      case 'minimal':
        return {
          container: 'py-2 px-3',
          initial: { opacity: 0, y: 20, scale: 0.9 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
          shadow: 'shadow-sm',
        };
      case 'prominent':
        return {
          container: 'p-4 rounded-md',
          initial: { opacity: 0, y: 50, scale: 0.5 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, scale: 0.5, transition: { duration: 0.25 } },
          shadow: 'shadow-lg',
        };
      default: // standard
        return {
          container: 'p-3 rounded-lg',
          initial: { opacity: 0, y: 30, scale: 0.8 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
          shadow: 'shadow-md',
        };
    }
  };

  const styleVariants = getStyleVariants();

  return (
    <div className="fixed bottom-20 xl:bottom-4 right-4 z-50 w-full max-w-sm">
      <AnimatePresence>
        {filteredNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            className={`mb-2 border-l-4 ${styleVariants.container} ${styleVariants.shadow} ${getNotificationBg(notification.type, notification.category)}`}
            initial={styleVariants.initial}
            animate={styleVariants.animate}
            exit={styleVariants.exit}
            layout
            onClick={() => handleNotificationClick(notification.id)}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  {notification.category && getCategoryIcon(notification.category)}
                  {notification.category && <span className="mx-1">·</span>}
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {notification.message}
                  </p>
                </div>
                {!notification.read && notificationPreferences.visual.showBadges && (
                  <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    New
                  </span>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="inline-flex text-gray-400 focus:outline-none hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(notification.id);
                  }}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPanel; 
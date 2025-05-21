import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { removeNotification } from '../../store/uiSlice';
import { RootState } from '../../store';

const NotificationContainer: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state: RootState) => state.ui);

  // Automatically remove notifications after 6 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notifications[0].id));
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications, dispatch]);

  const getNotificationClasses = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
      case 'success':
        return 'bg-success-100 border-success-500 text-success-700 dark:bg-success-800 dark:text-success-200';
      case 'error':
        return 'bg-danger-100 border-danger-500 text-danger-700 dark:bg-danger-800 dark:text-danger-200';
      case 'warning':
        return 'bg-warning-100 border-warning-500 text-warning-700 dark:bg-warning-800 dark:text-warning-200';
      case 'info':
        return 'bg-primary-100 border-primary-500 text-primary-700 dark:bg-primary-800 dark:text-primary-200';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getNotificationIcon = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-5 w-5 text-success-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5 text-danger-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5 text-warning-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`${getNotificationClasses(notification.type)} border-l-4 rounded-md p-4 mb-3 shadow-lg flex items-start`}
            layout
          >
            <div className="flex-shrink-0 mr-3">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dispatch(removeNotification(notification.id))}
              className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationContainer; 
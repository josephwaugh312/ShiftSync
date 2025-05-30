import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../../store';
import { setCurrentView } from '../../store/uiSlice';
import { useSoundEffects } from '../../hooks/useSoundEffects';

type ViewType = 'daily' | 'weekly' | 'staff' | 'list';

interface ViewOption {
  id: ViewType;
  label: string;
  icon: JSX.Element;
}

const ViewToggle: React.FC = () => {
  const dispatch = useDispatch();
  const currentView = useSelector((state: RootState) => state.ui.currentView);
  const { playSound } = useSoundEffects();

  const viewOptions: ViewOption[] = [
    {
      id: 'daily',
      label: 'Day',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'weekly',
      label: 'Week',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'list',
      label: 'List',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
  ];

  const handleViewChange = (view: ViewOption) => {
    if (view.id !== currentView) {
      playSound('toggle');
      dispatch(setCurrentView(view.id));
    }
  };

  return (
    <div className="flex items-center justify-center bg-white dark:bg-dark-700 shadow-sm rounded-lg border border-gray-200 dark:border-dark-600 p-1 mb-4">
      {viewOptions.map((view) => (
        <motion.button
          key={view.id}
          onClick={() => handleViewChange(view)}
          className={`flex items-center justify-center px-3 py-2 rounded-md mx-1 text-sm focus:outline-none transition-colors ${
            currentView === view.id
              ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-600'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          role="tab"
          aria-selected={currentView === view.id}
          aria-controls={`${view.id}-view`}
        >
          <span className="mr-1">{view.icon}</span>
          <span className="hidden sm:inline">{view.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default ViewToggle; 
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeatmapView from './HeatmapView';
import StaffingLevelsView from './StaffingLevelsView';
import EmployeeHoursView from './EmployeeHoursView';
import TimelineView from './TimelineView';
import DashboardView from './DashboardView';

interface InsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'heatmap' | 'staffing' | 'hours' | 'timeline'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'heatmap', label: 'Heatmap', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'staffing', label: 'Staffing', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'hours', label: 'Hours', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'timeline', label: 'Timeline', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  // Define animation variants for tab transitions
  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-[calc(16rem+1rem)] md:right-4 bg-white dark:bg-dark-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-dark-600 flex flex-col"
        style={{ maxHeight: 'calc(100vh - 8rem)' }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-dark-600 flex justify-between items-center sticky top-0 bg-white dark:bg-dark-800 z-20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <svg className="h-5 w-5 mr-2 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Schedule Insights
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex border-b border-gray-200 dark:border-dark-600 overflow-x-auto sticky top-[4.5rem] bg-white dark:bg-dark-800 z-20 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap flex items-center transition-colors ${
                activeTab === tab.id 
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabContentVariants}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="h-full overflow-y-auto momentum-scroll touch-action-pan-y"
              >
                <div className="p-4 pb-6">
                  <DashboardView />
                </div>
              </motion.div>
            )}
            
            {activeTab === 'heatmap' && (
              <motion.div
                key="heatmap"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabContentVariants}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="h-full overflow-y-auto momentum-scroll touch-action-pan-y"
              >
                <div className="p-4 pb-6">
                  <HeatmapView />
                </div>
              </motion.div>
            )}
            
            {activeTab === 'staffing' && (
              <motion.div
                key="staffing"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabContentVariants}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="h-full overflow-y-auto momentum-scroll touch-action-pan-y"
              >
                <div className="p-4 pb-6">
                  <StaffingLevelsView />
                </div>
              </motion.div>
            )}
            
            {activeTab === 'hours' && (
              <motion.div
                key="hours"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabContentVariants}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="h-full overflow-y-auto momentum-scroll touch-action-pan-y"
              >
                <div className="p-4 pb-6">
                  <EmployeeHoursView />
                </div>
              </motion.div>
            )}
            
            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabContentVariants}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="h-full overflow-y-auto momentum-scroll touch-action-pan-y"
              >
                <div className="p-4 pb-6">
                  <TimelineView />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InsightsPanel; 
import React from 'react';
import { motion } from 'framer-motion';

const ShiftTemplatesStep: React.FC = () => {
  const templates = [
    {
      id: 1,
      name: 'Morning Shift',
      color: 'blue',
      startTime: '08:00',
      endTime: '16:00',
      role: 'Cashier'
    },
    {
      id: 2,
      name: 'Evening Shift',
      color: 'purple',
      startTime: '16:00',
      endTime: '00:00',
      role: 'Supervisor'
    },
    {
      id: 3,
      name: 'Weekend Shift',
      color: 'green',
      startTime: '12:00',
      endTime: '20:00',
      role: 'Stockroom'
    }
  ];

  return (
    <motion.div 
      className="templates-showcase bg-white dark:bg-dark-800 rounded-lg shadow-lg p-4 max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Shift Templates
      </h3>
      
      <div className="space-y-3">
        {templates.map(template => (
          <motion.div 
            key={template.id}
            className={`bg-${template.color}-100 dark:bg-${template.color}-900 dark:bg-opacity-30 p-3 rounded-md`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {template.name}
              </h4>
              <span className={`text-xs bg-${template.color}-200 dark:bg-${template.color}-700 text-${template.color}-800 dark:text-${template.color}-200 px-2 py-1 rounded-full`}>
                {template.role}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {template.startTime} - {template.endTime}
            </div>
            <div className="mt-2 flex justify-end">
              <button className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Apply template
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
          Create new template
        </button>
      </div>
    </motion.div>
  );
};

export default ShiftTemplatesStep; 
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../../store';
import { Shift, Employee } from '../../types';
import { formatDate } from '../../utils/dateUtils';

const StaffView: React.FC = () => {
  const { shifts } = useSelector((state: RootState) => state.shifts);
  const { selectedDate } = useSelector((state: RootState) => state.shifts);
  const { employees } = useSelector((state: RootState) => state.employees);
  
  // Group shifts by employee for the selected date
  const shiftsByEmployee = useMemo(() => {
    // Filter shifts for the selected date
    const shiftsForDate = shifts.filter(shift => shift.date === selectedDate);
    
    // Create an object to store shifts by employee name
    const groupedShifts: Record<string, Shift[]> = {};
    
    // Group shifts by employee name instead of ID
    shiftsForDate.forEach(shift => {
      const employeeName = shift.employeeName;
      
      if (!groupedShifts[employeeName]) {
        groupedShifts[employeeName] = [];
      }
      
      groupedShifts[employeeName].push(shift);
    });
    
    return groupedShifts;
  }, [shifts, selectedDate]);
  
  // Get employee by name
  const getEmployeeByName = (name: string): Employee | undefined => {
    return employees.find(emp => emp.name === name);
  };
  
  // Get role badge color
  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'Front Desk':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'Server':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'Manager':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'Cook':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };
  
  // Get role border color for shift items
  const getRoleBorderColor = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'border-blue-500';
      case 'Server': return 'border-purple-500';
      case 'Manager': return 'border-yellow-500';
      case 'Cook': return 'border-red-500';
      default: return 'border-gray-500';
    }
  };
  
  // Get role background color for shift items
  const getRoleBackgroundColor = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'Server': return 'bg-purple-50 dark:bg-purple-900/20';
      case 'Manager': return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'Cook': return 'bg-red-50 dark:bg-red-900/20';
      default: return 'bg-gray-50 dark:bg-dark-700';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string): JSX.Element => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirmed
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
            <svg className="w-3 h-3 mr-1 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending
          </span>
        );
      case 'Canceled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Canceled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
            {status}
          </span>
        );
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="staff-view pb-24">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Staff Schedule for {formatDate(selectedDate)}
      </h2>
      
      {Object.keys(shiftsByEmployee).length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No staff scheduled for this date.</p>
        </div>
      ) : (
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Object.entries(shiftsByEmployee).map(([employeeName, employeeShifts]) => {
            // Skip any empty shift arrays
            if (employeeShifts.length === 0) return null;
            
            const employee = getEmployeeByName(employeeName);
            
            return (
              <motion.div 
                key={employeeName}
                className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 overflow-hidden"
                variants={itemVariants}
              >
                <div className="p-4 border-b border-gray-200 dark:border-dark-600 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full ${employee?.color || 'bg-gray-400'} flex items-center justify-center text-white mr-3`}>
                      {employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {employeeName}
                      </h3>
                      {employee && (
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-md ${getRoleBadgeColor(employee.role)}`}>
                          {employee.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {employeeShifts.length} {employeeShifts.length === 1 ? 'shift' : 'shifts'}
                  </div>
                </div>
                
                <div className="p-4">
                  <ul className="space-y-3">
                    {employeeShifts.map(shift => (
                      <li 
                        key={shift.id} 
                        className={`flex items-center justify-between p-3 ${getRoleBackgroundColor(shift.role)} rounded-lg border-l-4 ${getRoleBorderColor(shift.role)}`}
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {shift.timeRange}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {shift.role}
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(shift.status)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default StaffView; 
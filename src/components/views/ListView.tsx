import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../../store';
import { setSelectedShiftId, setModalOpen } from '../../store/uiSlice';
import { formatDate } from '../../utils/dateUtils';
import Tooltip from '../common/Tooltip';

const ListView: React.FC = () => {
  const dispatch = useDispatch();
  const { shifts } = useSelector((state: RootState) => state.shifts);
  const { selectedDate } = useSelector((state: RootState) => state.shifts);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'name' | 'role'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filter and sort shifts
  const filteredAndSortedShifts = useMemo(() => {
    // Filter shifts for the selected date
    let result = shifts.filter(shift => shift.date === selectedDate);
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(shift => 
        shift.employeeName.toLowerCase().includes(query) || 
        shift.role.toLowerCase().includes(query) ||
        shift.timeRange.toLowerCase().includes(query) ||
        shift.status.toLowerCase().includes(query)
      );
    }
    
    // Sort shifts
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'time') {
        // Convert time to minutes for comparison
        const getMinutes = (timeRange: string) => {
          const startTime = timeRange.split(' - ')[0];
          const [hourMinute, period] = startTime.split(' ');
          let [hour, minute] = hourMinute.split(':').map(Number);
          
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          
          return hour * 60 + minute;
        };
        
        const aMinutes = getMinutes(a.timeRange);
        const bMinutes = getMinutes(b.timeRange);
        
        comparison = aMinutes - bMinutes;
      } else if (sortBy === 'name') {
        comparison = a.employeeName.localeCompare(b.employeeName);
      } else if (sortBy === 'role') {
        comparison = a.role.localeCompare(b.role);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [shifts, selectedDate, searchQuery, sortBy, sortDirection]);
  
  const handleSort = (column: 'time' | 'name' | 'role') => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  const handleShiftClick = (shiftId: string) => {
    dispatch(setSelectedShiftId(shiftId));
    dispatch(setModalOpen({ modal: 'editShift', isOpen: true }));
  };
  
  // Get role color
  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'Front Desk':
        return 'hover:bg-blue-100 dark:hover:bg-blue-900/30';
      case 'Server':
        return 'hover:bg-purple-100 dark:hover:bg-purple-900/30';
      case 'Manager':
        return 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30';
      case 'Cook':
        return 'hover:bg-red-100 dark:hover:bg-red-900/30';
      default:
        return 'hover:bg-gray-100 dark:hover:bg-dark-700';
    }
  };
  
  // Get role border color
  const getRoleBorderColor = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'border-blue-500';
      case 'Server': return 'border-purple-500';
      case 'Manager': return 'border-yellow-500';
      case 'Cook': return 'border-red-500';
      default: return 'border-gray-500';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string): JSX.Element => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirmed
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
            <svg className="w-3 h-3 mr-1 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending
          </span>
        );
      case 'Canceled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Canceled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
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
        duration: 0.3
      }
    }
  };
  
  return (
    <motion.div 
      className="list-view pb-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Shifts for {formatDate(selectedDate)}
        </h2>
        <div className="flex-1 max-w-md ml-4">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search shifts..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg 
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {filteredAndSortedShifts.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No shifts match your search criteria.' : 'No shifts scheduled for this date.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th 
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('time')}
                  >
                    <div className="flex items-center">
                      Time
                      {sortBy === 'time' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? 
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg> : 
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          }
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Employee
                      {sortBy === 'name' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? 
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg> : 
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          }
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center">
                      Role
                      {sortBy === 'role' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? 
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg> : 
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          }
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                {filteredAndSortedShifts.map((shift) => (
                  <tr 
                    key={shift.id}
                    className={`transition-colors duration-150 ${getRoleColor(shift.role)}`}
                    onClick={() => handleShiftClick(shift.id)}
                  >
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white border-l-4 ${getRoleBorderColor(shift.role)}`}>
                      {shift.timeRange}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {shift.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {shift.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(shift.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end">
                        <Tooltip content="Edit Shift" position="top">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftClick(shift.id);
                            }}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ListView; 
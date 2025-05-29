import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface EmployeeData {
  name: string;
  hours: number;
  shifts: number;
  byRole: Record<string, number>;
  isOvertime: boolean;
  shiftIds: string[];
}

const EmployeeHoursView: React.FC = () => {
  const { shifts, selectedDate } = useSelector((state: RootState) => state.shifts);
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const [employeeData, setEmployeeData] = useState<EmployeeData[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'hours' | 'shifts'>('hours');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  
  // Overtime threshold
  const OVERTIME_THRESHOLD = timeframe === 'week' ? 40 : 160;
  
  // Helper function to format date to YYYY-MM-DD
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Helper function to create a Date from YYYY-MM-DD string
  const createDateFromYYYYMMDD = (dateStr: string): Date => {
    // Extract date parts directly from the string to avoid any timezone adjustments
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Explicitly create the date with local timezone components
    const date = new Date(year, month - 1, day);
    
    console.log(`EmployeeHoursView: Created date from ${dateStr}: ${date.toLocaleDateString()} (${date.getDay()})`);
    return date;
  };
  
  // Helper function to check if a date is within a range (inclusive)
  const isDateInRange = (dateToCheck: string, startDate: Date, endDate: Date): boolean => {
    // Parse the dateToCheck using our helper to ensure consistent timezone handling
    const checkDate = createDateFromYYYYMMDD(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const isInRange = checkDate >= start && checkDate <= end;
    console.log(`EmployeeHoursView: Date check - ${dateToCheck} in range ${formatDateToYYYYMMDD(start)} to ${formatDateToYYYYMMDD(end)}: ${isInRange}`);
    
    return isInRange;
  };
  
  // Debug function to print the date and day of week
  const debugDate = (date: Date, label: string): void => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[date.getDay()];
    console.log(`${label}: ${formatDateToYYYYMMDD(date)} (${dayOfWeek})`);
  };
  
  useEffect(() => {
    console.log('******** EMPLOYEE HOURS VIEW EFFECT RUNNING ********');
    console.log(`Current timeframe: ${timeframe}`);
    
    // If there are no shifts, no need to process data
    if (shifts.length === 0) {
      console.log('No shifts in the store. Exiting early.');
      setEmployeeData([]);
      return;
    }
    
    console.log(`Total shifts in store: ${shifts.length}`);
    if (shifts.length > 0) {
      console.log('Sample shift data:', 
        shifts.slice(0, Math.min(3, shifts.length)).map(s => ({
          id: s.id,
          date: s.date,
          employee: s.employeeName,
          time: s.timeRange
        }))
      );
    }
    
    // Get current date using local time
    const currentDate = selectedDate ? createDateFromYYYYMMDD(selectedDate) : new Date();
    debugDate(currentDate, 'Current date');
    
    // Calculate start date based on timeframe
    let startDate = new Date(currentDate);
    let endDate = new Date(currentDate);
    
    if (timeframe === 'week') {
      // Calculate start of week (Sunday) - getDay() returns 0 for Sunday, 1 for Monday, etc.
      const dayOfWeek = currentDate.getDay();
      startDate.setDate(currentDate.getDate() - dayOfWeek);
      debugDate(startDate, 'Start of week (Sunday)');
      
      // End date is Saturday (6 days after Sunday)
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      debugDate(endDate, 'End of week (Saturday)');
    } else {
      // Start of month - set to 1st day of current month
      startDate.setDate(1);
      debugDate(startDate, 'Start of month');
      
      // End of month - last day of current month
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      debugDate(endDate, 'End of month');
    }
    
    // Reset hours to ensure full day comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`Date range for ${timeframe} view: ${formatDateToYYYYMMDD(startDate)} to ${formatDateToYYYYMMDD(endDate)}`);
    
    // Build array of all dates in the timeframe for verification
    const allDatesInTimeframe = [];
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      allDatesInTimeframe.push(formatDateToYYYYMMDD(tempDate));
      tempDate.setDate(tempDate.getDate() + 1);
    }
    console.log('All dates in timeframe:', allDatesInTimeframe);
    
    // Filter shifts in the selected timeframe
    const timeframeShifts = shifts.filter(shift => {
      // Skip shifts with invalid dates
      if (!shift.date || shift.date.trim() === '') {
        console.log('Shift has empty date, skipping:', shift);
        return false;
      }
      
      try {
        // Parse the shift date using our helper
        const shiftDate = createDateFromYYYYMMDD(shift.date);
        
        // Skip shifts with invalid dates
        if (isNaN(shiftDate.getTime())) {
          console.log('Invalid shift date format:', shift.date);
          return false;
        }
        
        // Check if the shift date is within the timeframe
        const isInTimeframe = isDateInRange(shift.date, startDate, endDate);
        
        // Log the result for debugging
        const debugInfo = {
          shiftDate: formatDateToYYYYMMDD(shiftDate),
          dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][shiftDate.getDay()],
          startDate: formatDateToYYYYMMDD(startDate),
          endDate: formatDateToYYYYMMDD(endDate),
          isInTimeframe
        };
        
        console.log(`Shift ${shift.id} date check:`, debugInfo);
        
        return isInTimeframe;
      } catch (error) {
        console.error('Error processing shift date:', shift.date, error);
        return false;
      }
    });
    
    console.log(`Filtered shifts for ${timeframe}: ${timeframeShifts.length} of ${shifts.length}`);
    console.log('Filtered shifts:', timeframeShifts.map(s => ({
      id: s.id,
      date: s.date,
      employee: s.employeeName,
      time: s.timeRange
    })));
    
    // Collect employee data
    const employeeMap = new Map<string, EmployeeData>();
    
    timeframeShifts.forEach(shift => {
      const { employeeName, role } = shift;
      
      // Skip shifts without proper time values
      if (!shift.startTime || !shift.endTime) {
        console.log('Shift missing time data, skipping:', shift);
        return;
      }
      
      // Calculate shift duration in hours
      let startHour, startMinute, endHour, endMinute;
      
      // Handle both 24h format and 12h format (with AM/PM)
      if (shift.startTime.includes('AM') || shift.startTime.includes('PM')) {
        // 12-hour format
        const startParts = shift.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!startParts) {
          console.log('Invalid 12h time format for start time:', shift.startTime);
          return;
        }
        
        startHour = parseInt(startParts[1], 10);
        startMinute = parseInt(startParts[2], 10);
        
        // Convert 12h to 24h format
        if (startParts[3].toUpperCase() === 'PM' && startHour < 12) {
          startHour += 12;
        } else if (startParts[3].toUpperCase() === 'AM' && startHour === 12) {
          startHour = 0;
        }
      } else {
        // 24-hour format
        const [hours, minutes] = shift.startTime.split(':').map(Number);
        startHour = hours;
        startMinute = minutes;
      }
      
      if (shift.endTime.includes('AM') || shift.endTime.includes('PM')) {
        // 12-hour format
        const endParts = shift.endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!endParts) {
          console.log('Invalid 12h time format for end time:', shift.endTime);
          return;
        }
        
        endHour = parseInt(endParts[1], 10);
        endMinute = parseInt(endParts[2], 10);
        
        // Convert 12h to 24h format
        if (endParts[3].toUpperCase() === 'PM' && endHour < 12) {
          endHour += 12;
        } else if (endParts[3].toUpperCase() === 'AM' && endHour === 12) {
          endHour = 0;
        }
      } else {
        // 24-hour format
        const [hours, minutes] = shift.endTime.split(':').map(Number);
        endHour = hours;
        endMinute = minutes;
      }
      
      // Skip shifts with invalid time values
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        console.log('Shift has invalid time values, skipping:', shift);
        return;
      }
      
      console.log(`Time calculation for shift ${shift.id}: ${shift.timeRange} (${shift.startTime}-${shift.endTime})`);
      console.log(`Normalized time values: startHour=${startHour}, startMinute=${startMinute}, endHour=${endHour}, endMinute=${endMinute}`);
      
      // Handle overnight shifts
      if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
        console.log('Overnight shift detected, adding 24 hours to end time');
        endHour += 24;
      }
      
      const duration = (endHour - startHour) + ((endMinute - startMinute) / 60);
      console.log(`Calculated duration: ${duration.toFixed(2)} hours`);
      console.log(`Shift for ${employeeName}, date: ${shift.date}, hours: ${duration.toFixed(2)}`);
      
      // Get or initialize employee data
      if (!employeeMap.has(employeeName)) {
        employeeMap.set(employeeName, {
          name: employeeName,
          hours: 0,
          shifts: 0,
          byRole: {},
          isOvertime: false,
          shiftIds: []
        });
      }
      
      const employee = employeeMap.get(employeeName)!;
      employee.hours += duration;
      employee.shifts += 1;
      employee.shiftIds.push(shift.id);
      
      // Track hours by role
      employee.byRole[role] = (employee.byRole[role] || 0) + duration;
      
      // Check if overtime
      employee.isOvertime = employee.hours > OVERTIME_THRESHOLD;
    });
    
    // Convert map to array and sort
    let employees = Array.from(employeeMap.values());
    
    console.log('Processed employee data:', employees);
    
    // Sort the data
    employees = sortEmployeeData(employees, sortBy, sortDirection);
    
    setEmployeeData(employees);
    console.log('******** EMPLOYEE HOURS VIEW EFFECT COMPLETE ********');
  }, [shifts, timeframe, sortBy, sortDirection, OVERTIME_THRESHOLD, selectedDate]);
  
  // Sort employee data
  const sortEmployeeData = (
    data: EmployeeData[], 
    sortByField: 'name' | 'hours' | 'shifts',
    direction: 'asc' | 'desc'
  ): EmployeeData[] => {
    return [...data].sort((a, b) => {
      let comparison: number;
      
      if (sortByField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortByField === 'hours') {
        comparison = a.hours - b.hours;
      } else {
        comparison = a.shifts - b.shifts;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };
  
  // Handle sorting
  const handleSort = (field: 'name' | 'hours' | 'shifts') => {
    if (sortBy === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for hours and shifts, ascending for name
      setSortBy(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };
  
  // Get sort indicator arrow
  const getSortIndicator = (field: 'name' | 'hours' | 'shifts') => {
    if (sortBy !== field) return null;
    
    return sortDirection === 'asc' ? (
      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };
  
  // Format hours nicely
  const formatHours = (hours: number): string => {
    return hours.toFixed(1);
  };
  
  // Get role color
  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'bg-blue-500';
      case 'Server': return 'bg-purple-500';
      case 'Manager': return 'bg-yellow-500';
      case 'Cook': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // If there are no shifts, display a message
  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No Hours Data</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          There are no shifts scheduled yet. Add shifts to see employee hours analytics.
        </p>
      </div>
    );
  }
  
  // Ensure the toggleEmployeeDetails function is defined here
  const toggleEmployeeDetails = (employeeName: string) => {
    if (expandedEmployee === employeeName) {
      setExpandedEmployee(null);
    } else {
      setExpandedEmployee(employeeName);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              timeframe === 'week' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setTimeframe('week')}
          >
            This Week
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              timeframe === 'month' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setTimeframe('month')}
          >
            This Month
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Employee {getSortIndicator('name')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('hours')}
                >
                  <div className="flex items-center">
                    Hours {getSortIndicator('hours')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('shifts')}
                >
                  <div className="flex items-center">
                    Shifts {getSortIndicator('shifts')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Breakdown
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-700 divide-y divide-gray-200 dark:divide-dark-600">
              {employeeData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    No employee data available for this timeframe
                  </td>
                </tr>
              ) : (
                employeeData.map(employee => (
                  <React.Fragment key={employee.name}>
                    <tr className={employee.isOvertime ? 'bg-danger-50 dark:bg-danger-900/20' : ''}>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                        onClick={() => toggleEmployeeDetails(employee.name)}
                      >
                        <div className="flex items-center">
                          <span className="mr-2">
                            {expandedEmployee === employee.name ? 
                              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg> :
                              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            }
                          </span>
                          {employee.name}
                          {employee.isOvertime && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200">
                              Overtime
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatHours(employee.hours)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {employee.shifts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-32 h-4 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden flex">
                          {Object.entries(employee.byRole).map(([role, hours], index) => (
                            <div 
                              key={role}
                              className={`h-full ${getRoleColor(role)}`} 
                              style={{ width: `${(hours / employee.hours) * 100}%` }}
                              title={`${role}: ${formatHours(hours)} hours`}
                            ></div>
                          ))}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {Object.entries(employee.byRole).map(([role, hours]) => (
                            <div key={role} className="flex items-center text-xs">
                              <div className={`h-2 w-2 ${getRoleColor(role)} rounded-full mr-1`}></div>
                              <span>{formatHours(hours)}h</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {expandedEmployee === employee.name && (
                      <tr>
                        <td colSpan={4} className="px-6 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-dark-600">
                          <div className="p-2">
                            <p className="font-medium mb-1">Included Shifts ({employee.shiftIds.length}):</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {employee.shiftIds.map(shiftId => {
                                const shift = shifts.find(s => s.id === shiftId);
                                return shift ? (
                                  <div key={shiftId} className="text-xs p-2 bg-gray-100 dark:bg-dark-700 rounded flex flex-col">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{shift.date}</span>
                                    <span>{shift.timeRange}</span>
                                    <span className="text-primary-500">{shift.role}</span>
                                  </div>
                                ) : (
                                  <div key={shiftId} className="text-xs p-1 bg-gray-100 dark:bg-dark-700 rounded">
                                    ID: {shiftId} (details not found)
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white dark:bg-dark-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Overtime Information</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Employees are highlighted when they exceed {OVERTIME_THRESHOLD} hours in the selected timeframe.
          This helps identify potential overtime issues before they become problems.
        </p>
      </div>
    </div>
  );
};

export default EmployeeHoursView; 
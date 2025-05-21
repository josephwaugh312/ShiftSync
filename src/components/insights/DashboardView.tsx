import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const DashboardView: React.FC = () => {
  const { shifts, selectedDate } = useSelector((state: RootState) => state.shifts);
  const { employees } = useSelector((state: RootState) => state.employees);
  
  // Calculate various metrics for the dashboard
  const totalShifts = shifts.length;
  const uniqueEmployeeNames = new Set(shifts.map(shift => shift.employeeName));
  const uniqueEmployees = uniqueEmployeeNames.size;
  
  // Calculate total scheduled hours
  const totalHours = shifts.reduce((total, shift) => {
    // Parse the start and end times to calculate hours
    const [startHour, startMinute] = shift.startTime.split(':').map(Number);
    const [endHour, endMinute] = shift.endTime.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMinute - startMinute;
    
    // Adjust for crossing midnight
    if (hours < 0) hours += 24;
    if (minutes < 0) {
      minutes += 60;
      hours -= 1;
    }
    
    return total + hours + (minutes / 60);
  }, 0);
  
  // Count roles distribution
  const roleDistribution = shifts.reduce((acc, shift) => {
    acc[shift.role] = (acc[shift.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const roleEntries = Object.entries(roleDistribution)
    .sort((a, b) => b[1] - a[1]);
  
  // Count shifts by status
  const statusCounts = shifts.reduce((acc, shift) => {
    acc[shift.status] = (acc[shift.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Use the selectedDate from Redux store instead of calculating a new date
  // This ensures consistency with the rest of the application
  const today = selectedDate;
  console.log(`DashboardView: Using selected date: ${today}`);
  
  // Check if shifts have the expected date format
  if (shifts.length > 0) {
    console.log(`DashboardView: Sample shift dates: ${shifts.slice(0, 3).map(s => JSON.stringify({id: s.id, date: s.date}))}`);
  }
  
  // Add consistent date formatting for comparison
  const formatDateForComparison = (date: string): string => {
    try {
      return date.trim().replace(/\s+/g, '');
    } catch (error) {
      console.error(`DashboardView: Error formatting date ${date}:`, error);
      return date;
    }
  };

  const todayFormatted = formatDateForComparison(today);
  
  const shiftsToday = shifts.filter(shift => {
    const shiftDateFormatted = formatDateForComparison(shift.date);
    const matches = shiftDateFormatted === todayFormatted;
    if (!matches && shift.date) {
      console.log(`DashboardView: Shift date '${shift.date}' (${shiftDateFormatted}) !== selected date '${today}' (${todayFormatted}) - type: ${typeof shift.date}`);
    }
    return matches;
  }).length;
  
  // If there are no shifts scheduled, display a message
  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No Shifts Scheduled</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          There are no shifts scheduled yet. Add shifts to the calendar to see insights and analytics.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Shifts Metric */}
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-dark-600">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Shifts</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">{totalShifts}</p>
          <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">scheduled</p>
        </div>
      </div>
      
      {/* Unique Employees Metric */}
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-dark-600">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Employees</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">{uniqueEmployees}</p>
          <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">of {employees.length} total</p>
        </div>
      </div>
      
      {/* Total Hours Metric */}
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-dark-600">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Hours</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">{totalHours.toFixed(1)}</p>
          <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">hours</p>
        </div>
      </div>
      
      {/* Shifts Today Metric */}
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-dark-600">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Shifts Today</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">{shiftsToday}</p>
          <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">scheduled</p>
        </div>
      </div>
      
      {/* Status Breakdown */}
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-dark-600">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status Breakdown</h3>
        {Object.keys(statusCounts).length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">No status data available</p>
        ) : (
          <div className="mt-3 space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-2 ${
                  status === 'Confirmed' ? 'bg-success-500' :
                  status === 'Pending' ? 'bg-warning-500' :
                  status === 'Canceled' ? 'bg-danger-500' : 'bg-gray-500'
                }`}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{status}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Role Distribution */}
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-dark-600 col-span-1 md:col-span-2 lg:col-span-1">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Role Distribution</h3>
        {roleEntries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">No role data available</p>
        ) : (
          <div className="mt-3 space-y-3">
            {roleEntries.map(([role, count]) => (
              <div key={role} className="relative">
                <div className="flex items-center mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
                  <span className="ml-auto text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      role === 'Front Desk' ? 'bg-blue-500' :
                      role === 'Server' ? 'bg-purple-500' :
                      role === 'Manager' ? 'bg-yellow-500' :
                      role === 'Cook' ? 'bg-red-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${(count / totalShifts) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView; 
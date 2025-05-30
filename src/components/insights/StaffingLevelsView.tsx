import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface HourlyData {
  hour: number;
  total: number;
  byRole: Record<string, number>;
}

interface TooltipData {
  hour: number;
  byRole: Record<string, number>;
  total: number;
}

const StaffingLevelsView: React.FC = () => {
  const { shifts, selectedDate: storeSelectedDate } = useSelector((state: RootState) => state.shifts);
  const [selectedDay, setSelectedDay] = useState<string>('today');
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 768);
  
  // Track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Generate day options based on the selected date in the store
  const dayOptions = [
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    ...Array.from({ length: 5 }, (_, i) => {
      const [year, month, day] = storeSelectedDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      date.setDate(date.getDate() + i + 2); // Skip today and tomorrow
      
      // Format consistently
      const dateYear = date.getFullYear();
      const dateMonth = String(date.getMonth() + 1).padStart(2, '0'); 
      const dateDay = String(date.getDate()).padStart(2, '0');
      const isoDate = `${dateYear}-${dateMonth}-${dateDay}`;
      
      return {
        id: isoDate,
        label: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      };
    })
  ];
  
  // Format time for display
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };
  
  // Get date string for the selected day
  const getDateForSelectedDay = (): string => {
    if (selectedDay === 'today') {
      return storeSelectedDate;
    } 
    if (selectedDay === 'tomorrow') {
      const [year, month, day] = storeSelectedDate.split('-').map(Number);
      const tomorrow = new Date(year, month - 1, day);
      
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Format as YYYY-MM-DD to ensure consistency
      const tomorrowYear = tomorrow.getFullYear();
      const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');
      
      return `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
    }
    return selectedDay;
  };
  
  useEffect(() => {
    // If there are no shifts, no need to process data
    if (shifts.length === 0) {
      setHourlyData([]);
      setRoles([]);
      return;
    }
    
    // Get shifts for the selected day
    const targetDate = getDateForSelectedDay();
    const filteredShifts = shifts.filter(shift => shift.date === targetDate);
    
    // Collect all unique roles
    const uniqueRoles = Array.from(new Set(filteredShifts.map(shift => shift.role)));
    setRoles(uniqueRoles);
    
    // Initialize hourly data (0-23 hours)
    const hourlyStaffing: HourlyData[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      total: 0,
      byRole: Object.fromEntries(uniqueRoles.map(role => [role, 0]))
    }));
    
    // Populate hourly data with shift counts
    filteredShifts.forEach(shift => {
      // Parse start and end times
      const [startHour] = shift.startTime.split(':').map(Number);
      let [endHour] = shift.endTime.split(':').map(Number);
      
      // Handle overnight shifts
      if (endHour <= startHour) endHour += 24;
      
      // Increment counts for each hour of the shift
      for (let h = startHour; h < endHour; h++) {
        const hourIndex = h % 24;
        hourlyStaffing[hourIndex].total += 1;
        hourlyStaffing[hourIndex].byRole[shift.role] += 1;
      }
    });
    
    setHourlyData(hourlyStaffing);
  }, [shifts, selectedDay, storeSelectedDate]);
  
  // Get color for each role
  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'bg-blue-500';
      case 'Server': return 'bg-purple-500';
      case 'Manager': return 'bg-yellow-500';
      case 'Cook': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Find the maximum staffing level for chart scaling
  const maxStaffing = Math.max(...hourlyData.map(h => h.total), 1);
  
  // If there are no shifts, display a message
  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No Staffing Data</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          There are no shifts scheduled yet. Add shifts to see staffing level analytics.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {dayOptions.map(day => (
          <button
            key={day.id}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedDay === day.id 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setSelectedDay(day.id)}
          >
            {day.label}
          </button>
        ))}
      </div>
      
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-600">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Staffing Levels for {selectedDay === 'today' ? 'Today' : selectedDay === 'tomorrow' ? 'Tomorrow' : (() => {
              // Parse the date with explicit local components instead of using the Date constructor directly
              const [year, month, day] = selectedDay.split('-').map(Number);
              const date = new Date(year, month - 1, day);
              return date.toLocaleDateString();
            })()}
          </h3>
        </div>
        
        <div className="p-4">
          {hourlyData.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No shifts scheduled for this day
            </div>
          ) : (
            <div className="relative h-64" style={{ isolation: 'isolate' }}>
              {/* Tooltip */}
              {tooltip && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-16 bg-gray-800 text-white text-xs rounded px-3 py-2 shadow-lg z-50">
                  <div className="font-bold mb-1">{formatHour(tooltip.hour)}</div>
                  {Object.entries(tooltip.byRole)
                    .filter(([_, count]) => count > 0)
                    .map(([role, count]) => (
                      <div key={role} className="flex items-center">
                        <div className={`h-2 w-2 mr-1 rounded-full ${getRoleColor(role)}`}></div>
                        <span>{role}: {count}</span>
                      </div>
                    ))
                  }
                  <div className="border-t border-gray-700 mt-1 pt-1">
                    Total: {tooltip.total}
                  </div>
                  <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            
              {/* Y-axis labels */}
              <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 py-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i}>{Math.round((5 - i) * maxStaffing / 5)}</div>
                ))}
              </div>
              
              {/* Chart */}
              <div className="ml-8 h-full flex">
                {hourlyData.map(data => (
                  <div 
                    key={data.hour} 
                    className="flex-1 flex flex-col justify-end relative"
                    onMouseEnter={() => setTooltip(data)}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {/* Horizontal time label - responsive display */}
                    <div 
                      className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400"
                      data-hour={data.hour}
                    >
                      {/* Show every 6 hours on small screens, every 3 hours on larger screens */}
                      <span className="hidden sm:inline">
                        {data.hour % 3 === 0 ? formatHour(data.hour) : ''}
                      </span>
                      <span className="sm:hidden">
                        {/* For very small screens (< 375px), show only 4 key times: 12 AM, 6 AM, 12 PM, 6 PM */}
                        {windowWidth < 375 
                          ? (data.hour === 0 || data.hour === 6 || data.hour === 12 || data.hour === 18 ? formatHour(data.hour) : '')
                          : (data.hour % 6 === 0 ? formatHour(data.hour) : '')
                        }
                      </span>
                    </div>
                    
                    {/* Stacked bar segments for each role */}
                    {Object.entries(data.byRole)
                      .filter(([_, count]) => count > 0)
                      .map(([role, count]) => (
                        <div
                          key={role}
                          className={`w-full ${getRoleColor(role)}`}
                          style={{ 
                            height: `${(count / maxStaffing) * 100}%`,
                            minHeight: count > 0 ? '8px' : '0'
                          }}
                          title={`${role}: ${count}`}
                        ></div>
                      ))
                    }
                  </div>
                ))}
              </div>
              
              {/* X-axis line */}
              <div className="absolute bottom-0 left-8 right-0 h-px bg-gray-300 dark:bg-gray-600"></div>
            </div>
          )}
        </div>
        
        {/* Legend */}
        {roles.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-dark-600 flex flex-wrap gap-4">
            {roles.map(role => (
              <div key={role} className="flex items-center">
                <div className={`h-3 w-3 mr-1.5 rounded-sm ${getRoleColor(role)}`}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffingLevelsView; 
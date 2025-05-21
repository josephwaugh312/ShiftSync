import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Shift } from '../../types';

const HeatmapView: React.FC = () => {
  const { shifts } = useSelector((state: RootState) => state.shifts);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  
  // Days of the week labels
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Hours of the day for our heatmap
  const hours = Array.from({ length: 24 }, (_, i) => 
    i === 0 ? '12 AM' : 
    i < 12 ? `${i} AM` : 
    i === 12 ? '12 PM' : 
    `${i - 12} PM`
  );
  
  useEffect(() => {
    // Initialize a fresh 7x24 grid (days of week x hours) with zeros
    const freshGrid: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    
    // Process shifts day by day to ensure correct counting
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      // For each hour of the day
      for (let hour = 0; hour < 24; hour++) {
        // Find all dates that fall on this day of week
        const shiftsForThisDayHour = new Set<string>(); // Track unique employee IDs
        
        // Process all shifts
        shifts.forEach(shift => {
          try {
            // Improved date parsing to avoid timezone issues:
            // Extract date parts directly from the date string (YYYY-MM-DD)
            const [year, month, day] = shift.date.split('-').map(Number);
            
            // Create date using local timezone to avoid any conversion
            const shiftDate = new Date(year, month - 1, day);
            
            // Debug logging to verify correct day of week calculation
            console.log(`HeatmapView: Shift date ${shift.date} parsed as: ${shiftDate.toISOString()}, day of week: ${shiftDate.getDay()} (${daysOfWeek[shiftDate.getDay()]})`);
            
            // Only process shifts for this day of week
            if (shiftDate.getDay() === dayOfWeek) {
              // Extract start and end times
              const [startHour, startMinute] = shift.startTime.split(':').map(Number);
              let [endHour, endMinute] = shift.endTime.split(':').map(Number);
              
              // Handle overnight shifts
              if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
                endHour += 24;
              }
              
              // Check if this shift covers this hour
              if (hour >= startHour && hour < endHour) {
                // We use employeeName as unique identifier to ensure one employee only counts once per hour
                shiftsForThisDayHour.add(shift.employeeName);
              }
            }
          } catch (error) {
            console.error(`Error processing shift:`, error);
          }
        });
        
        // Store the count of unique employees working during this hour
        freshGrid[dayOfWeek][hour] = shiftsForThisDayHour.size;
      }
    }
    
    setHeatmapData(freshGrid);
  }, [shifts]);
  
  // Find the maximum value for scaling
  const maxValue = heatmapData.length > 0 
    ? Math.max(...heatmapData.flatMap(row => row))
    : 0;
  
  // Get color intensity based on absolute value instead of relative intensity
  const getColorIntensity = (value: number) => {
    // Return the lightest shade for empty cells
    if (value === 0) return 'bg-blue-50 dark:bg-dark-800';
    
    // Use fixed thresholds based on absolute values
    if (value === 1) return 'bg-blue-100 dark:bg-blue-900';
    if (value === 2) return 'bg-blue-200 dark:bg-blue-800';
    if (value === 3) return 'bg-blue-300 dark:bg-blue-700';
    if (value === 4) return 'bg-blue-400 dark:bg-blue-600';
    if (value === 5) return 'bg-blue-500 dark:bg-blue-500';
    
    // Return the darkest shade for 6+ shifts
    return 'bg-blue-600 dark:bg-blue-400';
  };
  
  // If there are no shifts, display a message
  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No Data Available</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Schedule shifts to see the heatmap of activity throughout the week.
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="text-sm text-gray-700 dark:text-gray-300 mb-4">
        <p>This heatmap shows the number of employees scheduled during each hour of the week. Darker colors indicate more employees working.</p>
      </div>
      
      <div className="relative min-w-[800px]">
        {/* Hour labels (on top) */}
        <div className="flex mb-1">
          <div className="w-24 flex-shrink-0"></div>
          {hours.map((hour, index) => (
            <div key={index} className="text-xs text-gray-500 dark:text-gray-400 font-medium w-12 flex-shrink-0 text-center">
              {index % 3 === 0 ? hour : ''}
            </div>
          ))}
        </div>
        
        {/* Day rows with heatmap cells */}
        {daysOfWeek.map((day, dayIndex) => (
          <div key={day} className="flex mb-1">
            <div className="w-24 flex-shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              {day}
            </div>
            <div className="flex flex-1">
              {heatmapData[dayIndex] && heatmapData[dayIndex].map((value, hourIndex) => (
                <div
                  key={hourIndex}
                  className={`w-12 h-10 flex-shrink-0 flex items-center justify-center text-xs font-medium rounded-sm m-px ${getColorIntensity(value)}`}
                >
                  {value > 0 ? value : ''}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Legend */}
        <div className="mt-6 flex items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">0</span>
          <div className="flex">
            {[
              'bg-blue-50 dark:bg-dark-800',   // 0 employees
              'bg-blue-100 dark:bg-blue-900',  // 1 employee
              'bg-blue-200 dark:bg-blue-800',  // 2 employees
              'bg-blue-300 dark:bg-blue-700',  // 3 employees
              'bg-blue-400 dark:bg-blue-600',  // 4 employees
              'bg-blue-500 dark:bg-blue-500',  // 5 employees
              'bg-blue-600 dark:bg-blue-400',  // 6+ employees
            ].map((color, i) => (
              <div key={i} className={`w-6 h-4 ${color}`}></div>
            ))}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">6+</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapView;

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Shift } from '../../types';

// Define an interface for the enhanced shift with positioning info
interface EnhancedShift extends Shift {
  yOffset?: number;
}

const TimelineView: React.FC = () => {
  const { shifts, selectedDate: storeSelectedDate } = useSelector((state: RootState) => state.shifts);
  const [selectedDate, setSelectedDate] = useState<string>(storeSelectedDate);
  const [timelineData, setTimelineData] = useState<EnhancedShift[]>([]);
  const [groupBy, setGroupBy] = useState<'employee' | 'role'>('employee');
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Update local selectedDate when Redux store changes
  useEffect(() => {
    setSelectedDate(storeSelectedDate);
  }, [storeSelectedDate]);
  
  // Generate date options relative to the selected date
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    // Parse the date using local components to avoid timezone issues
    const [year, month, day] = storeSelectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    date.setDate(date.getDate() + i);
    
    // Format as YYYY-MM-DD consistently
    const dateYear = date.getFullYear();
    const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
    const dateDay = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${dateYear}-${dateMonth}-${dateDay}`;
    
    return {
      value: formattedDate,
      label: i === 0 ? 'Today' : 
             i === 1 ? 'Tomorrow' : 
             date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    };
  });
  
  useEffect(() => {
    // If there are no shifts, no need to filter further
    if (shifts.length === 0) {
      setTimelineData([]);
      return;
    }
    
    // Filter shifts for the selected date
    const filteredShifts = shifts.filter(shift => shift.date === selectedDate);
    
    // Sort by start time
    const sortedShifts = [...filteredShifts].sort((a, b) => {
      const aTime = a.startTime.split(':').map(Number);
      const bTime = b.startTime.split(':').map(Number);
      
      // Compare hours first
      if (aTime[0] !== bTime[0]) return aTime[0] - bTime[0];
      
      // Then compare minutes
      return aTime[1] - bTime[1];
    });
    
    setTimelineData(sortedShifts);

    // Scroll to current time if viewing today
    if (selectedDate === storeSelectedDate && timelineRef.current) {
      setTimeout(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const hourWidth = timelineRef.current?.clientWidth ? 
          timelineRef.current.clientWidth / 24 : 0;
        
        // Scroll to 1 hour before current time to center current time in view
        timelineRef.current?.scrollTo({
          left: (currentHour - 1) * hourWidth,
          behavior: 'smooth'
        });
      }, 500);
    }
  }, [shifts, selectedDate, storeSelectedDate]);
  
  // Helper function to parse time to minutes for easier comparison
  const parseTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Group shifts based on selected grouping
  const groupShiftsWithPositioning = () => {
    const groups: Record<string, EnhancedShift[]> = {};
    
    // First, group shifts by the selected criterion
    timelineData.forEach(shift => {
      const key = groupBy === 'employee' ? shift.employeeName : shift.role;
      if (!groups[key]) groups[key] = [];
      groups[key].push({...shift});
    });
    
    // Then, calculate vertical positions within each group to avoid overlaps
    // Only needed when grouping by role, so multiple employees can be shown
    if (groupBy === 'role') {
      Object.entries(groups).forEach(([role, roleShifts]) => {
        // Sort by start time first
        roleShifts.sort((a, b) => {
          const aStart = parseTimeToMinutes(a.startTime);
          const bStart = parseTimeToMinutes(b.startTime);
          return aStart - bStart;
        });
        
        // Detect and resolve overlaps
        for (let i = 0; i < roleShifts.length; i++) {
          const currentShift = roleShifts[i];
          const currentStart = parseTimeToMinutes(currentShift.startTime);
          const currentEnd = parseTimeToMinutes(currentShift.endTime);
          
          // Track which vertical positions are already taken
          const takenPositions = new Set<number>();
          
          // Check for overlaps with previous shifts
          for (let j = 0; j < i; j++) {
            const prevShift = roleShifts[j];
            const prevStart = parseTimeToMinutes(prevShift.startTime);
            const prevEnd = parseTimeToMinutes(prevShift.endTime);
            
            // Check if there's an overlap
            if ((currentStart <= prevEnd && currentEnd >= prevStart) ||
                (prevStart <= currentEnd && prevEnd >= currentStart)) {
              if (prevShift.yOffset !== undefined) {
                takenPositions.add(prevShift.yOffset);
              }
            }
          }
          
          // Find the first available position
          let position = 0;
          while (takenPositions.has(position)) {
            position++;
          }
          
          // Assign the position
          currentShift.yOffset = position;
        }
      });
    }
    
    return groups;
  };
  
  const groupedShifts = groupShiftsWithPositioning();
  
  // Get hour range for the timeline (minimum 7am to 11pm, extend if needed)
  const getHourRange = () => {
    let minHour = 7; // Default minimum 7am
    let maxHour = 23; // Default maximum 11pm
    
    timelineData.forEach(shift => {
      const startHour = parseInt(shift.startTime.split(':')[0]);
      let endHour = parseInt(shift.endTime.split(':')[0]);
      
      // Handle overnight shifts
      if (endHour < startHour) endHour += 24;
      
      minHour = Math.min(minHour, startHour);
      maxHour = Math.max(maxHour, endHour);
    });
    
    // Ensure we have at least a 16-hour window
    if (maxHour - minHour < 16) {
      maxHour = Math.max(maxHour, minHour + 16);
    }
    
    return { minHour, maxHour };
  };
  
  const { minHour, maxHour } = getHourRange();
  const hourLabels = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);
  
  // Format hour for display
  const formatHour = (hour: number): string => {
    const displayHour = hour % 24; // Handle overnight hours
    if (displayHour === 0) return '12 AM';
    if (displayHour < 12) return `${displayHour} AM`;
    if (displayHour === 12) return '12 PM';
    return `${displayHour - 12} PM`;
  };
  
  // Calculate position and width for a shift
  const getShiftStyles = (shift: EnhancedShift) => {
    const startHour = parseInt(shift.startTime.split(':')[0]);
    const startMinute = parseInt(shift.startTime.split(':')[1]);
    let endHour = parseInt(shift.endTime.split(':')[0]);
    const endMinute = parseInt(shift.endTime.split(':')[1]);
    
    // Handle overnight shifts
    if (endHour < startHour) endHour += 24;
    
    const startPosition = ((startHour - minHour) + (startMinute / 60)) / (maxHour - minHour + 1) * 100;
    const duration = (endHour - startHour) + ((endMinute - startMinute) / 60);
    const width = (duration / (maxHour - minHour + 1)) * 100;
    
    // Calculate vertical position within the role's container
    // For employee view, use default (centered), for role view, stack based on yOffset
    const verticalOffset = groupBy === 'role' && shift.yOffset !== undefined 
      ? `${shift.yOffset * 32}px` // Increased spacing between shifts
      : '0px';
    
    return {
      left: `${startPosition}%`,
      width: `${width}%`,
      top: verticalOffset,
      height: groupBy === 'role' ? '28px' : '80%', // Fixed height for role-based shifts
      border: groupBy === 'role' ? '1px solid rgba(0,0,0,0.1)' : 'none',
      zIndex: 1 // Ensure shifts are above the hour markers but below tooltips
    };
  };
  
  // Get color for a role
  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'bg-blue-500';
      case 'Server': return 'bg-purple-500';
      case 'Manager': return 'bg-yellow-500';
      case 'Cook': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // If there are no shifts at all, display a message
  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No Timeline Data</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          There are no shifts scheduled yet. Add shifts to see the timeline visualization.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {dateOptions.map(date => (
            <button
              key={date.value}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedDate === date.value 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setSelectedDate(date.value)}
            >
              {date.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Group by:</span>
          <div className="flex items-center">
            <button
              className={`px-3 py-1 rounded-l-md text-sm ${
                groupBy === 'employee' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setGroupBy('employee')}
            >
              Employee
            </button>
            <button
              className={`px-3 py-1 rounded-r-md text-sm ${
                groupBy === 'role' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setGroupBy('role')}
            >
              Role
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-600">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Timeline for {selectedDate === storeSelectedDate ? 'Today' : (() => {
              // Parse the date using local components to avoid timezone issues 
              const [year, month, day] = selectedDate.split('-').map(Number);
              const date = new Date(year, month - 1, day);
              return date.toLocaleDateString();
            })()}
          </h3>
        </div>
        
        {timelineData.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            No shifts scheduled for this day
          </div>
        ) : (
          <div className="p-6 overflow-x-auto" ref={timelineRef}>
            {/* Hour labels */}
            <div className="flex mb-4 ml-32 relative min-w-[800px]">
              {hourLabels.map((hour, i) => (
                <div 
                  key={hour} 
                  className="flex-1 text-xs text-gray-500 dark:text-gray-400 font-medium"
                  style={{ position: 'relative' }}
                >
                  <div className="absolute left-0 transform -translate-x-1/2">{formatHour(hour)}</div>
                  {i > 0 && <div className="absolute top-6 left-0 w-px h-full bg-gray-300 dark:bg-gray-600"></div>}
                </div>
              ))}
            </div>
            
            {/* Timeline rows */}
            <div className="space-y-6 min-w-[800px]">
              {Object.entries(groupedShifts).map(([group, shifts]) => (
                <div key={group} className="relative">
                  <div className="w-32 absolute top-0 left-0 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {group}
                  </div>
                  
                  <div 
                    className="ml-32 relative bg-gray-100 dark:bg-dark-800 rounded"
                    style={{
                      // Dynamically adjust height based on the maximum number of stacked shifts
                      height: groupBy === 'role' ?
                        `${Math.max(1, ...shifts.map(s => (s.yOffset || 0) + 1)) * 32 + 4}px` :
                        '48px'
                    }}
                  >
                    {/* Current time indicator if viewing today */}
                    {selectedDate === storeSelectedDate && (
                      <div className="absolute top-0 bottom-0 w-px bg-red-500 z-10" style={{
                        left: `${((new Date().getHours() + new Date().getMinutes() / 60 - minHour) / (maxHour - minHour + 1)) * 100}%`
                      }}>
                        <div className="h-3 w-3 rounded-full bg-red-500 absolute -top-1 -ml-1.5"></div>
                      </div>
                    )}
                    
                    {/* Shift blocks */}
                    {shifts.map(shift => (
                      <div
                        key={shift.id}
                        className={`absolute rounded ${getRoleColor(shift.role)} hover:opacity-90 transition-opacity text-white text-xs font-medium flex items-center overflow-hidden px-2`}
                        style={getShiftStyles(shift)}
                        title={`${shift.employeeName}: ${shift.startTime} - ${shift.endTime}`}
                      >
                        <div className="truncate">
                          {groupBy === 'employee' ? shift.role : shift.employeeName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="mt-6 border-t border-gray-200 dark:border-dark-600 pt-4 flex flex-wrap gap-3">
              {Array.from(new Set(timelineData.map(shift => shift.role))).map(role => (
                <div key={role} className="flex items-center">
                  <div className={`h-3 w-3 mr-1.5 rounded-sm ${getRoleColor(role)}`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView; 
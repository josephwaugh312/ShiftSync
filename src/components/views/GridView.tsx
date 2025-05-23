import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../../store';
import { formatDate } from '../../utils/dateUtils';
import { setSelectedShiftId, setModalOpen } from '../../store/uiSlice';
import Tooltip from '../common/Tooltip';

// Time slots for the grid
const timeSlots = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM',
];

interface GridShift {
  id: string;
  employeeName: string;
  role: string;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  color: string;
  status: string;
}

const GridView: React.FC = () => {
  const dispatch = useDispatch();
  const { shifts } = useSelector((state: RootState) => state.shifts);
  const { selectedDate } = useSelector((state: RootState) => state.shifts);
  const { employees } = useSelector((state: RootState) => state.employees);
  const [hoveredShiftId, setHoveredShiftId] = useState<string | null>(null);
  
  // Process shifts for grid display
  const gridShifts = useMemo(() => {
    // Filter shifts for the selected date
    const shiftsForDate = shifts.filter(shift => shift.date === selectedDate);
    
    // Convert shifts to grid format
    return shiftsForDate.map(shift => {
      // Parse time range (e.g., "9:00 AM - 5:00 PM")
      const [startTime, endTime] = shift.timeRange.split(' - ');
      
      // Calculate duration in hours
      const getHours = (timeStr: string) => {
        const [hourMinute, period] = timeStr.split(' ');
        let [hour, minute] = hourMinute.split(':').map(Number);
        
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        return hour + minute / 60;
      };
      
      const startHour = getHours(startTime);
      const endHour = getHours(endTime);
      const duration = endHour - startHour;
      
      return {
        id: shift.id,
        employeeName: shift.employeeName,
        role: shift.role,
        startTime,
        endTime,
        duration,
        color: shift.color,
        status: shift.status,
      };
    });
  }, [shifts, selectedDate]);
  
  // Group shifts by employee
  const shiftsByEmployee = useMemo(() => {
    const grouped: Record<string, GridShift[]> = {};
    
    gridShifts.forEach(shift => {
      if (!grouped[shift.employeeName]) {
        grouped[shift.employeeName] = [];
      }
      grouped[shift.employeeName].push(shift);
    });
    
    return grouped;
  }, [gridShifts]);
  
  // Get employees in alphabetical order
  const sortedEmployees = useMemo(() => {
    return Object.keys(shiftsByEmployee).sort();
  }, [shiftsByEmployee]);
  
  // Find the grid position for a shift based on time
  const getGridPosition = (timeStr: string) => {
    const timeSlotIndex = timeSlots.findIndex(slot => slot === timeStr);
    return timeSlotIndex >= 0 ? timeSlotIndex + 1 : 1; // +1 because grid starts at 1
  };
  
  // Handle shift click
  const handleShiftClick = (shiftId: string) => {
    dispatch(setSelectedShiftId(shiftId));
    dispatch(setModalOpen({ modal: 'editShift', isOpen: true }));
  };
  
  // Get role-specific background color
  const getRoleBackgroundColor = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'rgba(59, 130, 246, 0.6)'; // blue-500 with 60% opacity
      case 'Server': return 'rgba(168, 85, 247, 0.6)'; // purple-500 with 60% opacity
      case 'Manager': return 'rgba(234, 179, 8, 0.6)'; // yellow-500 with 60% opacity
      case 'Cook': return 'rgba(239, 68, 68, 0.6)'; // red-500 with 60% opacity
      default: return 'rgba(107, 114, 128, 0.6)'; // gray-500 with 60% opacity
    }
  };

  // Get role-specific border color
  const getRoleBorderColor = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'rgb(59, 130, 246)'; // blue-500
      case 'Server': return 'rgb(168, 85, 247)'; // purple-500
      case 'Manager': return 'rgb(234, 179, 8)'; // yellow-500
      case 'Cook': return 'rgb(239, 68, 68)'; // red-500
      default: return 'rgb(107, 114, 128)'; // gray-500
    }
  };

  // Get status indicator color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-500';
      case 'Pending':
        return 'bg-yellow-500';
      case 'Canceled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
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
      className="grid-view pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Schedule Grid for {formatDate(selectedDate)}
      </h2>
      
      {sortedEmployees.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No shifts scheduled for this date.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Grid Header */}
              <div className="grid grid-cols-[150px_repeat(18,_80px)] border-b border-gray-200 dark:border-dark-600">
                <div className="bg-gray-50 dark:bg-dark-700 p-3 sticky left-0 z-10 border-r border-gray-200 dark:border-dark-600">
                  <div className="font-medium text-gray-700 dark:text-gray-300 text-sm">Employees</div>
                </div>
                {timeSlots.map((time, index) => (
                  <div key={time} className={`bg-gray-50 dark:bg-dark-700 p-2 text-center border-r border-gray-200 dark:border-dark-600 ${index % 2 === 0 ? 'text-gray-700' : 'text-gray-500'} dark:text-gray-300 text-xs font-medium`}>
                    {time}
                  </div>
                ))}
              </div>
              
              {/* Grid Body */}
              <div>
                {sortedEmployees.map((employeeName, index) => (
                  <div 
                    key={employeeName} 
                    className={`grid grid-cols-[150px_repeat(18,_80px)] relative ${
                      index % 2 === 0 ? 'bg-white dark:bg-dark-800' : 'bg-gray-50 dark:bg-dark-700'
                    } border-b border-gray-200 dark:border-dark-600`}
                    style={{ height: '60px' }}
                  >
                    {/* Employee Name (fixed column) */}
                    <div className="p-3 sticky left-0 z-10 border-r border-gray-200 dark:border-dark-600 bg-inherit flex items-center">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {employeeName}
                      </div>
                    </div>
                    
                    {/* Time Columns */}
                    {timeSlots.map((time, i) => (
                      <div 
                        key={`${employeeName}-${time}`} 
                        className="border-r border-gray-200 dark:border-dark-600 relative"
                      >
                        {/* Vertical grid line */}
                        <div className={`absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-dark-600 ${
                          i % 2 === 0 ? 'opacity-100' : 'opacity-50'
                        }`}></div>
                      </div>
                    ))}
                    
                    {/* Shifts */}
                    {shiftsByEmployee[employeeName].map(shift => {
                      const startCol = getGridPosition(shift.startTime);
                      const colSpan = shift.duration; // 1 hour = 1 column
                      const isHovered = hoveredShiftId === shift.id;
                      
                      return (
                        <motion.div
                          key={shift.id}
                          className={`absolute top-1.5 h-[50px] z-20 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer ${
                            isHovered ? 'ring-2 ring-primary-500 z-30' : ''
                          }`}
                          style={{
                            left: `calc(150px + ${startCol - 1} * 80px)`,
                            width: `calc(${colSpan} * 80px - 4px)`,
                            backgroundColor: getRoleBackgroundColor(shift.role),
                            borderLeft: `4px solid ${getRoleBorderColor(shift.role)}`
                          }}
                          onClick={() => handleShiftClick(shift.id)}
                          onMouseEnter={() => setHoveredShiftId(shift.id)}
                          onMouseLeave={() => setHoveredShiftId(null)}
                          whileHover={{ y: -2 }}
                          role="button"
                          aria-label={`${shift.employeeName} shift from ${shift.startTime} to ${shift.endTime}`}
                        >
                          <Tooltip content={`${shift.employeeName} - ${shift.role}\n${shift.startTime} - ${shift.endTime}`} position="top">
                            <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
                              <div className="flex justify-between items-center">
                                <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                  {shift.startTime} - {shift.endTime}
                                </div>
                                <div className={`h-2 w-2 rounded-full ${getStatusColor(shift.status)}`}></div>
                              </div>
                              <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                {shift.role}
                              </div>
                            </div>
                          </Tooltip>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GridView; 
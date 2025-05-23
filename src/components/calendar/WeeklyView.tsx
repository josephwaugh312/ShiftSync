import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../../store';
import { setModalOpen } from '../../store/uiSlice';
import { setSelectedDate } from '../../store/shiftsSlice';
import { formatDate, formatToISODate, createDateFromISO } from '../../utils/dateUtils';
import ShiftCard from '../shifts/ShiftCard';
import EmptyState from '../common/EmptyState';

interface WeeklyViewProps {
  days: Date[];
  selectedDate: string;
  handleDayClick: (day: string) => void;
  handleAddShift: () => void;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({ 
  days, 
  selectedDate, 
  handleDayClick, 
  handleAddShift 
}) => {
  const dispatch = useDispatch();
  const { shifts } = useSelector((state: RootState) => state.shifts);
  
  // Get array of days for current week with consistent LOCAL date handling
  const weekDays = useMemo(() => {
    // Format the days array to YYYY-MM-DD strings
    return days.map(day => formatToISODate(day));
  }, [days]);
  
  // Group shifts by day
  const shiftsByDay = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    // Initialize each day with an empty array
    weekDays.forEach(day => {
      grouped[day] = [];
    });
    
    // Add shifts to the corresponding day
    shifts.forEach(shift => {
      if (grouped[shift.date]) {
        grouped[shift.date].push(shift);
      }
    });
    
    return grouped;
  }, [shifts, weekDays]);
  
  // Handle add shift for a specific day
  const handleAddShiftForDay = (date: string) => {
    dispatch(setSelectedDate(date));
    handleAddShift();
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const dayVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };
  
  // Check if date is today with consistent LOCAL date handling
  const isToday = (dateString: string): boolean => {
    const today = new Date();
    // Create direct YYYY-MM-DD string for today
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayFormatted = `${year}-${month}-${day}`;
    
    const result = dateString === todayFormatted;
    console.log('WeeklyView - Checking if date is today:', dateString, todayFormatted, result);
    return result;
  };
  
  return (
    <motion.div
      className="weekly-view pb-28"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          // Create a date object from the day string
          const dateParts = day.split('-');
          const dayDate = new Date(
            parseInt(dateParts[0]), // year
            parseInt(dateParts[1]) - 1, // month (0-indexed)
            parseInt(dateParts[2]) // day
          );
          
          // Use direct local date to get day name and number
          const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNumber = dateParts[2]; // Use the exact day number from the string
          
          console.log('WeeklyView - Rendering day:', day, 'Date object:', dayDate, 'Name:', dayName, 'Number:', dayNumber);
          
          const isCurrentDay = isToday(day);
          const isSelectedDay = day === selectedDate;
          
          return (
            <motion.div 
              key={day}
              className={`rounded-lg border ${
                isSelectedDay 
                  ? 'border-primary-500 dark:border-primary-400 ring-2 ring-primary-200 dark:ring-primary-900'
                  : 'border-gray-200 dark:border-dark-600'
              } overflow-hidden`}
              variants={dayVariants}
            >
              <div 
                className={`p-3 text-center border-b ${
                  isSelectedDay
                    ? 'bg-primary-500 text-white dark:bg-primary-600'
                    : isCurrentDay
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                    : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => handleDayClick(day)}
              >
                <div className="text-xs font-medium">{dayName}</div>
                <div className="text-lg font-bold">{dayNumber}</div>
              </div>
              
              <div className="p-3 bg-white dark:bg-dark-800 h-[calc(100%-48px)] min-h-[200px] overflow-y-auto">
                {shiftsByDay[day] && shiftsByDay[day].length > 0 ? (
                  <div className="space-y-2">
                    {shiftsByDay[day].map(shift => (
                      <ShiftCard key={shift.id} shift={shift} isCompact={true} />
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState 
                      message="No shifts"
                      description={`Add a shift for ${dayName}`}
                      actionLabel="Add"
                      onAction={() => handleAddShiftForDay(day)}
                      isCompact={true}
                      icon={
                        <svg className="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      }
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default WeeklyView; 
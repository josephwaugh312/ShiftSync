import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setSelectedDate } from '../../store/shiftsSlice';
import { motion } from 'framer-motion';
import ShiftCard from '../shifts/ShiftCard';
import GestureDetector from './GestureDetector';

const MobileCalendarView: React.FC = () => {
  const dispatch = useDispatch();
  const { shifts, selectedDate } = useSelector((state: RootState) => state.shifts);
  const [filteredShifts, setFilteredShifts] = useState<typeof shifts>([]);
  const [dateLabels, setDateLabels] = useState<Array<{ date: string, label: string, isToday: boolean }>>([]);
  
  // Get formatted date for display
  const formatDisplayDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  // Create date labels for the date selector
  useEffect(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Generate date labels for the next 7 days
    const labels = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      return {
        date: dateString,
        label: i === 0 ? 'Today' : 
               i === 1 ? 'Tomorrow' : 
               date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: dateString === todayString
      };
    });
    
    setDateLabels(labels);
  }, []);
  
  // Filter shifts for the selected date
  useEffect(() => {
    const filtered = shifts.filter(shift => shift.date === selectedDate);
    
    // Sort shifts by start time
    const sorted = [...filtered].sort((a, b) => {
      const aTime = a.startTime.split(':').map(Number);
      const bTime = b.startTime.split(':').map(Number);
      
      // Compare hours first
      if (aTime[0] !== bTime[0]) return aTime[0] - bTime[0];
      
      // Then compare minutes
      return aTime[1] - bTime[1];
    });
    
    setFilteredShifts(sorted);
  }, [shifts, selectedDate]);
  
  // Handle date selection with haptic feedback
  const handleDateSelect = (date: string) => {
    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    
    dispatch(setSelectedDate(date));
  };
  
  // Handle swipe navigation between dates
  const handleSwipeLeft = () => {
    // Find the next date in the sequence
    const currentIndex = dateLabels.findIndex(d => d.date === selectedDate);
    if (currentIndex < dateLabels.length - 1) {
      const nextDate = dateLabels[currentIndex + 1].date;
      handleDateSelect(nextDate);
    }
  };
  
  const handleSwipeRight = () => {
    // Find the previous date in the sequence
    const currentIndex = dateLabels.findIndex(d => d.date === selectedDate);
    if (currentIndex > 0) {
      const prevDate = dateLabels[currentIndex - 1].date;
      handleDateSelect(prevDate);
    }
  };
  
  return (
    <div className="pb-24">
      {/* Date selector (horizontally scrollable) */}
      <div className="mb-4 overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex space-x-2 min-w-max">
          {dateLabels.map((dateInfo) => (
            <motion.button
              key={dateInfo.date}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedDate === dateInfo.date 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => handleDateSelect(dateInfo.date)}
              whileTap={{ scale: 0.95 }}
            >
              {dateInfo.label}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Date heading */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {formatDisplayDate(selectedDate)}
      </h2>
      
      {/* Shifts for selected date */}
      <GestureDetector
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
      >
        <div className="space-y-3">
          {filteredShifts.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg">No shifts scheduled</p>
              <p className="text-sm mt-1">Swipe left or right to change date</p>
            </div>
          ) : (
            filteredShifts.map(shift => (
              <div key={shift.id} className="touch-action-manipulation">
                <ShiftCard shift={shift} />
              </div>
            ))
          )}
        </div>
      </GestureDetector>
      
      {/* Custom styling is now handled by the classes in index.css */}
    </div>
  );
};

export default MobileCalendarView;

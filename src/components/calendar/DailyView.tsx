import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../../store';
import { formatDate, formatToISODate, createDateFromISO } from '../../utils/dateUtils';
import { setModalOpen } from '../../store/uiSlice';
import ShiftCard from '../shifts/ShiftCard';
import ShiftCardSkeleton from '../shifts/ShiftCardSkeleton';
import EmptyState from '../common/EmptyState';

const DailyView: React.FC = () => {
  const dispatch = useDispatch();
  const { shifts, selectedDate } = useSelector((state: RootState) => state.shifts);
  const [shiftsLoading, setShiftsLoading] = React.useState(false);
  
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
  
  // Simulate loading state when shifting days
  React.useEffect(() => {
    setShiftsLoading(true);
    const timer = setTimeout(() => {
      setShiftsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedDate]);
  
  const handleAddShift = () => {
    dispatch(setModalOpen({ modal: 'addShift', isOpen: true }));
  };
  
  // Get shifts for the selected date with additional logging
  const shiftsForDay = useMemo(() => {
    console.log('DailyView - Filtering shifts for date:', selectedDate);
    
    // Verify the date format
    const dateObj = createDateFromISO(selectedDate);
    const localDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    
    console.log('DailyView - Parsed date object:', dateObj);
    console.log('DailyView - Local date format:', localDate);
    console.log('DailyView - Comparing against shifts:', shifts.map(s => s.date));
    
    // Strict equality check against the exact selectedDate string
    const filteredShifts = shifts.filter(shift => shift.date === selectedDate);
    console.log('DailyView - Filtered shifts:', filteredShifts);
    
    return filteredShifts;
  }, [selectedDate, shifts]);
  
  return (
    <motion.div
      className="daily-view"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mb-6">
        <div className="w-full mb-4 py-2 px-4 rounded-lg transition-colors bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
          <div className="text-xl font-bold text-center">
            {/* Display more readable date format using direct source date string */}
            {(() => {
              const dateObj = createDateFromISO(selectedDate);
              console.log('DailyView - Header date object:', dateObj);
              return dateObj.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              });
            })()}
          </div>
        </div>
        
        <div className="w-full">
          {shiftsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((_, index) => (
                <ShiftCardSkeleton key={index} />
              ))}
            </div>
          ) : shiftsForDay.length > 0 ? (
            <div className="space-y-4">
              {shiftsForDay.map(shift => (
                <ShiftCard key={shift.id} shift={shift} />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState 
                message="No shifts scheduled"
                actionLabel="Add Shift"
                onAction={handleAddShift}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DailyView; 
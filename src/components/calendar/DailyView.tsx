import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../../store';
import { formatDate, formatToISODate, createDateFromISO } from '../../utils/dateUtils';
import { setModalOpen } from '../../store/uiSlice';
import ShiftCard from '../shifts/ShiftCard';
import ShiftCardSkeleton from '../shifts/ShiftCardSkeleton';
import EmptyState from '../common/EmptyState';

interface DailyViewProps {
  selectedDate: string;
  handleAddShift: () => void;
}

const DailyView: React.FC<DailyViewProps> = ({ selectedDate, handleAddShift }) => {
  const dispatch = useDispatch();
  const { shifts } = useSelector((state: RootState) => state.shifts);
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
      className="daily-view pb-28"
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
                description={`Add a shift for ${(() => {
                  const dateObj = createDateFromISO(selectedDate);
                  return dateObj.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric'
                  });
                })()}`}
                actionLabel="Add Shift"
                onAction={handleAddShift}
                icon={
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 11v6m0 0v-6m0 6h6m-6 0H6" />
                  </svg>
                }
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DailyView; 
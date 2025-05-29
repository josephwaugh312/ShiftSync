import React, { memo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setModalOpen, setSelectedShiftId, addNotification } from '../../store/uiSlice';
import { deleteShift } from '../../store/shiftsSlice';
import { Shift } from '../../types';
import { RootState } from '../../store';
import { formatDate } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface ShiftCardProps {
  shift: Shift;
  isCompact?: boolean;
}

const ShiftCard: React.FC<ShiftCardProps> = ({ shift, isCompact = false }) => {
  const dispatch = useDispatch();
  const { shifts } = useSelector((state: RootState) => state.shifts);
  const { notificationPreferences } = useSelector((state: RootState) => state.ui);
  const { playSound } = useSoundEffects();
  
  // State for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Log the shift to debug
  console.log('Rendering ShiftCard with shift:', shift);

  const handleEditClick = () => {
    dispatch(setSelectedShiftId(shift.id));
    dispatch(setModalOpen({ modal: 'editShift', isOpen: true }));
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    // Prevent propagation to avoid triggering edit modal
    e.stopPropagation();
    
    // Set the selected shift to copy
    dispatch(setSelectedShiftId(shift.id));
    
    // Open the copy shift modal
    dispatch(setModalOpen({ modal: 'copyShift', isOpen: true }));
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    // Prevent propagation to avoid triggering edit modal
    e.stopPropagation();
    
    // Show delete confirmation modal
    setShowDeleteConfirm(true);
    playSound('click');
  };

  const handleConfirmDelete = () => {
    // Delete the shift
    dispatch(deleteShift(shift.id));
    
    // Close confirmation modal
    setShowDeleteConfirm(false);
    
    // Play delete sound
    playSound('delete');
    
    // Show success notification
    if (notificationPreferences.enabled && notificationPreferences.types.shifts) {
      dispatch(addNotification({
        message: `Shift for ${shift.employeeName} deleted successfully`,
        type: 'success',
        category: 'shifts'
      }));
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    playSound('click');
  };

  const getRoleGradient = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'bg-gradient-to-r from-blue-500 to-blue-300';
      case 'Server': return 'bg-gradient-to-r from-purple-500 to-purple-300';
      case 'Manager': return 'bg-gradient-to-r from-yellow-500 to-yellow-300';
      case 'Cook': return 'bg-gradient-to-r from-red-500 to-red-300';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-300';
    }
  };

  const getRoleBorderColor = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'border-blue-500';
      case 'Server': return 'border-purple-500';
      case 'Manager': return 'border-yellow-500';
      case 'Cook': return 'border-red-500';
      default: return 'border-gray-500';
    }
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'bg-blue-500 text-white';
      case 'Server': return 'bg-purple-500 text-white';
      case 'Manager': return 'bg-yellow-500 text-dark-900';
      case 'Cook': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Helper to convert time string to minutes for easier comparison
  const timeToMinutes = (timeStr: string): number => {
    try {
      // Handle 12-hour format (e.g., "9:00 AM")
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const [timePart, period] = timeStr.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
      } 
      // Handle 24-hour format (e.g., "09:00")
      else {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          console.error('Invalid time format:', timeStr);
          return 0;
        }
        return hours * 60 + minutes;
      }
    } catch (error) {
      console.error('Error converting time to minutes:', timeStr, error);
      return 0;
    }
  };

  // Check for shift overlaps with other shifts on the same day
  const checkForOverlaps = (): { hasOverlap: boolean; overlappingShifts: Shift[] } => {
    if (!shift) return { hasOverlap: false, overlappingShifts: [] };
    
    const overlappingShifts = shifts.filter(otherShift => {
      // Skip self-comparison and different dates
      if (otherShift.id === shift.id || otherShift.date !== shift.date) {
        return false;
      }
      
      // Must be both the same employee AND the same role to be considered a conflict
      const isSameEmployee = otherShift.employeeName === shift.employeeName;
      const isSameRole = otherShift.role === shift.role;
      
      if (!isSameEmployee || !isSameRole) {
        return false;
      }
      
      const thisStart = timeToMinutes(shift.startTime);
      const thisEnd = timeToMinutes(shift.endTime);
      const otherStart = timeToMinutes(otherShift.startTime);
      const otherEnd = timeToMinutes(otherShift.endTime);
      
      // Check if shifts overlap in time
      return (thisStart < otherEnd && thisEnd > otherStart);
    });
    
    return { 
      hasOverlap: overlappingShifts.length > 0,
      overlappingShifts
    };
  };

  const getStatusBadge = (status: string): JSX.Element => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className={`inline-flex items-center rounded-full ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100`}>
            <svg className={`${isCompact ? 'w-2 h-2' : 'w-3 h-3'} mr-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirmed
          </span>
        );
      case 'Pending':
        return (
          <span className={`inline-flex items-center rounded-full ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100`}>
            <svg className={`${isCompact ? 'w-2 h-2' : 'w-3 h-3'} mr-1 animate-pulse`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending
          </span>
        );
      case 'Canceled':
        return (
          <span className={`inline-flex items-center rounded-full ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100`}>
            <svg className={`${isCompact ? 'w-2 h-2' : 'w-3 h-3'} mr-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Canceled
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center rounded-full ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100`}>
            {status}
          </span>
        );
    }
  };

  // Calculate exact duration for display (hours and minutes)
  const calculateExactDuration = (): string => {
    try {
      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      const [endHour, endMinute] = shift.endTime.split(':').map(Number);
      
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        console.error('Invalid time format in shift:', shift);
        return '0h';
      }
      
      // Handle overnight shifts (end time is earlier than start time)
      let hourDiff = endHour - startHour;
      let minuteDiff = endMinute - startMinute;
      
      // If end time is earlier than start time, assume it's an overnight shift
      if (hourDiff < 0 || (hourDiff === 0 && minuteDiff < 0)) {
        hourDiff = hourDiff + 24; // Add 24 hours for overnight shifts
      }
      
      if (minuteDiff < 0) {
        minuteDiff += 60;
        hourDiff -= 1;
      }
      
      if (hourDiff === 0) {
        return `${minuteDiff}m`;
      } else if (minuteDiff === 0) {
        return `${hourDiff}h`;
      } else {
        return `${hourDiff}h ${minuteDiff}m`;
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      return '0h';
    }
  };

  // Get role-specific color for the duration bar
  const getRoleBarColor = (role: string): string => {
    switch (role) {
      case 'Front Desk': return 'bg-blue-500';
      case 'Server': return 'bg-purple-500';
      case 'Manager': return 'bg-yellow-500';
      case 'Cook': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Calculate shift duration in hours for the visual indicator
  const calculateDuration = (): number => {
    try {
      // Log shift data to debug
      console.log('Processing shift for duration bar:', shift);
      
      if (!shift.startTime || !shift.endTime) {
        console.error('Missing time data in shift:', shift);
        return 2; // Default to 2 hours if invalid
      }
      
      const startTimeParts = shift.startTime.split(':');
      const endTimeParts = shift.endTime.split(':');
      
      if (!startTimeParts || !endTimeParts || startTimeParts.length < 2 || endTimeParts.length < 2) {
        console.error('Invalid time format in shift:', shift);
        return 2;
      }
      
      const startHour = parseInt(startTimeParts[0], 10);
      const startMinute = parseInt(startTimeParts[1], 10);
      const endHour = parseInt(endTimeParts[0], 10);
      const endMinute = parseInt(endTimeParts[1], 10);
      
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        console.error('Invalid time format in shift:', shift);
        return 2;
      }
      
      // Handle overnight shifts (end time is earlier than start time)
      let hourDiff = endHour - startHour;
      let minuteDiff = endMinute - startMinute;
      
      // If end time is earlier than start time, assume it's an overnight shift
      if (hourDiff < 0 || (hourDiff === 0 && minuteDiff < 0)) {
        hourDiff = hourDiff + 24; // Add 24 hours for overnight shifts
      }
      
      if (minuteDiff < 0) {
        minuteDiff += 60;
        hourDiff -= 1;
      }
      
      // Add partial hour for minutes
      const partialHour = minuteDiff / 60;
      const totalHours = hourDiff + partialHour;
      
      console.log('Calculated duration:', totalHours, 'hours');
      
      // Cap maximum width at 8 hours for visualization
      return Math.min(Math.max(totalHours, 0.5), 8);
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 2; // Default to 2 hours if error
    }
  };

  const duration = calculateDuration();
  const exactDuration = calculateExactDuration();
  const { hasOverlap, overlappingShifts } = checkForOverlaps();

  // Overlap warning badge component
  const OverlapWarningBadge = (): JSX.Element | null => {
    if (!hasOverlap) return null;
    
    return (
      <span className={`inline-flex items-center rounded-full ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100`}>
        <svg className={`${isCompact ? 'w-2 h-2' : 'w-3 h-3'} mr-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Overlap
      </span>
    );
  };

  if (isCompact) {
    return (
      <motion.div
        className={`border-l-4 rounded-md shadow-sm bg-white dark:bg-dark-800 border ${getRoleBorderColor(shift.role)} overflow-hidden cursor-pointer`}
        style={{ borderLeftColor: shift.color }}
        onClick={handleEditClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        role="button"
        aria-label={`${shift.employeeName} shift from ${shift.timeRange}`}
      >
        <div className="p-2">
          <div className="flex justify-between items-center">
            <div className="font-medium text-gray-900 dark:text-white text-sm">
              {shift.timeRange}
            </div>
            <div className="flex space-x-1">
              <OverlapWarningBadge />
              {getStatusBadge(shift.status)}
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>{shift.employeeName}</span>
            <span className={`role-badge text-xs ${getRoleBadgeColor(shift.role)}`}>{shift.role}</span>
          </div>
          {/* Duration bar - improved for compact view */}
          <div className="mt-2 h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getRoleBarColor(shift.role)}`} 
              style={{ 
                width: `${Math.max((duration / 8) * 100, 20)}%`,
                backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.3) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.3) 75%, transparent 75%, transparent)',
                backgroundSize: '10px 10px'
              }}
              title={`${exactDuration} duration`}
            ></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`shift-card border-l-4 rounded-lg shadow-sm bg-white dark:bg-dark-800 border ${getRoleBorderColor(shift.role)} overflow-hidden cursor-pointer transition-shadow hover:shadow-md relative`}
      style={{ borderLeftColor: shift.color }}
      onClick={handleEditClick}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      role="button"
      aria-label={`${shift.employeeName} shift from ${shift.timeRange}`}
    >
      {/* Floating logo */}
      <div className="absolute -right-3 -top-3 z-10">
        <motion.div
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-white dark:border-dark-700"
          animate={{ 
            y: [0, -5, 0],
            x: [0, 2, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            repeatType: "reverse", 
            duration: 4,
            ease: "easeInOut"
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-dark-900 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-orange-500"></div>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <div className="flex items-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-0">
                {shift.timeRange}
              </div>
              {/* Duration pill */}
              <div className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400">
                {exactDuration}
              </div>
            </div>
            <div className="flex mt-1 gap-2 items-center">
              <div className="font-medium text-gray-700 dark:text-gray-300">
                {shift.employeeName}
              </div>
              <div className="h-1 w-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
              <div className={`role-badge ${getRoleBadgeColor(shift.role)}`}>
                {shift.role}
              </div>
            </div>
          </div>
          <div className="mt-2 sm:mt-0">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(shift.status)}
              {hasOverlap && <OverlapWarningBadge />}
              
              {/* Copy Button */}
              <div 
                onClick={handleCopyClick}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                title="Copy shift"
                aria-label="Copy shift"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              
              {/* Delete Button */}
              <div 
                onClick={handleDeleteClick}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 cursor-pointer hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                title="Delete shift"
                aria-label="Delete shift"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Duration bar showing relative shift length */}
      <div className="px-4 pb-4">
        <div className="h-5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden relative">
          <div 
            className={`h-full ${getRoleBarColor(shift.role)}`} 
            style={{ 
              width: `${Math.max((duration / 8) * 100, 20)}%`,
              backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.3) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.3) 75%, transparent 75%, transparent)',
              backgroundSize: '15px 15px',
              transition: 'width 0.3s ease-in-out'
            }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium px-2 text-gray-700 dark:text-gray-300 mix-blend-difference z-10">
              {exactDuration}
            </span>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCancelDelete}></div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-800 rounded-lg p-6 max-w-md mx-auto relative z-50 shadow-2xl"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete Shift</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete the shift for <strong>{shift.employeeName}</strong> on{' '}
                <strong>{new Date(shift.date).toLocaleDateString()}</strong> from{' '}
                <strong>{shift.timeRange}</strong>?
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Shift
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default memo(ShiftCard); 
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { addShift } from '../../store/shiftsSlice';
import { setModalOpen, setSelectedShiftId, addNotification } from '../../store/uiSlice';
import { RootState } from '../../store';
import { Shift } from '../../types';
import LoadingButton from '../common/LoadingButton';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { notificationService } from '../../services/NotificationService';

// Helper to format dates consistently
const formatDate = (date: Date): string => {
  // Use local date components instead of UTC to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CopyShiftForm: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { shifts } = useSelector((state: RootState) => state.shifts);
  const { selectedShiftId } = useSelector((state: RootState) => state.ui);
  const { employees } = useSelector((state: RootState) => state.employees);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [copyMode, setCopyMode] = useState<'single' | 'multiple' | 'recurring'>('single');
  const [validationError, setValidationError] = useState<{message: string, type: 'error' | 'warning'} | null>(null);
  const [recurringOptions, setRecurringOptions] = useState({
    frequency: 'weekly', // weekly, daily
    occurrences: 4,
    daysOfWeek: [] as number[], // 0-6, Sunday to Saturday
  });
  
  // Find the original shift to copy
  const originalShift = shifts.find(shift => shift.id === selectedShiftId);
  
  // Close the modal
  const handleClose = () => {
    dispatch(setModalOpen({ modal: 'copyShift', isOpen: false }));
    dispatch(setSelectedShiftId(null));
  };

  // Remove dates where we already have the same employee working at the same time
  useEffect(() => {
    if (!originalShift || selectedDates.length === 0) return;

    // Get original shift's date for comparison
    const originalDate = originalShift.date;

    // Filter out dates that match the original shift date to avoid duplication
    const filteredDates = selectedDates.filter(date => {
      return formatDate(date) !== originalDate;
    });

    if (filteredDates.length !== selectedDates.length) {
      setSelectedDates(filteredDates);
    }
  }, [selectedDates, originalShift]);
  
  // Add a validation function for employee details 
  const validateEmployeeDetails = (shift: Shift): boolean => {
    // Check if employee exists in the employees list
    const employeeExists = employees.some(emp => emp.name === shift.employeeName);
    
    if (!employeeExists) {
      setValidationError({
        message: `Employee "${shift.employeeName}" does not exist. Please add them in the Employees tab first.`,
        type: 'error'
      });
      return false;
    }
    
    // Check if the role matches the employee's role
    const employee = employees.find(emp => emp.name === shift.employeeName);
    
    if (employee && employee.role !== shift.role) {
      setValidationError({
        message: `Role mismatch: ${shift.employeeName} is a ${employee.role}, not a ${shift.role}.`,
        type: 'warning'
      });
      return false;
    }
    
    return true;
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originalShift) {
      dispatch(addNotification({
        message: 'Error: Could not find the original shift to copy',
        type: 'error',
        category: 'general'
      }));
      return;
    }
    
    if (selectedDates.length === 0) {
      dispatch(addNotification({
        message: 'Please select at least one date to copy the shift to',
        type: 'warning',
        category: 'general'
      }));
      return;
    }
    
    // Filter out any selected dates that match the original shift's date
    const filteredDates = selectedDates.filter(date => {
      return formatDate(date) !== originalShift.date;
    });
    
    if (filteredDates.length === 0) {
      dispatch(addNotification({
        message: 'Cannot copy shift to its original date. Please select a different date.',
        type: 'warning',
        category: 'general'
      }));
      return;
    }
    
    // Validate employee details before proceeding
    if (!validateEmployeeDetails(originalShift)) {
      return;
    }
    
    // Set loading state
    setIsSubmitting(true);
    
    // Create new shifts for each selected date
    const newShifts: Shift[] = filteredDates.map(date => {
      // Ensure we use local date, not UTC
      const formattedDate = formatDate(date);
      
      // Log for debugging
      console.log(`Creating shift for date: ${date.toLocaleDateString()}, formatted as: ${formattedDate}`);
      
      // Create a new ID and set the new date with proper formatting
      return {
        ...originalShift,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        date: formattedDate,
      };
    });
    
    // Add each shift with a slight delay between them
    setTimeout(() => {
      newShifts.forEach((shift, index) => {
        setTimeout(() => {
          console.log(`Adding shift with date: ${shift.date}`);
          dispatch(addShift(shift));
          
          // Check for shift reminders
          notificationService.checkShiftReminder(shift);
        }, index * 100);
      });
      
      // Add success notification
      dispatch(addNotification({
        message: `Successfully copied shift to ${newShifts.length} day(s)`,
        type: 'success',
        category: 'general'
      }));
      
      // Reset states and close form
      setIsSubmitting(false);
      handleClose();
    }, 800);
  };
  
  // Handle adding a recurring pattern
  const handleAddRecurringPattern = () => {
    if (!originalShift) return;
    
    const dates: Date[] = [];
    // Start from tomorrow to avoid potential issues with today's date
    const startDate = new Date();
    startDate.setHours(12, 0, 0, 0); // Set to noon to avoid any time-of-day issues
    console.log(`Starting recurring pattern from date: ${startDate.toLocaleDateString()}`);
    
    // For weekly pattern, we need tomorrow's date
    const tomorrowDate = new Date(startDate);
    tomorrowDate.setDate(startDate.getDate() + 1);
    console.log(`Tomorrow's date for recurring pattern: ${tomorrowDate.toLocaleDateString()}`);
    
    if (recurringOptions.frequency === 'weekly') {
      // Weekly pattern: add for the selected days of week for the given number of weeks
      const daysToAdd = recurringOptions.daysOfWeek.length > 0 
        ? recurringOptions.daysOfWeek 
        : [tomorrowDate.getDay()]; // Default to tomorrow's day of week if none selected
      
      console.log(`Weekly pattern with ${recurringOptions.occurrences} weeks for days: ${daysToAdd.map(d => getDayName(d)).join(', ')}`);
      
      for (let week = 0; week < recurringOptions.occurrences; week++) {
        for (const dayOfWeek of daysToAdd) {
          const date = new Date(tomorrowDate);
          
          // Calculate the day offset for the current week
          // Get days until the next occurrence of dayOfWeek
          // This part is problematic for Saturday (6) which may roll into Sunday
          // Fix by ensuring we're calculating relative to the current day of week
          
          // Current approach can push Saturday to Sunday due to day calculation
          // const dayDiff = (dayOfWeek - tomorrowDate.getDay() + 7) % 7;
          
          // Improved approach using more explicit calculation
          let dayDiff;
          if (dayOfWeek >= tomorrowDate.getDay()) {
            // If target day is later in the week (or same day)
            dayDiff = dayOfWeek - tomorrowDate.getDay();
          } else {
            // If target day has already passed in the current week, go to next week
            dayDiff = 7 - (tomorrowDate.getDay() - dayOfWeek);
          }
          
          // Add days to reach the correct day of week, plus weeks
          date.setDate(tomorrowDate.getDate() + dayDiff + (week * 7));
          
          console.log(`Generated date for week ${week}, day ${getDayName(dayOfWeek)}: ${date.toLocaleDateString()} (${date.getDay()})`);
          
          // Skip if it's the original shift date
          if (originalShift && formatDate(date) !== originalShift.date) {
            dates.push(date);
          } else {
            console.log(`Skipping date ${date.toLocaleDateString()} because it matches original shift date`);
          }
        }
      }
    } else if (recurringOptions.frequency === 'daily') {
      // Daily pattern: add for the given number of consecutive days
      console.log(`Daily pattern with ${recurringOptions.occurrences} days`);
      
      for (let day = 0; day < recurringOptions.occurrences; day++) {
        const date = new Date(tomorrowDate);
        date.setDate(tomorrowDate.getDate() + day);
        
        console.log(`Generated date for day ${day}: ${date.toLocaleDateString()}`);
        
        // Skip if it's the original shift date
        if (originalShift && formatDate(date) !== originalShift.date) {
          dates.push(date);
        } else {
          console.log(`Skipping date ${date.toLocaleDateString()} because it matches original shift date`);
        }
      }
    }
    
    // Update selected dates - sort chronologically
    dates.sort((a, b) => a.getTime() - b.getTime());
    console.log(`Generated ${dates.length} dates in total:`, dates.map(d => d.toLocaleDateString()));
    
    setSelectedDates(dates);
    
    // Show confirmation
    if (dates.length > 0) {
      dispatch(addNotification({
        message: `Generated ${dates.length} dates for recurring pattern`,
        type: 'success',
        category: 'general'
      }));
    } else {
      dispatch(addNotification({
        message: 'No valid dates generated. Please check your pattern.',
        type: 'warning',
        category: 'general'
      }));
    }
  };
  
  // Handle day of week toggle for weekly recurring patterns
  const handleDayOfWeekToggle = (dayIndex: number) => {
    const updatedDays = [...recurringOptions.daysOfWeek];
    const existingIndex = updatedDays.indexOf(dayIndex);
    
    if (existingIndex > -1) {
      updatedDays.splice(existingIndex, 1);
    } else {
      updatedDays.push(dayIndex);
    }
    
    setRecurringOptions({
      ...recurringOptions,
      daysOfWeek: updatedDays,
    });
  };
  
  // Get day name helper
  const getDayName = (dayIndex: number): string => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
  };
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-dark-800 rounded-xl shadow-xl overflow-hidden w-full max-w-md mx-auto"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Copy Shift
              <button
                type="button"
                onClick={handleClose}
                className="float-right text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </h2>
            
            {!originalShift ? (
              <div className="text-center p-4">
                <p className="text-gray-600 dark:text-gray-400">Error: Could not find the shift to copy</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Original Shift Details
                  </h3>
                  <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100">
                          {originalShift.employeeName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {originalShift.role}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(originalShift.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {originalShift.timeRange}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Copy Mode
                  </label>
                  <div className="flex space-x-4 mb-4">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-md ${
                        copyMode === 'single' 
                          ? 'bg-primary-500 text-white' 
                          : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => setCopyMode('single')}
                    >
                      Single Date
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-md ${
                        copyMode === 'multiple' 
                          ? 'bg-primary-500 text-white' 
                          : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => setCopyMode('multiple')}
                    >
                      Multiple Dates
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-md ${
                        copyMode === 'recurring' 
                          ? 'bg-primary-500 text-white' 
                          : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => setCopyMode('recurring')}
                    >
                      Recurring
                    </button>
                  </div>
                  
                  {copyMode === 'single' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Date
                      </label>
                      <DatePicker
                        selected={selectedDates[0] || null}
                        onChange={(date: Date) => setSelectedDates([date])}
                        inline
                        className="w-full p-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        filterDate={(date: Date) => formatDate(date) !== (originalShift?.date || '')}
                      />
                    </div>
                  )}
                  
                  {copyMode === 'multiple' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Multiple Dates
                      </label>
                      <DatePicker
                        selected={new Date()}
                        onChange={(date: Date) => {
                          // Add date if not already selected, otherwise remove it
                          const dateString = formatDate(date);

                          // Prevent selecting the original shift's date
                          if (dateString === originalShift?.date) {
                            dispatch(addNotification({
                              message: 'Cannot copy to the original shift date',
                              type: 'warning',
                              category: 'general'
                            }));
                            return;
                          }

                          const existingIndex = selectedDates.findIndex(
                            d => formatDate(d) === dateString
                          );
                            
                          if (existingIndex > -1) {
                            const newDates = [...selectedDates];
                            newDates.splice(existingIndex, 1);
                            setSelectedDates(newDates);
                          } else {
                            setSelectedDates([...selectedDates, date]);
                          }
                        }}
                        inline
                        highlightDates={selectedDates}
                        className="w-full"
                        filterDate={(date: Date) => formatDate(date) !== (originalShift?.date || '')}
                      />
                      
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Selected Dates ({selectedDates.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedDates.map((date, index) => (
                            <div 
                              key={index} 
                              className="bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded-md text-xs flex items-center"
                            >
                              {date.toLocaleDateString()}
                              <button
                                type="button"
                                className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                onClick={() => {
                                  const newDates = [...selectedDates];
                                  newDates.splice(index, 1);
                                  setSelectedDates(newDates);
                                }}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {copyMode === 'recurring' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Frequency
                        </label>
                        <div className="flex space-x-4">
                          <button
                            type="button"
                            className={`px-4 py-2 rounded-md ${
                              recurringOptions.frequency === 'daily' 
                                ? 'bg-primary-500 text-white' 
                                : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                            }`}
                            onClick={() => setRecurringOptions({
                              ...recurringOptions,
                              frequency: 'daily'
                            })}
                          >
                            Daily
                          </button>
                          <button
                            type="button"
                            className={`px-4 py-2 rounded-md ${
                              recurringOptions.frequency === 'weekly' 
                                ? 'bg-primary-500 text-white' 
                                : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                            }`}
                            onClick={() => setRecurringOptions({
                              ...recurringOptions,
                              frequency: 'weekly'
                            })}
                          >
                            Weekly
                          </button>
                        </div>
                      </div>
                      
                      {recurringOptions.frequency === 'weekly' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Days of Week
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
                              <button
                                key={dayIndex}
                                type="button"
                                className={`px-3 py-1 rounded-md text-sm ${
                                  recurringOptions.daysOfWeek.includes(dayIndex) 
                                    ? 'bg-primary-500 text-white' 
                                    : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                                }`}
                                onClick={() => handleDayOfWeekToggle(dayIndex)}
                              >
                                {getDayName(dayIndex)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {recurringOptions.frequency === 'weekly' ? 'Number of Weeks' : 'Number of Days'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={recurringOptions.occurrences}
                          onChange={(e) => setRecurringOptions({
                            ...recurringOptions,
                            occurrences: parseInt(e.target.value) || 1
                          })}
                          className="w-full p-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <button
                          type="button"
                          className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                          onClick={handleAddRecurringPattern}
                        >
                          Generate Dates
                        </button>
                      </div>

                      {selectedDates.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Generated Dates ({selectedDates.length}):
                          </p>
                          <div className="max-h-40 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                              {selectedDates.map((date, index) => (
                                <div 
                                  key={index} 
                                  className="bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded-md text-xs flex items-center"
                                >
                                  {date.toLocaleDateString()}
                                  <button
                                    type="button"
                                    className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    onClick={() => {
                                      const newDates = [...selectedDates];
                                      newDates.splice(index, 1);
                                      setSelectedDates(newDates);
                                    }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <LoadingButton
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                  >
                    Copy Shift
                  </LoadingButton>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CopyShiftForm;
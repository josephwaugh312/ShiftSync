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
export const formatDate = (date: Date): string => {
  // Use local date components instead of UTC to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Export day name helper for testing
export const getDayName = (dayIndex: number): string => {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
};

// Export copy mode validation for testing
export const validateCopyMode = (mode: string): boolean => {
  return ['single', 'multiple', 'recurring'].includes(mode);
};

// Export date filtering logic for testing
export const shouldFilterDate = (date: Date, originalShiftDate: string): boolean => {
  return formatDate(date) === originalShiftDate;
};

// Export shift validation logic for testing
export const validateShiftCopy = (originalShift: any, selectedDates: Date[]): { isValid: boolean; error?: string } => {
  if (!originalShift) {
    return {
      isValid: false,
      error: 'Could not find the original shift to copy'
    };
  }
  
  if (selectedDates.length === 0) {
    return {
      isValid: false,
      error: 'Please select at least one date to copy the shift to'
    };
  }
  
  return { isValid: true };
};

// Export date filtering for submission
export const filterValidDates = (selectedDates: Date[], originalShiftDate: string): Date[] => {
  return selectedDates.filter(date => formatDate(date) !== originalShiftDate);
};

// Export shift ID generation logic for testing
export const generateShiftId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5);
};

// Export new shift creation logic for testing
export const createCopiedShift = (originalShift: any, newDate: Date): any => {
  const formattedDate = formatDate(newDate);
  
  return {
    ...originalShift,
    id: generateShiftId(),
    date: formattedDate,
  };
};

// Export employee validation logic for testing
export const validateEmployeeDetails = (shift: any, employees: any[]): { isValid: boolean; error?: { message: string; type: 'error' | 'warning' } } => {
  // Check if employee exists in the employees list
  const employeeExists = employees.some(emp => emp.name === shift.employeeName);
  
  if (!employeeExists) {
    return {
      isValid: false,
      error: {
        message: `Employee "${shift.employeeName}" does not exist. Please add them in the Employees tab first.`,
        type: 'error'
      }
    };
  }
  
  // Check if the role matches the employee's role
  const employee = employees.find(emp => emp.name === shift.employeeName);
  
  if (employee && employee.role !== shift.role) {
    return {
      isValid: false,
      error: {
        message: `Role mismatch: ${shift.employeeName} is a ${employee.role}, not a ${shift.role}.`,
        type: 'warning'
      }
    };
  }
  
  return { isValid: true };
};

// Export day of week toggle logic for testing
export const toggleDayOfWeek = (currentDays: number[], dayIndex: number): number[] => {
  const updatedDays = [...currentDays];
  const existingIndex = updatedDays.indexOf(dayIndex);
  
  if (existingIndex > -1) {
    updatedDays.splice(existingIndex, 1);
  } else {
    updatedDays.push(dayIndex);
  }
  
  return updatedDays;
};

// Export day difference calculation for testing
export const calculateDayDifference = (targetDay: number, currentDay: number): number => {
  if (targetDay >= currentDay) {
    // If target day is later in the week (or same day)
    return targetDay - currentDay;
  } else {
    // If target day has already passed in the current week, go to next week
    return 7 - (currentDay - targetDay);
  }
};

// Export weekly pattern generation for testing
export const generateWeeklyPattern = (
  startDate: Date,
  daysOfWeek: number[],
  numWeeks: number,
  originalShiftDate: string
): Date[] => {
  const dates: Date[] = [];
  const tomorrowDate = new Date(startDate);
  tomorrowDate.setDate(startDate.getDate() + 1);
  
  const daysToAdd = daysOfWeek.length > 0 
    ? daysOfWeek 
    : [tomorrowDate.getDay()]; // Default to tomorrow's day of week if none selected
  
  for (let week = 0; week < numWeeks; week++) {
    for (const dayOfWeek of daysToAdd) {
      const date = new Date(tomorrowDate);
      const dayDiff = calculateDayDifference(dayOfWeek, tomorrowDate.getDay());
      
      // Add days to reach the correct day of week, plus weeks
      date.setDate(tomorrowDate.getDate() + dayDiff + (week * 7));
      
      // Skip if it's the original shift date
      if (formatDate(date) !== originalShiftDate) {
        dates.push(date);
      }
    }
  }
  
  return dates;
};

// Export daily pattern generation for testing
export const generateDailyPattern = (
  startDate: Date,
  numDays: number,
  originalShiftDate: string
): Date[] => {
  const dates: Date[] = [];
  const tomorrowDate = new Date(startDate);
  tomorrowDate.setDate(startDate.getDate() + 1);
  
  for (let day = 0; day < numDays; day++) {
    const date = new Date(tomorrowDate);
    date.setDate(tomorrowDate.getDate() + day);
    
    // Skip if it's the original shift date
    if (formatDate(date) !== originalShiftDate) {
      dates.push(date);
    }
  }
  
  return dates;
};

// Export date sorting and validation for testing
export const sortAndValidateDates = (dates: Date[]): Date[] => {
  return [...dates].sort((a, b) => a.getTime() - b.getTime());
};

// Export recurring pattern generation for testing
export const generateRecurringPattern = (
  frequency: 'daily' | 'weekly',
  occurrences: number,
  daysOfWeek: number[],
  originalShiftDate: string
): Date[] => {
  const startDate = new Date();
  startDate.setHours(12, 0, 0, 0); // Set to noon to avoid any time-of-day issues
  
  let dates: Date[] = [];
  
  if (frequency === 'weekly') {
    dates = generateWeeklyPattern(startDate, daysOfWeek, occurrences, originalShiftDate);
  } else if (frequency === 'daily') {
    dates = generateDailyPattern(startDate, occurrences, originalShiftDate);
  }
  
  return sortAndValidateDates(dates);
};

// Export notification message generation for testing
export const createPatternNotification = (datesLength: number): { message: string; type: 'success' | 'warning' } => {
  if (datesLength > 0) {
    return {
      message: `Generated ${datesLength} dates for recurring pattern`,
      type: 'success'
    };
  } else {
    return {
      message: 'No valid dates generated. Please check your pattern.',
      type: 'warning'
    };
  }
};

// Export form submission validation for testing
export const validateFormSubmission = (
  originalShift: any,
  selectedDates: Date[]
): { isValid: boolean; errorNotification?: { message: string; type: string; category: string } } => {
  if (!originalShift) {
    return {
      isValid: false,
      errorNotification: {
        message: 'Error: Could not find the original shift to copy',
        type: 'error',
        category: 'general'
      }
    };
  }
  
  if (selectedDates.length === 0) {
    return {
      isValid: false,
      errorNotification: {
        message: 'Please select at least one date to copy the shift to',
        type: 'warning',
        category: 'general'
      }
    };
  }
  
  return { isValid: true };
};

// Export filtered dates validation for testing
export const validateFilteredDates = (
  filteredDates: Date[]
): { isValid: boolean; errorNotification?: { message: string; type: string; category: string } } => {
  if (filteredDates.length === 0) {
    return {
      isValid: false,
      errorNotification: {
        message: 'Cannot copy shift to its original date. Please select a different date.',
        type: 'warning',
        category: 'general'
      }
    };
  }
  
  return { isValid: true };
};

// Export batch shift creation for testing
export const createBatchShifts = (originalShift: any, dates: Date[]): any[] => {
  return dates.map(date => createCopiedShift(originalShift, date));
};

// Export success notification creation for testing
export const createSuccessNotification = (shiftsCount: number): { message: string; type: string; category: string } => {
  return {
    message: `Successfully copied shift to ${shiftsCount} day(s)`,
    type: 'success',
    category: 'general'
  };
};

// Export modal actions for testing
export const getModalActions = (): { modal: string; isOpen: boolean } => {
  return { modal: 'copyShift', isOpen: false };
};

// Export delay configuration for testing
export const getSubmissionDelays = () => {
  return {
    submissionDelay: 800,
    batchDelay: 100
  };
};

// Export date selection logic for testing
export const handleDateSelection = (
  currentDates: Date[],
  newDate: Date,
  originalShiftDate: string
): { dates: Date[]; shouldShowWarning: boolean } => {
  const dateString = formatDate(newDate);
  
  // Prevent selecting the original shift's date
  if (dateString === originalShiftDate) {
    return {
      dates: currentDates,
      shouldShowWarning: true
    };
  }
  
  const existingIndex = currentDates.findIndex(d => formatDate(d) === dateString);
  
  if (existingIndex > -1) {
    // Remove existing date
    const newDates = [...currentDates];
    newDates.splice(existingIndex, 1);
    return {
      dates: newDates,
      shouldShowWarning: false
    };
  } else {
    // Add new date
    return {
      dates: [...currentDates, newDate],
      shouldShowWarning: false
    };
  }
};

// Export recurring options validation for testing
export const validateRecurringOptions = (
  frequency: string,
  occurrences: number,
  daysOfWeek: number[]
): { isValid: boolean; error?: string } => {
  if (occurrences < 1 || occurrences > 12) {
    return {
      isValid: false,
      error: 'Occurrences must be between 1 and 12'
    };
  }
  
  if (frequency === 'weekly' && daysOfWeek.length === 0) {
    // Weekly with no days selected is still valid (will default to tomorrow's day)
    return { isValid: true };
  }
  
  return { isValid: true };
};

// Export form state defaults for testing
export const getFormStateDefaults = () => {
  return {
    isSubmitting: false,
    selectedDates: [],
    copyMode: 'single' as const,
    validationError: null,
    recurringOptions: {
      frequency: 'weekly' as const,
      occurrences: 4,
      daysOfWeek: [] as number[]
    }
  };
};

// Export useEffect logic for testing
export const processSelectedDatesEffect = (
  originalShift: any,
  selectedDates: Date[]
): { shouldFilter: boolean; filteredDates: Date[] } => {
  if (!originalShift || selectedDates.length === 0) {
    return { shouldFilter: false, filteredDates: selectedDates };
  }

  const originalDate = originalShift.date;
  const filteredDates = selectedDates.filter(date => {
    return formatDate(date) !== originalDate;
  });

  return {
    shouldFilter: filteredDates.length !== selectedDates.length,
    filteredDates
  };
};

// Export modal closure logic for testing
export const createModalCloseActions = () => {
  return [
    { type: 'setModalOpen', payload: { modal: 'copyShift', isOpen: false } },
    { type: 'setSelectedShiftId', payload: null }
  ];
};

// Export form submission pipeline for testing
export const processFormSubmission = (
  originalShift: any,
  selectedDates: Date[],
  employees: any[]
): {
  isValid: boolean;
  errorNotification?: { message: string; type: string; category: string };
  processedData?: { filteredDates: Date[]; newShifts: any[] };
} => {
  // Step 1: Basic validation
  const basicValidation = validateFormSubmission(originalShift, selectedDates);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Step 2: Filter dates
  const filteredDates = filterValidDates(selectedDates, originalShift.date);
  const filteredValidation = validateFilteredDates(filteredDates);
  if (!filteredValidation.isValid) {
    return filteredValidation;
  }

  // Step 3: Employee validation
  const employeeValidation = validateEmployeeDetails(originalShift, employees);
  if (!employeeValidation.isValid) {
    return {
      isValid: false,
      errorNotification: {
        message: employeeValidation.error?.message || 'Employee validation failed',
        type: employeeValidation.error?.type || 'error',
        category: 'general'
      }
    };
  }

  // Step 4: Create new shifts
  const newShifts = createBatchShifts(originalShift, filteredDates);

  return {
    isValid: true,
    processedData: { filteredDates, newShifts }
  };
};

// Export batch dispatch logic for testing
export const createBatchDispatchActions = (
  newShifts: any[],
  delays: { submissionDelay: number; batchDelay: number }
) => {
  const actions: Array<{ type: string; payload?: any; delay?: number }> = [];

  // Add shift actions with delays
  newShifts.forEach((shift, index) => {
    actions.push({
      type: 'addShift',
      payload: shift,
      delay: delays.submissionDelay + (index * delays.batchDelay)
    });
  });

  // Add success notification
  actions.push({
    type: 'addNotification',
    payload: createSuccessNotification(newShifts.length),
    delay: delays.submissionDelay + (newShifts.length * delays.batchDelay)
  });

  return actions;
};

// Export recurring options update logic for testing
export const updateRecurringOptions = (
  currentOptions: { frequency: string; occurrences: number; daysOfWeek: number[] },
  updateType: 'frequency' | 'occurrences' | 'daysOfWeek',
  value: any
): { frequency: string; occurrences: number; daysOfWeek: number[] } => {
  switch (updateType) {
    case 'frequency':
      return { ...currentOptions, frequency: value };
    case 'occurrences':
      return { ...currentOptions, occurrences: parseInt(value) || 1 };
    case 'daysOfWeek':
      return { ...currentOptions, daysOfWeek: value };
    default:
      return currentOptions;
  }
};

// Export copy mode styling logic for testing
export const getCopyModeButtonClass = (
  currentMode: string,
  buttonMode: string,
  baseClass: string = 'px-3 py-2 rounded-md text-sm'
): string => {
  const activeClass = 'bg-primary-500 text-white';
  const inactiveClass = 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300';
  
  return `${baseClass} ${currentMode === buttonMode ? activeClass : inactiveClass}`;
};

// Export date picker filter logic for testing
export const createDatePickerFilter = (originalShiftDate?: string) => {
  return (date: Date) => formatDate(date) !== (originalShiftDate || '');
};

// Export multiple dates handling logic for testing
export const processMultipleDateChange = (
  date: Date,
  currentDates: Date[],
  originalShiftDate?: string
): {
  updatedDates: Date[];
  shouldShowWarning: boolean;
  warningMessage?: string;
} => {
  const dateString = formatDate(date);

  // Prevent selecting the original shift's date
  if (dateString === originalShiftDate) {
    return {
      updatedDates: currentDates,
      shouldShowWarning: true,
      warningMessage: 'Cannot copy to the original shift date'
    };
  }

  const existingIndex = currentDates.findIndex(d => formatDate(d) === dateString);

  if (existingIndex > -1) {
    // Remove existing date
    const newDates = [...currentDates];
    newDates.splice(existingIndex, 1);
    return {
      updatedDates: newDates,
      shouldShowWarning: false
    };
  } else {
    // Add new date
    return {
      updatedDates: [...currentDates, date],
      shouldShowWarning: false
    };
  }
};

// Export recurring frequency button logic for testing
export const getRecurringFrequencyClass = (
  currentFrequency: string,
  targetFrequency: string
): string => {
  const baseClass = 'px-3 py-2 rounded-md text-sm';
  const activeClass = 'bg-primary-500 text-white';
  const inactiveClass = 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300';
  
  return `${baseClass} ${currentFrequency === targetFrequency ? activeClass : inactiveClass}`;
};

// Export day of week button logic for testing
export const getDayOfWeekButtonClass = (
  selectedDays: number[],
  dayIndex: number
): string => {
  const baseClass = 'px-2 py-2 rounded-md text-xs font-medium';
  const activeClass = 'bg-primary-500 text-white';
  const inactiveClass = 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300';
  
  return `${baseClass} ${selectedDays.includes(dayIndex) ? activeClass : inactiveClass}`;
};

// Export shift finding logic for testing
export const findOriginalShift = (shifts: any[], selectedShiftId: string | null): any | undefined => {
  if (!selectedShiftId) return undefined;
  return shifts.find(shift => shift.id === selectedShiftId);
};

// Export form reset logic for testing
export const getFormResetState = () => {
  return {
    isSubmitting: false,
    selectedDates: [],
    validationError: null
  };
};

// Export console logging helpers for testing
export const createPatternLog = (
  frequency: string,
  occurrences: number,
  daysOfWeek: number[]
): string => {
  if (frequency === 'weekly') {
    const dayNames = daysOfWeek.map(d => getDayName(d)).join(', ');
    return `Weekly pattern with ${occurrences} weeks for days: ${dayNames}`;
  } else {
    return `Daily pattern with ${occurrences} days`;
  }
};

// Export date generation logging for testing
export const createDateGenerationLog = (
  week: number,
  dayIndex: number,
  date: Date
): string => {
  return `Generated date for week ${week}, day ${getDayName(dayIndex)}: ${date.toLocaleDateString()} (${date.getDay()})`;
};

// Export date skipping logic for testing
export const shouldSkipDate = (
  date: Date,
  originalShift: any
): { shouldSkip: boolean; reason?: string } => {
  if (!originalShift) {
    return { shouldSkip: false };
  }
  
  if (formatDate(date) === originalShift.date) {
    return {
      shouldSkip: true,
      reason: `Skipping date ${date.toLocaleDateString()} because it matches original shift date`
    };
  }
  
  return { shouldSkip: false };
};

// Export pattern completion summary for testing
export const createPatternSummary = (dates: Date[]): string => {
  const dateStrings = dates.map(d => d.toLocaleDateString());
  return `Generated ${dates.length} dates in total: ${dateStrings.join(', ')}`;
};

// Export validation error creation for testing
export const createValidationError = (
  message: string,
  type: 'error' | 'warning'
): { message: string; type: 'error' | 'warning' } => {
  return { message, type };
};

// Export shift creation with logging for testing
export const createShiftWithLogging = (
  originalShift: any,
  date: Date
): { shift: any; logMessage: string } => {
  const formattedDate = formatDate(date);
  const logMessage = `Creating shift for date: ${date.toLocaleDateString()}, formatted as: ${formattedDate}`;
  
  const shift = createCopiedShift(originalShift, date);
  
  return { shift, logMessage };
};

// Export shift dispatch logging for testing
export const createShiftDispatchLog = (shift: any): string => {
  return `Adding shift with date: ${shift.date}`;
};

// Export event form submission logic for testing
export const processEventFormSubmission = (
  e: React.FormEvent,
  originalShift: any,
  selectedDates: Date[],
  employees: any[],
  setValidationError: (error: any) => void,
  setIsSubmitting: (loading: boolean) => void
): { shouldContinue: boolean; processedData?: any } => {
  e.preventDefault();
  
  const submission = processFormSubmission(originalShift, selectedDates, employees);
  
  if (!submission.isValid) {
    if (submission.errorNotification?.message.includes('Employee')) {
      setValidationError({
        message: submission.errorNotification.message,
        type: submission.errorNotification.type as 'error' | 'warning'
      });
    }
    return { shouldContinue: false };
  }
  
  setIsSubmitting(true);
  return { shouldContinue: true, processedData: submission.processedData };
};

// Export async shift creation and dispatch logic for testing
export const executeAsyncShiftCreation = (
  newShifts: any[],
  delays: { submissionDelay: number; batchDelay: number }
): {
  dispatchPlan: Array<{ action: string; shift?: any; delay: number }>;
  totalDuration: number;
} => {
  const dispatchPlan: Array<{ action: string; shift?: any; delay: number }> = [];
  
  // Plan shift dispatches
  newShifts.forEach((shift, index) => {
    dispatchPlan.push({
      action: 'addShift',
      shift,
      delay: delays.submissionDelay + (index * delays.batchDelay)
    });
  });
  
  // Plan success notification
  const finalDelay = delays.submissionDelay + (newShifts.length * delays.batchDelay);
  dispatchPlan.push({
    action: 'addNotification',
    delay: finalDelay
  });
  
  // Plan cleanup
  dispatchPlan.push({
    action: 'cleanup',
    delay: finalDelay + 50
  });
  
  return {
    dispatchPlan,
    totalDuration: finalDelay + 50
  };
};

// Export conditional rendering logic for testing
export const shouldShowErrorMessage = (originalShift: any): boolean => {
  return !originalShift;
};

// Export copy mode conditional logic for testing  
export const getCopyModeContent = (
  copyMode: string,
  selectedDates: Date[],
  originalShift: any
): {
  shouldShowSingle: boolean;
  shouldShowMultiple: boolean;
  shouldShowRecurring: boolean;
  datePickerProps?: any;
} => {
  return {
    shouldShowSingle: copyMode === 'single',
    shouldShowMultiple: copyMode === 'multiple', 
    shouldShowRecurring: copyMode === 'recurring',
    datePickerProps: originalShift ? {
      filterDate: createDatePickerFilter(originalShift.date),
      selected: copyMode === 'single' ? (selectedDates[0] || null) : new Date()
    } : undefined
  };
};

// Export date removal logic for multiple mode for testing
export const createDateRemovalHandler = (
  selectedDates: Date[],
  setSelectedDates: (dates: Date[]) => void
) => {
  return (indexToRemove: number) => {
    const newDates = [...selectedDates];
    newDates.splice(indexToRemove, 1);
    setSelectedDates(newDates);
  };
};

// Export date selection counter logic for testing
export const getDateSelectionInfo = (selectedDates: Date[]): {
  count: number;
  displayText: string;
  hasSelections: boolean;
} => {
  return {
    count: selectedDates.length,
    displayText: `Selected Dates (${selectedDates.length}):`,
    hasSelections: selectedDates.length > 0
  };
};

// Export recurring pattern state management for testing
export const processRecurringPatternGeneration = (
  originalShift: any,
  recurringOptions: { frequency: string; occurrences: number; daysOfWeek: number[] },
  setSelectedDates: (dates: Date[]) => void
): { 
  wasExecuted: boolean; 
  generatedDates?: Date[]; 
  notificationData?: { message: string; type: string; category: string };
} => {
  if (!originalShift) {
    return { wasExecuted: false };
  }
  
  const dates = generateRecurringPattern(
    recurringOptions.frequency as 'daily' | 'weekly',
    recurringOptions.occurrences,
    recurringOptions.daysOfWeek,
    originalShift.date
  );
  
  setSelectedDates(dates);
  
  const notification = createPatternNotification(dates.length);
  
  return {
    wasExecuted: true,
    generatedDates: dates,
    notificationData: {
      message: notification.message,
      type: notification.type,
      category: 'general'
    }
  };
};

// Export recurring options frequency update for testing
export const handleRecurringFrequencyChange = (
  currentOptions: { frequency: string; occurrences: number; daysOfWeek: number[] },
  newFrequency: string,
  setRecurringOptions: (options: any) => void
): void => {
  const updatedOptions = updateRecurringOptions(currentOptions, 'frequency', newFrequency);
  setRecurringOptions(updatedOptions);
};

// Export recurring options occurrences update for testing
export const handleRecurringOccurrencesChange = (
  currentOptions: { frequency: string; occurrences: number; daysOfWeek: number[] },
  newOccurrences: string,
  setRecurringOptions: (options: any) => void
): void => {
  const updatedOptions = updateRecurringOptions(currentOptions, 'occurrences', newOccurrences);
  setRecurringOptions(updatedOptions);
};

// Export day of week selection state management for testing
export const processDayOfWeekToggle = (
  dayIndex: number,
  currentOptions: { frequency: string; occurrences: number; daysOfWeek: number[] },
  setRecurringOptions: (options: any) => void
): { 
  updatedDays: number[]; 
  wasAdded: boolean; 
} => {
  const updatedDays = toggleDayOfWeek(currentOptions.daysOfWeek, dayIndex);
  const wasAdded = !currentOptions.daysOfWeek.includes(dayIndex);
  
  setRecurringOptions({
    ...currentOptions,
    daysOfWeek: updatedDays
  });
  
  return { updatedDays, wasAdded };
};

// Export footer submit button logic for testing
export const getSubmitButtonConfig = (
  originalShift: any,
  selectedDates: Date[],
  isSubmitting: boolean
): {
  shouldShow: boolean;
  isDisabled: boolean;
  buttonText: string;
  className: string;
} => {
  if (!originalShift) {
    return {
      shouldShow: false,
      isDisabled: true,
      buttonText: '',
      className: ''
    };
  }
  
  const dateCount = selectedDates.length;
  const buttonText = dateCount === 1 
    ? 'Copy Shift to 1 Date'
    : `Copy Shift to ${dateCount} Dates`;
  
  return {
    shouldShow: true,
    isDisabled: isSubmitting || dateCount === 0,
    buttonText,
    className: 'w-full'
  };
};

// Export form validation state management for testing
export const shouldDisplayValidationError = (
  validationError: { message: string; type: 'error' | 'warning' } | null
): {
  shouldShow: boolean;
  errorClass: string;
  message: string;
} => {
  if (!validationError) {
    return {
      shouldShow: false,
      errorClass: '',
      message: ''
    };
  }
  
  return {
    shouldShow: true,
    errorClass: validationError.type === 'error' 
      ? 'text-red-600 bg-red-50 border-red-200' 
      : 'text-yellow-700 bg-yellow-50 border-yellow-200',
    message: validationError.message
  };
};

// Export animation configuration for testing
export const getModalAnimationConfig = () => {
  return {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 }
  };
};

// Export modal styling configuration for testing
export const getModalStylingConfig = () => {
  return {
    overlayClass: 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4',
    modalClass: 'bg-white dark:bg-dark-800 rounded-xl shadow-xl overflow-hidden w-full max-w-[95vw] sm:max-w-lg mx-auto max-h-[85vh] flex flex-col',
    contentClass: 'p-4 sm:p-6 flex-1 overflow-y-auto',
    footerClass: 'border-t border-gray-200 dark:border-dark-600 p-4 bg-white dark:bg-dark-800'
  };
};

// Export header close button configuration for testing
export const getCloseButtonConfig = () => {
  return {
    className: 'float-right text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none',
    ariaLabel: 'Close',
    svgConfig: {
      className: 'w-5 h-5 sm:w-6 sm:h-6',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      strokeWidth: 2,
      pathD: 'M6 18L18 6M6 6l12 12'
    }
  };
};

// Export original shift display configuration for testing
export const getOriginalShiftDisplayConfig = (originalShift: any) => {
  if (!originalShift) return null;
  
  return {
    employeeName: originalShift.employeeName,
    role: originalShift.role,
    formattedDate: new Date(originalShift.date).toLocaleDateString(),
    timeRange: originalShift.timeRange,
    displayConfig: {
      containerClass: 'bg-gray-100 dark:bg-dark-700 rounded-lg p-3 sm:p-4',
      layoutClass: 'flex flex-col sm:flex-row sm:justify-between gap-2',
      employeeClass: 'font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base',
      roleClass: 'text-xs sm:text-sm text-gray-600 dark:text-gray-400'
    }
  };
};

// Export selected dates display logic for testing
export const getSelectedDatesDisplay = (selectedDates: Date[]) => {
  return {
    dates: selectedDates.map((date, index) => ({
      index,
      formattedDate: date.toLocaleDateString(),
      containerClass: 'bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded-md text-xs flex items-center',
      removeButtonClass: 'ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
    })),
    hasMultipleDates: selectedDates.length > 1,
    wrapperClass: 'flex flex-wrap gap-2'
  };
};

// Export day of week display configuration for testing  
export const getDayOfWeekDisplayConfig = (selectedDays: number[]) => {
  return [0, 1, 2, 3, 4, 5, 6].map(dayIndex => ({
    dayIndex,
    dayName: getDayName(dayIndex),
    isSelected: selectedDays.includes(dayIndex),
    buttonClass: getDayOfWeekButtonClass(selectedDays, dayIndex)
  }));
};

// Export complex inline multiple date onChange handler logic for testing
export const processMultipleDatePickerChange = (
  date: Date,
  selectedDates: Date[],
  originalShift: any,
  setSelectedDates: (dates: Date[]) => void,
  dispatch: any,
  addNotification: any
): { wasProcessed: boolean; action: 'added' | 'removed' | 'blocked' } => {
  const dateString = formatDate(date);

  // Prevent selecting the original shift's date
  if (dateString === originalShift?.date) {
    dispatch(addNotification({
      message: 'Cannot copy to the original shift date',
      type: 'warning',
      category: 'general'
    }));
    return { wasProcessed: true, action: 'blocked' };
  }

  const existingIndex = selectedDates.findIndex(
    d => formatDate(d) === dateString
  );
    
  if (existingIndex > -1) {
    // Remove existing date
    const newDates = [...selectedDates];
    newDates.splice(existingIndex, 1);
    setSelectedDates(newDates);
    return { wasProcessed: true, action: 'removed' };
  } else {
    // Add new date
    setSelectedDates([...selectedDates, date]);
    return { wasProcessed: true, action: 'added' };
  }
};

// Export inline date removal onClick handler logic for testing
export const processDateRemovalClick = (
  index: number,
  selectedDates: Date[],
  setSelectedDates: (dates: Date[]) => void
): { newDates: Date[]; removedDate: Date } => {
  const newDates = [...selectedDates];
  const removedDate = newDates[index];
  newDates.splice(index, 1);
  setSelectedDates(newDates);
  return { newDates, removedDate };
};

// Export complex recurring pattern handler logic for testing
export const processCompleteRecurringPatternHandler = (
  originalShift: any,
  recurringOptions: { frequency: string; occurrences: number; daysOfWeek: number[] },
  setSelectedDates: (dates: Date[]) => void,
  dispatch: any,
  addNotification: any
): {
  wasExecuted: boolean;
  generatedDates?: Date[];
  dispatchedNotification?: any;
} => {
  if (!originalShift) return { wasExecuted: false };
  
  const dates = generateRecurringPattern(
    recurringOptions.frequency as 'daily' | 'weekly',
    recurringOptions.occurrences,
    recurringOptions.daysOfWeek,
    originalShift.date
  );
  
  setSelectedDates(dates);
  
  const notificationData = dates.length > 0 
    ? {
        message: `Generated ${dates.length} dates for recurring pattern`,
        type: 'success',
        category: 'general'
      }
    : {
        message: 'No valid dates generated. Please check your pattern.',
        type: 'warning',
        category: 'general'
      };
  
  dispatch(addNotification(notificationData));
  
  return {
    wasExecuted: true,
    generatedDates: dates,
    dispatchedNotification: notificationData
  };
};

// Export copy mode button onClick handler logic for testing  
export const processCopyModeChange = (
  newMode: 'single' | 'multiple' | 'recurring',
  setCopyMode: (mode: 'single' | 'multiple' | 'recurring') => void
): { previousMode: string | null; newMode: string } => {
  // Could track previous mode if needed for analytics
  setCopyMode(newMode);
  return { previousMode: null, newMode };
};

// Export single date picker onChange logic for testing
export const processSingleDateChange = (
  date: Date,
  setSelectedDates: (dates: Date[]) => void
): { selectedDate: Date; formattedDate: string } => {
  setSelectedDates([date]);
  return {
    selectedDate: date,
    formattedDate: formatDate(date)
  };
};

// Export recurring frequency button logic for testing
export const processRecurringFrequencyButtonClick = (
  frequency: 'daily' | 'weekly',
  recurringOptions: { frequency: string; occurrences: number; daysOfWeek: number[] },
  setRecurringOptions: (options: any) => void
): { previousFrequency: string; newFrequency: string } => {
  const previousFrequency = recurringOptions.frequency;
  setRecurringOptions({
    ...recurringOptions,
    frequency
  });
  return { previousFrequency, newFrequency: frequency };
};

// Export recurring occurrences input onChange logic for testing
export const processRecurringOccurrencesInput = (
  value: string,
  recurringOptions: { frequency: string; occurrences: number; daysOfWeek: number[] },
  setRecurringOptions: (options: any) => void
): { previousOccurrences: number; newOccurrences: number; isValid: boolean } => {
  const previousOccurrences = recurringOptions.occurrences;
  const newOccurrences = parseInt(value) || 1;
  
  setRecurringOptions({
    ...recurringOptions,
    occurrences: newOccurrences
  });
  
  return {
    previousOccurrences,
    newOccurrences,
    isValid: newOccurrences >= 1 && newOccurrences <= 12
  };
};

// Export complex useEffect dependency logic for testing
export const shouldTriggerDatesEffect = (
  originalShift: any,
  selectedDates: Date[]
): { shouldTrigger: boolean; reason?: string } => {
  if (!originalShift) {
    return { shouldTrigger: false, reason: 'No original shift' };
  }
  
  if (selectedDates.length === 0) {
    return { shouldTrigger: false, reason: 'No selected dates' };
  }
  
  return { shouldTrigger: true };
};

// Export effect processing logic for testing
export const processUseEffectDatesFilter = (
  originalShift: any,
  selectedDates: Date[],
  setSelectedDates: (dates: Date[]) => void
): { shouldUpdate: boolean; filteredDates?: Date[]; removedCount?: number } => {
  if (!originalShift || selectedDates.length === 0) {
    return { shouldUpdate: false };
  }

  const originalDate = originalShift.date;
  const filteredDates = selectedDates.filter(date => {
    return formatDate(date) !== originalDate;
  });

  if (filteredDates.length !== selectedDates.length) {
    setSelectedDates(filteredDates);
    return {
      shouldUpdate: true,
      filteredDates,
      removedCount: selectedDates.length - filteredDates.length
    };
  }
  
  return { shouldUpdate: false };
};

// Export form section visibility logic for testing
export const getFormSectionVisibility = (
  originalShift: any,
  copyMode: string
): {
  showForm: boolean;
  showSingleDatePicker: boolean;
  showMultipleDatePicker: boolean;
  showRecurringOptions: boolean;
  showSelectedDatesDisplay: boolean;
} => {
  const showForm = !!originalShift;
  
  return {
    showForm,
    showSingleDatePicker: showForm && copyMode === 'single',
    showMultipleDatePicker: showForm && copyMode === 'multiple',
    showRecurringOptions: showForm && copyMode === 'recurring',
    showSelectedDatesDisplay: showForm && copyMode === 'multiple'
  };
};

// Export day of week button grid logic for testing
export const getDayOfWeekButtonGrid = (
  recurringOptions: { daysOfWeek: number[] },
  handleDayOfWeekToggle: (dayIndex: number) => void
): Array<{
  dayIndex: number;
  dayName: string;
  isSelected: boolean;
  onClick: () => void;
  className: string;
}> => {
  return [0, 1, 2, 3, 4, 5, 6].map(dayIndex => ({
    dayIndex,
    dayName: getDayName(dayIndex),
    isSelected: recurringOptions.daysOfWeek.includes(dayIndex),
    onClick: () => handleDayOfWeekToggle(dayIndex),
    className: getDayOfWeekButtonClass(recurringOptions.daysOfWeek, dayIndex)
  }));
};

// Export recurring options validation display logic for testing
export const getRecurringValidationDisplay = (
  recurringOptions: { frequency: string; occurrences: number; daysOfWeek: number[] }
): {
  isValid: boolean;
  validationMessage?: string;
  showWarning: boolean;
  warningClass: string;
} => {
  const validation = validateRecurringOptions(
    recurringOptions.frequency,
    recurringOptions.occurrences,
    recurringOptions.daysOfWeek
  );
  
  return {
    isValid: validation.isValid,
    validationMessage: validation.error,
    showWarning: !validation.isValid,
    warningClass: 'text-yellow-600 text-sm mt-1'
  };
};

// Export complex footer conditional logic for testing
export const getFooterConditionalConfig = (
  originalShift: any,
  selectedDates: Date[],
  isSubmitting: boolean
): {
  shouldShowFooter: boolean;
  submitConfig: {
    isEnabled: boolean;
    buttonText: string;
    loadingText: string;
    className: string;
  };
} => {
  const shouldShowFooter = !!originalShift;
  const dateCount = selectedDates.length;
  
  return {
    shouldShowFooter,
    submitConfig: {
      isEnabled: !isSubmitting && dateCount > 0,
      buttonText: dateCount === 1 
        ? 'Copy Shift to 1 Date' 
        : `Copy Shift to ${dateCount} Dates`,
      loadingText: 'Copying...',
      className: 'w-full'
    }
  };
};

// Export header title and close button configuration for testing
export const getHeaderConfiguration = (
  handleClose: () => void
): {
  title: string;
  titleClass: string;
  closeButton: {
    onClick: () => void;
    className: string;
    ariaLabel: string;
    iconConfig: any;
  };
} => {
  return {
    title: 'Copy Shift',
    titleClass: 'text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6',
    closeButton: {
      onClick: handleClose,
      className: 'float-right text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none',
      ariaLabel: 'Close',
      iconConfig: getCloseButtonConfig().svgConfig
    }
  };
};

// Export error state rendering logic for testing
export const getErrorStateConfig = (): {
  containerClass: string;
  messageClass: string;
  message: string;
} => {
  return {
    containerClass: 'text-center p-4',
    messageClass: 'text-gray-600 dark:text-gray-400',
    message: 'Error: Could not find the shift to copy'
  };
};

// Export label and input configuration for testing
export const getLabelInputConfigs = () => {
  return {
    copyModeLabel: {
      text: 'Copy Mode',
      className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
    },
    singleDateLabel: {
      text: 'Select Date',
      className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
    },
    multipleDateLabel: {
      text: 'Select Multiple Dates',
      className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
    },
    frequencyLabel: {
      text: 'Frequency',
      className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
    },
    daysOfWeekLabel: {
      text: 'Days of Week',
      className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
    },
    occurrencesInput: {
      type: 'number',
      min: '1',
      max: '12',
      className: 'w-full p-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-700 dark:text-white'
    }
  };
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
  
  // Prevent background scrolling when modal is open
  useEffect(() => {
    // Disable background scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      // Re-enable background scrolling when modal closes
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);
  
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
    
    // For weekly pattern, we need tomorrow's date
    const tomorrowDate = new Date(startDate);
    tomorrowDate.setDate(startDate.getDate() + 1);
    
    if (recurringOptions.frequency === 'weekly') {
      // Weekly pattern: add for the selected days of week for the given number of weeks
      const daysToAdd = recurringOptions.daysOfWeek.length > 0 
        ? recurringOptions.daysOfWeek 
        : [tomorrowDate.getDay()]; // Default to tomorrow's day of week if none selected
      
      for (let week = 0; week < recurringOptions.occurrences; week++) {
        for (const dayOfWeek of daysToAdd) {
          const date = new Date(tomorrowDate);
          
          // Calculate the day offset for the current week
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
          
          // Skip if it's the original shift date
          if (originalShift && formatDate(date) !== originalShift.date) {
            dates.push(date);
          }
        }
      }
    } else if (recurringOptions.frequency === 'daily') {
      // Daily pattern: add for the given number of consecutive days
      for (let day = 0; day < recurringOptions.occurrences; day++) {
        const date = new Date(tomorrowDate);
        date.setDate(tomorrowDate.getDate() + day);
        
        // Skip if it's the original shift date
        if (originalShift && formatDate(date) !== originalShift.date) {
          dates.push(date);
        }
      }
    }
    
    // Update selected dates - sort chronologically
    dates.sort((a, b) => a.getTime() - b.getTime());
    
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
  
  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        style={{ touchAction: 'none' }}
        onTouchMove={(e) => e.preventDefault()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-dark-800 shadow-xl w-full h-full sm:w-auto sm:h-auto sm:max-w-4xl sm:max-h-[85vh] sm:rounded-xl flex flex-col"
          style={{ touchAction: 'auto' }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 sm:rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Copy Shift
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none p-2 touch-manipulation"
                aria-label="Close"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content with bottom padding for button on mobile only */}
          <div 
            className="flex-1 overflow-y-auto pb-20 sm:pb-0"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {!originalShift ? (
                <div className="text-center p-4">
                  <p className="text-gray-600 dark:text-gray-400">Error: Could not find the shift to copy</p>
                </div>
              ) : (
                <form className="space-y-4">
                  {/* Original Shift Details */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                      Original Shift Details
                    </h3>
                    <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-3">
                      <div className="space-y-2">
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
                  
                  {/* Copy Mode Selection */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Copy Mode
                    </label>
                    <div className="grid grid-cols-1 gap-3 mb-4">
                      <button
                        type="button"
                        className={`p-3 rounded-lg text-base touch-manipulation transition-colors ${
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
                        className={`p-3 rounded-lg text-base touch-manipulation transition-colors ${
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
                        className={`p-3 rounded-lg text-base touch-manipulation transition-colors ${
                          copyMode === 'recurring' 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                        }`}
                        onClick={() => setCopyMode('recurring')}
                      >
                        Recurring Pattern
                      </button>
                    </div>
                    
                    {/* Single Date Mode */}
                    {copyMode === 'single' && (
                      <div>
                        <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Select Date
                        </label>
                        <DatePicker
                          selected={selectedDates[0] || null}
                          onChange={(date: Date) => setSelectedDates([date])}
                          inline
                          className="w-full"
                          filterDate={(date: Date) => formatDate(date) !== (originalShift?.date || '')}
                        />
                      </div>
                    )}
                    
                    {/* Multiple Dates Mode */}
                    {copyMode === 'multiple' && (
                      <div>
                        <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Select Multiple Dates
                        </label>
                        <DatePicker
                          selected={new Date()}
                          onChange={(date: Date) => {
                            const dateString = formatDate(date);
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
                        
                        {selectedDates.length > 0 && (
                          <div className="mt-4">
                            <p className="text-base text-gray-600 dark:text-gray-400 mb-3">
                              Selected Dates ({selectedDates.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedDates.map((date, index) => (
                                <div 
                                  key={index} 
                                  className="bg-gray-100 dark:bg-dark-700 px-3 py-2 rounded-lg text-sm flex items-center"
                                >
                                  {date.toLocaleDateString()}
                                  <button
                                    type="button"
                                    className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 touch-manipulation text-lg"
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
                        )}
                      </div>
                    )}
                    
                    {/* Recurring Mode */}
                    {copyMode === 'recurring' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Frequency
                          </label>
                          <div className="grid grid-cols-1 gap-3">
                            <button
                              type="button"
                              className={`p-3 rounded-lg text-base touch-manipulation transition-colors ${
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
                              className={`p-3 rounded-lg text-base touch-manipulation transition-colors ${
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
                            <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Days of Week
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                              {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
                                <button
                                  key={dayIndex}
                                  type="button"
                                  className={`p-3 rounded-lg text-sm font-medium touch-manipulation transition-colors ${
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
                          <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                            className="w-full p-3 text-base border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <button
                            type="button"
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors touch-manipulation text-base"
                            onClick={handleAddRecurringPattern}
                          >
                            Generate Dates
                          </button>
                        </div>

                        {selectedDates.length > 0 && (
                          <div className="mt-4">
                            <p className="text-base text-gray-600 dark:text-gray-400 mb-3">
                              Generated Dates ({selectedDates.length}):
                            </p>
                            <div 
                              className="max-h-40 overflow-y-auto border border-gray-200 dark:border-dark-600 rounded-lg p-3 bg-gray-50 dark:bg-dark-900"
                              style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                              <div className="flex flex-wrap gap-2">
                                {selectedDates.map((date, index) => (
                                  <div 
                                    key={index} 
                                    className="bg-gray-100 dark:bg-dark-700 px-3 py-2 rounded-lg text-sm flex items-center"
                                  >
                                    {date.toLocaleDateString()}
                                    <button
                                      type="button"
                                      className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 touch-manipulation text-lg"
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
                </form>
              )}
            </div>
          </div>
          
          {/* Footer with submit button - absolute on mobile, normal flow on desktop */}
          {originalShift && (
            <div className="absolute bottom-0 left-0 right-0 sm:relative sm:bottom-auto sm:left-auto sm:right-auto bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-600 p-4 sm:p-6 safe-area-bottom sm:rounded-b-xl">
              <div className="flex justify-center sm:justify-stretch">
                <LoadingButton
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-full max-w-sm sm:max-w-none py-4 sm:py-3 text-base font-semibold touch-manipulation rounded-xl sm:rounded-lg shadow-lg sm:shadow-none"
                  onClick={handleSubmit}
                  disabled={selectedDates.length === 0}
                >
                  {selectedDates.length === 0 
                    ? 'Select dates to copy shift' 
                    : `Copy Shift to ${selectedDates.length} Date${selectedDates.length !== 1 ? 's' : ''}`
                  }
                </LoadingButton>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CopyShiftForm;
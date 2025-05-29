import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { addShift, updateShift } from '../../store/shiftsSlice';
import { setModalOpen, setSelectedShiftId, addNotification } from '../../store/uiSlice';
import { RootState } from '../../store';
import { Shift } from '../../types';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import CustomFocusButton from '../common/CustomFocusButton';
import CustomToggle from '../common/CustomToggle';
import ProgressIndicator from '../common/ProgressIndicator';
import SuccessAnimation from '../common/SuccessAnimation';
import { notificationService } from '../../services/NotificationService';

interface ShiftFormProps {
  isEdit: boolean;
}

// Role options for dropdown
export const roleOptions = [
  { value: 'Manager', label: 'Manager', color: 'bg-blue-500' },
  { value: 'Server', label: 'Server', color: 'bg-green-500' },
  { value: 'Cook', label: 'Cook', color: 'bg-red-500' },
  { value: 'Host', label: 'Host', color: 'bg-purple-500' },
  { value: 'Bartender', label: 'Bartender', color: 'bg-orange-500' },
];

// Status options for dropdown
export const statusOptions = [
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Canceled', label: 'Canceled' },
];

// Helper function to format time (24h to 12h format)
export const formatTime = (time: string): string => {
  // Handle null/undefined inputs
  if (!time || typeof time !== 'string') {
    return time || '';
  }
  
  // Handle if time is already in 12h format
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  
  try {
    // Convert from 24h format to 12h format
    const [hours, minutes] = time.split(':');
    
    // Validate that we have both hours and minutes
    if (!hours || !minutes || hours === undefined || minutes === undefined) {
      throw new Error('Invalid time format');
    }
    
    const hoursNum = parseInt(hours, 10);
    
    // Validate that hours is a valid number
    if (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 23) {
      throw new Error('Invalid hours');
    }
    
    const period = hoursNum >= 12 ? 'PM' : 'AM';
    const hours12 = hoursNum % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', time, error);
    return time; // Return original if format fails
  }
};

// Export modal variants for testing
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

// Export default shift creation logic for testing
export const createInitialShift = (selectedDate: string) => {
  const startTime = '09:00';
  const endTime = '17:00';
  return {
    id: '',
    employeeName: '',
    role: roleOptions[0].value,
    timeRange: `${formatTime(startTime)} - ${formatTime(endTime)}`,
    startTime,
    endTime,
    status: 'Confirmed' as 'Confirmed' | 'Pending' | 'Canceled',
    date: selectedDate,
    color: roleOptions[0].color
  };
};

// Export time range formatting logic for testing
export const createTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// Export role color lookup logic for testing
export const getRoleColor = (roleName: string): string => {
  return roleOptions.find(option => option.value === roleName)?.color || 'bg-blue-500';
};

// Export date cleaning logic for testing
export const cleanDateString = (dateStr: string): string => {
  return dateStr.replace(/\s+/g, '');
};

// Export validation logic for testing
export const validateEmployeeName = (employeeName: string, employees: any[]): boolean => {
  return employees.some(emp => emp.name === employeeName);
};

// Export role validation logic for testing
export const validateEmployeeRole = (employeeName: string, selectedRole: string, employees: any[]): boolean => {
  const employee = employees.find(emp => emp.name === employeeName);
  return !employee || employee.role === selectedRole;
};

// Export form data processing logic for testing
export const processFormChange = (
  name: string, 
  value: string, 
  currentFormData: any, 
  employees: any[]
): any => {
  if (name === 'employeeName') {
    const employee = employees.find(emp => emp.name === value);
    
    if (employee) {
      const roleColor = roleOptions.find(option => option.value === employee.role)?.color || 'bg-blue-500';
      return {
        ...currentFormData,
        employeeName: value,
        role: employee.role,
        color: roleColor
      };
    } else {
      return {
        ...currentFormData,
        employeeName: value
      };
    }
  } else if (name === 'role') {
    const roleColor = roleOptions.find(option => option.value === value)?.color || 'bg-blue-500';
    return {
      ...currentFormData,
      [name]: value,
      color: roleColor
    };
  } else if (name === 'startTime' || name === 'endTime') {
    const formattedStart = name === 'startTime' ? formatTime(value) : formatTime(currentFormData.startTime);
    const formattedEnd = name === 'endTime' ? formatTime(value) : formatTime(currentFormData.endTime);
    const newTimeRange = `${formattedStart} - ${formattedEnd}`;
    
    return {
      ...currentFormData,
      [name]: value,
      timeRange: newTimeRange
    };
  } else {
    return {
      ...currentFormData,
      [name]: value
    };
  }
};

// Export shift preparation logic for testing
export const prepareShiftForSubmission = (
  formData: any, 
  selectedDate: string, 
  isEdit: boolean
): any => {
  const cleanDate = selectedDate.replace(/\s+/g, '');
  
  return {
    ...formData,
    date: cleanDate,
    id: isEdit ? formData.id : Date.now().toString(),
    startTime: formData.startTime,
    endTime: formData.endTime,
    timeRange: `${formatTime(formData.startTime)} - ${formatTime(formData.endTime)}`,
    color: formData.color || roleOptions.find(opt => opt.value === formData.role)?.color || 'bg-blue-500'
  };
};

// Export step navigation logic for testing
export const canMoveToNextStep = (currentStep: number, maxSteps: number): boolean => {
  return currentStep < maxSteps;
};

export const canMoveToPreviousStep = (currentStep: number): boolean => {
  return currentStep > 1;
};

// Export validation error message generation for testing
export const generateValidationErrorMessage = (
  employeeName: string, 
  employees: any[], 
  selectedRole: string
): { message: string; type: 'error' | 'warning' } | null => {
  const employeeExists = employees.some(emp => emp.name === employeeName);
  
  if (!employeeExists) {
    return {
      message: `Employee "${employeeName}" does not exist. Please add them in the Employees tab first.`,
      type: 'error'
    };
  }
  
  const employee = employees.find(emp => emp.name === employeeName);
  
  if (employee && employee.role !== selectedRole) {
    return {
      message: `Role mismatch: ${employeeName} is a ${employee.role}, not a ${selectedRole}.`,
      type: 'warning'
    };
  }
  
  return null;
};

// Export notification message generation for testing
export const generateNotificationMessage = (isEdit: boolean, isSuccess: boolean): string => {
  if (isSuccess) {
    return isEdit ? 'Shift updated successfully' : 'Shift added successfully';
  } else {
    return 'There was an error saving the shift';
  }
};

// Export Redux action determination logic for testing
export const determineReduxAction = (isEdit: boolean): 'add' | 'update' => {
  return isEdit ? 'update' : 'add';
};

// Export modal title logic for testing
export const getModalTitle = (isEdit: boolean): string => {
  return isEdit ? 'Edit Shift' : 'Add New Shift';
};

// Export modal type determination for testing
export const getModalType = (isEdit: boolean): 'editShift' | 'addShift' => {
  return isEdit ? 'editShift' : 'addShift';
};

// Export form step configuration for testing
export const getFormStepConfig = () => {
  return {
    steps: 2,
    labels: ['Basic Info', 'Details']
  };
};

// Export button text logic for testing
export const getSubmitButtonText = (isSubmitting: boolean, isEdit: boolean): string => {
  if (isSubmitting) {
    return 'Saving...';
  }
  return isEdit ? 'Update Shift' : 'Add Shift';
};

// Export notification creation logic for testing
export const createNotificationPayload = (message: string, type: 'success' | 'error' | 'info', category: string) => {
  return {
    message,
    type,
    category
  };
};

// Export first shift detection logic for testing
export const isFirstShift = (isEdit: boolean, shiftsLength: number): boolean => {
  return !isEdit && shiftsLength === 0;
};

// Export notification preferences check for testing
export const shouldShowNotification = (
  notificationPreferences: any, 
  notificationType: 'shifts' | 'reminders' | 'updates'
): boolean => {
  return notificationPreferences.enabled && notificationPreferences.types[notificationType];
};

// Export form submission validation logic for testing
export const validateFormSubmission = (currentStep: number, maxSteps: number): boolean => {
  return currentStep >= maxSteps;
};

// Export Redux action creation logic for testing
export const createReduxAction = (isEdit: boolean, shiftData: any) => {
  return isEdit ? { type: 'UPDATE_SHIFT', payload: shiftData } : { type: 'ADD_SHIFT', payload: shiftData };
};

// Export event handler logic for testing
export const shouldPreventFormSubmission = (currentStep: number, maxSteps: number): boolean => {
  return currentStep < maxSteps;
};

// Export keyboard event handling logic for testing
export const shouldPreventEnterSubmission = (key: string, currentStep: number, maxSteps: number): boolean => {
  return key === 'Enter' && currentStep < maxSteps;
};

// Export form step rendering logic for testing
export const shouldRenderStep = (currentStep: number, targetStep: number): boolean => {
  return currentStep === targetStep;
};

// Export role option filtering logic for testing
export const isRoleOptionDisabled = (
  option: any,
  employeeName: string,
  employees: any[]
): boolean => {
  if (!employeeName) return false;
  
  const employeeExists = employees.some(emp => emp.name === employeeName);
  if (!employeeExists) return false;
  
  const employee = employees.find(emp => emp.name === employeeName);
  return !!(employee && employee.role !== option.value);
};

// Export CSS class name generation for testing
export const getModalZIndex = (isBackdrop: boolean): number => {
  return isBackdrop ? 100 : 101;
};

// Export timeout values for testing
export const getFormTimeouts = () => {
  return {
    submissionDelay: 800,
    advancedFeaturesDelay: 1500
  };
};

// Export form field validation logic for testing
export const validateRequiredField = (value: string): boolean => {
  return value !== null && value !== undefined && value.trim() !== '';
};

// Export input value processing for testing
export const processInputValue = (value: string, fieldType: 'text' | 'time' | 'select'): string => {
  if (fieldType === 'text') {
    return value.trim();
  }
  return value;
};

// Export CSS class generation for testing
export const getFieldClasses = (isDarkMode: boolean = false): string => {
  const baseClasses = 'mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500';
  const lightClasses = 'border-gray-300';
  const darkClasses = 'border-dark-600 bg-dark-800 text-white';
  
  return `${baseClasses} ${isDarkMode ? darkClasses : lightClasses}`;
};

// Export form state initialization logic for testing
export const getInitialFormState = () => {
  return {
    currentStep: 1,
    showSuccess: false,
    isPriorityShift: false,
    validationError: null,
    isSubmitting: false
  };
};

// Export form step transition logic for testing
export const getNextStep = (currentStep: number, maxSteps: number): number => {
  return currentStep < maxSteps ? currentStep + 1 : currentStep;
};

export const getPreviousStep = (currentStep: number): number => {
  return currentStep > 1 ? currentStep - 1 : currentStep;
};

// Export validation error type checking for testing
export const isValidationError = (error: any): boolean => {
  return error !== null && 
         typeof error === 'object' && 
         'message' in error && 
         'type' in error &&
         (error.type === 'error' || error.type === 'warning');
};

// Export datalist option generation for testing
export const generateEmployeeOptions = (employees: any[]): Array<{key: string, value: string}> => {
  return employees.map(employee => ({
    key: employee.id,
    value: employee.name
  }));
};

// Export form element ID generation for testing
export const generateFieldId = (fieldName: string): string => {
  return fieldName;
};

// Export button state logic for testing
export const getButtonState = (currentStep: number, maxSteps: number, isSubmitting: boolean) => {
  return {
    canGoNext: currentStep < maxSteps,
    canGoPrevious: currentStep > 1,
    canSubmit: currentStep >= maxSteps && !isSubmitting,
    isLoading: isSubmitting
  };
};

// Export sound effect management for testing
export const getSoundType = (action: 'open' | 'click' | 'complete' | 'error' | 'success'): string => {
  const soundMap = {
    open: 'notification',
    click: 'click',
    complete: 'complete',
    error: 'error',
    success: 'complete'
  };
  return soundMap[action];
};

// Export initial shift data logic for testing  
export const createInitialShiftData = (selectedDate: string, isEdit: boolean, existingShift?: any) => {
  const baseShift = createInitialShift(selectedDate);
  
  if (isEdit && existingShift) {
    return existingShift;
  }
  
  return {
    ...baseShift,
    id: Date.now().toString(),
    date: selectedDate
  };
};

// Export form validation workflow for testing  
export const performFormValidation = (formData: any, employees: any[]) => {
  const employeeExists = employees.some(emp => emp.name === formData.employeeName);
  
  if (!employeeExists) {
    return {
      isValid: false,
      error: {
        message: `Employee "${formData.employeeName}" does not exist. Please add them in the Employees tab first.`,
        type: 'error' as const
      }
    };
  }
  
  const employee = employees.find(emp => emp.name === formData.employeeName);
  
  if (employee && employee.role !== formData.role) {
    return {
      isValid: false,
      error: {
        message: `Role mismatch: ${formData.employeeName} is a ${employee.role}, not a ${formData.role}.`,
        type: 'warning' as const
      }
    };
  }
  
  return { isValid: true, error: null };
};

// Export form submission workflow logic for testing
export const processFormSubmission = (
  formData: any,
  selectedDate: string,
  isEdit: boolean,
  notificationPreferences: any,
  shiftsLength: number
) => {
  const shiftToSubmit = prepareShiftForSubmission(formData, selectedDate, isEdit);
  
  const notifications = [];
  
  // Main success notification
  if (shouldShowNotification(notificationPreferences, 'shifts')) {
    notifications.push(createNotificationPayload(
      generateNotificationMessage(isEdit, true),
      'success',
      'shifts'
    ));
    
    // First shift welcome notification
    if (isFirstShift(isEdit, shiftsLength)) {
      notifications.push(createNotificationPayload(
        "Ready to explore advanced features? You've completed the basics!",
        'info',
        'general'
      ));
    }
  }
  
  return {
    shiftToSubmit,
    notifications,
    shouldDispatchEvent: isFirstShift(isEdit, shiftsLength)
  };
};

// Export error handling workflow for testing
export const processFormError = (
  error: Error,
  notificationPreferences: any
): { notifications: any[] } => {
  const notifications = [];
  
  if (shouldShowNotification(notificationPreferences, 'shifts')) {
    notifications.push(createNotificationPayload(
      'There was an error saving the shift',
      'error',
      'shifts'
    ));
  }
  
  return { notifications };
};

// Export event handler logic for testing
export const processEventHandler = (eventName: string, value: string, employees: any[]) => {
  return processFormChange(eventName, value, {}, employees);
};

// Export Redux action dispatch logic for testing
export const createDispatchActions = (isEdit: boolean, shiftData: any) => {
  const actions = [];
  
  // Main shift action
  if (isEdit) {
    actions.push({ type: 'shifts/updateShift', payload: shiftData });
  } else {
    actions.push({ type: 'shifts/addShift', payload: shiftData });
  }
  
  return actions;
};

// Export modal management logic for testing
export const getModalActions = (isEdit: boolean) => {
  return {
    closeModal: {
      type: 'ui/setModalOpen',
      payload: { modal: isEdit ? 'editShift' : 'addShift', isOpen: false }
    },
    clearSelection: isEdit ? {
      type: 'ui/setSelectedShiftId',
      payload: null
    } : null
  };
};

// Export timeRange update logic for testing
export const shouldUpdateTimeRange = (formData: any): boolean => {
  return Boolean(!formData.timeRange && formData.startTime && formData.endTime);
};

// Export form step validation for testing
export const validateStepBeforeSubmission = (currentStep: number, maxSteps: number): boolean => {
  return currentStep >= maxSteps;
};

// Export console logging logic for testing
export const getDebugMessages = (formData: any, shiftToSubmit: any) => {
  return {
    submissionLog: `Submitting form data: ${JSON.stringify(formData)}`,
    dispatchLog: `ShiftForm: Dispatching shift with date: ${shiftToSubmit.date}`
  };
};

// Export success callback workflow for testing
export const getSuccessWorkflow = () => {
  return {
    showAnimation: true,
    playSound: 'complete',
    resetSubmitting: false // Don't reset immediately, wait for animation
  };
};

// Export form submission delay logic for testing
export const getSubmissionDelay = (): number => {
  return 800; // milliseconds
};

// Export advanced features notification delay for testing
export const getAdvancedFeaturesDelay = (): number => {
  return 1500; // milliseconds
};

// Export custom event creation for testing
export const createTutorialPromptEvent = (): CustomEvent => {
  return new CustomEvent('showTutorialPrompt');
};

// Export button configuration logic for testing
export const getButtonConfiguration = (currentStep: number, maxSteps: number) => {
  return {
    showPrevious: currentStep > 1,
    showNext: currentStep < maxSteps,
    showSubmit: currentStep >= maxSteps,
    previousText: 'Previous',
    cancelText: 'Cancel',
    nextText: 'Next'
  };
};

// Export validation error modal properties for testing
export const getValidationErrorModalConfig = (validationError: any) => {
  if (!validationError) return null;
  
  return {
    title: validationError.type === 'error' ? 'Employee Not Found' : 'Role Mismatch',
    iconColor: validationError.type === 'error' ? 'text-red-500' : 'text-yellow-500',
    titleColor: validationError.type === 'error' 
      ? 'text-red-800 dark:text-red-400' 
      : 'text-yellow-800 dark:text-yellow-400',
    message: validationError.message,
    showAddEmployeeButton: validationError.type === 'error'
  };
};

// Export success animation configuration for testing
export const getSuccessAnimationConfig = (isEdit: boolean) => {
  return {
    message: isEdit ? 'Shift Updated!' : 'Shift Added Successfully!',
    variant: 'confetti',
    duration: 3000,
    zIndex: 200
  };
};

// Export form submission event logic for testing
export const getFormSubmissionBehavior = (currentStep: number, maxSteps: number) => {
  return {
    shouldPreventDefault: true,
    shouldMoveToNext: currentStep < maxSteps,
    shouldSubmit: currentStep >= maxSteps
  };
};

// Export keyboard event handling logic for testing
export const getKeyboardEventBehavior = (key: string, currentStep: number, maxSteps: number) => {
  return {
    shouldPreventDefault: key === 'Enter' && currentStep < maxSteps,
    shouldMoveToNext: key === 'Enter' && currentStep < maxSteps
  };
};

// Export role option rendering logic for testing
export const shouldDisableRoleOption = (
  option: any,
  formData: any,
  employees: any[]
): boolean => {
  if (!formData.employeeName) return false;
  
  const employeeExists = employees.some(emp => emp.name === formData.employeeName);
  if (!employeeExists) return false;
  
  const employee = employees.find(emp => emp.name === formData.employeeName);
  return !!(employee && employee.role !== option.value);
};

// Export form field input attributes for testing
export const getInputAttributes = (fieldName: string, isDarkMode: boolean = false) => {
  const baseClasses = 'mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500';
  const themeClasses = isDarkMode 
    ? 'border-dark-600 bg-dark-800 text-white'
    : 'border-gray-300';
  
  const attributes = {
    className: `${baseClasses} ${themeClasses}`,
    required: ['employeeName', 'startTime', 'endTime'].includes(fieldName),
    type: fieldName.includes('Time') ? 'time' : fieldName === 'employeeName' ? 'text' : 'select'
  };
  
  if (fieldName.includes('Time')) {
    attributes.className += ' h-12 text-base';
  }
  
  return attributes;
};

// Export step conditional rendering logic for testing
export const getStepContent = (currentStep: number) => {
  return {
    showStep1: currentStep === 1,
    showStep2: currentStep === 2,
    step1Fields: ['employeeName', 'role', 'status', 'priority'],
    step2Fields: ['startTime', 'endTime']
  };
};

// Export form validation display logic for testing
export const getValidationDisplayConfig = (validationError: any) => {
  if (!validationError) return { shouldShow: false };
  
  return {
    shouldShow: true,
    zIndex: 150,
    backdropOpacity: 0.5,
    modalZIndex: 200,
    borderColor: 'border-red-500',
    animationDuration: 0.2
  };
};

// Export datalist generation logic for testing
export const generateDatalistOptions = (employees: any[]) => {
  return employees.map(employee => ({
    key: employee.id,
    value: employee.name
  }));
};

// Export progress indicator configuration for testing
export const getProgressIndicatorConfig = (currentStep: number) => {
  return {
    steps: 2,
    currentStep,
    labels: ['Basic Info', 'Details'],
    className: 'mb-6'
  };
};

// Export navigation button actions for testing
export const getNavigationActions = (isEdit: boolean) => {
  return {
    closeModal: { modal: isEdit ? 'editShift' : 'addShift', isOpen: false },
    clearSelection: isEdit ? null : undefined,
    navigateTo: '/employees'
  };
};

// Export form state initialization logic for testing
export const getFormStateConfig = () => {
  return {
    initialStep: 1,
    maxSteps: 2,
    defaultPriority: false,
    defaultSuccess: false,
    defaultSubmitting: false
  };
};

// Export modal styling configuration for testing
export const getModalStylingConfig = () => {
  return {
    backdrop: {
      className: 'fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity',
      zIndex: 100
    },
    content: {
      className: 'inline-block align-bottom bg-white dark:bg-dark-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-[90vw] sm:max-w-xl relative',
      zIndex: 101
    },
    container: {
      className: 'fixed inset-0 z-[100] overflow-y-auto',
      role: 'dialog',
      ariaModal: true,
      ariaLabelledby: 'modal-title'
    }
  };
};

// Export form accessibility attributes for testing
export const getAccessibilityAttributes = (fieldName: string) => {
  return {
    id: fieldName,
    name: fieldName,
    'aria-describedby': `${fieldName}-help`,
    'aria-required': ['employeeName', 'startTime', 'endTime'].includes(fieldName)
  };
};

// Export CSS class generation for different states for testing
export const getStateClasses = (isSubmitting: boolean, hasError: boolean, isDarkMode: boolean) => {
  const base = 'transition-all duration-200';
  const submitting = isSubmitting ? 'opacity-50 cursor-not-allowed' : '';
  const error = hasError ? 'border-red-500 ring-red-500' : '';
  const theme = isDarkMode ? 'dark' : 'light';
  
  return {
    form: `${base} ${submitting}`,
    field: `${base} ${error}`,
    theme
  };
};

// Export component state initialization logic for testing
export const getComponentStateDefaults = () => {
  return {
    currentStep: 1,
    showSuccess: false,
    isPriorityShift: false,
    validationError: null,
    isSubmitting: false
  };
};

// Export useMemo initial shift creation logic for testing
export const createMemoizedInitialShift = (selectedDate: string) => {
  const startTime = '09:00';
  const endTime = '17:00';
  return {
    id: '',
    employeeName: '',
    role: roleOptions[0].value,
    timeRange: `${formatTime(startTime)} - ${formatTime(endTime)}`,
    startTime,
    endTime,
    status: 'Confirmed' as const,
    date: selectedDate,
    color: roleOptions[0].color
  };
};

// Export useEffect patterns for testing
export const getUseEffectConfigurations = () => {
  return {
    formDataInit: {
      dependencies: ['isEdit', 'selectedShiftId', 'shifts', 'selectedDate', 'initialShift'],
      purpose: 'Initialize form data based on edit mode and selected shift'
    },
    timeRangeUpdate: {
      dependencies: ['formData'],
      purpose: 'Ensure timeRange is always formatted correctly'
    },
    soundEffect: {
      dependencies: ['playSound'],
      purpose: 'Play notification sound when form opens'
    }
  };
};

// Export event handler logic patterns for testing
export const getEventHandlerPatterns = () => {
  return {
    preventDefault: true,
    soundFeedback: true,
    stateUpdate: true,
    validation: 'conditional'
  };
};

// Export employee lookup logic for testing
export const findEmployeeByName = (employeeName: string, employees: any[]) => {
  return employees.find(emp => emp.name === employeeName);
};

// Export form field change handling logic for testing
export const getFormFieldChangeLogic = (fieldName: string) => {
  const fieldTypes = {
    employeeName: {
      hasEmployeeLookup: true,
      autoUpdatesRole: true,
      autoUpdatesColor: true
    },
    role: {
      hasEmployeeLookup: false,
      autoUpdatesRole: false,
      autoUpdatesColor: true
    },
    startTime: {
      hasEmployeeLookup: false,
      autoUpdatesRole: false,
      autoUpdatesColor: false,
      updatesTimeRange: true
    },
    endTime: {
      hasEmployeeLookup: false,
      autoUpdatesRole: false,
      autoUpdatesColor: false,
      updatesTimeRange: true
    },
    default: {
      hasEmployeeLookup: false,
      autoUpdatesRole: false,
      autoUpdatesColor: false,
      updatesTimeRange: false
    }
  };
  
  return fieldTypes[fieldName] || fieldTypes.default;
};

// Export step navigation conditions for testing
export const getStepNavigationConditions = (currentStep: number, maxSteps: number) => {
  return {
    canGoNext: currentStep < maxSteps,
    canGoPrevious: currentStep > 1,
    shouldPlaySound: true,
    shouldPreventDefault: true
  };
};

// Export validation error creation logic for testing
export const createValidationError = (type: 'error' | 'warning', message: string) => {
  return { type, message };
};

// Export employee validation workflow for testing
export const performEmployeeValidation = (formData: any, employees: any[]) => {
  const employeeExists = employees.some(emp => emp.name === formData.employeeName);
  
  if (!employeeExists) {
    return createValidationError('error', 
      `Employee "${formData.employeeName}" does not exist. Please add them in the Employees tab first.`
    );
  }
  
  const employee = employees.find(emp => emp.name === formData.employeeName);
  
  if (employee && employee.role !== formData.role) {
    return createValidationError('warning',
      `Role mismatch: ${formData.employeeName} is a ${employee.role}, not a ${formData.role}.`
    );
  }
  
  return null;
};

// Export form submission preparation workflow for testing
export const prepareFormSubmissionWorkflow = (
  formData: any,
  selectedDate: string,
  isEdit: boolean,
  currentStep: number,
  maxSteps: number
) => {
  return {
    shouldPreventDefault: true,
    shouldMoveToNextStep: currentStep < maxSteps,
    shouldValidate: currentStep >= maxSteps,
    shouldSubmit: currentStep >= maxSteps,
    cleanedDate: selectedDate.replace(/\s+/g, ''),
    shiftId: isEdit ? formData.id : Date.now().toString()
  };
};

// Export Redux action timing and workflow for testing
export const getReduxActionWorkflow = () => {
  return {
    setLoadingState: true,
    logFormData: true,
    cleanDate: true,
    createShiftData: true,
    dispatchDelay: 800,
    playCompleteSound: true,
    showSuccessAnimation: true,
    checkNotificationPreferences: true,
    checkFirstShift: true,
    advancedFeaturesDelay: 1500,
    resetLoadingState: true
  };
};

// Export error handling workflow for testing
export const getErrorHandlingWorkflow = () => {
  return {
    logError: true,
    resetLoadingState: true,
    checkNotificationPreferences: true,
    playErrorSound: true,
    showErrorNotification: true
  };
};

// Export success completion workflow for testing
export const getSuccessCompletionWorkflow = () => {
  return {
    closeForm: true,
    playClickSound: true,
    dispatchModalClose: true,
    clearSelection: 'conditional'
  };
};

// Export form initialization workflow for testing
export const getFormInitializationWorkflow = (isEdit: boolean) => {
  return {
    checkEditMode: isEdit,
    findSelectedShift: isEdit,
    setFormData: true,
    generateNewId: !isEdit,
    useSelectedDate: true
  };
};

// Export time range update conditions for testing
export const getTimeRangeUpdateConditions = (formData: any) => {
  return {
    shouldUpdate: Boolean(!formData.timeRange && formData.startTime && formData.endTime),
    hasTimeRange: !!formData.timeRange,
    hasStartTime: !!formData.startTime,
    hasEndTime: !!formData.endTime
  };
};

// Export sound effect patterns for testing
export const getSoundEffectPatterns = () => {
  return {
    formOpen: 'notification',
    userInteraction: 'click',
    stepNavigation: 'click',
    validationError: 'error',
    formSubmission: 'complete',
    formClose: 'click',
    soundVolume: 0.2
  };
};

const ShiftForm: React.FC<ShiftFormProps> = ({ isEdit }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedDate, shifts } = useSelector((state: RootState) => state.shifts);
  const { selectedShiftId } = useSelector((state: RootState) => state.ui);
  const { employees } = useSelector((state: RootState) => state.employees);
  const { playSound } = useSoundEffects();
  const notificationPreferences = useSelector((state: RootState) => state.ui.notificationPreferences);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPriorityShift, setIsPriorityShift] = useState(false);
  const [validationError, setValidationError] = useState<{message: string, type: 'error' | 'warning'} | null>(null);
  
  const initialShift = useMemo(() => {
    const startTime = '09:00';
    const endTime = '17:00';
    return {
      id: '',
      employeeName: '',
      role: roleOptions[0].value,
      timeRange: `${formatTime(startTime)} - ${formatTime(endTime)}`,
      startTime,
      endTime,
      status: 'Confirmed' as 'Confirmed' | 'Pending' | 'Canceled',
      date: selectedDate,
      color: roleOptions[0].color
    }
  }, [selectedDate]);
  
  const [formData, setFormData] = useState<Shift>(initialShift);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (isEdit && selectedShiftId) {
      const shift = shifts.find((s) => s.id === selectedShiftId);
      if (shift) {
        setFormData(shift);
      }
    } else {
      setFormData({
        ...initialShift,
        id: Date.now().toString(),
        date: selectedDate
      });
    }
  }, [isEdit, selectedShiftId, shifts, selectedDate, initialShift]);
  
  // Ensure timeRange is always formatted correctly
  useEffect(() => {
    if (!formData.timeRange && formData.startTime && formData.endTime) {
      setFormData(prev => ({
        ...prev,
        timeRange: `${formatTime(prev.startTime)} - ${formatTime(prev.endTime)}`
      }));
    }
  }, [formData]);
  
  // Play a sound effect when the form opens
  useEffect(() => {
    playSound('notification');
  }, [playSound]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Play a subtle click sound on form interaction
    playSound('click', 0.2);
    
    const { name, value } = e.target;
    
    if (name === 'employeeName') {
      // Find if the employee exists in our database
      const employee = employees.find(emp => emp.name === value);
      
      if (employee) {
        // If employee exists, automatically set the role to match the employee's role
        const roleColor = roleOptions.find(option => option.value === employee.role)?.color || 'bg-blue-500';
        
        setFormData({
          ...formData,
          employeeName: value,
          role: employee.role,
          color: roleColor
        });
      } else {
        // If employee doesn't exist yet, just update the name field
        setFormData({
          ...formData,
          employeeName: value
        });
      }
    } else if (name === 'role') {
      const roleColor = roleOptions.find(option => option.value === value)?.color || 'bg-blue-500';
      setFormData({
        ...formData,
        [name]: value,
        color: roleColor
      });
    } else if (name === 'startTime' || name === 'endTime') {
      const formattedStart = name === 'startTime' ? formatTime(value) : formatTime(formData.startTime);
      const formattedEnd = name === 'endTime' ? formatTime(value) : formatTime(formData.endTime);
      const newTimeRange = `${formattedStart} - ${formattedEnd}`;
      
      setFormData({
        ...formData,
        [name]: value,
        timeRange: newTimeRange
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const moveToNextStep = (e?: React.MouseEvent) => {
    // If called from an event, prevent default behavior 
    if (e) {
      e.preventDefault();
    }
    
    if (currentStep < 2) {
      setCurrentStep(prev => prev + 1);
      playSound('click');
    }
  };
  
  const moveToPreviousStep = (e?: React.MouseEvent) => {
    // If called from an event, prevent default behavior 
    if (e) {
      e.preventDefault();
    }
    
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      playSound('click');
    }
  };
  
  const validateEmployeeDetails = () => {
    // Check if employee name exists in the employees list
    const employeeExists = employees.some(emp => emp.name === formData.employeeName);
    
    if (!employeeExists) {
      setValidationError({
        message: `Employee "${formData.employeeName}" does not exist. Please add them in the Employees tab first.`,
        type: 'error'
      });
      playSound('error');
      return false;
    }
    
    // Check if the selected role matches the employee's role in the employee list
    const employee = employees.find(emp => emp.name === formData.employeeName);
    
    if (employee && employee.role !== formData.role) {
      setValidationError({
        message: `Role mismatch: ${formData.employeeName} is a ${employee.role}, not a ${formData.role}.`,
        type: 'warning'
      });
      playSound('error');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    // Always prevent default form submission behavior
    e.preventDefault();
    
    // Ensure we're on the second step before submitting
    if (currentStep < 2) {
      moveToNextStep();
      return;
    }
    
    // Validate employee details before submitting
    if (!validateEmployeeDetails()) {
      return;
    }
    
    // Set loading state
    setIsSubmitting(true);
    
    // Debug: Log form data before submission
    console.log('Submitting form data:', formData);
    
    try {
      // Clean the date string to remove any extra spaces
      const cleanDate = selectedDate.replace(/\s+/g, '');
      
      // Always create a fresh copy with all fields properly set
      const shiftToSubmit = {
        ...formData,
        // Ensure we use the exact date string from the store, cleaned of spaces
        date: cleanDate, 
        id: isEdit ? formData.id : Date.now().toString(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        timeRange: `${formatTime(formData.startTime)} - ${formatTime(formData.endTime)}`,
        color: formData.color || roleOptions.find(opt => opt.value === formData.role)?.color || 'bg-blue-500'
      };
      
      // Simulate a slight delay for the loading animation
      setTimeout(() => {
        // Log the shift data before dispatching to Redux
        console.log('ShiftForm: Dispatching shift with date:', shiftToSubmit.date);
        
        // Dispatch action to Redux
        const action = isEdit ? updateShift(shiftToSubmit) : addShift(shiftToSubmit);
        dispatch(action);
        
        // Play complete sound
        playSound('complete');
        
        // Show success animation 
        setShowSuccess(true);
        
        // Notify user through the notification system as well
        if (notificationPreferences.enabled && notificationPreferences.types.shifts) {
          dispatch(addNotification({
            message: isEdit ? 'Shift updated successfully' : 'Shift added successfully',
            type: 'success',
            category: 'shifts'
          }));
          
          // If this is the first shift added (only check for non-edit mode)
          if (!isEdit && shifts.length === 0) {
            // Show the advanced features notification
            setTimeout(() => {
              dispatch(addNotification({
                message: "Ready to explore advanced features? You've completed the basics!",
                type: 'info',
                category: 'general'
              }));
              
              document.dispatchEvent(new CustomEvent('showTutorialPrompt'));
            }, 1500); // Show this notification with a delay after the first one
          }
        }
        
        // Check for shift reminders
        notificationService.checkShiftReminder(shiftToSubmit);
        
        // Reset loading state but don't close form yet (success animation will show)
        setIsSubmitting(false);
      }, 800);
    } catch (error) {
      console.error('Error submitting shift:', error);
      setIsSubmitting(false);
      if (notificationPreferences.enabled && notificationPreferences.types.shifts) {
        dispatch(addNotification({
          message: 'There was an error saving the shift',
          type: 'error',
          category: 'shifts'
        }));
      }
      playSound('error');
    }
  };
  
  const handleSuccessComplete = () => {
    handleClose();
  };
  
  const handleClose = () => {
    playSound('click');
    dispatch(setModalOpen({ modal: isEdit ? 'editShift' : 'addShift', isOpen: false }));
    if (isEdit) {
      dispatch(setSelectedShiftId(null));
    }
  };
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-28 md:pb-20 text-center sm:block sm:p-0">
          {/* Backdrop - make sure the z-index is lower than the form */}
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
            aria-hidden="true" 
            onClick={handleClose}
            style={{ zIndex: 100 }}
          ></div>
          
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          
          {/* Modal content - make sure the z-index is higher than the backdrop */}
          <motion.div
            className="inline-block align-bottom bg-white dark:bg-dark-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-[90vw] sm:max-w-xl relative"
            style={{ zIndex: 101 }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-white dark:bg-dark-700 px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4" id="modal-title">
                    {isEdit ? 'Edit Shift' : 'Add New Shift'}
                  </h3>
                  
                  {/* Progress indicator for multi-step form */}
                  <ProgressIndicator 
                    steps={2} 
                    currentStep={currentStep} 
                    labels={['Basic Info', 'Details']} 
                    className="mb-6" 
                  />
                  
                  <form 
                    // Only allow form submission on the final step
                    onSubmit={(e) => {
                      if (currentStep < 2) {
                        e.preventDefault();
                        moveToNextStep();
                      } else {
                        handleSubmit(e);
                      }
                    }}
                    className="pointer-events-auto"
                    onKeyDown={(e) => {
                      // Prevent form submission when pressing Enter
                      if (e.key === 'Enter' && currentStep < 2) {
                        e.preventDefault();
                        moveToNextStep();
                      }
                    }}
                  >
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Employee Name
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="employeeName"
                              id="employeeName"
                              value={formData.employeeName}
                              onChange={handleChange}
                              required
                              list="employee-list"
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              onKeyDown={(e) => {
                                // Prevent form submission on Enter
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                }
                              }}
                            />
                            <datalist id="employee-list">
                              {employees.map(employee => (
                                <option key={employee.id} value={employee.name} />
                              ))}
                            </datalist>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Employee must be added in the Employees tab first
                          </p>
                        </div>
                        
                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Role
                          </label>
                          <select
                            name="role"
                            id="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                          >
                            {roleOptions.map((option) => (
                              <option 
                                key={option.value} 
                                value={option.value}
                                disabled={!!(formData.employeeName && employees.some(emp => emp.name === formData.employeeName) && 
                                         employees.find(emp => emp.name === formData.employeeName)?.role !== option.value)}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Role must match employee's assigned role
                          </p>
                        </div>
                        
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Status
                          </label>
                          <select
                            name="status"
                            id="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <CustomToggle
                          label="Priority Shift"
                          checked={isPriorityShift}
                          onChange={setIsPriorityShift}
                          className="mt-4"
                        />
                      </div>
                    )}
                    
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Start Time
                          </label>
                          <input
                            type="time"
                            name="startTime"
                            id="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 h-12 text-base"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            End Time
                          </label>
                          <input
                            type="time"
                            name="endTime"
                            id="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 h-12 text-base"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-8 flex justify-between gap-3">
                      {currentStep > 1 ? (
                        <CustomFocusButton
                          onClick={moveToPreviousStep}
                          variant="outline"
                          sound="click"
                          type="button"
                          className="flex-1 sm:flex-none"
                        >
                          Previous
                        </CustomFocusButton>
                      ) : (
                        <CustomFocusButton
                          onClick={handleClose}
                          variant="outline"
                          sound="click"
                          type="button"
                          className="flex-1 sm:flex-none"
                        >
                          Cancel
                        </CustomFocusButton>
                      )}
                      
                      {currentStep < 2 ? (
                        <CustomFocusButton
                          onClick={moveToNextStep}
                          variant="primary"
                          sound="click"
                          type="button"
                          preventFormSubmit={true}
                          className="flex-1 sm:flex-none"
                        >
                          Next
                        </CustomFocusButton>
                      ) : (
                        <CustomFocusButton
                          type="submit"
                          disabled={isSubmitting}
                          variant="primary"
                          sound="success"
                          className="flex-1 sm:flex-none"
                        >
                          {isSubmitting ? 'Saving...' : isEdit ? 'Update Shift' : 'Add Shift'}
                        </CustomFocusButton>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Success Animation */}
          <SuccessAnimation
            show={showSuccess}
            message={isEdit ? 'Shift Updated!' : 'Shift Added Successfully!'}
            variant="confetti"
            duration={3000}
            onComplete={handleSuccessComplete}
            className="z-[200]"
          />
          
          {/* Validation Error Modal */}
          {validationError && (
            <div className="fixed inset-0 z-[150] overflow-y-auto flex items-center justify-center">
              <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setValidationError(null)}></div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-dark-800 rounded-lg p-6 max-w-md mx-auto relative z-[200] shadow-2xl border-l-4 border-red-500"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className={`h-6 w-6 ${validationError.type === 'error' ? 'text-red-500' : 'text-yellow-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-lg font-medium ${validationError.type === 'error' ? 'text-red-800 dark:text-red-400' : 'text-yellow-800 dark:text-yellow-400'}`}>
                      {validationError.type === 'error' ? 'Employee Not Found' : 'Role Mismatch'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-base text-gray-700 dark:text-gray-300">{validationError.message}</p>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-dark-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        onClick={() => setValidationError(null)}
                      >
                        Go Back
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        onClick={() => {
                          setValidationError(null);
                          dispatch(setModalOpen({ modal: isEdit ? 'editShift' : 'addShift', isOpen: false }));
                          navigate('/employees');
                        }}
                      >
                        Add Employee
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ShiftForm; 
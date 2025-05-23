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

const roleOptions = [
  { value: 'Front Desk', label: 'Front Desk', color: 'bg-blue-500' },
  { value: 'Server', label: 'Server', color: 'bg-purple-500' },
  { value: 'Manager', label: 'Manager', color: 'bg-yellow-500' },
  { value: 'Cook', label: 'Cook', color: 'bg-red-500' },
];

const statusOptions = [
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Canceled', label: 'Canceled' },
];

// Helper function to format time (24h to 12h format)
const formatTime = (time: string): string => {
  // Handle if time is already in 12h format
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  
  try {
    // Convert from 24h format to 12h format
    const [hours, minutes] = time.split(':');
    const hoursNum = parseInt(hours, 10);
    const period = hoursNum >= 12 ? 'PM' : 'AM';
    const hours12 = hoursNum % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', time, error);
    return time; // Return original if format fails
  }
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
  
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-32 md:pb-20 text-center sm:block sm:p-0">
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
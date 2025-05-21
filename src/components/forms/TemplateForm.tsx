import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { addTemplate, updateTemplate } from '../../store/shiftsSlice';
import { setModalOpen, setSelectedTemplateId, addNotification } from '../../store/uiSlice';
import { RootState } from '../../store';
import { ShiftTemplate } from '../../types';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import CustomFocusButton from '../common/CustomFocusButton';
import CustomToggle from '../common/CustomToggle';
import SuccessAnimation from '../common/SuccessAnimation';

interface TemplateFormProps {
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

// Standard shift durations
const commonDurations = [
  { label: 'Full Day (8h)', startTime: '09:00', endTime: '17:00' },
  { label: 'Morning (4h)', startTime: '08:00', endTime: '12:00' },
  { label: 'Afternoon (4h)', startTime: '13:00', endTime: '17:00' },
  { label: 'Evening (5h)', startTime: '17:00', endTime: '22:00' },
  { label: 'Night (8h)', startTime: '22:00', endTime: '06:00' },
];

// Helper function to format time (24h to 12h format)
const formatTime = (time: string): string => {
  if (time.includes('AM') || time.includes('PM')) return time;
  
  try {
    const [hours, minutes] = time.split(':');
    const hoursNum = parseInt(hours, 10);
    const period = hoursNum >= 12 ? 'PM' : 'AM';
    const hours12 = hoursNum % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', time, error);
    return time;
  }
};

const TemplateForm: React.FC<TemplateFormProps> = ({ isEdit }) => {
  const dispatch = useDispatch();
  const { templates } = useSelector((state: RootState) => state.shifts);
  const { selectedTemplateId } = useSelector((state: RootState) => state.ui);
  const { playSound } = useSoundEffects();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCommonDuration, setUseCommonDuration] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<{startTime: string, endTime: string}>(commonDurations[0]);
  
  // Create refs for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null); 
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  // Use useMemo to prevent re-creation on each render
  const initialTemplate = useMemo((): ShiftTemplate => ({
    id: '',
    name: '',
    description: '',
    employeeName: '',
    role: roleOptions[0].value,
    startTime: '09:00',
    endTime: '17:00',
    status: 'Confirmed',
    color: roleOptions[0].color,
    icon: '🗓️'
  }), []);
  
  const [formData, setFormData] = useState<ShiftTemplate>(initialTemplate);
  
  // Load template data if editing
  useEffect(() => {
    if (isEdit && selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setFormData(template);
        
        const matchingDuration = commonDurations.find(
          d => d.startTime === template.startTime && d.endTime === template.endTime
        );
        
        if (matchingDuration) {
          setUseCommonDuration(true);
          setSelectedDuration(matchingDuration);
        } else {
          setUseCommonDuration(false);
        }
      }
    } else {
      setFormData({
        ...initialTemplate,
        id: Date.now().toString()
      });
      setUseCommonDuration(true);
      setSelectedDuration(commonDurations[0]);
    }
  }, [isEdit, selectedTemplateId, templates, initialTemplate]);
  
  // Focus the first field when the form opens
  useEffect(() => {
    if (initialFocusRef.current) {
      initialFocusRef.current.focus();
    }
  }, []);
  
  // Set up focus trap within the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        e.preventDefault();
      } else if (e.key === 'Tab') {
        // Trap focus inside the modal
        if (!modalRef.current) return;
        
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Play a sound effect when the form opens
  useEffect(() => {
    playSound('notification');
  }, [playSound]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    playSound('click', 0.2);
    
    const { name, value } = e.target;
    
    if (name === 'role') {
      const roleColor = roleOptions.find(option => option.value === value)?.color || 'bg-blue-500';
      setFormData({
        ...formData,
        [name]: value,
        color: roleColor
      });
    } else if (name === 'status') {
      // Ensure status is typed correctly
      setFormData({
        ...formData,
        status: value as 'Confirmed' | 'Pending' | 'Canceled'
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value);
    const duration = commonDurations[index];
    setSelectedDuration(duration);
    setFormData({
      ...formData,
      startTime: duration.startTime,
      endTime: duration.endTime
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.name.trim()) {
        dispatch(addNotification({
          message: 'Please enter a template name',
          type: 'error',
          category: 'general'
        }));
        setIsSubmitting(false);
        return;
      }
      
      const templateToSave: ShiftTemplate = {
        ...formData,
        startTime: useCommonDuration ? selectedDuration.startTime : formData.startTime,
        endTime: useCommonDuration ? selectedDuration.endTime : formData.endTime,
        id: isEdit ? formData.id : Date.now().toString()
      };
      
      setTimeout(() => {
        const action = isEdit ? updateTemplate(templateToSave) : addTemplate(templateToSave);
        dispatch(action);
        
        setShowSuccess(true);
        playSound('complete');
        
        dispatch(addNotification({
          message: isEdit ? 'Template updated successfully' : 'Template added successfully',
          type: 'success',
          category: 'general'
        }));
        
        setIsSubmitting(false);
      }, 600);
    } catch (error) {
      console.error('Error submitting template form:', error);
      dispatch(addNotification({
        message: 'There was an error saving the template',
        type: 'error',
        category: 'general'
      }));
      setIsSubmitting(false);
    }
  };
  
  const handleSuccessComplete = () => {
    setShowSuccess(false);
    handleClose();
  };
  
  const handleClose = () => {
    if (isEdit) {
      dispatch(setSelectedTemplateId(null));
    }
    dispatch(setModalOpen({ modal: isEdit ? 'editTemplate' : 'addTemplate', isOpen: false }));
  };
  
  const handleIconSelect = (icon: string) => {
    setFormData({
      ...formData,
      icon
    });
    playSound('click');
  };
  
  // Available icons - reduced for mobile
  const icons = ['🗓️', '⏰', '👩‍💼', '👨‍💼', '🧑‍🍳', '🍽️', '🛎️', '💼', '📊', '⭐'];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-form-title"
      >
        <div 
          className="bg-black bg-opacity-50 fixed inset-0" 
          onClick={handleClose}
          aria-hidden="true"
        ></div>
        
        <div className="relative w-full max-w-md mx-auto z-10 h-full">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-dark-800 rounded-lg shadow-lg overflow-hidden mx-3 my-4 max-h-[calc(100vh-32px)] flex flex-col"
          >
            <div className="flex justify-between items-center bg-primary-500 px-3 py-2 text-white">
              <h2 
                id="template-form-title" 
                className="text-lg font-semibold"
              >
                {isEdit ? 'Edit Template' : 'New Template'}
              </h2>
              <button 
                onClick={handleClose} 
                className="text-white hover:text-gray-200 p-1"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-grow">
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="space-y-3 flex-grow">
                  {/* Template Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Template Name*
                    </label>
                    <input
                      ref={initialFocusRef}
                      type="text" 
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1 px-2"
                      placeholder="e.g., Morning Shift"
                      autoComplete="off"
                      aria-required="true"
                    />
                  </div>
                  
                  {/* Icons - more compact layout */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Icon
                    </label>
                    <div 
                      className="flex flex-wrap gap-1.5"
                      role="radiogroup"
                      aria-label="Select template icon"
                    >
                      {icons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => handleIconSelect(icon)}
                          className={`w-7 h-7 text-base flex items-center justify-center rounded-md ${
                            formData.icon === icon 
                              ? 'bg-primary-500 text-white' 
                              : 'bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-dark-600'
                          }`}
                          aria-label={`Icon ${icon}`}
                          aria-pressed={formData.icon === icon}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Role and Status in a single row on larger screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Role */}
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Role
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1"
                        aria-label="Select role"
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Status */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1"
                        aria-label="Select status"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Shift Duration */}
                  <div className="space-y-2">
                    <CustomToggle
                      label="Use common shift duration"
                      checked={useCommonDuration}
                      onChange={setUseCommonDuration}
                      aria-controls="duration-options"
                    />
                    
                    {useCommonDuration ? (
                      <div id="duration-options">
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Shift Duration
                        </label>
                        <select
                          id="duration"
                          value={commonDurations.findIndex(d => 
                            d.startTime === selectedDuration.startTime && 
                            d.endTime === selectedDuration.endTime
                          )}
                          onChange={handleDurationChange}
                          className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1"
                          aria-label="Select shift duration"
                        >
                          {commonDurations.map((duration, index) => (
                            <option key={index} value={index}>
                              {duration.label} ({formatTime(duration.startTime)} - {formatTime(duration.endTime)})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3" id="duration-options">
                        <div>
                          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            id="startTime"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1"
                            aria-label="Start time"
                          />
                        </div>
                        <div>
                          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Time
                          </label>
                          <input
                            type="time"
                            id="endTime"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1"
                            aria-label="End time"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Employee Name and Description - optional fields that can be collapsed on mobile */}
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Default Employee (Optional)
                      </label>
                      <input
                        type="text"
                        id="employeeName"
                        name="employeeName"
                        value={formData.employeeName || ''}
                        onChange={handleChange}
                        className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1 px-2"
                        placeholder="Leave blank to ask each time"
                        autoComplete="off"
                        aria-label="Default employee name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        rows={2}
                        className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1 px-2"
                        placeholder="Add notes about this template"
                        aria-label="Template description"
                      />
                    </div>
                  </div>
                  
                  {/* Template Preview - minimized on smaller screens */}
                  <div 
                    className="bg-gray-50 dark:bg-dark-700 p-2 rounded-md border border-gray-200 dark:border-dark-600"
                    aria-label="Template preview"
                  >
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Preview</div>
                    <div className={`p-2 rounded-md ${formData.color.replace('bg-', 'bg-opacity-20 bg-')}`}>
                      <div className="flex items-center">
                        <span className="text-base mr-1.5" aria-hidden="true">{formData.icon}</span>
                        <span className="font-semibold text-sm">{formData.name || 'Unnamed Template'}</span>
                      </div>
                      <div className="mt-0.5 text-xs">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${formData.color} text-white`}>
                          {formData.role}
                        </span>
                        <span className="ml-1.5">
                          {useCommonDuration 
                            ? `${formatTime(selectedDuration.startTime)} - ${formatTime(selectedDuration.endTime)}`
                            : `${formatTime(formData.startTime)} - ${formatTime(formData.endTime)}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Fixed position footer with action buttons */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-600 flex justify-end items-center space-x-3 sticky bottom-0 bg-white dark:bg-dark-800">
                  <CustomFocusButton
                    type="button"
                    onClick={handleClose}
                    variant="outline"
                    sound="click"
                    className="px-3 py-1.5 text-sm"
                    aria-label="Cancel and close form"
                  >
                    Cancel
                  </CustomFocusButton>
                  <CustomFocusButton
                    ref={submitButtonRef}
                    type="submit"
                    disabled={isSubmitting}
                    variant="primary"
                    sound="success"
                    className="px-3 py-1.5 text-sm"
                    aria-label={isSubmitting 
                      ? 'Saving template' 
                      : isEdit 
                        ? 'Update template' 
                        : 'Save template'
                    }
                  >
                    {isSubmitting 
                      ? 'Saving...' 
                      : isEdit 
                        ? 'Update' 
                        : 'Save'
                    }
                  </CustomFocusButton>
                </div>
              </form>
            </div>
          </motion.div>
          
          {/* Success Animation */}
          <SuccessAnimation
            show={showSuccess}
            message={isEdit ? 'Template Updated!' : 'Template Created!'}
            variant="confetti"
            duration={2000}
            onComplete={handleSuccessComplete}
            className="z-[200]"
            role="status"
            aria-live="assertive"
          />
        </div>
      </div>
    </AnimatePresence>
  );
};

export default TemplateForm; 
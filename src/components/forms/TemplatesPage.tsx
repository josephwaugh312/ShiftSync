import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteTemplate, applyTemplate } from '../../store/shiftsSlice';
import { setModalOpen, setSelectedTemplateId, addNotification } from '../../store/uiSlice';
import { RootState } from '../../store';
import CustomFocusButton from '../common/CustomFocusButton';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import TemplateForm from './TemplateForm';

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

const TemplatesPage: React.FC = () => {
  const dispatch = useDispatch();
  const { templates } = useSelector((state: RootState) => state.shifts);
  const { selectedDate } = useSelector((state: RootState) => state.shifts);
  const { modalOpen } = useSelector((state: RootState) => state.ui);
  const { playSound } = useSoundEffects();
  
  const [selectedTemplateForDelete, setSelectedTemplateForDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmployeePrompt, setShowEmployeePrompt] = useState(false);
  const [templateToApply, setTemplateToApply] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  
  // Function to handle editing a template
  const handleEditTemplate = (templateId: string) => {
    dispatch(setSelectedTemplateId(templateId));
    dispatch(setModalOpen({ modal: 'editTemplate', isOpen: true }));
  };
  
  // Function to handle deleting a template
  const handleDeleteTemplate = (templateId: string) => {
    setSelectedTemplateForDelete(templateId);
    setShowDeleteConfirm(true);
  };
  
  // Function to confirm template deletion
  const handleConfirmDelete = () => {
    if (selectedTemplateForDelete) {
      dispatch(deleteTemplate(selectedTemplateForDelete));
      setShowDeleteConfirm(false);
      setSelectedTemplateForDelete(null);
      
      dispatch(addNotification({
        message: 'Template deleted successfully',
        type: 'success',
        category: 'general'
      }));
      
      playSound('notification');
    }
  };
  
  // Function to start the apply template process
  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      if (template.employeeName) {
        // If the template has a default employee name, apply directly
        dispatch(applyTemplate({
          templateId,
          date: selectedDate,
          employeeName: template.employeeName
        }));
        
        dispatch(addNotification({
          message: 'Shift added to schedule',
          type: 'success',
          category: 'general'
        }));
        
        playSound('complete');
      } else {
        // Ask for employee name
        setTemplateToApply(templateId);
        setShowEmployeePrompt(true);
      }
    }
  };
  
  // Function to apply template with employee name
  const handleConfirmApply = () => {
    if (templateToApply) {
      if (!employeeName.trim()) {
        dispatch(addNotification({
          message: 'Please enter an employee name',
          type: 'error',
          category: 'general'
        }));
        return;
      }
      
      dispatch(applyTemplate({
        templateId: templateToApply,
        date: selectedDate,
        employeeName
      }));
      
      setShowEmployeePrompt(false);
      setTemplateToApply(null);
      setEmployeeName('');
      
      dispatch(addNotification({
        message: 'Shift added to schedule',
        type: 'success',
        category: 'general'
      }));
      
      playSound('complete');
      
      // Close the templates modal after applying
      dispatch(setModalOpen({ modal: 'templates', isOpen: false }));
    }
  };
  
  // Function to close the page
  const handleClose = () => {
    dispatch(setModalOpen({ modal: 'templates', isOpen: false }));
  };
  
  // Function to add a new template
  const handleAddTemplate = () => {
    dispatch(setModalOpen({ modal: 'addTemplate', isOpen: true }));
  };
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
        
        <div className="relative flex items-start justify-center min-h-screen p-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-xl mx-auto overflow-hidden my-4 max-h-[calc(100vh-32px)] flex flex-col"
          >
            <div className="bg-primary-500 py-3 px-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Shift Templates</h2>
              <button 
                onClick={handleClose}
                className="text-white hover:text-gray-200 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-grow">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Create templates for quick shift scheduling.
                </p>
                <CustomFocusButton
                  onClick={handleAddTemplate}
                  variant="primary"
                  sound="click"
                  className="text-sm py-1.5 px-3 whitespace-nowrap"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Template
                  </span>
                </CustomFocusButton>
              </div>
              
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-base font-medium text-gray-900 dark:text-white">No templates yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first template.</p>
                  <div className="mt-4">
                    <CustomFocusButton
                      onClick={handleAddTemplate}
                      variant="primary"
                      sound="click"
                      className="text-sm py-1.5 px-4"
                    >
                      Create Template
                    </CustomFocusButton>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <div 
                      key={template.id}
                      className={`border rounded-md p-3 ${template.color.replace('bg-', 'bg-opacity-10 bg-')} hover:bg-opacity-20 transition-colors duration-200`}
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="text-base mr-1.5">{template.icon}</span>
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate max-w-[120px]">
                            {template.name}
                          </h3>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditTemplate(template.id)}
                            className="p-1.5 text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                            aria-label="Edit template"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                            aria-label="Delete template"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-1.5">
                        <div className="flex items-center flex-wrap gap-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${template.color} text-white`}>
                            {template.role}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {formatTime(template.startTime)} - {formatTime(template.endTime)}
                          </span>
                        </div>
                        {template.description && (
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="mt-2 flex justify-end">
                        <CustomFocusButton
                          onClick={() => handleApplyTemplate(template.id)}
                          variant="outline"
                          sound="click"
                          className="text-xs py-1 px-2"
                        >
                          Use Template
                        </CustomFocusButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Add Template Modal */}
      {modalOpen.addTemplate && <TemplateForm isEdit={false} />}
      
      {/* Edit Template Modal */}
      {modalOpen.editTemplate && <TemplateForm isEdit={true} />}
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
            <div className="bg-black bg-opacity-50 fixed inset-0" onClick={() => setShowDeleteConfirm(false)}></div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-4 w-full max-w-xs mx-3 relative z-10"
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Delete Template
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete this template?
              </p>
              
              <div className="flex justify-end space-x-3">
                <CustomFocusButton
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  sound="click"
                  className="text-sm py-1.5 px-3"
                >
                  Cancel
                </CustomFocusButton>
                <CustomFocusButton
                  onClick={handleConfirmDelete}
                  variant="danger"
                  sound="error"
                  className="text-sm py-1.5 px-3"
                >
                  Delete
                </CustomFocusButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Employee Name Prompt */}
      <AnimatePresence>
        {showEmployeePrompt && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
            <div className="bg-black bg-opacity-50 fixed inset-0" onClick={() => setShowEmployeePrompt(false)}></div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-4 w-full max-w-xs mx-3 relative z-10"
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Add Employee
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Who will be working this shift?
              </p>
              
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Enter employee name"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1.5 px-2 text-sm"
                  autoComplete="off"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <CustomFocusButton
                  onClick={() => setShowEmployeePrompt(false)}
                  variant="outline"
                  sound="click"
                  className="text-sm py-1.5 px-3"
                >
                  Cancel
                </CustomFocusButton>
                <CustomFocusButton
                  onClick={handleConfirmApply}
                  variant="primary"
                  sound="success"
                  className="text-sm py-1.5 px-3"
                >
                  Add to Schedule
                </CustomFocusButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default TemplatesPage; 
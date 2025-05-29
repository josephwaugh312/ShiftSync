import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setModalOpen, setSelectedShiftId, addNotification } from '../../store/uiSlice';
import { deleteShift } from '../../store/shiftsSlice';
import { RootState } from '../../store';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const DeleteConfirmModal: React.FC = () => {
  const dispatch = useDispatch();
  const { modalOpen, selectedShiftId, notificationPreferences } = useSelector((state: RootState) => state.ui);
  const { shifts } = useSelector((state: RootState) => state.shifts);
  const { playSound } = useSoundEffects();

  // Find the selected shift
  const selectedShift = shifts.find(shift => shift.id === selectedShiftId);

  const handleConfirmDelete = () => {
    if (!selectedShift) return;
    
    // Delete the shift
    dispatch(deleteShift(selectedShift.id));
    
    // Close confirmation modal
    dispatch(setModalOpen({ modal: 'deleteConfirm', isOpen: false }));
    
    // Clear selected shift
    dispatch(setSelectedShiftId(null));
    
    // Play delete sound
    playSound('delete');
    
    // Show success notification
    if (notificationPreferences.enabled && notificationPreferences.types.shifts) {
      dispatch(addNotification({
        message: `Shift for ${selectedShift.employeeName} deleted successfully`,
        type: 'success',
        category: 'shifts'
      }));
    }
  };

  const handleCancelDelete = () => {
    dispatch(setModalOpen({ modal: 'deleteConfirm', isOpen: false }));
    dispatch(setSelectedShiftId(null));
    playSound('click');
  };

  if (!selectedShift) return null;

  return (
    <AnimatePresence>
      {modalOpen.deleteConfirm && (
        <div className="fixed inset-0 z-[200] overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
            onClick={handleCancelDelete}
            aria-hidden="true"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-dark-800 rounded-lg p-6 max-w-md mx-auto relative z-[201] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 id="delete-modal-title" className="text-lg font-medium text-gray-900 dark:text-white">Delete Shift</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <p id="delete-modal-description" className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete the shift for <strong>{selectedShift.employeeName}</strong> on{' '}
              <strong>{new Date(selectedShift.date).toLocaleDateString()}</strong> from{' '}
              <strong>{selectedShift.timeRange}</strong>?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete Shift
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal; 
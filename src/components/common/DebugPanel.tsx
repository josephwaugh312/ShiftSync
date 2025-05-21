import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { clearShifts } from '../../store/shiftsSlice';

const DebugPanel: React.FC = () => {
  const dispatch = useDispatch();
  const shifts = useSelector((state: RootState) => state.shifts.shifts);
  const employees = useSelector((state: RootState) => state.employees.employees);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleClearShifts = () => {
    if (showConfirm) {
      dispatch(clearShifts());
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };
  
  // Analyze shift data for potential issues
  const duplicateShiftIds = shifts
    .map(shift => shift.id)
    .filter((id, index, array) => array.indexOf(id) !== index);
    
  const corruptedShifts = shifts.filter(shift => 
    !shift.id || 
    !shift.date || 
    !shift.startTime || 
    !shift.endTime ||
    !shift.employeeName
  );
  
  const hasDataIssues = duplicateShiftIds.length > 0 || corruptedShifts.length > 0;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg shadow-lg p-4 max-w-2xl max-h-[70vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Debug Panel</h3>
        <div className="flex space-x-2">
          {showConfirm ? (
            <>
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-dark-600 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearShifts}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded"
              >
                Confirm Clear
              </button>
            </>
          ) : (
            <button 
              onClick={handleClearShifts}
              className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded"
            >
              Clear All Shifts
            </button>
          )}
        </div>
      </div>
      
      {hasDataIssues && (
        <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
          <h4 className="font-medium mb-1">⚠️ Data Issues Detected</h4>
          {duplicateShiftIds.length > 0 && (
            <p className="text-xs mb-1">Duplicate Shift IDs: {duplicateShiftIds.join(', ')}</p>
          )}
          {corruptedShifts.length > 0 && (
            <p className="text-xs">Corrupted Shifts: {corruptedShifts.length}</p>
          )}
        </div>
      )}
      
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-1">Shifts ({shifts.length})</h4>
        <pre className="text-xs bg-gray-100 dark:bg-dark-900 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(shifts, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-1">Employees ({employees.length})</h4>
        <pre className="text-xs bg-gray-100 dark:bg-dark-900 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(employees, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DebugPanel; 
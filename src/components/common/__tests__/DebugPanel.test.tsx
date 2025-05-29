import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DebugPanel from '../DebugPanel';
import shiftsSlice, { clearShifts } from '../../../store/shiftsSlice';
import employeeSlice from '../../../store/employeeSlice';

// ===== UTILITY FUNCTIONS =====

const createTestStore = (initialState?: any) => {
  const defaultState = {
    shifts: {
      shifts: [],
      currentShift: null,
      loading: false,
      error: null,
    },
    employees: {
      employees: [],
      loading: false,
      error: null,
    },
  };

  return configureStore({
    reducer: {
      shifts: shiftsSlice,
      employees: employeeSlice,
    },
    preloadedState: initialState || defaultState,
  });
};

const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

// Sample test data
const sampleShifts = [
  {
    id: '1',
    date: '2024-01-01',
    startTime: '09:00',
    endTime: '17:00',
    employeeName: 'John Doe',
    role: 'Developer',
  },
  {
    id: '2',
    date: '2024-01-02',
    startTime: '10:00',
    endTime: '18:00',
    employeeName: 'Jane Smith',
    role: 'Designer',
  },
];

const sampleEmployees = [
  { id: '1', name: 'John Doe', role: 'Developer' },
  { id: '2', name: 'Jane Smith', role: 'Designer' },
];

describe('DebugPanel Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<DebugPanel />);
      
      expect(screen.getByText('Debug Panel')).toBeInTheDocument();
    });

    it('should render with correct structure', () => {
      renderWithProviders(<DebugPanel />);
      
      // Should have fixed positioning and styling
      const panel = document.querySelector('.fixed.bottom-4.right-4.z-50');
      expect(panel).toBeInTheDocument();
      
      // Should have proper background and border
      expect(panel).toHaveClass(
        'bg-white',
        'dark:bg-dark-800',
        'border',
        'border-gray-200',
        'dark:border-dark-600',
        'rounded-lg',
        'shadow-lg'
      );
    });

    it('should have scrollable content area', () => {
      renderWithProviders(<DebugPanel />);
      
      const panel = document.querySelector('.max-w-2xl.max-h-\\[70vh\\].overflow-auto');
      expect(panel).toBeInTheDocument();
    });

    it('should display header with title', () => {
      renderWithProviders(<DebugPanel />);
      
      const title = screen.getByText('Debug Panel');
      expect(title).toHaveClass('text-lg', 'font-medium', 'text-gray-900', 'dark:text-white');
    });
  });

  describe('Clear Shifts Functionality', () => {
    it('should show clear button initially', () => {
      renderWithProviders(<DebugPanel />);
      
      const clearButton = screen.getByText('Clear All Shifts');
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveClass(
        'px-2',
        'py-1',
        'text-xs',
        'bg-red-100',
        'dark:bg-red-900',
        'text-red-700',
        'dark:text-red-200',
        'rounded'
      );
    });

    it('should show confirmation buttons when clear is clicked', () => {
      renderWithProviders(<DebugPanel />);
      
      const clearButton = screen.getByText('Clear All Shifts');
      fireEvent.click(clearButton);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm Clear')).toBeInTheDocument();
      expect(screen.queryByText('Clear All Shifts')).not.toBeInTheDocument();
    });

    it('should cancel confirmation and return to normal state', () => {
      renderWithProviders(<DebugPanel />);
      
      // Click clear button
      const clearButton = screen.getByText('Clear All Shifts');
      fireEvent.click(clearButton);
      
      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      // Should return to normal state
      expect(screen.getByText('Clear All Shifts')).toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Confirm Clear')).not.toBeInTheDocument();
    });

    it('should dispatch clearShifts when confirmed', () => {
      const store = createTestStore({
        shifts: { shifts: sampleShifts },
        employees: { employees: sampleEmployees },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<DebugPanel />, store);
      
      // Click clear button
      const clearButton = screen.getByText('Clear All Shifts');
      fireEvent.click(clearButton);
      
      // Click confirm
      const confirmButton = screen.getByText('Confirm Clear');
      fireEvent.click(confirmButton);
      
      expect(dispatchSpy).toHaveBeenCalledWith(clearShifts());
    });

    it('should return to normal state after confirmation', () => {
      const store = createTestStore();
      
      renderWithProviders(<DebugPanel />, store);
      
      // Click clear button
      const clearButton = screen.getByText('Clear All Shifts');
      fireEvent.click(clearButton);
      
      // Click confirm
      const confirmButton = screen.getByText('Confirm Clear');
      fireEvent.click(confirmButton);
      
      // Should return to normal state
      expect(screen.getByText('Clear All Shifts')).toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Confirm Clear')).not.toBeInTheDocument();
    });

    it('should apply correct styling to confirmation buttons', () => {
      renderWithProviders(<DebugPanel />);
      
      const clearButton = screen.getByText('Clear All Shifts');
      fireEvent.click(clearButton);
      
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveClass('px-2', 'py-1', 'text-xs', 'bg-gray-200', 'dark:bg-dark-600', 'rounded');
      
      const confirmButton = screen.getByText('Confirm Clear');
      expect(confirmButton).toHaveClass('px-2', 'py-1', 'text-xs', 'bg-red-500', 'text-white', 'rounded');
    });
  });

  describe('Data Display', () => {
    it('should display shifts data', () => {
      const store = createTestStore({
        shifts: { shifts: sampleShifts },
        employees: { employees: sampleEmployees },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      expect(screen.getByText('Shifts (2)')).toBeInTheDocument();
      
      // Should display JSON data
      const shiftsJson = document.querySelector('pre');
      expect(shiftsJson).toBeInTheDocument();
      expect(shiftsJson).toHaveTextContent('"id": "1"');
      expect(shiftsJson).toHaveTextContent('"employeeName": "John Doe"');
    });

    it('should display employees data', () => {
      const store = createTestStore({
        shifts: { shifts: sampleShifts },
        employees: { employees: sampleEmployees },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      expect(screen.getByText('Employees (2)')).toBeInTheDocument();
      
      // Should find employee data in JSON
      const allPre = document.querySelectorAll('pre');
      const employeesJson = allPre[1]; // Second pre should be employees
      expect(employeesJson).toHaveTextContent('"name": "John Doe"');
      expect(employeesJson).toHaveTextContent('"role": "Developer"');
    });

    it('should display correct counts for empty data', () => {
      const store = createTestStore({
        shifts: { shifts: [] },
        employees: { employees: [] },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      expect(screen.getByText('Shifts (0)')).toBeInTheDocument();
      expect(screen.getByText('Employees (0)')).toBeInTheDocument();
    });

    it('should apply correct styling to data sections', () => {
      renderWithProviders(<DebugPanel />);
      
      const shiftsHeader = screen.getByText(/Shifts \(\d+\)/);
      expect(shiftsHeader).toHaveClass('text-md', 'font-medium', 'text-gray-800', 'dark:text-gray-200', 'mb-1');
      
      const employeesHeader = screen.getByText(/Employees \(\d+\)/);
      expect(employeesHeader).toHaveClass('text-md', 'font-medium', 'text-gray-800', 'dark:text-gray-200', 'mb-1');
    });

    it('should apply correct styling to JSON display', () => {
      renderWithProviders(<DebugPanel />);
      
      const jsonDisplays = document.querySelectorAll('pre');
      jsonDisplays.forEach(pre => {
        expect(pre).toHaveClass(
          'text-xs',
          'bg-gray-100',
          'dark:bg-dark-900',
          'p-2',
          'rounded',
          'overflow-auto',
          'max-h-40'
        );
      });
    });
  });

  describe('Data Issues Detection', () => {
    it('should not show data issues warning when data is clean', () => {
      const store = createTestStore({
        shifts: { shifts: sampleShifts },
        employees: { employees: sampleEmployees },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      expect(screen.queryByText('⚠️ Data Issues Detected')).not.toBeInTheDocument();
    });

    it('should detect duplicate shift IDs', () => {
      const duplicateShifts = [
        ...sampleShifts,
        { ...sampleShifts[0] }, // Duplicate ID
      ];
      
      const store = createTestStore({
        shifts: { shifts: duplicateShifts },
        employees: { employees: sampleEmployees },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      expect(screen.getByText('⚠️ Data Issues Detected')).toBeInTheDocument();
      expect(screen.getByText('Duplicate Shift IDs: 1')).toBeInTheDocument();
    });

    it('should detect corrupted shifts with missing id', () => {
      const corruptedShifts = [
        ...sampleShifts,
        {
          // Missing id
          date: '2024-01-03',
          startTime: '09:00',
          endTime: '17:00',
          employeeName: 'Bob Johnson',
        },
      ];
      
      const store = createTestStore({
        shifts: { shifts: corruptedShifts },
        employees: { employees: sampleEmployees },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      expect(screen.getByText('⚠️ Data Issues Detected')).toBeInTheDocument();
      expect(screen.getByText('Corrupted Shifts: 1')).toBeInTheDocument();
    });

    it('should detect corrupted shifts with missing required fields', () => {
      const corruptedShifts = [
        {
          id: '3',
          // Missing date, startTime, endTime, employeeName
        },
        {
          id: '4',
          date: '2024-01-04',
          // Missing startTime, endTime, employeeName
        },
      ];
      
      const store = createTestStore({
        shifts: { shifts: corruptedShifts },
        employees: { employees: sampleEmployees },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      expect(screen.getByText('⚠️ Data Issues Detected')).toBeInTheDocument();
      expect(screen.getByText('Corrupted Shifts: 2')).toBeInTheDocument();
    });

    it('should detect multiple issues simultaneously', () => {
      const problematicShifts = [
        ...sampleShifts,
        { ...sampleShifts[0] }, // Duplicate
        { id: '3' }, // Corrupted
      ];
      
      const store = createTestStore({
        shifts: { shifts: problematicShifts },
        employees: { employees: sampleEmployees },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      expect(screen.getByText('⚠️ Data Issues Detected')).toBeInTheDocument();
      expect(screen.getByText('Duplicate Shift IDs: 1')).toBeInTheDocument();
      expect(screen.getByText('Corrupted Shifts: 1')).toBeInTheDocument();
    });

    it('should apply correct styling to data issues warning', () => {
      const corruptedShifts = [{ id: '1' }]; // Missing required fields
      
      const store = createTestStore({
        shifts: { shifts: corruptedShifts },
        employees: { employees: sampleEmployees },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      const warningSection = document.querySelector('.bg-yellow-100.dark\\:bg-yellow-900.text-yellow-800.dark\\:text-yellow-200.rounded');
      expect(warningSection).toBeInTheDocument();
      
      const warningHeader = screen.getByText('⚠️ Data Issues Detected');
      expect(warningHeader).toHaveClass('font-medium', 'mb-1');
      
      const issueDetails = screen.getByText('Corrupted Shifts: 1');
      expect(issueDetails).toHaveClass('text-xs');
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for panel background', () => {
      renderWithProviders(<DebugPanel />);
      
      const panel = document.querySelector('.bg-white.dark\\:bg-dark-800');
      expect(panel).toBeInTheDocument();
    });

    it('should include dark mode classes for borders', () => {
      renderWithProviders(<DebugPanel />);
      
      const panel = document.querySelector('.border-gray-200.dark\\:border-dark-600');
      expect(panel).toBeInTheDocument();
    });

    it('should include dark mode classes for text', () => {
      renderWithProviders(<DebugPanel />);
      
      const title = screen.getByText('Debug Panel');
      expect(title).toHaveClass('dark:text-white');
      
      const headers = document.querySelectorAll('h4');
      headers.forEach(header => {
        expect(header).toHaveClass('dark:text-gray-200');
      });
    });

    it('should include dark mode classes for JSON displays', () => {
      renderWithProviders(<DebugPanel />);
      
      const jsonDisplays = document.querySelectorAll('pre');
      jsonDisplays.forEach(pre => {
        expect(pre).toHaveClass('dark:bg-dark-900');
      });
    });

    it('should include dark mode classes for buttons', () => {
      renderWithProviders(<DebugPanel />);
      
      const clearButton = screen.getByText('Clear All Shifts');
      expect(clearButton).toHaveClass('dark:bg-red-900', 'dark:text-red-200');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined shifts gracefully', () => {
      const store = createTestStore({
        shifts: { shifts: undefined },
        employees: { employees: [] },
      });
      
      expect(() => {
        renderWithProviders(<DebugPanel />, store);
      }).not.toThrow();
    });

    it('should handle undefined employees gracefully', () => {
      const store = createTestStore({
        shifts: { shifts: [] },
        employees: { employees: undefined },
      });
      
      expect(() => {
        renderWithProviders(<DebugPanel />, store);
      }).not.toThrow();
    });

    it('should handle null shift properties', () => {
      const shiftsWithNulls = [
        {
          id: '1',
          date: null,
          startTime: null,
          endTime: null,
          employeeName: null,
        },
      ];
      
      const store = createTestStore({
        shifts: { shifts: shiftsWithNulls },
        employees: { employees: [] },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      expect(screen.getByText('⚠️ Data Issues Detected')).toBeInTheDocument();
      expect(screen.getByText('Corrupted Shifts: 1')).toBeInTheDocument();
    });

    it('should handle empty string shift properties', () => {
      const shiftsWithEmptyStrings = [
        {
          id: '',
          date: '',
          startTime: '',
          endTime: '',
          employeeName: '',
        },
      ];
      
      const store = createTestStore({
        shifts: { shifts: shiftsWithEmptyStrings },
        employees: { employees: [] },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      expect(screen.getByText('⚠️ Data Issues Detected')).toBeInTheDocument();
      expect(screen.getByText('Corrupted Shifts: 1')).toBeInTheDocument();
    });

    it('should handle very large datasets', () => {
      const largeShiftsArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        date: '2024-01-01',
        startTime: '09:00',
        endTime: '17:00',
        employeeName: `Employee ${i}`,
      }));
      
      const store = createTestStore({
        shifts: { shifts: largeShiftsArray },
        employees: { employees: [] },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      expect(screen.getByText('Shifts (1000)')).toBeInTheDocument();
    });
  });

  describe('JSON Formatting', () => {
    it('should format JSON with proper indentation', () => {
      const store = createTestStore({
        shifts: { shifts: sampleShifts },
        employees: { employees: sampleEmployees },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      const jsonDisplays = document.querySelectorAll('pre');
      jsonDisplays.forEach(pre => {
        const jsonText = pre.textContent;
        expect(jsonText).toContain('  '); // Should have indentation
        expect(jsonText).toContain('\n'); // Should have line breaks
      });
    });

    it('should handle complex nested objects in JSON', () => {
      const complexShift = {
        id: '1',
        date: '2024-01-01',
        startTime: '09:00',
        endTime: '17:00',
        employeeName: 'John Doe',
        metadata: {
          location: 'Office A',
          equipment: ['laptop', 'phone'],
          permissions: { admin: false, manager: true },
        },
      };
      
      const store = createTestStore({
        shifts: { shifts: [complexShift] },
        employees: { employees: [] },
      });
      
      renderWithProviders(<DebugPanel />, store);
      
      const shiftsJson = document.querySelector('pre');
      expect(shiftsJson).toHaveTextContent('metadata');
      expect(shiftsJson).toHaveTextContent('location');
      expect(shiftsJson).toHaveTextContent('equipment');
    });
  });

  describe('Integration Tests', () => {
    it('should work with full data flow', () => {
      const store = createTestStore({
        shifts: { shifts: sampleShifts },
        employees: { employees: sampleEmployees },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<DebugPanel />, store);
      
      // Should display data
      expect(screen.getByText('Shifts (2)')).toBeInTheDocument();
      expect(screen.getByText('Employees (2)')).toBeInTheDocument();
      
      // Should not show data issues
      expect(screen.queryByText('⚠️ Data Issues Detected')).not.toBeInTheDocument();
      
      // Should be able to clear shifts
      const clearButton = screen.getByText('Clear All Shifts');
      fireEvent.click(clearButton);
      
      const confirmButton = screen.getByText('Confirm Clear');
      fireEvent.click(confirmButton);
      
      expect(dispatchSpy).toHaveBeenCalledWith(clearShifts());
    });

    it('should handle data with multiple issues and clearing', () => {
      const problematicShifts = [
        ...sampleShifts,
        { ...sampleShifts[0] }, // Duplicate
        { id: '3' }, // Corrupted
      ];
      
      const store = createTestStore({
        shifts: { shifts: problematicShifts },
        employees: { employees: sampleEmployees },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<DebugPanel />, store);
      
      // Should display issues
      expect(screen.getByText('⚠️ Data Issues Detected')).toBeInTheDocument();
      expect(screen.getByText('Duplicate Shift IDs: 1')).toBeInTheDocument();
      expect(screen.getByText('Corrupted Shifts: 1')).toBeInTheDocument();
      
      // Should still be able to clear
      const clearButton = screen.getByText('Clear All Shifts');
      fireEvent.click(clearButton);
      
      const confirmButton = screen.getByText('Confirm Clear');
      fireEvent.click(confirmButton);
      
      expect(dispatchSpy).toHaveBeenCalledWith(clearShifts());
    });
  });
}); 
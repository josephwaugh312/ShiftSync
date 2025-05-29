import React from 'react';

// Mock external dependencies at the top level
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: () => ({
    shifts: [],
    selectedShiftId: null,
    employees: []
  })
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

jest.mock('react-datepicker', () => {
  return function MockDatePicker({ selected, onChange, inline, ...props }: any) {
    return (
      <div data-testid="mock-datepicker">
        <input
          type="date"
          value={selected ? selected.toISOString().split('T')[0] : ''}
          onChange={(e) => onChange && onChange(new Date(e.target.value))}
          {...props}
        />
      </div>
    );
  };
});

jest.mock('../../common/LoadingButton', () => {
  return function MockLoadingButton({ children, onClick, isLoading, ...props }: any) {
    return (
      <button 
        onClick={onClick} 
        disabled={isLoading}
        data-testid="loading-button"
        {...props}
      >
        {children}
      </button>
    );
  };
});

jest.mock('../../../store/shiftsSlice', () => ({
  addShift: jest.fn()
}));

jest.mock('../../../store/uiSlice', () => ({
  setModalOpen: jest.fn(),
  setSelectedShiftId: jest.fn(),
  addNotification: jest.fn()
}));

jest.mock('../../../services/NotificationService', () => ({
  notificationService: {
    checkShiftReminder: jest.fn()
  }
}));

describe('CopyShiftForm', () => {
  describe('basic import', () => {
    it('should import CopyShiftForm component without errors', async () => {
      const module = await import('../CopyShiftForm');
      expect(module).toBeDefined();
      expect(module.default).toBeDefined();
    });
  });

  describe('component structure', () => {
    it('should be a React functional component', async () => {
      const { default: CopyShiftForm } = await import('../CopyShiftForm');
      expect(typeof CopyShiftForm).toBe('function');
      expect(CopyShiftForm.length).toBe(0); // No props expected
    });
  });

  describe('mock dependencies', () => {
    it('should have all required mocks available', () => {
      // Verify Redux mocks are available
      const { useDispatch, useSelector } = require('react-redux');
      expect(typeof useDispatch).toBe('function');
      expect(typeof useSelector).toBe('function');
      
      // Verify router mock is available
      const { useNavigate } = require('react-router-dom');
      expect(typeof useNavigate).toBe('function');
    });

    it('should mock framer-motion components', () => {
      const { motion, AnimatePresence } = require('framer-motion');
      expect(motion.div).toBeDefined();
      expect(AnimatePresence).toBeDefined();
    });
  });

  describe('component functionality', () => {
    it('should have proper default export', async () => {
      const module = await import('../CopyShiftForm');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });

    it('should be compatible with React component props', async () => {
      const { default: CopyShiftForm } = await import('../CopyShiftForm');
      
      // Should not require any props
      expect(() => {
        React.createElement(CopyShiftForm);
      }).not.toThrow();
    });
  });

  describe('utility functions - starting extraction', () => {
    it('should test formatDate function', async () => {
      const { formatDate } = await import('../CopyShiftForm');
      
      // Test basic date formatting
      const testDate = new Date(2024, 0, 15); // January 15, 2024
      expect(formatDate(testDate)).toBe('2024-01-15');
      
      // Test month padding
      const singleDigitMonth = new Date(2024, 8, 5); // September 5, 2024
      expect(formatDate(singleDigitMonth)).toBe('2024-09-05');
      
      // Test day padding
      const singleDigitDay = new Date(2024, 11, 3); // December 3, 2024
      expect(formatDate(singleDigitDay)).toBe('2024-12-03');
      
      // Test year boundary
      const newYear = new Date(2025, 0, 1); // January 1, 2025
      expect(formatDate(newYear)).toBe('2025-01-01');
    });

    it('should test getDayName function', async () => {
      const { getDayName } = await import('../CopyShiftForm');
      
      // Test all days of the week
      expect(getDayName(0)).toBe('Sun');
      expect(getDayName(1)).toBe('Mon');
      expect(getDayName(2)).toBe('Tue');
      expect(getDayName(3)).toBe('Wed');
      expect(getDayName(4)).toBe('Thu');
      expect(getDayName(5)).toBe('Fri');
      expect(getDayName(6)).toBe('Sat');
    });

    it('should test validateCopyMode function', async () => {
      const { validateCopyMode } = await import('../CopyShiftForm');
      
      // Test valid modes
      expect(validateCopyMode('single')).toBe(true);
      expect(validateCopyMode('multiple')).toBe(true);
      expect(validateCopyMode('recurring')).toBe(true);
      
      // Test invalid modes
      expect(validateCopyMode('invalid')).toBe(false);
      expect(validateCopyMode('')).toBe(false);
      expect(validateCopyMode('SINGLE')).toBe(false); // Case sensitive
    });

    it('should test shouldFilterDate function', async () => {
      const { shouldFilterDate } = await import('../CopyShiftForm');
      
      const testDate = new Date(2024, 0, 15); // January 15, 2024
      
      // Test matching date (should filter)
      expect(shouldFilterDate(testDate, '2024-01-15')).toBe(true);
      
      // Test non-matching date (should not filter)
      expect(shouldFilterDate(testDate, '2024-01-16')).toBe(false);
      expect(shouldFilterDate(testDate, '2024-02-15')).toBe(false);
    });

    it('should test validateShiftCopy function', async () => {
      const { validateShiftCopy } = await import('../CopyShiftForm');
      
      const mockShift = { id: '1', employeeName: 'John Doe' };
      const mockDates = [new Date(2024, 0, 15)];
      
      // Test valid shift copy
      const validResult = validateShiftCopy(mockShift, mockDates);
      expect(validResult).toEqual({ isValid: true });
      
      // Test missing original shift
      const noShiftResult = validateShiftCopy(null, mockDates);
      expect(noShiftResult).toEqual({
        isValid: false,
        error: 'Could not find the original shift to copy'
      });
      
      // Test no selected dates
      const noDatesResult = validateShiftCopy(mockShift, []);
      expect(noDatesResult).toEqual({
        isValid: false,
        error: 'Please select at least one date to copy the shift to'
      });
    });

    it('should test filterValidDates function', async () => {
      const { filterValidDates } = await import('../CopyShiftForm');
      
      const dates = [
        new Date(2024, 0, 15), // 2024-01-15
        new Date(2024, 0, 16), // 2024-01-16
        new Date(2024, 0, 17)  // 2024-01-17
      ];
      
      // Filter out the original shift date
      const filtered = filterValidDates(dates, '2024-01-16');
      expect(filtered).toHaveLength(2);
      expect(filtered[0]).toEqual(dates[0]); // 2024-01-15
      expect(filtered[1]).toEqual(dates[2]); // 2024-01-17
      
      // Test when no dates match
      const noMatch = filterValidDates(dates, '2024-01-20');
      expect(noMatch).toHaveLength(3);
      expect(noMatch).toEqual(dates);
    });

    it('should test generateShiftId function', async () => {
      const { generateShiftId } = await import('../CopyShiftForm');
      
      // Mock Date.now for predictable testing
      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);
      
      const id1 = generateShiftId();
      const id2 = generateShiftId();
      
      // Should start with timestamp
      expect(id1).toMatch(/^1234567890/);
      expect(id2).toMatch(/^1234567890/);
      
      // Should be different due to random component
      expect(id1).not.toBe(id2);
      
      // Should have expected length (timestamp + random string)
      expect(id1.length).toBeGreaterThan(10);
      
      mockDateNow.mockRestore();
    });

    it('should test createCopiedShift function', async () => {
      const { createCopiedShift } = await import('../CopyShiftForm');
      
      const originalShift = {
        id: 'original-123',
        employeeName: 'John Doe',
        role: 'Manager',
        date: '2024-01-15',
        timeRange: '9:00 AM - 5:00 PM'
      };
      
      const newDate = new Date(2024, 0, 20); // January 20, 2024
      
      const copiedShift = createCopiedShift(originalShift, newDate);
      
      // Test that the date is updated correctly
      expect(copiedShift.date).toBe('2024-01-20');
      
      // Test that a new ID is generated (should be different from original)
      expect(copiedShift.id).not.toBe('original-123');
      expect(typeof copiedShift.id).toBe('string');
      expect(copiedShift.id.length).toBeGreaterThan(10);
      
      // Test that all other properties are preserved
      expect(copiedShift.employeeName).toBe('John Doe');
      expect(copiedShift.role).toBe('Manager');
      expect(copiedShift.timeRange).toBe('9:00 AM - 5:00 PM');
      
      // Test that the original shift is not mutated
      expect(originalShift.id).toBe('original-123');
      expect(originalShift.date).toBe('2024-01-15');
    });

    it('should test validateEmployeeDetails function', async () => {
      const { validateEmployeeDetails } = await import('../CopyShiftForm');
      
      const mockEmployees = [
        { id: '1', name: 'John Doe', role: 'Manager' },
        { id: '2', name: 'Jane Smith', role: 'Server' }
      ];
      
      // Test valid employee and role
      const validShift = { employeeName: 'John Doe', role: 'Manager' };
      const validResult = validateEmployeeDetails(validShift, mockEmployees);
      expect(validResult).toEqual({ isValid: true });
      
      // Test non-existent employee
      const invalidShift = { employeeName: 'Unknown Person', role: 'Manager' };
      const invalidResult = validateEmployeeDetails(invalidShift, mockEmployees);
      expect(invalidResult).toEqual({
        isValid: false,
        error: {
          message: 'Employee "Unknown Person" does not exist. Please add them in the Employees tab first.',
          type: 'error'
        }
      });
      
      // Test role mismatch
      const mismatchShift = { employeeName: 'John Doe', role: 'Server' };
      const mismatchResult = validateEmployeeDetails(mismatchShift, mockEmployees);
      expect(mismatchResult).toEqual({
        isValid: false,
        error: {
          message: 'Role mismatch: John Doe is a Manager, not a Server.',
          type: 'warning'
        }
      });
      
      // Test with empty employees list
      const emptyResult = validateEmployeeDetails(validShift, []);
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.error?.type).toBe('error');
    });
  });

  describe('recurring pattern and date logic', () => {
    it('should test toggleDayOfWeek function', async () => {
      const { toggleDayOfWeek } = await import('../CopyShiftForm');
      
      // Test adding a day
      const initialDays = [1, 3, 5]; // Mon, Wed, Fri
      const addedResult = toggleDayOfWeek(initialDays, 2); // Add Tuesday
      expect(addedResult).toEqual([1, 3, 5, 2]);
      
      // Test removing a day
      const removedResult = toggleDayOfWeek(initialDays, 3); // Remove Wednesday
      expect(removedResult).toEqual([1, 5]);
      
      // Test with empty array
      const emptyResult = toggleDayOfWeek([], 0); // Add Sunday
      expect(emptyResult).toEqual([0]);
      
      // Test original array is not mutated
      expect(initialDays).toEqual([1, 3, 5]);
    });

    it('should test calculateDayDifference function', async () => {
      const { calculateDayDifference } = await import('../CopyShiftForm');
      
      // Test same day
      expect(calculateDayDifference(3, 3)).toBe(0); // Wed to Wed
      
      // Test later in the week
      expect(calculateDayDifference(5, 2)).toBe(3); // Tue to Fri (3 days)
      
      // Test earlier in the week (next week)
      expect(calculateDayDifference(1, 5)).toBe(3); // Fri to Mon next week (3 days)
      
      // Test Sunday wrap-around
      expect(calculateDayDifference(0, 6)).toBe(1); // Sat to Sun (1 day)
      expect(calculateDayDifference(6, 0)).toBe(6); // Sun to Sat next week (6 days)
    });

    it('should test generateWeeklyPattern function', async () => {
      const { generateWeeklyPattern } = await import('../CopyShiftForm');
      
      const startDate = new Date(2024, 0, 15); // Monday, January 15, 2024
      const daysOfWeek = [1, 3, 5]; // Mon, Wed, Fri
      const numWeeks = 2;
      const originalShiftDate = '2024-01-17'; // Wednesday to exclude
      
      const result = generateWeeklyPattern(startDate, daysOfWeek, numWeeks, originalShiftDate);
      
      // Should generate dates but exclude the original shift date
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(6); // Less than 6 because one is excluded
      
      // Verify no date matches the original shift date
      result.forEach(date => {
        expect(date.toISOString().split('T')[0]).not.toBe('2024-01-17');
      });
      
      // Test with empty days (should default to tomorrow's day)
      const defaultResult = generateWeeklyPattern(startDate, [], 1, '');
      expect(defaultResult.length).toBe(1);
    });

    it('should test generateDailyPattern function', async () => {
      const { generateDailyPattern } = await import('../CopyShiftForm');
      
      const startDate = new Date(2024, 0, 15); // January 15, 2024
      const numDays = 5;
      const originalShiftDate = '2024-01-17'; // Exclude this date
      
      const result = generateDailyPattern(startDate, numDays, originalShiftDate);
      
      // Should generate 4 dates (5 days minus 1 excluded)
      expect(result.length).toBe(4);
      
      // Verify no date matches the original shift date
      result.forEach(date => {
        expect(date.toISOString().split('T')[0]).not.toBe('2024-01-17');
      });
      
      // Test with no exclusions
      const noExclusionResult = generateDailyPattern(startDate, 3, '');
      expect(noExclusionResult.length).toBe(3);
    });

    it('should test sortAndValidateDates function', async () => {
      const { sortAndValidateDates } = await import('../CopyShiftForm');
      
      const dates = [
        new Date(2024, 0, 20), // January 20
        new Date(2024, 0, 15), // January 15
        new Date(2024, 0, 18)  // January 18
      ];
      
      const sorted = sortAndValidateDates(dates);
      
      // Should be sorted chronologically
      expect(sorted[0]).toEqual(new Date(2024, 0, 15)); // January 15
      expect(sorted[1]).toEqual(new Date(2024, 0, 18)); // January 18
      expect(sorted[2]).toEqual(new Date(2024, 0, 20)); // January 20
      
      // Original array should not be mutated
      expect(dates[0]).toEqual(new Date(2024, 0, 20));
    });

    it('should test generateRecurringPattern function', async () => {
      const { generateRecurringPattern } = await import('../CopyShiftForm');
      
      // Use jest.useFakeTimers for predictable Date.now()
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 15, 12, 0, 0)); // January 15, 2024, noon
      
      // Test weekly pattern
      const weeklyResult = generateRecurringPattern('weekly', 2, [1, 3], '2024-01-17');
      expect(weeklyResult.length).toBeGreaterThan(0);
      
      // Test daily pattern
      const dailyResult = generateRecurringPattern('daily', 5, [], '2024-01-17');
      expect(dailyResult.length).toBe(4); // 5 days minus 1 excluded
      
      // Results should be sorted
      for (let i = 1; i < dailyResult.length; i++) {
        expect(dailyResult[i].getTime()).toBeGreaterThan(dailyResult[i-1].getTime());
      }
      
      jest.useRealTimers();
    });
  });

  describe('notification and validation logic', () => {
    it('should test createPatternNotification function', async () => {
      const { createPatternNotification } = await import('../CopyShiftForm');
      
      // Test success notification
      const successResult = createPatternNotification(5);
      expect(successResult).toEqual({
        message: 'Generated 5 dates for recurring pattern',
        type: 'success'
      });
      
      // Test warning notification
      const warningResult = createPatternNotification(0);
      expect(warningResult).toEqual({
        message: 'No valid dates generated. Please check your pattern.',
        type: 'warning'
      });
    });

    it('should test validateFormSubmission function', async () => {
      const { validateFormSubmission } = await import('../CopyShiftForm');
      
      const mockShift = { id: '1', employeeName: 'John Doe' };
      const mockDates = [new Date(2024, 0, 15)];
      
      // Test valid submission
      const validResult = validateFormSubmission(mockShift, mockDates);
      expect(validResult).toEqual({ isValid: true });
      
      // Test missing shift
      const noShiftResult = validateFormSubmission(null, mockDates);
      expect(noShiftResult).toEqual({
        isValid: false,
        errorNotification: {
          message: 'Error: Could not find the original shift to copy',
          type: 'error',
          category: 'general'
        }
      });
      
      // Test no dates
      const noDatesResult = validateFormSubmission(mockShift, []);
      expect(noDatesResult).toEqual({
        isValid: false,
        errorNotification: {
          message: 'Please select at least one date to copy the shift to',
          type: 'warning',
          category: 'general'
        }
      });
    });

    it('should test validateFilteredDates function', async () => {
      const { validateFilteredDates } = await import('../CopyShiftForm');
      
      const validDates = [new Date(2024, 0, 15), new Date(2024, 0, 16)];
      const emptyDates: Date[] = [];
      
      // Test valid filtered dates
      const validResult = validateFilteredDates(validDates);
      expect(validResult).toEqual({ isValid: true });
      
      // Test empty filtered dates
      const emptyResult = validateFilteredDates(emptyDates);
      expect(emptyResult).toEqual({
        isValid: false,
        errorNotification: {
          message: 'Cannot copy shift to its original date. Please select a different date.',
          type: 'warning',
          category: 'general'
        }
      });
    });

    it('should test validateRecurringOptions function', async () => {
      const { validateRecurringOptions } = await import('../CopyShiftForm');
      
      // Test valid options
      const validResult = validateRecurringOptions('weekly', 4, [1, 3, 5]);
      expect(validResult).toEqual({ isValid: true });
      
      // Test valid weekly with no days selected
      const validWeeklyResult = validateRecurringOptions('weekly', 2, []);
      expect(validWeeklyResult).toEqual({ isValid: true });
      
      // Test invalid occurrences (too low)
      const tooLowResult = validateRecurringOptions('daily', 0, []);
      expect(tooLowResult).toEqual({
        isValid: false,
        error: 'Occurrences must be between 1 and 12'
      });
      
      // Test invalid occurrences (too high)
      const tooHighResult = validateRecurringOptions('daily', 15, []);
      expect(tooHighResult).toEqual({
        isValid: false,
        error: 'Occurrences must be between 1 and 12'
      });
    });
  });

  describe('form submission and workflow logic', () => {
    it('should test createBatchShifts function', async () => {
      const { createBatchShifts } = await import('../CopyShiftForm');
      
      const originalShift = {
        id: 'original-123',
        employeeName: 'John Doe',
        role: 'Manager'
      };
      
      const dates = [
        new Date(2024, 0, 15),
        new Date(2024, 0, 16),
        new Date(2024, 0, 17)
      ];
      
      const batchShifts = createBatchShifts(originalShift, dates);
      
      expect(batchShifts).toHaveLength(3);
      expect(batchShifts[0].employeeName).toBe('John Doe');
      expect(batchShifts[1].role).toBe('Manager');
      expect(batchShifts[0].date).toBe('2024-01-15');
      expect(batchShifts[1].date).toBe('2024-01-16');
      expect(batchShifts[2].date).toBe('2024-01-17');
      
      // Each shift should have a unique ID
      const ids = batchShifts.map(shift => shift.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('should test createSuccessNotification function', async () => {
      const { createSuccessNotification } = await import('../CopyShiftForm');
      
      const singleResult = createSuccessNotification(1);
      expect(singleResult).toEqual({
        message: 'Successfully copied shift to 1 day(s)',
        type: 'success',
        category: 'general'
      });
      
      const multipleResult = createSuccessNotification(5);
      expect(multipleResult).toEqual({
        message: 'Successfully copied shift to 5 day(s)',
        type: 'success',
        category: 'general'
      });
    });

    it('should test getModalActions function', async () => {
      const { getModalActions } = await import('../CopyShiftForm');
      
      const actions = getModalActions();
      expect(actions).toEqual({
        modal: 'copyShift',
        isOpen: false
      });
    });

    it('should test getSubmissionDelays function', async () => {
      const { getSubmissionDelays } = await import('../CopyShiftForm');
      
      const delays = getSubmissionDelays();
      expect(delays).toEqual({
        submissionDelay: 800,
        batchDelay: 100
      });
      
      expect(typeof delays.submissionDelay).toBe('number');
      expect(typeof delays.batchDelay).toBe('number');
    });

    it('should test handleDateSelection function', async () => {
      const { handleDateSelection } = await import('../CopyShiftForm');
      
      const currentDates = [
        new Date(2024, 0, 15),
        new Date(2024, 0, 16)
      ];
      
      // Test adding a new date
      const addResult = handleDateSelection(currentDates, new Date(2024, 0, 17), '2024-01-20');
      expect(addResult.dates).toHaveLength(3);
      expect(addResult.shouldShowWarning).toBe(false);
      
      // Test removing an existing date
      const removeResult = handleDateSelection(currentDates, new Date(2024, 0, 15), '2024-01-20');
      expect(removeResult.dates).toHaveLength(1);
      expect(removeResult.dates[0].getTime()).toBe(new Date(2024, 0, 16).getTime());
      expect(removeResult.shouldShowWarning).toBe(false);
      
      // Test selecting original shift date (should show warning)
      const warningResult = handleDateSelection(currentDates, new Date(2024, 0, 20), '2024-01-20');
      expect(warningResult.dates).toEqual(currentDates);
      expect(warningResult.shouldShowWarning).toBe(true);
    });

    it('should test getFormStateDefaults function', async () => {
      const { getFormStateDefaults } = await import('../CopyShiftForm');
      
      const defaults = getFormStateDefaults();
      expect(defaults).toEqual({
        isSubmitting: false,
        selectedDates: [],
        copyMode: 'single',
        validationError: null,
        recurringOptions: {
          frequency: 'weekly',
          occurrences: 4,
          daysOfWeek: []
        }
      });
      
      // Test that it returns a new object each time
      const defaults2 = getFormStateDefaults();
      expect(defaults).not.toBe(defaults2);
      expect(defaults.selectedDates).not.toBe(defaults2.selectedDates);
    });

    it('should test complete form submission workflow', async () => {
      const {
        validateFormSubmission,
        filterValidDates,
        validateFilteredDates,
        validateEmployeeDetails,
        createBatchShifts,
        createSuccessNotification
      } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1', employeeName: 'John Doe', role: 'Manager' };
      const employees = [{ id: '1', name: 'John Doe', role: 'Manager' }];
      const selectedDates = [
        new Date(2024, 0, 15),
        new Date(2024, 0, 16),
        new Date(2024, 0, 17)
      ];
      
      // Step 1: Validate submission
      const submissionValidation = validateFormSubmission(originalShift, selectedDates);
      expect(submissionValidation.isValid).toBe(true);
      
      // Step 2: Filter dates (use the correct exported function)
      const filteredDates = filterValidDates(selectedDates, '2024-01-20');
      expect(filteredDates).toHaveLength(3); // None filtered out
      
      // Step 3: Validate filtered dates
      const filteredValidation = validateFilteredDates(filteredDates);
      expect(filteredValidation.isValid).toBe(true);
      
      // Step 4: Validate employee (use the correct exported function)
      const employeeValidation = validateEmployeeDetails(originalShift, employees);
      expect(employeeValidation.isValid).toBe(true);
      
      // Step 5: Create batch shifts
      const batchShifts = createBatchShifts(originalShift, filteredDates);
      expect(batchShifts).toHaveLength(3);
      
      // Step 6: Create success notification
      const successNotification = createSuccessNotification(batchShifts.length);
      expect(successNotification.type).toBe('success');
      expect(successNotification.message).toContain('3 day(s)');
    });
  });

  describe('integration and workflow tests', () => {
    it('should test complete recurring pattern workflow', async () => {
      const {
        validateRecurringOptions,
        generateRecurringPattern,
        createPatternNotification,
        sortAndValidateDates
      } = await import('../CopyShiftForm');
      
      // Step 1: Validate options
      const validation = validateRecurringOptions('weekly', 2, [1, 3, 5]);
      expect(validation.isValid).toBe(true);
      
      // Step 2: Generate pattern
      const dates = generateRecurringPattern('weekly', 2, [1, 3, 5], '2024-01-17');
      
      // Step 3: Create notification
      const notification = createPatternNotification(dates.length);
      expect(notification.type).toBe(dates.length > 0 ? 'success' : 'warning');
      
      // Step 4: Verify dates are sorted
      const sortedDates = sortAndValidateDates(dates);
      for (let i = 1; i < sortedDates.length; i++) {
        expect(sortedDates[i].getTime()).toBeGreaterThanOrEqual(sortedDates[i-1].getTime());
      }
    });

    it('should test error scenarios workflow', async () => {
      const {
        validateFormSubmission,
        validateEmployeeDetails,
        validateFilteredDates
      } = await import('../CopyShiftForm');
      
      // Test missing shift scenario
      const noShiftValidation = validateFormSubmission(null, [new Date()]);
      expect(noShiftValidation.isValid).toBe(false);
      expect(noShiftValidation.errorNotification?.type).toBe('error');
      
      // Test missing employee scenario
      const invalidShift = { employeeName: 'Unknown Person', role: 'Manager' };
      const employeeValidation = validateEmployeeDetails(invalidShift, []);
      expect(employeeValidation.isValid).toBe(false);
      expect(employeeValidation.error?.type).toBe('error');
      
      // Test no valid dates scenario
      const emptyDatesValidation = validateFilteredDates([]);
      expect(emptyDatesValidation.isValid).toBe(false);
      expect(emptyDatesValidation.errorNotification?.type).toBe('warning');
    });
  });

  describe('effect and modal management logic', () => {
    it('should test processSelectedDatesEffect function', async () => {
      const { processSelectedDatesEffect } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1', date: '2024-01-15' };
      const selectedDates = [
        new Date(2024, 0, 15), // Same as original
        new Date(2024, 0, 16),
        new Date(2024, 0, 17)
      ];
      
      // Test with filtering needed
      const result = processSelectedDatesEffect(originalShift, selectedDates);
      expect(result.shouldFilter).toBe(true);
      expect(result.filteredDates).toHaveLength(2);
      expect(result.filteredDates[0]).toEqual(new Date(2024, 0, 16));
      
      // Test with no original shift
      const noShiftResult = processSelectedDatesEffect(null, selectedDates);
      expect(noShiftResult.shouldFilter).toBe(false);
      expect(noShiftResult.filteredDates).toEqual(selectedDates);
      
      // Test with empty dates
      const emptyDatesResult = processSelectedDatesEffect(originalShift, []);
      expect(emptyDatesResult.shouldFilter).toBe(false);
      expect(emptyDatesResult.filteredDates).toEqual([]);
    });

    it('should test createModalCloseActions function', async () => {
      const { createModalCloseActions } = await import('../CopyShiftForm');
      
      const actions = createModalCloseActions();
      expect(actions).toEqual([
        { type: 'setModalOpen', payload: { modal: 'copyShift', isOpen: false } },
        { type: 'setSelectedShiftId', payload: null }
      ]);
      
      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('setModalOpen');
      expect(actions[1].type).toBe('setSelectedShiftId');
    });

    it('should test processFormSubmission function', async () => {
      const { processFormSubmission } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1', employeeName: 'John Doe', role: 'Manager', date: '2024-01-15' };
      const employees = [{ id: '1', name: 'John Doe', role: 'Manager' }];
      const selectedDates = [new Date(2024, 0, 16), new Date(2024, 0, 17)];
      
      // Test successful submission
      const result = processFormSubmission(originalShift, selectedDates, employees);
      expect(result.isValid).toBe(true);
      expect(result.processedData?.filteredDates).toHaveLength(2);
      expect(result.processedData?.newShifts).toHaveLength(2);
      
      // Test with invalid shift
      const invalidResult = processFormSubmission(null, selectedDates, employees);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errorNotification?.type).toBe('error');
      
      // Test with employee validation failure
      const invalidEmployeeResult = processFormSubmission(
        { ...originalShift, employeeName: 'Unknown' }, 
        selectedDates, 
        employees
      );
      expect(invalidEmployeeResult.isValid).toBe(false);
      expect(invalidEmployeeResult.errorNotification?.message).toContain('Unknown');
    });

    it('should test createBatchDispatchActions function', async () => {
      const { createBatchDispatchActions } = await import('../CopyShiftForm');
      
      const newShifts = [
        { id: '1', date: '2024-01-16' },
        { id: '2', date: '2024-01-17' }
      ];
      const delays = { submissionDelay: 800, batchDelay: 100 };
      
      const actions = createBatchDispatchActions(newShifts, delays);
      
      expect(actions).toHaveLength(3); // 2 shifts + 1 notification
      expect(actions[0].type).toBe('addShift');
      expect(actions[0].delay).toBe(800);
      expect(actions[1].type).toBe('addShift');
      expect(actions[1].delay).toBe(900);
      expect(actions[2].type).toBe('addNotification');
      expect(actions[2].delay).toBe(1000);
    });

    it('should test updateRecurringOptions function', async () => {
      const { updateRecurringOptions } = await import('../CopyShiftForm');
      
      const currentOptions = {
        frequency: 'weekly',
        occurrences: 4,
        daysOfWeek: [1, 3, 5]
      };
      
      // Test frequency update
      const frequencyResult = updateRecurringOptions(currentOptions, 'frequency', 'daily');
      expect(frequencyResult.frequency).toBe('daily');
      expect(frequencyResult.occurrences).toBe(4); // Unchanged
      
      // Test occurrences update
      const occurrencesResult = updateRecurringOptions(currentOptions, 'occurrences', '6');
      expect(occurrencesResult.occurrences).toBe(6);
      
      // Test invalid occurrences
      const invalidOccurrencesResult = updateRecurringOptions(currentOptions, 'occurrences', 'invalid');
      expect(invalidOccurrencesResult.occurrences).toBe(1); // Default
      
      // Test days of week update
      const daysResult = updateRecurringOptions(currentOptions, 'daysOfWeek', [0, 6]);
      expect(daysResult.daysOfWeek).toEqual([0, 6]);
      
      // Test invalid update type
      const invalidResult = updateRecurringOptions(currentOptions, 'invalid' as any, 'value');
      expect(invalidResult).toEqual(currentOptions);
    });
  });

  describe('UI styling and component logic', () => {
    it('should test getCopyModeButtonClass function', async () => {
      const { getCopyModeButtonClass } = await import('../CopyShiftForm');
      
      // Test active button
      const activeClass = getCopyModeButtonClass('single', 'single');
      expect(activeClass).toContain('bg-primary-500 text-white');
      expect(activeClass).toContain('px-3 py-2 rounded-md text-sm');
      
      // Test inactive button
      const inactiveClass = getCopyModeButtonClass('single', 'multiple');
      expect(inactiveClass).toContain('bg-gray-200 dark:bg-dark-700');
      expect(inactiveClass).not.toContain('bg-primary-500');
      
      // Test with custom base class
      const customClass = getCopyModeButtonClass('single', 'single', 'custom-base');
      expect(customClass).toContain('custom-base');
      expect(customClass).toContain('bg-primary-500 text-white');
    });

    it('should test createDatePickerFilter function', async () => {
      const { createDatePickerFilter } = await import('../CopyShiftForm');
      
      // Test with original shift date
      const filter = createDatePickerFilter('2024-01-15');
      expect(filter(new Date(2024, 0, 15))).toBe(false); // Should filter out
      expect(filter(new Date(2024, 0, 16))).toBe(true);  // Should allow
      
      // Test without original shift date
      const noDateFilter = createDatePickerFilter();
      expect(noDateFilter(new Date(2024, 0, 15))).toBe(true);
      
      // Test with undefined
      const undefinedFilter = createDatePickerFilter(undefined);
      expect(undefinedFilter(new Date(2024, 0, 15))).toBe(true);
    });

    it('should test processMultipleDateChange function', async () => {
      const { processMultipleDateChange } = await import('../CopyShiftForm');
      
      const currentDates = [new Date(2024, 0, 15), new Date(2024, 0, 16)];
      
      // Test adding new date
      const addResult = processMultipleDateChange(new Date(2024, 0, 17), currentDates);
      expect(addResult.updatedDates).toHaveLength(3);
      expect(addResult.shouldShowWarning).toBe(false);
      
      // Test removing existing date
      const removeResult = processMultipleDateChange(new Date(2024, 0, 15), currentDates);
      expect(removeResult.updatedDates).toHaveLength(1);
      expect(removeResult.shouldShowWarning).toBe(false);
      
      // Test selecting original shift date
      const warningResult = processMultipleDateChange(new Date(2024, 0, 20), currentDates, '2024-01-20');
      expect(warningResult.updatedDates).toEqual(currentDates);
      expect(warningResult.shouldShowWarning).toBe(true);
      expect(warningResult.warningMessage).toBe('Cannot copy to the original shift date');
    });

    it('should test getRecurringFrequencyClass function', async () => {
      const { getRecurringFrequencyClass } = await import('../CopyShiftForm');
      
      // Test active frequency
      const activeClass = getRecurringFrequencyClass('weekly', 'weekly');
      expect(activeClass).toContain('bg-primary-500 text-white');
      
      // Test inactive frequency
      const inactiveClass = getRecurringFrequencyClass('weekly', 'daily');
      expect(inactiveClass).toContain('bg-gray-200 dark:bg-dark-700');
      
      // Verify base class is always included
      expect(activeClass).toContain('px-3 py-2 rounded-md text-sm');
      expect(inactiveClass).toContain('px-3 py-2 rounded-md text-sm');
    });

    it('should test getDayOfWeekButtonClass function', async () => {
      const { getDayOfWeekButtonClass } = await import('../CopyShiftForm');
      
      const selectedDays = [1, 3, 5]; // Mon, Wed, Fri
      
      // Test selected day
      const selectedClass = getDayOfWeekButtonClass(selectedDays, 1);
      expect(selectedClass).toContain('bg-primary-500 text-white');
      
      // Test unselected day
      const unselectedClass = getDayOfWeekButtonClass(selectedDays, 2);
      expect(unselectedClass).toContain('bg-gray-200 dark:bg-dark-700');
      
      // Verify base class
      expect(selectedClass).toContain('px-2 py-2 rounded-md text-xs font-medium');
      expect(unselectedClass).toContain('px-2 py-2 rounded-md text-xs font-medium');
    });
  });

  describe('data management and utility logic', () => {
    it('should test findOriginalShift function', async () => {
      const { findOriginalShift } = await import('../CopyShiftForm');
      
      const shifts = [
        { id: '1', employeeName: 'John' },
        { id: '2', employeeName: 'Jane' },
        { id: '3', employeeName: 'Bob' }
      ];
      
      // Test finding existing shift
      const found = findOriginalShift(shifts, '2');
      expect(found).toEqual({ id: '2', employeeName: 'Jane' });
      
      // Test with non-existent ID
      const notFound = findOriginalShift(shifts, '999');
      expect(notFound).toBeUndefined();
      
      // Test with null ID
      const nullResult = findOriginalShift(shifts, null);
      expect(nullResult).toBeUndefined();
      
      // Test with empty shifts array
      const emptyResult = findOriginalShift([], '1');
      expect(emptyResult).toBeUndefined();
    });

    it('should test getFormResetState function', async () => {
      const { getFormResetState } = await import('../CopyShiftForm');
      
      const resetState = getFormResetState();
      expect(resetState).toEqual({
        isSubmitting: false,
        selectedDates: [],
        validationError: null
      });
      
      // Test that it returns a new object each time
      const resetState2 = getFormResetState();
      expect(resetState).not.toBe(resetState2);
      expect(resetState.selectedDates).not.toBe(resetState2.selectedDates);
    });

    it('should test createValidationError function', async () => {
      const { createValidationError } = await import('../CopyShiftForm');
      
      const errorResult = createValidationError('Test error message', 'error');
      expect(errorResult).toEqual({
        message: 'Test error message',
        type: 'error'
      });
      
      const warningResult = createValidationError('Test warning', 'warning');
      expect(warningResult).toEqual({
        message: 'Test warning',
        type: 'warning'
      });
    });

    it('should test shouldSkipDate function', async () => {
      const { shouldSkipDate } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1', date: '2024-01-15' };
      const testDate = new Date(2024, 0, 15);
      const differentDate = new Date(2024, 0, 16);
      
      // Test date that should be skipped
      const skipResult = shouldSkipDate(testDate, originalShift);
      expect(skipResult.shouldSkip).toBe(true);
      expect(skipResult.reason).toContain('matches original shift date');
      
      // Test date that should not be skipped
      const noSkipResult = shouldSkipDate(differentDate, originalShift);
      expect(noSkipResult.shouldSkip).toBe(false);
      expect(noSkipResult.reason).toBeUndefined();
      
      // Test with no original shift
      const noShiftResult = shouldSkipDate(testDate, null);
      expect(noShiftResult.shouldSkip).toBe(false);
    });
  });

  describe('logging and debugging helpers', () => {
    it('should test createPatternLog function', async () => {
      const { createPatternLog } = await import('../CopyShiftForm');
      
      // Test weekly pattern
      const weeklyLog = createPatternLog('weekly', 3, [1, 3, 5]);
      expect(weeklyLog).toBe('Weekly pattern with 3 weeks for days: Mon, Wed, Fri');
      
      // Test daily pattern
      const dailyLog = createPatternLog('daily', 5, []);
      expect(dailyLog).toBe('Daily pattern with 5 days');
      
      // Test weekly with empty days
      const weeklyEmptyLog = createPatternLog('weekly', 2, []);
      expect(weeklyEmptyLog).toBe('Weekly pattern with 2 weeks for days: ');
    });

    it('should test createDateGenerationLog function', async () => {
      const { createDateGenerationLog } = await import('../CopyShiftForm');
      
      const testDate = new Date(2024, 0, 15); // Monday, January 15, 2024
      const log = createDateGenerationLog(1, 1, testDate);
      
      expect(log).toContain('Generated date for week 1, day Mon:');
      expect(log).toContain('1/15/2024');
      expect(log).toContain('(1)'); // Day of week
    });

    it('should test createPatternSummary function', async () => {
      const { createPatternSummary } = await import('../CopyShiftForm');
      
      const dates = [
        new Date(2024, 0, 15),
        new Date(2024, 0, 16),
        new Date(2024, 0, 17)
      ];
      
      const summary = createPatternSummary(dates);
      expect(summary).toContain('Generated 3 dates in total:');
      expect(summary).toContain('1/15/2024');
      expect(summary).toContain('1/16/2024');
      expect(summary).toContain('1/17/2024');
      
      // Test empty dates
      const emptySummary = createPatternSummary([]);
      expect(emptySummary).toBe('Generated 0 dates in total: ');
    });

    it('should test createShiftWithLogging function', async () => {
      const { createShiftWithLogging } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1', employeeName: 'John', role: 'Manager' };
      const testDate = new Date(2024, 0, 15);
      
      const result = createShiftWithLogging(originalShift, testDate);
      
      expect(result.shift.employeeName).toBe('John');
      expect(result.shift.date).toBe('2024-01-15');
      expect(result.shift.id).not.toBe('1'); // Should have new ID
      expect(result.logMessage).toContain('Creating shift for date:');
      expect(result.logMessage).toContain('1/15/2024');
      expect(result.logMessage).toContain('formatted as: 2024-01-15');
    });

    it('should test createShiftDispatchLog function', async () => {
      const { createShiftDispatchLog } = await import('../CopyShiftForm');
      
      const shift = { id: '1', date: '2024-01-15', employeeName: 'John' };
      const log = createShiftDispatchLog(shift);
      
      expect(log).toBe('Adding shift with date: 2024-01-15');
    });
  });

  describe('advanced event handling and async operations', () => {
    it('should test processEventFormSubmission function', async () => {
      const { processEventFormSubmission } = await import('../CopyShiftForm');
      
      const mockEvent = { preventDefault: jest.fn() } as any;
      const originalShift = { id: '1', employeeName: 'John Doe', role: 'Manager', date: '2024-01-15' };
      const employees = [{ id: '1', name: 'John Doe', role: 'Manager' }];
      const selectedDates = [new Date(2024, 0, 16)];
      const setValidationError = jest.fn();
      const setIsSubmitting = jest.fn();
      
      // Test successful submission
      const successResult = processEventFormSubmission(
        mockEvent, originalShift, selectedDates, employees, setValidationError, setIsSubmitting
      );
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(successResult.shouldContinue).toBe(true);
      expect(successResult.processedData).toBeDefined();
      expect(setIsSubmitting).toHaveBeenCalledWith(true);
      
      // Test failed submission with employee error
      const invalidShift = { ...originalShift, employeeName: 'Unknown' };
      const failResult = processEventFormSubmission(
        mockEvent, invalidShift, selectedDates, employees, setValidationError, setIsSubmitting
      );
      
      expect(failResult.shouldContinue).toBe(false);
      expect(setValidationError).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Unknown'),
        type: 'error'
      }));
    });

    it('should test executeAsyncShiftCreation function', async () => {
      const { executeAsyncShiftCreation } = await import('../CopyShiftForm');
      
      const newShifts = [
        { id: '1', date: '2024-01-16' },
        { id: '2', date: '2024-01-17' },
        { id: '3', date: '2024-01-18' }
      ];
      const delays = { submissionDelay: 800, batchDelay: 100 };
      
      const result = executeAsyncShiftCreation(newShifts, delays);
      
      expect(result.dispatchPlan).toHaveLength(5); // 3 shifts + 1 notification + 1 cleanup
      expect(result.dispatchPlan[0]).toEqual({
        action: 'addShift',
        shift: newShifts[0],
        delay: 800
      });
      expect(result.dispatchPlan[1]).toEqual({
        action: 'addShift',
        shift: newShifts[1],
        delay: 900
      });
      expect(result.dispatchPlan[3]).toEqual({
        action: 'addNotification',
        delay: 1100
      });
      expect(result.dispatchPlan[4]).toEqual({
        action: 'cleanup',
        delay: 1150
      });
      expect(result.totalDuration).toBe(1150);
    });

    it('should test createDateRemovalHandler function', async () => {
      const { createDateRemovalHandler } = await import('../CopyShiftForm');
      
      const selectedDates = [
        new Date(2024, 0, 15),
        new Date(2024, 0, 16),
        new Date(2024, 0, 17)
      ];
      const setSelectedDates = jest.fn();
      
      const removalHandler = createDateRemovalHandler(selectedDates, setSelectedDates);
      
      // Test removing middle item
      removalHandler(1);
      expect(setSelectedDates).toHaveBeenCalledWith([
        new Date(2024, 0, 15),
        new Date(2024, 0, 17)
      ]);
      
      // Test removing first item
      removalHandler(0);
      expect(setSelectedDates).toHaveBeenCalledWith([
        new Date(2024, 0, 16),
        new Date(2024, 0, 17)
      ]);
    });

    it('should test processRecurringPatternGeneration function', async () => {
      const { processRecurringPatternGeneration } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1', date: '2024-01-15' };
      const recurringOptions = {
        frequency: 'weekly',
        occurrences: 2,
        daysOfWeek: [1, 3, 5]
      };
      const setSelectedDates = jest.fn();
      
      // Test successful generation
      const result = processRecurringPatternGeneration(originalShift, recurringOptions, setSelectedDates);
      
      expect(result.wasExecuted).toBe(true);
      expect(result.generatedDates).toBeDefined();
      expect(result.notificationData).toEqual({
        message: expect.stringContaining('Generated'),
        type: expect.stringMatching(/success|warning/),
        category: 'general'
      });
      expect(setSelectedDates).toHaveBeenCalled();
      
      // Test with no original shift
      const noShiftResult = processRecurringPatternGeneration(null, recurringOptions, setSelectedDates);
      expect(noShiftResult.wasExecuted).toBe(false);
      expect(noShiftResult.generatedDates).toBeUndefined();
    });
  });

  describe('conditional rendering and UI logic', () => {
    it('should test shouldShowErrorMessage function', async () => {
      const { shouldShowErrorMessage } = await import('../CopyShiftForm');
      
      expect(shouldShowErrorMessage(null)).toBe(true);
      expect(shouldShowErrorMessage(undefined)).toBe(true);
      expect(shouldShowErrorMessage({ id: '1' })).toBe(false);
      expect(shouldShowErrorMessage({ id: '1', employeeName: 'John' })).toBe(false);
    });

    it('should test getCopyModeContent function', async () => {
      const { getCopyModeContent } = await import('../CopyShiftForm');
      
      const selectedDates = [new Date(2024, 0, 15)];
      const originalShift = { id: '1', date: '2024-01-10' };
      
      // Test single mode
      const singleResult = getCopyModeContent('single', selectedDates, originalShift);
      expect(singleResult).toEqual({
        shouldShowSingle: true,
        shouldShowMultiple: false,
        shouldShowRecurring: false,
        datePickerProps: expect.objectContaining({
          filterDate: expect.any(Function),
          selected: selectedDates[0]
        })
      });
      
      // Test multiple mode
      const multipleResult = getCopyModeContent('multiple', selectedDates, originalShift);
      expect(multipleResult.shouldShowMultiple).toBe(true);
      expect(multipleResult.shouldShowSingle).toBe(false);
      expect(multipleResult.datePickerProps?.selected).toEqual(expect.any(Date));
      
      // Test recurring mode
      const recurringResult = getCopyModeContent('recurring', selectedDates, originalShift);
      expect(recurringResult.shouldShowRecurring).toBe(true);
      
      // Test with no original shift
      const noShiftResult = getCopyModeContent('single', selectedDates, null);
      expect(noShiftResult.datePickerProps).toBeUndefined();
    });

    it('should test getDateSelectionInfo function', async () => {
      const { getDateSelectionInfo } = await import('../CopyShiftForm');
      
      // Test with multiple dates
      const multipleDates = [new Date(2024, 0, 15), new Date(2024, 0, 16)];
      const multipleResult = getDateSelectionInfo(multipleDates);
      expect(multipleResult).toEqual({
        count: 2,
        displayText: 'Selected Dates (2):',
        hasSelections: true
      });
      
      // Test with single date
      const singleDate = [new Date(2024, 0, 15)];
      const singleResult = getDateSelectionInfo(singleDate);
      expect(singleResult).toEqual({
        count: 1,
        displayText: 'Selected Dates (1):',
        hasSelections: true
      });
      
      // Test with no dates
      const emptyResult = getDateSelectionInfo([]);
      expect(emptyResult).toEqual({
        count: 0,
        displayText: 'Selected Dates (0):',
        hasSelections: false
      });
    });

    it('should test getSubmitButtonConfig function', async () => {
      const { getSubmitButtonConfig } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1' };
      const selectedDates = [new Date(2024, 0, 15), new Date(2024, 0, 16)];
      
      // Test normal state
      const normalResult = getSubmitButtonConfig(originalShift, selectedDates, false);
      expect(normalResult).toEqual({
        shouldShow: true,
        isDisabled: false,
        buttonText: 'Copy Shift to 2 Dates',
        className: 'w-full'
      });
      
      // Test single date
      const singleResult = getSubmitButtonConfig(originalShift, [selectedDates[0]], false);
      expect(singleResult.buttonText).toBe('Copy Shift to 1 Date');
      
      // Test submitting state
      const submittingResult = getSubmitButtonConfig(originalShift, selectedDates, true);
      expect(submittingResult.isDisabled).toBe(true);
      
      // Test no dates
      const noDatesResult = getSubmitButtonConfig(originalShift, [], false);
      expect(noDatesResult.isDisabled).toBe(true);
      
      // Test no original shift
      const noShiftResult = getSubmitButtonConfig(null, selectedDates, false);
      expect(noShiftResult).toEqual({
        shouldShow: false,
        isDisabled: true,
        buttonText: '',
        className: ''
      });
    });

    it('should test shouldDisplayValidationError function', async () => {
      const { shouldDisplayValidationError } = await import('../CopyShiftForm');
      
      // Test with error
      const errorResult = shouldDisplayValidationError({
        message: 'Test error message',
        type: 'error'
      });
      expect(errorResult).toEqual({
        shouldShow: true,
        errorClass: 'text-red-600 bg-red-50 border-red-200',
        message: 'Test error message'
      });
      
      // Test with warning
      const warningResult = shouldDisplayValidationError({
        message: 'Test warning message',
        type: 'warning'
      });
      expect(warningResult).toEqual({
        shouldShow: true,
        errorClass: 'text-yellow-700 bg-yellow-50 border-yellow-200',
        message: 'Test warning message'
      });
      
      // Test with no error
      const noErrorResult = shouldDisplayValidationError(null);
      expect(noErrorResult).toEqual({
        shouldShow: false,
        errorClass: '',
        message: ''
      });
    });
  });

  describe('state management and event handlers', () => {
    it('should test handleRecurringFrequencyChange function', async () => {
      const { handleRecurringFrequencyChange } = await import('../CopyShiftForm');
      
      const currentOptions = {
        frequency: 'weekly',
        occurrences: 4,
        daysOfWeek: [1, 3, 5]
      };
      const setRecurringOptions = jest.fn();
      
      handleRecurringFrequencyChange(currentOptions, 'daily', setRecurringOptions);
      
      expect(setRecurringOptions).toHaveBeenCalledWith({
        frequency: 'daily',
        occurrences: 4,
        daysOfWeek: [1, 3, 5]
      });
    });

    it('should test handleRecurringOccurrencesChange function', async () => {
      const { handleRecurringOccurrencesChange } = await import('../CopyShiftForm');
      
      const currentOptions = {
        frequency: 'weekly',
        occurrences: 4,
        daysOfWeek: [1, 3, 5]
      };
      const setRecurringOptions = jest.fn();
      
      handleRecurringOccurrencesChange(currentOptions, '8', setRecurringOptions);
      
      expect(setRecurringOptions).toHaveBeenCalledWith({
        frequency: 'weekly',
        occurrences: 8,
        daysOfWeek: [1, 3, 5]
      });
    });

    it('should test processDayOfWeekToggle function', async () => {
      const { processDayOfWeekToggle } = await import('../CopyShiftForm');
      
      const currentOptions = {
        frequency: 'weekly',
        occurrences: 4,
        daysOfWeek: [1, 3, 5]
      };
      const setRecurringOptions = jest.fn();
      
      // Test adding a day
      const addResult = processDayOfWeekToggle(2, currentOptions, setRecurringOptions);
      expect(addResult.wasAdded).toBe(true);
      expect(addResult.updatedDays).toEqual([1, 3, 5, 2]);
      expect(setRecurringOptions).toHaveBeenCalledWith({
        ...currentOptions,
        daysOfWeek: [1, 3, 5, 2]
      });
      
      // Test removing a day
      const removeResult = processDayOfWeekToggle(3, currentOptions, setRecurringOptions);
      expect(removeResult.wasAdded).toBe(false);
      expect(removeResult.updatedDays).toEqual([1, 5]);
    });
  });

  describe('configuration and display logic', () => {
    it('should test getModalAnimationConfig function', async () => {
      const { getModalAnimationConfig } = await import('../CopyShiftForm');
      
      const config = getModalAnimationConfig();
      expect(config).toEqual({
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.2 }
      });
    });

    it('should test getModalStylingConfig function', async () => {
      const { getModalStylingConfig } = await import('../CopyShiftForm');
      
      const config = getModalStylingConfig();
      expect(config).toEqual({
        overlayClass: 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4',
        modalClass: 'bg-white dark:bg-dark-800 rounded-xl shadow-xl overflow-hidden w-full max-w-[95vw] sm:max-w-lg mx-auto max-h-[85vh] flex flex-col',
        contentClass: 'p-4 sm:p-6 flex-1 overflow-y-auto',
        footerClass: 'border-t border-gray-200 dark:border-dark-600 p-4 bg-white dark:bg-dark-800'
      });
    });

    it('should test getCloseButtonConfig function', async () => {
      const { getCloseButtonConfig } = await import('../CopyShiftForm');
      
      const config = getCloseButtonConfig();
      expect(config).toEqual({
        className: 'float-right text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none',
        ariaLabel: 'Close',
        svgConfig: {
          className: 'w-5 h-5 sm:w-6 sm:h-6',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          pathD: 'M6 18L18 6M6 6l12 12'
        }
      });
    });

    it('should test getOriginalShiftDisplayConfig function', async () => {
      const { getOriginalShiftDisplayConfig } = await import('../CopyShiftForm');
      
      const originalShift = {
        employeeName: 'John Doe',
        role: 'Manager',
        date: '2024-01-15',
        timeRange: '9:00 AM - 5:00 PM'
      };
      
      const config = getOriginalShiftDisplayConfig(originalShift);
      expect(config).toEqual({
        employeeName: 'John Doe',
        role: 'Manager',
        formattedDate: expect.stringMatching(/\d{1,2}\/\d{1,2}\/\d{4}/),
        timeRange: '9:00 AM - 5:00 PM',
        displayConfig: {
          containerClass: 'bg-gray-100 dark:bg-dark-700 rounded-lg p-3 sm:p-4',
          layoutClass: 'flex flex-col sm:flex-row sm:justify-between gap-2',
          employeeClass: 'font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base',
          roleClass: 'text-xs sm:text-sm text-gray-600 dark:text-gray-400'
        }
      });
      
      // Test with null shift
      const nullResult = getOriginalShiftDisplayConfig(null);
      expect(nullResult).toBeNull();
    });

    it('should test getSelectedDatesDisplay function', async () => {
      const { getSelectedDatesDisplay } = await import('../CopyShiftForm');
      
      const selectedDates = [
        new Date(2024, 0, 15),
        new Date(2024, 0, 16)
      ];
      
      const display = getSelectedDatesDisplay(selectedDates);
      expect(display).toEqual({
        dates: [
          {
            index: 0,
            formattedDate: '1/15/2024',
            containerClass: 'bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded-md text-xs flex items-center',
            removeButtonClass: 'ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          },
          {
            index: 1,
            formattedDate: '1/16/2024',
            containerClass: 'bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded-md text-xs flex items-center',
            removeButtonClass: 'ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }
        ],
        hasMultipleDates: true,
        wrapperClass: 'flex flex-wrap gap-2'
      });
      
      // Test with single date
      const singleDisplay = getSelectedDatesDisplay([selectedDates[0]]);
      expect(singleDisplay.hasMultipleDates).toBe(false);
    });

    it('should test getDayOfWeekDisplayConfig function', async () => {
      const { getDayOfWeekDisplayConfig } = await import('../CopyShiftForm');
      
      const selectedDays = [1, 3, 5]; // Mon, Wed, Fri
      const config = getDayOfWeekDisplayConfig(selectedDays);
      
      expect(config).toHaveLength(7);
      expect(config[0]).toEqual({
        dayIndex: 0,
        dayName: 'Sun',
        isSelected: false,
        buttonClass: expect.stringContaining('bg-gray-200 dark:bg-dark-700')
      });
      expect(config[1]).toEqual({
        dayIndex: 1,
        dayName: 'Mon',
        isSelected: true,
        buttonClass: expect.stringContaining('bg-primary-500 text-white')
      });
      expect(config[3]).toEqual({
        dayIndex: 3,
        dayName: 'Wed',
        isSelected: true,
        buttonClass: expect.stringContaining('bg-primary-500 text-white')
      });
    });
  });

  describe('Round 5: Advanced inline handlers and complex JSX logic', () => {
    it('should test processMultipleDatePickerChange function', async () => {
      const { processMultipleDatePickerChange } = await import('../CopyShiftForm');
      
      const date = new Date(2024, 0, 20);
      const selectedDates = [new Date(2024, 0, 15), new Date(2024, 0, 16)];
      const originalShift = { id: '1', date: '2024-01-10' };
      const setSelectedDates = jest.fn();
      const dispatch = jest.fn();
      const addNotification = jest.fn();
      
      // Test adding new date
      const addResult = processMultipleDatePickerChange(
        date, selectedDates, originalShift, setSelectedDates, dispatch, addNotification
      );
      expect(addResult).toEqual({ wasProcessed: true, action: 'added' });
      expect(setSelectedDates).toHaveBeenCalledWith([...selectedDates, date]);
      
      // Test removing existing date
      const removeResult = processMultipleDatePickerChange(
        selectedDates[0], selectedDates, originalShift, setSelectedDates, dispatch, addNotification
      );
      expect(removeResult).toEqual({ wasProcessed: true, action: 'removed' });
      
      // Test blocked date (original shift date)
      const blockedDate = new Date(2024, 0, 10);
      const blockResult = processMultipleDatePickerChange(
        blockedDate, selectedDates, originalShift, setSelectedDates, dispatch, addNotification
      );
      expect(blockResult).toEqual({ wasProcessed: true, action: 'blocked' });
      expect(dispatch).toHaveBeenCalledWith(addNotification({
        message: 'Cannot copy to the original shift date',
        type: 'warning',
        category: 'general'
      }));
    });

    it('should test processDateRemovalClick function', async () => {
      const { processDateRemovalClick } = await import('../CopyShiftForm');
      
      const selectedDates = [
        new Date(2024, 0, 15),
        new Date(2024, 0, 16),
        new Date(2024, 0, 17)
      ];
      const setSelectedDates = jest.fn();
      
      const result = processDateRemovalClick(1, selectedDates, setSelectedDates);
      
      expect(result.removedDate).toEqual(new Date(2024, 0, 16));
      expect(result.newDates).toEqual([
        new Date(2024, 0, 15),
        new Date(2024, 0, 17)
      ]);
      expect(setSelectedDates).toHaveBeenCalledWith(result.newDates);
    });

    it('should test processCompleteRecurringPatternHandler function', async () => {
      const { processCompleteRecurringPatternHandler } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1', date: '2024-01-15' };
      const recurringOptions = {
        frequency: 'weekly',
        occurrences: 2,
        daysOfWeek: [1, 3, 5]
      };
      const setSelectedDates = jest.fn();
      const dispatch = jest.fn();
      const addNotification = jest.fn();
      
      // Test successful execution
      const result = processCompleteRecurringPatternHandler(
        originalShift, recurringOptions, setSelectedDates, dispatch, addNotification
      );
      
      expect(result.wasExecuted).toBe(true);
      expect(result.generatedDates).toBeDefined();
      expect(result.dispatchedNotification).toEqual({
        message: expect.stringContaining('Generated'),
        type: expect.stringMatching(/success|warning/),
        category: 'general'
      });
      expect(setSelectedDates).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(addNotification(result.dispatchedNotification));
      
      // Test with no original shift
      const noShiftResult = processCompleteRecurringPatternHandler(
        null, recurringOptions, setSelectedDates, dispatch, addNotification
      );
      expect(noShiftResult.wasExecuted).toBe(false);
    });

    it('should test processCopyModeChange function', async () => {
      const { processCopyModeChange } = await import('../CopyShiftForm');
      
      const setCopyMode = jest.fn();
      
      const result = processCopyModeChange('multiple', setCopyMode);
      
      expect(result).toEqual({
        previousMode: null,
        newMode: 'multiple'
      });
      expect(setCopyMode).toHaveBeenCalledWith('multiple');
    });

    it('should test processSingleDateChange function', async () => {
      const { processSingleDateChange } = await import('../CopyShiftForm');
      
      const date = new Date(2024, 0, 15);
      const setSelectedDates = jest.fn();
      
      const result = processSingleDateChange(date, setSelectedDates);
      
      expect(result).toEqual({
        selectedDate: date,
        formattedDate: '2024-01-15'
      });
      expect(setSelectedDates).toHaveBeenCalledWith([date]);
    });

    it('should test processRecurringFrequencyButtonClick function', async () => {
      const { processRecurringFrequencyButtonClick } = await import('../CopyShiftForm');
      
      const recurringOptions = {
        frequency: 'weekly',
        occurrences: 4,
        daysOfWeek: [1, 3, 5]
      };
      const setRecurringOptions = jest.fn();
      
      const result = processRecurringFrequencyButtonClick('daily', recurringOptions, setRecurringOptions);
      
      expect(result).toEqual({
        previousFrequency: 'weekly',
        newFrequency: 'daily'
      });
      expect(setRecurringOptions).toHaveBeenCalledWith({
        ...recurringOptions,
        frequency: 'daily'
      });
    });

    it('should test processRecurringOccurrencesInput function', async () => {
      const { processRecurringOccurrencesInput } = await import('../CopyShiftForm');
      
      const recurringOptions = {
        frequency: 'weekly',
        occurrences: 4,
        daysOfWeek: [1, 3, 5]
      };
      const setRecurringOptions = jest.fn();
      
      // Test valid input
      const validResult = processRecurringOccurrencesInput('6', recurringOptions, setRecurringOptions);
      expect(validResult).toEqual({
        previousOccurrences: 4,
        newOccurrences: 6,
        isValid: true
      });
      
      // Test invalid input
      const invalidResult = processRecurringOccurrencesInput('15', recurringOptions, setRecurringOptions);
      expect(invalidResult.isValid).toBe(false);
      
      // Test non-numeric input
      const nonNumericResult = processRecurringOccurrencesInput('abc', recurringOptions, setRecurringOptions);
      expect(nonNumericResult.newOccurrences).toBe(1);
    });
  });

  describe('Round 5: useEffect and conditional rendering logic', () => {
    it('should test shouldTriggerDatesEffect function', async () => {
      const { shouldTriggerDatesEffect } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1' };
      const selectedDates = [new Date(2024, 0, 15)];
      
      // Test should trigger
      const triggerResult = shouldTriggerDatesEffect(originalShift, selectedDates);
      expect(triggerResult).toEqual({ shouldTrigger: true });
      
      // Test no original shift
      const noShiftResult = shouldTriggerDatesEffect(null, selectedDates);
      expect(noShiftResult).toEqual({
        shouldTrigger: false,
        reason: 'No original shift'
      });
      
      // Test no selected dates
      const noDatesResult = shouldTriggerDatesEffect(originalShift, []);
      expect(noDatesResult).toEqual({
        shouldTrigger: false,
        reason: 'No selected dates'
      });
    });

    it('should test processUseEffectDatesFilter function', async () => {
      const { processUseEffectDatesFilter } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1', date: '2024-01-15' };
      const selectedDates = [
        new Date(2024, 0, 15), // Same as original
        new Date(2024, 0, 16),
        new Date(2024, 0, 17)
      ];
      const setSelectedDates = jest.fn();
      
      // Test filtering needed
      const filterResult = processUseEffectDatesFilter(originalShift, selectedDates, setSelectedDates);
      expect(filterResult).toEqual({
        shouldUpdate: true,
        filteredDates: [new Date(2024, 0, 16), new Date(2024, 0, 17)],
        removedCount: 1
      });
      expect(setSelectedDates).toHaveBeenCalled();
      
      // Test no filtering needed
      const noFilterDates = [new Date(2024, 0, 16), new Date(2024, 0, 17)];
      const noFilterResult = processUseEffectDatesFilter(originalShift, noFilterDates, setSelectedDates);
      expect(noFilterResult.shouldUpdate).toBe(false);
      
      // Test no original shift
      const noShiftResult = processUseEffectDatesFilter(null, selectedDates, setSelectedDates);
      expect(noShiftResult.shouldUpdate).toBe(false);
    });

    it('should test getFormSectionVisibility function', async () => {
      const { getFormSectionVisibility } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1' };
      
      // Test single mode
      const singleResult = getFormSectionVisibility(originalShift, 'single');
      expect(singleResult).toEqual({
        showForm: true,
        showSingleDatePicker: true,
        showMultipleDatePicker: false,
        showRecurringOptions: false,
        showSelectedDatesDisplay: false
      });
      
      // Test multiple mode
      const multipleResult = getFormSectionVisibility(originalShift, 'multiple');
      expect(multipleResult.showMultipleDatePicker).toBe(true);
      expect(multipleResult.showSelectedDatesDisplay).toBe(true);
      
      // Test recurring mode
      const recurringResult = getFormSectionVisibility(originalShift, 'recurring');
      expect(recurringResult.showRecurringOptions).toBe(true);
      
      // Test no original shift
      const noShiftResult = getFormSectionVisibility(null, 'single');
      expect(noShiftResult.showForm).toBe(false);
      expect(noShiftResult.showSingleDatePicker).toBe(false);
    });

    it('should test getDayOfWeekButtonGrid function', async () => {
      const { getDayOfWeekButtonGrid } = await import('../CopyShiftForm');
      
      const recurringOptions = { daysOfWeek: [1, 3, 5] };
      const handleDayOfWeekToggle = jest.fn();
      
      const grid = getDayOfWeekButtonGrid(recurringOptions, handleDayOfWeekToggle);
      
      expect(grid).toHaveLength(7);
      expect(grid[0]).toEqual({
        dayIndex: 0,
        dayName: 'Sun',
        isSelected: false,
        onClick: expect.any(Function),
        className: expect.stringContaining('bg-gray-200')
      });
      expect(grid[1]).toEqual({
        dayIndex: 1,
        dayName: 'Mon',
        isSelected: true,
        onClick: expect.any(Function),
        className: expect.stringContaining('bg-primary-500')
      });
      
      // Test onClick calls
      grid[2].onClick();
      expect(handleDayOfWeekToggle).toHaveBeenCalledWith(2);
    });

    it('should test getRecurringValidationDisplay function', async () => {
      const { getRecurringValidationDisplay } = await import('../CopyShiftForm');
      
      // Test valid options
      const validOptions = { frequency: 'weekly', occurrences: 4, daysOfWeek: [1, 3, 5] };
      const validResult = getRecurringValidationDisplay(validOptions);
      expect(validResult).toEqual({
        isValid: true,
        validationMessage: undefined,
        showWarning: false,
        warningClass: 'text-yellow-600 text-sm mt-1'
      });
      
      // Test invalid options
      const invalidOptions = { frequency: 'weekly', occurrences: 15, daysOfWeek: [] };
      const invalidResult = getRecurringValidationDisplay(invalidOptions);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.showWarning).toBe(true);
      expect(invalidResult.validationMessage).toBeDefined();
    });
  });

  describe('Round 5: Complex UI configuration systems', () => {
    it('should test getFooterConditionalConfig function', async () => {
      const { getFooterConditionalConfig } = await import('../CopyShiftForm');
      
      const originalShift = { id: '1' };
      const selectedDates = [new Date(2024, 0, 15), new Date(2024, 0, 16)];
      
      // Test normal state
      const normalResult = getFooterConditionalConfig(originalShift, selectedDates, false);
      expect(normalResult).toEqual({
        shouldShowFooter: true,
        submitConfig: {
          isEnabled: true,
          buttonText: 'Copy Shift to 2 Dates',
          loadingText: 'Copying...',
          className: 'w-full'
        }
      });
      
      // Test submitting state
      const submittingResult = getFooterConditionalConfig(originalShift, selectedDates, true);
      expect(submittingResult.submitConfig.isEnabled).toBe(false);
      
      // Test single date
      const singleResult = getFooterConditionalConfig(originalShift, [selectedDates[0]], false);
      expect(singleResult.submitConfig.buttonText).toBe('Copy Shift to 1 Date');
      
      // Test no dates
      const noDatesResult = getFooterConditionalConfig(originalShift, [], false);
      expect(noDatesResult.submitConfig.isEnabled).toBe(false);
      
      // Test no original shift
      const noShiftResult = getFooterConditionalConfig(null, selectedDates, false);
      expect(noShiftResult.shouldShowFooter).toBe(false);
    });

    it('should test getHeaderConfiguration function', async () => {
      const { getHeaderConfiguration } = await import('../CopyShiftForm');
      
      const handleClose = jest.fn();
      const config = getHeaderConfiguration(handleClose);
      
      expect(config).toEqual({
        title: 'Copy Shift',
        titleClass: 'text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6',
        closeButton: {
          onClick: handleClose,
          className: 'float-right text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none',
          ariaLabel: 'Close',
          iconConfig: expect.objectContaining({
            className: 'w-5 h-5 sm:w-6 sm:h-6',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            pathD: 'M6 18L18 6M6 6l12 12'
          })
        }
      });
      
      // Test onClick
      config.closeButton.onClick();
      expect(handleClose).toHaveBeenCalled();
    });

    it('should test getErrorStateConfig function', async () => {
      const { getErrorStateConfig } = await import('../CopyShiftForm');
      
      const config = getErrorStateConfig();
      expect(config).toEqual({
        containerClass: 'text-center p-4',
        messageClass: 'text-gray-600 dark:text-gray-400',
        message: 'Error: Could not find the shift to copy'
      });
    });

    it('should test getLabelInputConfigs function', async () => {
      const { getLabelInputConfigs } = await import('../CopyShiftForm');
      
      const configs = getLabelInputConfigs();
      
      expect(configs.copyModeLabel).toEqual({
        text: 'Copy Mode',
        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
      });
      
      expect(configs.singleDateLabel).toEqual({
        text: 'Select Date',
        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
      });
      
      expect(configs.multipleDateLabel).toEqual({
        text: 'Select Multiple Dates',
        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
      });
      
      expect(configs.frequencyLabel).toEqual({
        text: 'Frequency',
        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
      });
      
      expect(configs.daysOfWeekLabel).toEqual({
        text: 'Days of Week',
        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
      });
      
      expect(configs.occurrencesInput).toEqual({
        type: 'number',
        min: '1',
        max: '12',
        className: 'w-full p-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-700 dark:text-white'
      });
    });
  });

  describe('Round 5: Integration tests for complex workflows', () => {
    it('should test complete multiple date selection workflow', async () => {
      const {
        processMultipleDatePickerChange,
        processDateRemovalClick,
        getDateSelectionInfo,
        getFormSectionVisibility
      } = await import('../CopyShiftForm');
      
      let selectedDates: Date[] = [];
      const setSelectedDates = (dates: Date[]) => { selectedDates = dates; };
      const dispatch = jest.fn();
      const addNotification = jest.fn();
      const originalShift = { id: '1', date: '2024-01-10' };
      
      // Step 1: Add first date
      processMultipleDatePickerChange(
        new Date(2024, 0, 15), selectedDates, originalShift, setSelectedDates, dispatch, addNotification
      );
      expect(selectedDates).toHaveLength(1);
      
      // Step 2: Add second date
      processMultipleDatePickerChange(
        new Date(2024, 0, 16), selectedDates, originalShift, setSelectedDates, dispatch, addNotification
      );
      expect(selectedDates).toHaveLength(2);
      
      // Step 3: Check selection info
      const selectionInfo = getDateSelectionInfo(selectedDates);
      expect(selectionInfo.count).toBe(2);
      expect(selectionInfo.hasSelections).toBe(true);
      
      // Step 4: Remove one date
      processDateRemovalClick(0, selectedDates, setSelectedDates);
      expect(selectedDates).toHaveLength(1);
      
      // Step 5: Check visibility
      const visibility = getFormSectionVisibility(originalShift, 'multiple');
      expect(visibility.showSelectedDatesDisplay).toBe(true);
    });

    it('should test complete recurring pattern workflow', async () => {
      const {
        processRecurringFrequencyButtonClick,
        processRecurringOccurrencesInput,
        getDayOfWeekButtonGrid,
        processCompleteRecurringPatternHandler,
        getRecurringValidationDisplay
      } = await import('../CopyShiftForm');
      
      let recurringOptions = { frequency: 'weekly', occurrences: 4, daysOfWeek: [] as number[] };
      const setRecurringOptions = (options: any) => { recurringOptions = options; };
      const mockDayToggle = jest.fn();
      const setSelectedDates = jest.fn();
      const dispatch = jest.fn();
      const addNotification = jest.fn();
      const originalShift = { id: '1', date: '2024-01-15' };
      
      // Step 1: Change frequency
      processRecurringFrequencyButtonClick('daily', recurringOptions, setRecurringOptions);
      expect(recurringOptions.frequency).toBe('daily');
      
      // Step 2: Change occurrences
      processRecurringOccurrencesInput('6', recurringOptions, setRecurringOptions);
      expect(recurringOptions.occurrences).toBe(6);
      
      // Step 3: Generate day grid
      const dayGrid = getDayOfWeekButtonGrid(recurringOptions, mockDayToggle);
      expect(dayGrid).toHaveLength(7);
      
      // Step 4: Validate options
      const validation = getRecurringValidationDisplay(recurringOptions);
      expect(validation.isValid).toBe(true);
      
      // Step 5: Generate pattern
      const result = processCompleteRecurringPatternHandler(
        originalShift, recurringOptions, setSelectedDates, dispatch, addNotification
      );
      expect(result.wasExecuted).toBe(true);
    });
  });
}); 
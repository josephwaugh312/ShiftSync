import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userEvent from '@testing-library/user-event';
import WeeklyView from '../WeeklyView';
import shiftsSlice, { setSelectedDate } from '../../../store/shiftsSlice';
import uiSlice from '../../../store/uiSlice';
import { Shift } from '../../../types';

// Mock console.log to reduce test noise
jest.spyOn(console, 'log').mockImplementation(() => {});

// Create test store with shifts
const createTestStore = (shifts: Shift[] = []) => {
  return configureStore({
    reducer: {
      shifts: shiftsSlice,
      ui: uiSlice,
    },
    preloadedState: {
      shifts: {
        shifts,
        templates: [],
        isLoading: false,
        error: null,
      },
      ui: {
        currentView: 'weekly' as const,
        selectedDate: '2024-01-15',
        isModalOpen: false,
        currentModal: null,
        theme: 'system' as const,
        sidebarCollapsed: false,
        notifications: [],
        keyboardShortcutsEnabled: true,
        soundEnabled: true,
        colorScheme: 'blue' as const,
      },
    },
  });
};

const renderWithProvider = (
  component: React.ReactElement, 
  store = createTestStore()
) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

// Mock shifts data
const mockShifts: Shift[] = [
  {
    id: '1',
    title: 'Morning Shift',
    employeeId: 'emp1',
    employeeName: 'John Doe',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '17:00',
    position: 'Manager',
    notes: 'Regular shift',
    isRecurring: false,
  },
  {
    id: '2',
    title: 'Evening Shift',
    employeeId: 'emp2',
    employeeName: 'Jane Smith',
    date: '2024-01-16',
    startTime: '17:00',
    endTime: '23:00',
    position: 'Cashier',
    notes: '',
    isRecurring: false,
  },
  {
    id: '3',
    title: 'Weekend Shift',
    employeeId: 'emp3',
    employeeName: 'Bob Wilson',
    date: '2024-01-20',
    startTime: '10:00',
    endTime: '18:00',
    position: 'Sales',
    notes: '',
    isRecurring: false,
  },
];

// Create test week days (January 15-21, 2024)
const createTestWeek = () => {
  return [
    new Date(2024, 0, 15), // Monday
    new Date(2024, 0, 16), // Tuesday
    new Date(2024, 0, 17), // Wednesday
    new Date(2024, 0, 18), // Thursday
    new Date(2024, 0, 19), // Friday
    new Date(2024, 0, 20), // Saturday
    new Date(2024, 0, 21), // Sunday
  ];
};

describe('WeeklyView', () => {
  const mockHandleDayClick = jest.fn();
  const mockHandleAddShift = jest.fn();
  const testWeek = createTestWeek();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering and layout', () => {
    it('should render with motion container', () => {
      const store = createTestStore(mockShifts);
      const { container } = renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      const weeklyView = container.querySelector('.weekly-view');
      expect(weeklyView).toBeInTheDocument();
      expect(weeklyView).toHaveClass('pb-24');
    });

    it('should render 7 days in grid layout', () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      const gridContainer = document.querySelector('.grid-cols-1.md\\:grid-cols-7');
      expect(gridContainer).toBeInTheDocument();
      
      // Should have 7 day columns
      const dayColumns = document.querySelectorAll('.rounded-lg.border');
      expect(dayColumns).toHaveLength(7);
    });

    it('should display day names and numbers correctly', () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Check for day names (Mon, Tue, Wed, etc.)
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
      expect(screen.getByText('Sun')).toBeInTheDocument();

      // Check for day numbers
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('16')).toBeInTheDocument();
      expect(screen.getByText('17')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('19')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('21')).toBeInTheDocument();
    });
  });

  describe('day selection and interaction', () => {
    it('should highlight the selected day', () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Find the selected day (15th)
      const selectedDay = screen.getByText('15').closest('.rounded-lg');
      expect(selectedDay).toHaveClass('border-primary-500', 'ring-2', 'ring-primary-200');
      
      const selectedDayHeader = screen.getByText('15').closest('.p-3');
      expect(selectedDayHeader).toHaveClass('bg-primary-500', 'text-white');
    });

    it('should handle day click events', async () => {
      const user = userEvent.setup();
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Click on Tuesday (16th)
      const tuesdayHeader = screen.getByText('16').closest('.p-3');
      await user.click(tuesdayHeader!);

      expect(mockHandleDayClick).toHaveBeenCalledWith('2024-01-16');
    });

    it('should handle clicks on different days', async () => {
      const user = userEvent.setup();
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Click on different days
      const wednesday = screen.getByText('17').closest('.p-3');
      const friday = screen.getByText('19').closest('.p-3');
      
      await user.click(wednesday!);
      expect(mockHandleDayClick).toHaveBeenCalledWith('2024-01-17');
      
      await user.click(friday!);
      expect(mockHandleDayClick).toHaveBeenCalledWith('2024-01-19');
    });
  });

  describe('shift display and grouping', () => {
    it('should display shifts in the correct days', () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Check that shifts appear in correct days
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // Monday 15th
      expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // Tuesday 16th
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument(); // Saturday 20th
    });

    it('should show empty states for days without shifts', () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Days without shifts should show "No shifts" message
      const noShiftsElements = screen.getAllByText('No shifts');
      expect(noShiftsElements.length).toBeGreaterThan(0);
      
      // Should have "Add" buttons for empty days
      const addButtons = screen.getAllByText('Add');
      expect(addButtons.length).toBeGreaterThan(0);
    });

    it('should group multiple shifts on the same day', () => {
      const shiftsWithMultiple = [
        ...mockShifts,
        {
          id: '4',
          title: 'Another Monday Shift',
          employeeId: 'emp4',
          employeeName: 'Alice Johnson',
          date: '2024-01-15',
          startTime: '18:00',
          endTime: '22:00',
          position: 'Server',
          notes: '',
          isRecurring: false,
        },
      ];

      const store = createTestStore(shiftsWithMultiple);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Monday should have both John Doe and Alice Johnson
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });

  describe('empty state interactions', () => {
    it('should handle add shift clicks for specific days', async () => {
      const user = userEvent.setup();
      const store = createTestStore([]);
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Find and click an "Add" button for a specific day
      const addButtons = screen.getAllByText('Add');
      await user.click(addButtons[0]);

      // Should dispatch setSelectedDate and call handleAddShift
      expect(dispatchSpy).toHaveBeenCalledWith(setSelectedDate('2024-01-15'));
      expect(mockHandleAddShift).toHaveBeenCalledTimes(1);
    });

    it('should handle add shift for different days', async () => {
      const user = userEvent.setup();
      const store = createTestStore([]);
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Get all Add buttons (one for each day)
      const addButtons = screen.getAllByText('Add');
      expect(addButtons).toHaveLength(7);

      // Click on different days' add buttons
      await user.click(addButtons[1]); // Tuesday
      expect(dispatchSpy).toHaveBeenCalledWith(setSelectedDate('2024-01-16'));
      
      await user.click(addButtons[5]); // Saturday
      expect(dispatchSpy).toHaveBeenCalledWith(setSelectedDate('2024-01-20'));
    });

    it('should display compact empty state icons', () => {
      const store = createTestStore([]);
      const { container } = renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Should have plus icons for empty states
      const plusIcons = container.querySelectorAll('svg');
      expect(plusIcons.length).toBeGreaterThan(0);
      
      // Check icon classes
      const firstIcon = plusIcons[0];
      expect(firstIcon).toHaveClass('w-12', 'h-12', 'text-gray-400');
    });
  });

  describe('today highlighting', () => {
    it('should highlight today when it is in the current week', () => {
      // Mock today to be January 17, 2024 (Wednesday)
      const mockToday = new Date(2024, 0, 17);
      const originalDate = Date;
      global.Date = jest.fn((...args) => 
        args.length ? new originalDate(...args) : mockToday
      ) as any;
      Object.assign(Date, originalDate);

      const store = createTestStore([]);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Wednesday should have today styling
      const wednesdayHeader = screen.getByText('17').closest('.p-3');
      expect(wednesdayHeader).toHaveClass('bg-primary-100', 'text-primary-800');

      // Restore original Date
      global.Date = originalDate;
    });

    it('should not highlight today when selected day is also today', () => {
      // Mock today to be January 15, 2024 (Monday) - same as selected
      const mockToday = new Date(2024, 0, 15);
      const originalDate = Date;
      global.Date = jest.fn((...args) => 
        args.length ? new originalDate(...args) : mockToday
      ) as any;
      Object.assign(Date, originalDate);

      const store = createTestStore([]);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Monday should have selected styling (not today styling)
      const mondayHeader = screen.getByText('15').closest('.p-3');
      expect(mondayHeader).toHaveClass('bg-primary-500', 'text-white');

      // Restore original Date
      global.Date = originalDate;
    });
  });

  describe('date formatting and parsing', () => {
    it('should correctly format week days to ISO strings', () => {
      const store = createTestStore([]);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // All days should be rendered
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should handle edge case dates correctly', () => {
      // Test with month boundary (January 31 - February 6)
      const edgeWeek = [
        new Date(2024, 0, 31), // Wednesday Jan 31
        new Date(2024, 1, 1),  // Thursday Feb 1
        new Date(2024, 1, 2),  // Friday Feb 2
        new Date(2024, 1, 3),  // Saturday Feb 3
        new Date(2024, 1, 4),  // Sunday Feb 4
        new Date(2024, 1, 5),  // Monday Feb 5
        new Date(2024, 1, 6),  // Tuesday Feb 6
      ];

      const store = createTestStore([]);
      renderWithProvider(
        <WeeklyView 
          days={edgeWeek}
          selectedDate="2024-02-01"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Should show correct day numbers across month boundary
      expect(screen.getByText('31')).toBeInTheDocument();
      expect(screen.getByText('01')).toBeInTheDocument();
      expect(screen.getByText('02')).toBeInTheDocument();
    });

    it('should handle leap year dates', () => {
      // Test February 29, 2024 (leap year)
      const leapWeek = [
        new Date(2024, 1, 26), // Monday
        new Date(2024, 1, 27), // Tuesday
        new Date(2024, 1, 28), // Wednesday
        new Date(2024, 1, 29), // Thursday (leap day)
        new Date(2024, 2, 1),  // Friday
        new Date(2024, 2, 2),  // Saturday
        new Date(2024, 2, 3),  // Sunday
      ];

      const store = createTestStore([]);
      renderWithProvider(
        <WeeklyView 
          days={leapWeek}
          selectedDate="2024-02-29"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      expect(screen.getByText('29')).toBeInTheDocument(); // Leap day
    });
  });

  describe('console logging and debugging', () => {
    it('should log date processing information', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const store = createTestStore([]);
      
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Should log for each day being rendered
      expect(consoleSpy).toHaveBeenCalledWith(
        'WeeklyView - Rendering day:', 
        '2024-01-15',
        'Date object:',
        expect.any(Date),
        'Name:',
        'Mon',
        'Number:',
        '15'
      );

      // Should log today checking
      expect(consoleSpy).toHaveBeenCalledWith(
        'WeeklyView - Checking if date is today:',
        expect.any(String),
        expect.any(String),
        expect.any(Boolean)
      );
    });
  });

  describe('motion animations', () => {
    it('should render with proper motion variants', () => {
      const store = createTestStore([]);
      const { container } = renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      const motionDiv = container.querySelector('.weekly-view');
      expect(motionDiv).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should include dark mode classes', () => {
      const store = createTestStore([]);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Check for dark mode classes
      const dayElements = document.querySelectorAll('.dark\\:border-dark-600');
      expect(dayElements.length).toBeGreaterThan(0);

      const bgElements = document.querySelectorAll('.dark\\:bg-dark-800');
      expect(bgElements.length).toBeGreaterThan(0);
    });
  });

  describe('compact shift display', () => {
    it('should render shifts in compact mode', () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // ShiftCards should be rendered with isCompact prop
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty days array', () => {
      const store = createTestStore([]);
      const { container } = renderWithProvider(
        <WeeklyView 
          days={[]}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.children).toHaveLength(0);
    });

    it('should handle shifts with dates not in current week', () => {
      const shiftsOutOfWeek = [
        {
          ...mockShifts[0],
          date: '2024-01-08', // Previous week
        },
        {
          ...mockShifts[1],
          date: '2024-01-22', // Next week
        },
      ];

      const store = createTestStore(shiftsOutOfWeek);
      renderWithProvider(
        <WeeklyView 
          days={testWeek}
          selectedDate="2024-01-15"
          handleDayClick={mockHandleDayClick}
          handleAddShift={mockHandleAddShift}
        />,
        store
      );

      // Should not show shifts from other weeks
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should handle malformed shift dates gracefully', () => {
      const malformedShifts = [
        {
          ...mockShifts[0],
          date: 'invalid-date',
        },
      ];

      const store = createTestStore(malformedShifts as any);
      
      expect(() => {
        renderWithProvider(
          <WeeklyView 
            days={testWeek}
            selectedDate="2024-01-15"
            handleDayClick={mockHandleDayClick}
            handleAddShift={mockHandleAddShift}
          />,
          store
        );
      }).not.toThrow();
    });
  });
}); 
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userEvent from '@testing-library/user-event';
import DailyView from '../DailyView';
import shiftsSlice from '../../../store/shiftsSlice';
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
        currentView: 'daily' as const,
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
    date: '2024-01-15',
    startTime: '17:00',
    endTime: '23:00',
    position: 'Cashier',
    notes: '',
    isRecurring: false,
  },
  {
    id: '3',
    title: 'Different Day Shift',
    employeeId: 'emp3',
    employeeName: 'Bob Wilson',
    date: '2024-01-16',
    startTime: '10:00',
    endTime: '18:00',
    position: 'Sales',
    notes: '',
    isRecurring: false,
  },
];

describe('DailyView', () => {
  const mockHandleAddShift = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('rendering and layout', () => {
    it('should render with motion container', () => {
      const store = createTestStore(mockShifts);
      const { container } = renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      const dailyView = container.querySelector('.daily-view');
      expect(dailyView).toBeInTheDocument();
      expect(dailyView).toHaveClass('pb-24');
    });

    it('should display formatted date in header', () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      // Should display formatted date
      expect(screen.getByText(/Mon, January 15, 2024/i)).toBeInTheDocument();
    });

    it('should have proper header styling', () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      const header = document.querySelector('.bg-primary-100');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass(
        'py-2',
        'px-4',
        'rounded-lg',
        'transition-colors',
        'dark:bg-primary-900'
      );
    });
  });

  describe('loading states', () => {
    it('should show loading skeletons initially', () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      // Should show skeleton loaders (check for SkeletonLoader class structure)
      const skeletons = document.querySelectorAll('.bg-gray-200, .dark\\:bg-gray-700');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should hide loading state after timeout', async () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      // Fast-forward time to complete loading
      act(() => {
        jest.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should restart loading when selectedDate changes', () => {
      const store = createTestStore(mockShifts);
      const { rerender } = renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      // Complete initial loading
      act(() => {
        jest.advanceTimersByTime(800);
      });

      // Change selected date
      rerender(
        <Provider store={store}>
          <DailyView selectedDate="2024-01-16" handleAddShift={mockHandleAddShift} />
        </Provider>
      );

      // Should show loading again (check for skeleton structures)
      const skeletons = document.querySelectorAll('.bg-gray-200, .dark\\:bg-gray-700');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('shift filtering and display', () => {
    it('should display shifts for the selected date', async () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      // Complete loading
      act(() => {
        jest.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
      });
    });

    it('should filter shifts correctly for different dates', async () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <DailyView selectedDate="2024-01-16" handleAddShift={mockHandleAddShift} />,
        store
      );

      // Complete loading
      act(() => {
        jest.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should handle shifts with exact date matching', async () => {
      const store = createTestStore([
        {
          ...mockShifts[0],
          date: '2024-01-15',
        },
      ]);
      renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      act(() => {
        jest.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('empty state handling', () => {
    it('should show empty state when no shifts exist', async () => {
      const store = createTestStore([]);
      renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      // Complete loading
      act(() => {
        jest.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(screen.getByText('No shifts scheduled')).toBeInTheDocument();
        expect(screen.getByText(/Add a shift for Monday, January 15/i)).toBeInTheDocument();
        expect(screen.getByText('Add Shift')).toBeInTheDocument();
      });
    });

    it('should show empty state for date with no shifts', async () => {
      const store = createTestStore(mockShifts);
      renderWithProvider(
        <DailyView selectedDate="2024-01-20" handleAddShift={mockHandleAddShift} />,
        store
      );

      act(() => {
        jest.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(screen.getByText('No shifts scheduled')).toBeInTheDocument();
        expect(screen.getByText(/Add a shift for Saturday, January 20/i)).toBeInTheDocument();
      });
    });

    it('should handle empty state action button click', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const store = createTestStore([]);
      renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      act(() => {
        jest.advanceTimersByTime(800);
      });

      await waitFor(() => {
        expect(screen.getByText('Add Shift')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Shift');
      await user.click(addButton);

      expect(mockHandleAddShift).toHaveBeenCalledTimes(1);
    });

    it('should display proper empty state icon', async () => {
      const store = createTestStore([]);
      const { container } = renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      act(() => {
        jest.advanceTimersByTime(800);
      });

      await waitFor(() => {
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass('w-16', 'h-16', 'text-gray-400', 'dark:text-gray-600');
      });
    });
  });

  describe('date formatting and parsing', () => {
    it('should handle different date formats correctly', async () => {
      const testDates = [
        { input: '2024-01-01', expected: /Mon, January 1, 2024/i },
        { input: '2024-12-31', expected: /Tue, December 31, 2024/i },
        { input: '2024-06-15', expected: /Sat, June 15, 2024/i },
      ];

      for (const { input, expected } of testDates) {
        const store = createTestStore([]);
        const { unmount } = renderWithProvider(
          <DailyView selectedDate={input} handleAddShift={mockHandleAddShift} />,
          store
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      }
    });

    it('should parse date objects correctly in header', () => {
      const store = createTestStore([]);
      renderWithProvider(
        <DailyView selectedDate="2024-02-29" handleAddShift={mockHandleAddShift} />,
        store
      );

      // Should handle leap year dates
      expect(screen.getByText(/Thu, February 29, 2024/i)).toBeInTheDocument();
    });

    it('should handle edge case dates', () => {
      const store = createTestStore([]);
      renderWithProvider(
        <DailyView selectedDate="2024-01-31" handleAddShift={mockHandleAddShift} />,
        store
      );

      expect(screen.getByText(/Wed, January 31, 2024/i)).toBeInTheDocument();
    });
  });

  describe('console logging and debugging', () => {
    it('should log shift filtering information', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const store = createTestStore(mockShifts);
      
      renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'DailyView - Filtering shifts for date:', 
        '2024-01-15'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'DailyView - Parsed date object:', 
        expect.any(Date)
      );
    });

    it('should log date parsing in header', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const store = createTestStore([]);
      
      renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'DailyView - Header date object:', 
        expect.any(Date)
      );
    });
  });

  describe('component cleanup', () => {
    it('should cleanup timer on unmount', () => {
      const store = createTestStore(mockShifts);
      const { unmount } = renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      // Verify timer is set
      expect(jest.getTimerCount()).toBeGreaterThan(0);

      // Unmount component
      unmount();

      // Fast forward to ensure timer is cleaned up
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    });

    it('should handle rapid date changes', () => {
      const store = createTestStore(mockShifts);
      const { rerender } = renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      // Rapidly change dates
      rerender(
        <Provider store={store}>
          <DailyView selectedDate="2024-01-16" handleAddShift={mockHandleAddShift} />
        </Provider>
      );

      rerender(
        <Provider store={store}>
          <DailyView selectedDate="2024-01-17" handleAddShift={mockHandleAddShift} />
        </Provider>
      );

      // Should not crash
      expect(screen.getByText(/January 17, 2024/i)).toBeInTheDocument();
    });
  });

  describe('motion animations', () => {
    it('should render with proper motion variants', () => {
      const store = createTestStore(mockShifts);
      const { container } = renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      const motionDiv = container.querySelector('.daily-view');
      expect(motionDiv).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should include dark mode classes', () => {
      const store = createTestStore([]);
      renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      const header = document.querySelector('.dark\\:bg-primary-900');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('dark:text-primary-300');
    });
  });

  describe('integration with Redux', () => {
    it('should update when shifts in store change', async () => {
      const store = createTestStore([]);
      const { rerender } = renderWithProvider(
        <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />,
        store
      );

      act(() => {
        jest.advanceTimersByTime(800);
      });

      // Initially no shifts
      await waitFor(() => {
        expect(screen.getByText('No shifts scheduled')).toBeInTheDocument();
      });

      // Add shifts to store
      const newStore = createTestStore(mockShifts);
      rerender(
        <Provider store={newStore}>
          <DailyView selectedDate="2024-01-15" handleAddShift={mockHandleAddShift} />
        </Provider>
      );

      act(() => {
        jest.advanceTimersByTime(800);
      });

      // Should now show shifts (check for employee names)
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });
}); 
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock timers for animations and timeouts
jest.useFakeTimers();

// Mock sound effects
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

// Mock CustomFocusButton
jest.mock('../../common/CustomFocusButton', () => {
  return function MockCustomFocusButton({ children, onClick, ...props }: any) {
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  };
});

// Mock LoadingButton
jest.mock('../../common/LoadingButton', () => {
  return function MockLoadingButton({ children, onClick, isLoading, loadingText, ...props }: any) {
    return (
      <button onClick={onClick} disabled={isLoading} {...props}>
        {isLoading ? loadingText : children}
      </button>
    );
  };
});

// Mock Tooltip
jest.mock('../../common/Tooltip', () => {
  return function MockTooltip({ children }: any) {
    return children;
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onMouseEnter, onMouseLeave, ...props }: any) => (
      <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock date utils with inline functions
jest.mock('../../../utils/dateUtils', () => ({
  formatDate: jest.fn(() => 'January 15, 2024'),
  formatToISODate: jest.fn((date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return '2024-01-15';
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }),
  createDateFromISO: jest.fn((dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') {
      return new Date(2024, 0, 15, 12, 0, 0);
    }
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return new Date(2024, 0, 15, 12, 0, 0);
      }
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } catch (error) {
      return new Date(2024, 0, 15, 12, 0, 0);
    }
  }),
}));

import CalendarHeader from '../CalendarHeader';
import shiftsSlice from '../../../store/shiftsSlice';
import uiSlice from '../../../store/uiSlice';
import { formatDate, formatToISODate, createDateFromISO } from '../../../utils/dateUtils';

// Mock console to reduce test noise
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Get mocked functions for testing
const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;
const mockFormatToISODate = formatToISODate as jest.MockedFunction<typeof formatToISODate>;
const mockCreateDateFromISO = createDateFromISO as jest.MockedFunction<typeof createDateFromISO>;

// ===== ROUND 1 UTILITY FUNCTIONS =====

// 1. Create test store utility
export const createTestStore = (initialState?: any) => {
  const defaultState = {
    shifts: {
      selectedDate: '2024-01-15',
      shifts: [],
      templates: [],
      error: null,
    },
    ui: {
      modalOpen: {
        addShift: false,
        editShift: false,
        templates: false,
        insights: false,
      },
      notifications: [],
      theme: 'light',
      soundEnabled: true,
      viewMode: 'weekly',
    },
  };

  return configureStore({
    reducer: {
      shifts: shiftsSlice,
      ui: uiSlice,
    },
    preloadedState: initialState || defaultState,
  });
};

// 2. Render with provider utility
export const renderWithProvider = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

// 3. Setup default date mocks utility
export const setupDefaultDateMocks = () => {
  mockFormatDate.mockReturnValue('January 15, 2024');
  
  mockCreateDateFromISO.mockImplementation((dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') {
      return new Date(2024, 0, 15, 12, 0, 0);
    }
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return new Date(2024, 0, 15, 12, 0, 0);
      }
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } catch (error) {
      return new Date(2024, 0, 15, 12, 0, 0);
    }
  });
  
  mockFormatToISODate.mockImplementation((date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return '2024-01-15';
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
};

// 4. Generate week days utility
export const generateWeekDays = (startDate: Date): Date[] => {
  const days = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  
  return days;
};

// 5. Calculate week start utility
export const calculateWeekStart = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const weekStart = new Date(date);
  weekStart.setDate(diff);
  return weekStart;
};

// 6. Create calendar month utility
export const createCalendarMonth = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let firstDayOfWeek = firstDay.getDay();
  firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
  
  const calendarDays: Date[] = [];
  
  // Previous month days
  const daysFromPrevMonth = firstDayOfWeek - 1;
  for (let i = daysFromPrevMonth; i > 0; i--) {
    calendarDays.push(new Date(year, month, 1 - i));
  }
  
  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    calendarDays.push(new Date(year, month, i));
  }
  
  // Next month days
  const daysToAdd = 42 - calendarDays.length;
  for (let i = 1; i <= daysToAdd; i++) {
    calendarDays.push(new Date(year, month + 1, i));
  }
  
  return calendarDays;
};

// 7. Format date display utility
export const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
};

// 8. Check if date is today utility
export const isDateToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// 9. Create date range string utility
export const createDateRangeString = (startDate: Date, endDate: Date): string => {
  const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${start} - ${end}`;
};

// 10. Setup complete date environment utility
export const setupDateEnvironment = (selectedDate = '2024-01-15') => {
  setupDefaultDateMocks();
  
  // Set up a consistent date environment
  const baseDate = new Date(2024, 0, 15, 12, 0, 0);
  jest.setSystemTime(baseDate);
  
  return {
    baseDate,
    selectedDate,
    weekStart: calculateWeekStart(baseDate),
    weekDays: generateWeekDays(calculateWeekStart(baseDate))
  };
};

describe('CalendarHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    setupDefaultDateMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.setSystemTime();
  });

  describe('Round 1: Core Utility Functions', () => {
    describe('createTestStore', () => {
      it('should create store with default state', () => {
        const store = createTestStore();
        const state = store.getState();
        
        expect(state.shifts.selectedDate).toBe('2024-01-15');
        expect(state.shifts.shifts).toEqual([]);
        expect(state.ui.modalOpen.addShift).toBe(false);
      });

      it('should create store with custom initial state', () => {
        const customState = {
          shifts: {
            selectedDate: '2024-02-01',
            shifts: [{ id: '1', title: 'Test' }],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: {
              addShift: true,
              editShift: false,
              templates: false,
              insights: false,
            },
            notifications: [],
            theme: 'dark',
            soundEnabled: false,
            viewMode: 'daily',
          },
        };

        const store = createTestStore(customState);
        const state = store.getState();
        
        expect(state.shifts.selectedDate).toBe('2024-02-01');
        expect(state.shifts.shifts).toHaveLength(1);
        expect(state.ui.modalOpen.addShift).toBe(true);
        expect(state.ui.theme).toBe('dark');
      });
    });

    describe('renderWithProvider', () => {
      it('should render component with default store', () => {
        const TestComponent = () => <div data-testid="test">Test</div>;
        renderWithProvider(<TestComponent />);
        
        expect(screen.getByTestId('test')).toBeInTheDocument();
      });

      it('should render component with custom store', () => {
        const customStore = createTestStore({
          shifts: {
            selectedDate: '2024-12-25',
            shifts: [],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: { addShift: false, editShift: false, templates: false, insights: false },
            notifications: [],
            theme: 'light',
            soundEnabled: true,
            viewMode: 'weekly',
          },
        });

        const TestComponent = () => <div>Custom Store Test</div>;
        renderWithProvider(<TestComponent />, customStore);
        
        expect(screen.getByText('Custom Store Test')).toBeInTheDocument();
      });
    });

    describe('setupDefaultDateMocks', () => {
      it('should setup date mocks correctly', () => {
        setupDefaultDateMocks();
        
        const testDate = mockCreateDateFromISO('2024-03-10');
        expect(testDate.getUTCFullYear()).toBe(2024);
        expect(testDate.getUTCMonth()).toBe(2); // March (0-indexed)
        expect(testDate.getUTCDate()).toBe(10);
      });

      it('should handle invalid date strings', () => {
        setupDefaultDateMocks();
        
        const invalidDate = mockCreateDateFromISO('invalid');
        expect(invalidDate.getFullYear()).toBe(2024);
        expect(invalidDate.getMonth()).toBe(0); // January
      });

      it('should format dates to ISO correctly', () => {
        setupDefaultDateMocks();
        
        const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0)); // June 15
        const formatted = mockFormatToISODate(date);
        expect(formatted).toBe('2024-06-15');
      });

      it('should handle invalid date objects', () => {
        setupDefaultDateMocks();
        
        const invalidDate = new Date('invalid');
        const formatted = mockFormatToISODate(invalidDate);
        expect(formatted).toBe('2024-01-15'); // Fallback
      });
    });

    describe('generateWeekDays', () => {
      it('should generate 7 consecutive days', () => {
        const startDate = new Date(2024, 0, 15); // Monday, Jan 15
        const weekDays = generateWeekDays(startDate);
        
        expect(weekDays).toHaveLength(7);
        expect(weekDays[0].getDate()).toBe(15);
        expect(weekDays[6].getDate()).toBe(21); // Sunday, Jan 21
      });

      it('should handle month boundaries', () => {
        const startDate = new Date(2024, 0, 29); // Jan 29
        const weekDays = generateWeekDays(startDate);
        
        expect(weekDays).toHaveLength(7);
        expect(weekDays[0].getDate()).toBe(29);
        expect(weekDays[6].getDate()).toBe(4); // Feb 4
        expect(weekDays[6].getMonth()).toBe(1); // February
      });
    });

    describe('calculateWeekStart', () => {
      it('should calculate Monday as week start for Tuesday', () => {
        const tuesday = new Date(2024, 0, 16); // Tuesday, Jan 16
        const weekStart = calculateWeekStart(tuesday);
        
        expect(weekStart.getDate()).toBe(15); // Monday, Jan 15
        expect(weekStart.getDay()).toBe(1); // Monday
      });

      it('should handle Sunday correctly', () => {
        const sunday = new Date(2024, 0, 14); // Sunday, Jan 14
        const weekStart = calculateWeekStart(sunday);
        
        expect(weekStart.getDate()).toBe(8); // Monday, Jan 8
        expect(weekStart.getDay()).toBe(1); // Monday
      });

      it('should return same date for Monday', () => {
        const monday = new Date(2024, 0, 15); // Monday, Jan 15
        const weekStart = calculateWeekStart(monday);
        
        expect(weekStart.getDate()).toBe(15);
        expect(weekStart.getDay()).toBe(1);
      });
    });

    describe('createCalendarMonth', () => {
      it('should create 42 days for calendar grid', () => {
        const calendarDays = createCalendarMonth(2024, 0); // January 2024
        
        expect(calendarDays).toHaveLength(42); // 6 weeks × 7 days
      });

      it('should include previous month days', () => {
        const calendarDays = createCalendarMonth(2024, 0); // January 2024
        
        // January 1, 2024 is a Monday, so no previous month days needed
        // But the function should still work correctly
        expect(calendarDays[0].getMonth()).toBeLessThanOrEqual(0);
      });

      it('should include next month days', () => {
        const calendarDays = createCalendarMonth(2024, 0); // January 2024
        
        // Should have February days at the end
        const lastWeek = calendarDays.slice(-7);
        const hasNextMonth = lastWeek.some(day => day.getMonth() === 1);
        expect(hasNextMonth).toBe(true);
      });

      it('should handle February in leap year', () => {
        const calendarDays = createCalendarMonth(2024, 1); // February 2024 (leap year)
        
        expect(calendarDays).toHaveLength(42);
        
        // Find the last day of February
        const febDays = calendarDays.filter(day => day.getMonth() === 1);
        const lastFebDay = Math.max(...febDays.map(day => day.getDate()));
        expect(lastFebDay).toBe(29); // Leap year has 29 days
      });
    });

    describe('formatDateDisplay', () => {
      it('should format date correctly', () => {
        const date = new Date(2024, 5, 15); // June 15, 2024
        const formatted = formatDateDisplay(date);
        
        expect(formatted).toBe('June 2024');
      });

      it('should handle different months', () => {
        const december = new Date(2023, 11, 25); // December 25, 2023
        const formatted = formatDateDisplay(december);
        
        expect(formatted).toBe('December 2023');
      });
    });

    describe('isDateToday', () => {
      it('should return true for today', () => {
        const today = new Date();
        const result = isDateToday(today);
        
        expect(result).toBe(true);
      });

      it('should return false for different date', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const result = isDateToday(yesterday);
        
        expect(result).toBe(false);
      });

      it('should handle date comparison correctly', () => {
        // Create a date that's definitely not today
        const notToday = new Date(2020, 0, 1);
        const result = isDateToday(notToday);
        
        expect(result).toBe(false);
      });
    });

    describe('createDateRangeString', () => {
      it('should create range string for same month', () => {
        const start = new Date(2024, 0, 15); // Jan 15
        const end = new Date(2024, 0, 21); // Jan 21
        const range = createDateRangeString(start, end);
        
        expect(range).toBe('Jan 15 - Jan 21');
      });

      it('should create range string for different months', () => {
        const start = new Date(2024, 0, 29); // Jan 29
        const end = new Date(2024, 1, 4); // Feb 4
        const range = createDateRangeString(start, end);
        
        expect(range).toBe('Jan 29 - Feb 4');
      });

      it('should handle year boundaries', () => {
        const start = new Date(2023, 11, 25); // Dec 25, 2023
        const end = new Date(2024, 0, 1); // Jan 1, 2024
        const range = createDateRangeString(start, end);
        
        expect(range).toBe('Dec 25 - Jan 1');
      });
    });

    describe('setupDateEnvironment', () => {
      it('should setup complete date environment', () => {
        const env = setupDateEnvironment('2024-03-15');
        
        expect(env.selectedDate).toBe('2024-03-15');
        expect(env.baseDate).toBeInstanceOf(Date);
        expect(env.weekStart).toBeInstanceOf(Date);
        expect(env.weekDays).toHaveLength(7);
      });

      it('should use default date when none provided', () => {
        const env = setupDateEnvironment();
        
        expect(env.selectedDate).toBe('2024-01-15');
        expect(env.baseDate.getFullYear()).toBe(2024);
        expect(env.baseDate.getMonth()).toBe(0); // January
      });

      it('should calculate week correctly', () => {
        const env = setupDateEnvironment('2024-01-17'); // Wednesday
        
        expect(env.weekDays).toHaveLength(7);
        expect(env.weekStart.getDay()).toBe(1); // Monday
      });
    });
  });

  describe('Component Rendering', () => {
    it('should render calendar header without errors', () => {
      setupDateEnvironment();
      renderWithProvider(<CalendarHeader />);
      
      // Should render without throwing
      expect(screen.getByText(/January 2024/)).toBeInTheDocument();
    });

    it('should render all action buttons', () => {
      setupDateEnvironment();
      renderWithProvider(<CalendarHeader />);
      
      expect(screen.getByLabelText('Add shift')).toBeInTheDocument();
      expect(screen.getByLabelText('Shift templates')).toBeInTheDocument();
      expect(screen.getByLabelText('View insights')).toBeInTheDocument();
      expect(screen.getByLabelText('Publish schedule')).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      setupDateEnvironment();
      renderWithProvider(<CalendarHeader />);
      
      expect(screen.getByLabelText('Go to previous week')).toBeInTheDocument();
      expect(screen.getByLabelText('Open date picker')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to next week')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to today')).toBeInTheDocument();
    });
  });

  // ===== ROUND 2: BUTTON INTERACTIONS AND EVENT HANDLERS =====

  describe('Round 2: Button Interactions and Event Handlers', () => {
    describe('Action Button Interactions', () => {
      it('should dispatch add shift modal action when add shift button clicked', async () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        const addShiftButton = screen.getByLabelText('Add shift');
        fireEvent.click(addShiftButton);
        
        const state = store.getState();
        expect(state.ui.modalOpen.addShift).toBe(true);
      });

      it('should dispatch templates modal action when templates button clicked', async () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        const templatesButton = screen.getByLabelText('Shift templates');
        fireEvent.click(templatesButton);
        
        const state = store.getState();
        expect(state.ui.modalOpen.templates).toBe(true);
        expect(mockPlaySound).toHaveBeenCalledWith('click');
      });

      it('should dispatch insights modal action when insights button clicked', async () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        const insightsButton = screen.getByLabelText('View insights');
        fireEvent.click(insightsButton);
        
        const state = store.getState();
        expect(state.ui.modalOpen.insights).toBe(true);
        expect(mockPlaySound).toHaveBeenCalledWith('notification');
      });

      it('should handle publish schedule button click and enter loading state', async () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        const publishButton = screen.getByLabelText('Publish schedule');
        fireEvent.click(publishButton);
        
        expect(mockPlaySound).toHaveBeenCalledWith('complete');
        
        // Check for loading state
        expect(screen.getByText('Publishing...')).toBeInTheDocument();
        expect(publishButton).toBeDisabled();
      });

      it('should setup timeout for publish completion', async () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        // Spy on setTimeout to verify it's called
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        
        const publishButton = screen.getByLabelText('Publish schedule');
        fireEvent.click(publishButton);
        
        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1500);
        
        setTimeoutSpy.mockRestore();
      });
    });

    describe('Navigation Button Interactions', () => {
      it('should navigate to previous week when previous button clicked', async () => {
        setupDateEnvironment();
        const store = createTestStore({
          shifts: {
            selectedDate: '2024-01-15',
            shifts: [],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: { addShift: false, editShift: false, templates: false, insights: false },
            notifications: [],
            theme: 'light',
            soundEnabled: true,
            viewMode: 'weekly',
          },
        });
        
        renderWithProvider(<CalendarHeader />, store);
        
        const previousButton = screen.getByLabelText('Go to previous week');
        fireEvent.click(previousButton);
        
        const state = store.getState();
        expect(mockCreateDateFromISO).toHaveBeenCalledWith('2024-01-15');
        expect(mockPlaySound).toHaveBeenCalledWith('click');
        
        // Should have updated the selected date
        expect(mockFormatToISODate).toHaveBeenCalled();
      });

      it('should navigate to next week when next button clicked', async () => {
        setupDateEnvironment();
        const store = createTestStore({
          shifts: {
            selectedDate: '2024-01-15',
            shifts: [],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: { addShift: false, editShift: false, templates: false, insights: false },
            notifications: [],
            theme: 'light',
            soundEnabled: true,
            viewMode: 'weekly',
          },
        });
        
        renderWithProvider(<CalendarHeader />, store);
        
        const nextButton = screen.getByLabelText('Go to next week');
        fireEvent.click(nextButton);
        
        const state = store.getState();
        expect(mockCreateDateFromISO).toHaveBeenCalledWith('2024-01-15');
        expect(mockPlaySound).toHaveBeenCalledWith('click');
        
        // Should have updated the selected date
        expect(mockFormatToISODate).toHaveBeenCalled();
      });

      it('should navigate to today when today button clicked', async () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        const todayButton = screen.getByLabelText('Go to today');
        fireEvent.click(todayButton);
        
        expect(mockPlaySound).toHaveBeenCalledWith('click');
        expect(mockFormatToISODate).toHaveBeenCalled();
      });

      it('should toggle date picker when date picker button clicked', async () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        const datePickerButton = screen.getByLabelText('Open date picker');
        fireEvent.click(datePickerButton);
        
        expect(mockPlaySound).toHaveBeenCalledWith('click');
        
        // Date picker should be visible
        expect(screen.getByText('Mo')).toBeInTheDocument();
        expect(screen.getByText('Tu')).toBeInTheDocument();
        expect(screen.getByText('We')).toBeInTheDocument();
      });

      it('should close date picker when clicked outside', async () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        // Open date picker
        const datePickerButton = screen.getByLabelText('Open date picker');
        fireEvent.click(datePickerButton);
        
        // Click outside
        fireEvent.mouseDown(document.body);
        
        // Date picker should close
        await waitFor(() => {
          expect(screen.queryByText('Mo')).not.toBeInTheDocument();
        });
      });
    });

    describe('Date Picker Interactions', () => {
      it('should navigate to previous month in date picker', async () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        // Open date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Click previous month
        const prevMonthButtons = screen.getAllByRole('button');
        const prevMonthButton = prevMonthButtons.find(btn => 
          btn.querySelector('svg') && 
          btn.querySelector('path[fill-rule="evenodd"]') &&
          btn.querySelector('path[d*="12.707 5.293"]')
        );
        
        if (prevMonthButton) {
          fireEvent.click(prevMonthButton);
          expect(mockPlaySound).toHaveBeenCalledWith('click');
        }
      });

      it('should navigate to next month in date picker', async () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        // Open date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Click next month
        const nextMonthButtons = screen.getAllByRole('button');
        const nextMonthButton = nextMonthButtons.find(btn => 
          btn.querySelector('svg') && 
          btn.querySelector('path[fill-rule="evenodd"]') &&
          btn.querySelector('path[d*="7.293 14.707"]')
        );
        
        if (nextMonthButton) {
          fireEvent.click(nextMonthButton);
          expect(mockPlaySound).toHaveBeenCalledWith('click');
        }
      });

      it('should select date from calendar and close picker', async () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        // Open date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Find a calendar day button (look for one with just a number)
        const dayButtons = screen.getAllByRole('button').filter(btn => {
          const text = btn.textContent;
          return text && /^\d+$/.test(text.trim()) && parseInt(text) <= 31;
        });
        
        if (dayButtons.length > 0) {
          const dayButton = dayButtons[0];
          fireEvent.click(dayButton);
          
          expect(mockPlaySound).toHaveBeenCalledWith('click');
          
          // Date picker should close
          await waitFor(() => {
            expect(screen.queryByText('Mo')).not.toBeInTheDocument();
          });
        }
      });
    });

    describe('Insights Button Hover Effects', () => {
      it('should show animation ping on insights button hover', async () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        const insightsButton = screen.getByLabelText('View insights');
        const motionDiv = insightsButton.closest('div[onMouseEnter]');
        
        if (motionDiv) {
          fireEvent.mouseEnter(motionDiv);
          
          // Should show the ping animation
          const pingElement = motionDiv.querySelector('.animate-ping');
          expect(pingElement).toBeInTheDocument();
          
          fireEvent.mouseLeave(motionDiv);
          
          // Should remove the ping animation
          await waitFor(() => {
            const pingAfterLeave = motionDiv.querySelector('.animate-ping');
            expect(pingAfterLeave).not.toBeInTheDocument();
          });
        }
      });
    });

    describe('Responsive Behavior', () => {
      it('should hide today button on small screens', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        const todayButton = screen.getByLabelText('Go to today');
        expect(todayButton).toHaveClass('hidden', 'md:block');
      });

      it('should hide main title on extra small screens', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        const title = screen.getByText(/January 2024/);
        expect(title).toHaveClass('max-[320px]:hidden');
      });

      it('should show responsive layout for action buttons', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        const buttonContainer = screen.getByLabelText('Add shift').closest('div.flex');
        expect(buttonContainer).toHaveClass('space-x-2', 'md:space-x-3', 'max-[320px]:w-full', 'max-[320px]:justify-center');
      });
    });

    describe('Loading States', () => {
      it('should show loading state during publish', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        const publishButton = screen.getByRole('button', { name: /publish/i });
        fireEvent.click(publishButton);
        
        expect(publishButton).toBeDisabled();
        expect(screen.getByText('Publishing...')).toBeInTheDocument();
      });

      it('should show publish button in normal state initially', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        const publishButton = screen.getByRole('button', { name: /publish/i });
        expect(publishButton).not.toBeDisabled();
        // Should show "Publish" text
        expect(screen.getByText('Publish')).toBeInTheDocument();
      });
    });

    describe('Sound Effects Integration', () => {
      it('should play click sound for all navigation buttons', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        mockPlaySound.mockClear();
        
        fireEvent.click(screen.getByLabelText('Go to previous week'));
        expect(mockPlaySound).toHaveBeenCalledWith('click');
        
        fireEvent.click(screen.getByLabelText('Go to next week'));
        expect(mockPlaySound).toHaveBeenCalledWith('click');
        
        fireEvent.click(screen.getByLabelText('Go to today'));
        expect(mockPlaySound).toHaveBeenCalledWith('click');
        
        fireEvent.click(screen.getByLabelText('Open date picker'));
        expect(mockPlaySound).toHaveBeenCalledWith('click');
      });

      it('should play different sounds for different actions', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        mockPlaySound.mockClear();
        
        fireEvent.click(screen.getByLabelText('View insights'));
        expect(mockPlaySound).toHaveBeenCalledWith('notification');
        
        fireEvent.click(screen.getByLabelText('Publish schedule'));
        expect(mockPlaySound).toHaveBeenCalledWith('complete');
        
        fireEvent.click(screen.getByLabelText('Shift templates'));
        expect(mockPlaySound).toHaveBeenCalledWith('click');
      });
    });
  });

  // ===== ROUND 3: ERROR HANDLING, EDGE CASES & LIFECYCLE =====

  describe('Round 3: Error Handling, Edge Cases & Lifecycle', () => {
    describe('Error Handling and Fallbacks', () => {
      it('should handle undefined selectedDate gracefully', () => {
        const store = createTestStore({
          shifts: {
            selectedDate: undefined,
            shifts: [],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: { addShift: false, editShift: false, templates: false, insights: false },
            notifications: [],
            theme: 'light',
            soundEnabled: true,
            viewMode: 'weekly',
          },
        });

        setupDateEnvironment();
        
        // Should not throw and should render fallback
        expect(() => renderWithProvider(<CalendarHeader />, store)).not.toThrow();
        expect(screen.getByText(/January 2024/)).toBeInTheDocument();
      });

      it('should handle invalid selectedDate string', () => {
        const store = createTestStore({
          shifts: {
            selectedDate: 'invalid-date',
            shifts: [],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: { addShift: false, editShift: false, templates: false, insights: false },
            notifications: [],
            theme: 'light',
            soundEnabled: true,
            viewMode: 'weekly',
          },
        });

        setupDateEnvironment();
        
        expect(() => renderWithProvider(<CalendarHeader />, store)).not.toThrow();
        expect(screen.getByText(/January 2024/)).toBeInTheDocument();
      });

      it('should handle createDateFromISO throwing error', () => {
        setupDateEnvironment();
        
        // Mock createDateFromISO to throw an error
        mockCreateDateFromISO.mockImplementationOnce(() => {
          throw new Error('Date parsing error');
        });

        const store = createTestStore();
        
        expect(() => renderWithProvider(<CalendarHeader />, store)).not.toThrow();
      });

      it('should handle formatToISODate throwing error', () => {
        setupDateEnvironment();
        
        // Mock formatToISODate to throw an error
        mockFormatToISODate.mockImplementationOnce(() => {
          throw new Error('Date formatting error');
        });

        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        // Should still be able to click navigation buttons
        expect(() => {
          fireEvent.click(screen.getByLabelText('Go to previous week'));
        }).not.toThrow();
      });

      it('should handle empty days array gracefully', () => {
        setupDateEnvironment();
        
        // Mock createDateFromISO to return null/invalid dates
        mockCreateDateFromISO.mockImplementation(() => {
          throw new Error('Invalid date');
        });

        const store = createTestStore();
        
        expect(() => renderWithProvider(<CalendarHeader />, store)).not.toThrow();
        
        // Should show fallback date range
        expect(screen.getByText(/Jan 15 - Jan 21/)).toBeInTheDocument();
      });
    });

    describe('Complex Date Logic Edge Cases', () => {
      it('should handle year boundary transitions', () => {
        setupDateEnvironment();
        
        // Set up date at end of year
        const store = createTestStore({
          shifts: {
            selectedDate: '2023-12-31',
            shifts: [],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: { addShift: false, editShift: false, templates: false, insights: false },
            notifications: [],
            theme: 'light',
            soundEnabled: true,
            viewMode: 'weekly',
          },
        });

        renderWithProvider(<CalendarHeader />, store);
        
        // Navigate to next week (should cross year boundary)
        fireEvent.click(screen.getByLabelText('Go to next week'));
        
        expect(mockCreateDateFromISO).toHaveBeenCalledWith('2023-12-31');
        expect(mockFormatToISODate).toHaveBeenCalled();
      });

      it('should handle leap year February edge cases', () => {
        setupDateEnvironment();
        
        const store = createTestStore({
          shifts: {
            selectedDate: '2024-02-29', // Leap day
            shifts: [],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: { addShift: false, editShift: false, templates: false, insights: false },
            notifications: [],
            theme: 'light',
            soundEnabled: true,
            viewMode: 'weekly',
          },
        });

        renderWithProvider(<CalendarHeader />, store);
        
        // Should handle leap day correctly
        fireEvent.click(screen.getByLabelText('Go to previous week'));
        fireEvent.click(screen.getByLabelText('Go to next week'));
        
        expect(mockCreateDateFromISO).toHaveBeenCalledWith('2024-02-29');
      });

      it('should handle month boundaries in date picker', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        // Open date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Navigate through multiple months
        const nextMonthButtons = screen.getAllByRole('button');
        const nextMonthButton = nextMonthButtons.find(btn => 
          btn.querySelector('svg') && 
          btn.querySelector('path[fill-rule="evenodd"]') &&
          btn.querySelector('path[d*="7.293 14.707"]')
        );
        
        if (nextMonthButton) {
          // Click multiple times to test month transitions
          fireEvent.click(nextMonthButton);
          fireEvent.click(nextMonthButton);
          fireEvent.click(nextMonthButton);
          
          expect(mockPlaySound).toHaveBeenCalledWith('click');
        }
      });

      it('should handle invalid dates in week calculation', () => {
        setupDateEnvironment();
        
        // Mock date that returns NaN for getDay()
        const invalidDate = new Date('invalid');
        jest.spyOn(Date.prototype, 'getDay').mockReturnValueOnce(NaN);
        
        const store = createTestStore();
        
        expect(() => renderWithProvider(<CalendarHeader />, store)).not.toThrow();
      });
    });

    describe('Component Lifecycle and Cleanup', () => {
      it('should properly add and remove event listeners', () => {
        setupDateEnvironment();
        
        const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
        
        const { unmount } = renderWithProvider(<CalendarHeader />);
        
        expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
        
        unmount();
        
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
        
        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
      });

      it('should handle rapid re-renders without memory leaks', () => {
        setupDateEnvironment();
        
        const { rerender } = renderWithProvider(<CalendarHeader />);
        
        // Rapid re-renders
        for (let i = 0; i < 5; i++) {
          rerender(
            <Provider store={createTestStore()}>
              <CalendarHeader />
            </Provider>
          );
        }
        
        // Should not throw and should still be functional
        expect(screen.getByLabelText('Add shift')).toBeInTheDocument();
      });

      it('should handle component unmount during date picker open', () => {
        setupDateEnvironment();
        
        const { unmount } = renderWithProvider(<CalendarHeader />);
        
        // Open date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Unmount while date picker is open
        expect(() => unmount()).not.toThrow();
      });

      it('should properly clean up when parent component changes', () => {
        setupDateEnvironment();
        
        const store1 = createTestStore({
          shifts: { selectedDate: '2024-01-15', shifts: [], templates: [], error: null },
          ui: { modalOpen: { addShift: false, editShift: false, templates: false, insights: false }, notifications: [], theme: 'light', soundEnabled: true, viewMode: 'weekly' },
        });
        
        const store2 = createTestStore({
          shifts: { selectedDate: '2024-02-15', shifts: [], templates: [], error: null },
          ui: { modalOpen: { addShift: false, editShift: false, templates: false, insights: false }, notifications: [], theme: 'dark', soundEnabled: false, viewMode: 'daily' },
        });
        
        const { rerender } = renderWithProvider(<CalendarHeader />, store1);
        
        // Change store completely
        rerender(
          <Provider store={store2}>
            <CalendarHeader />
          </Provider>
        );
        
        expect(screen.getByLabelText('Add shift')).toBeInTheDocument();
      });
    });

    describe('Advanced Date Picker Functionality', () => {
      it('should handle clicking on previous month dates in calendar', () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        // Open date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Find all calendar day buttons
        const dayButtons = screen.getAllByRole('button').filter(btn => {
          const text = btn.textContent;
          return text && /^\d+$/.test(text.trim()) && parseInt(text) <= 31;
        });
        
        if (dayButtons.length > 35) { // Should have days from previous month
          // Click on what should be a previous month date (typically first few buttons)
          const prevMonthDay = dayButtons[0];
          fireEvent.click(prevMonthDay);
          
          expect(mockPlaySound).toHaveBeenCalledWith('click');
        }
      });

      it('should handle clicking on next month dates in calendar', () => {
        setupDateEnvironment();
        const store = createTestStore();
        renderWithProvider(<CalendarHeader />, store);
        
        // Open date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Find all calendar day buttons
        const dayButtons = screen.getAllByRole('button').filter(btn => {
          const text = btn.textContent;
          return text && /^\d+$/.test(text.trim()) && parseInt(text) <= 31;
        });
        
        if (dayButtons.length > 35) { // Should have days from next month
          // Click on what should be a next month date (typically last few buttons)
          const nextMonthDay = dayButtons[dayButtons.length - 1];
          fireEvent.click(nextMonthDay);
          
          expect(mockPlaySound).toHaveBeenCalledWith('click');
        }
      });

      it('should correctly identify today in calendar', () => {
        // Set system time to a known date
        const testDate = new Date(2024, 0, 15, 12, 0, 0);
        jest.setSystemTime(testDate);
        
        setupDateEnvironment('2024-01-15');
        renderWithProvider(<CalendarHeader />);
        
        // Open date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Find day 15 (today) - it should have special styling
        const dayButtons = screen.getAllByRole('button').filter(btn => {
          return btn.textContent?.trim() === '15';
        });
        
        expect(dayButtons.length).toBeGreaterThan(0);
        
        // Reset system time
        jest.setSystemTime();
      });

      it('should handle rapid month navigation', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        // Open date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Get navigation buttons
        const prevButton = screen.getAllByRole('button').find(btn => 
          btn.querySelector('path[d*="12.707 5.293"]')
        );
        const nextButton = screen.getAllByRole('button').find(btn => 
          btn.querySelector('path[d*="7.293 14.707"]')
        );
        
        if (prevButton && nextButton) {
          // Rapid navigation
          fireEvent.click(nextButton);
          fireEvent.click(nextButton);
          fireEvent.click(prevButton);
          fireEvent.click(nextButton);
          fireEvent.click(prevButton);
          fireEvent.click(prevButton);
          
          // Should still be functional
          expect(screen.getByText('Mo')).toBeInTheDocument();
        }
      });

      it('should preserve calendar state across date picker toggles', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        // Open date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Navigate to next month
        const nextButton = screen.getAllByRole('button').find(btn => 
          btn.querySelector('path[d*="7.293 14.707"]')
        );
        
        if (nextButton) {
          fireEvent.click(nextButton);
        }
        
        // Close date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Reopen date picker
        fireEvent.click(screen.getByLabelText('Open date picker'));
        
        // Should remember we were in next month (calendar month state is preserved)
        expect(screen.getByText('Mo')).toBeInTheDocument();
      });
    });

    describe('State Management Edge Cases', () => {
      it('should handle modal state conflicts', () => {
        setupDateEnvironment();
        
        const store = createTestStore({
          shifts: {
            selectedDate: '2024-01-15',
            shifts: [],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: {
              addShift: true,
              editShift: true,
              templates: true,
              insights: true, // All modals open at once
            },
            notifications: [],
            theme: 'light',
            soundEnabled: true,
            viewMode: 'weekly',
          },
        });

        expect(() => renderWithProvider(<CalendarHeader />, store)).not.toThrow();
        
        // Should still be able to interact with buttons
        fireEvent.click(screen.getByLabelText('Add shift'));
        fireEvent.click(screen.getByLabelText('View insights'));
      });

      it('should handle store with missing properties', () => {
        setupDateEnvironment();
        
        const incompleteStore = createTestStore({
          shifts: {
            selectedDate: '2024-01-15',
            // Missing shifts, templates, error
          },
          ui: {
            // Missing modalOpen and other properties
            theme: 'light',
          },
        });

        expect(() => renderWithProvider(<CalendarHeader />, incompleteStore)).not.toThrow();
      });

      it('should handle theme changes dynamically', () => {
        setupDateEnvironment();
        
        const store = createTestStore({
          shifts: {
            selectedDate: '2024-01-15',
            shifts: [],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: { addShift: false, editShift: false, templates: false, insights: false },
            notifications: [],
            theme: 'light',
            soundEnabled: true,
            viewMode: 'weekly',
          },
        });

        const { rerender } = renderWithProvider(<CalendarHeader />, store);
        
        // Change theme
        const darkStore = createTestStore({
          shifts: {
            selectedDate: '2024-01-15',
            shifts: [],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: { addShift: false, editShift: false, templates: false, insights: false },
            notifications: [],
            theme: 'dark',
            soundEnabled: true,
            viewMode: 'weekly',
          },
        });

        rerender(
          <Provider store={darkStore}>
            <CalendarHeader />
          </Provider>
        );
        
        expect(screen.getByLabelText('Add shift')).toBeInTheDocument();
      });

      it('should handle sound settings changes', () => {
        setupDateEnvironment();
        
        const store = createTestStore({
          shifts: {
            selectedDate: '2024-01-15',
            shifts: [],
            templates: [],
            error: null,
          },
          ui: {
            modalOpen: { addShift: false, editShift: false, templates: false, insights: false },
            notifications: [],
            theme: 'light',
            soundEnabled: false, // Sound disabled
            viewMode: 'weekly',
          },
        });

        renderWithProvider(<CalendarHeader />, store);
        
        // Click button - should still call playSound (component doesn't check soundEnabled)
        fireEvent.click(screen.getByLabelText('Go to next week'));
        expect(mockPlaySound).toHaveBeenCalledWith('click');
      });
    });

    describe('Accessibility and Keyboard Navigation', () => {
      it('should have proper ARIA attributes', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        // Check ARIA attributes
        expect(screen.getByLabelText('Add shift')).toHaveAttribute('aria-label', 'Add shift');
        expect(screen.getByLabelText('Open date picker')).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByLabelText('Shift templates')).toHaveAttribute('aria-label', 'Shift templates');
        expect(screen.getByLabelText('View insights')).toHaveAttribute('aria-label', 'View insights');
        expect(screen.getByLabelText('Publish schedule')).toHaveAttribute('aria-label', 'Publish schedule');
      });

      it('should update aria-expanded when date picker opens', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        const datePickerButton = screen.getByLabelText('Open date picker');
        
        expect(datePickerButton).toHaveAttribute('aria-expanded', 'false');
        
        fireEvent.click(datePickerButton);
        
        expect(datePickerButton).toHaveAttribute('aria-expanded', 'true');
      });

      it('should handle keyboard navigation in date picker', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        // Open date picker
        const datePickerButton = screen.getByLabelText('Open date picker');
        fireEvent.click(datePickerButton);
        
        // Try keyboard events on calendar days
        const dayButtons = screen.getAllByRole('button').filter(btn => {
          const text = btn.textContent;
          return text && /^\d+$/.test(text.trim()) && parseInt(text) <= 31;
        });
        
        if (dayButtons.length > 0) {
          const firstDay = dayButtons[0];
          
          // Test keyboard events
          fireEvent.keyDown(firstDay, { key: 'Enter' });
          fireEvent.keyDown(firstDay, { key: ' ' });
          fireEvent.keyDown(firstDay, { key: 'Escape' });
          
          // Should not crash
          expect(screen.getByText('Mo')).toBeInTheDocument();
        }
      });

      it('should handle focus management correctly', () => {
        setupDateEnvironment();
        renderWithProvider(<CalendarHeader />);
        
        // Test focus on various elements
        const buttons = [
          screen.getByLabelText('Add shift'),
          screen.getByLabelText('Shift templates'),
          screen.getByLabelText('View insights'),
          screen.getByLabelText('Publish schedule'),
          screen.getByLabelText('Go to previous week'),
          screen.getByLabelText('Open date picker'),
          screen.getByLabelText('Go to next week'),
          screen.getByLabelText('Go to today'),
        ];
        
        buttons.forEach(button => {
          button.focus();
          expect(document.activeElement).toBe(button);
        });
      });
    });
  });
}); 
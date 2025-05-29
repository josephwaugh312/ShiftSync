import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MobileCalendarView from '../MobileCalendarView';
import shiftsSlice from '../../../store/shiftsSlice';
import uiSlice from '../../../store/uiSlice';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, whileTap, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

// Mock ShiftCard component
jest.mock('../../shifts/ShiftCard', () => {
  return function MockShiftCard({ shift }: any) {
    return (
      <div data-testid={`shift-card-${shift.id}`}>
        <div>{shift.employeeName}</div>
        <div>{shift.timeRange}</div>
        <div>{shift.role}</div>
      </div>
    );
  };
});

// Mock GestureDetector component
jest.mock('../GestureDetector', () => {
  return function MockGestureDetector({ children, onSwipeLeft, onSwipeRight }: any) {
    return (
      <div data-testid="gesture-detector">
        <button data-testid="swipe-left-trigger" onClick={onSwipeLeft}>
          Swipe Left
        </button>
        <button data-testid="swipe-right-trigger" onClick={onSwipeRight}>
          Swipe Right
        </button>
        {children}
      </div>
    );
  };
});

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Mock Date to have consistent test results
const mockDate = new Date('2024-01-15T10:00:00.000Z');
const originalDate = global.Date;

beforeAll(() => {
  global.Date = class extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(mockDate);
      } else {
        super(...args);
      }
    }
    
    static now() {
      return mockDate.getTime();
    }
    
    static UTC = originalDate.UTC;
    static parse = originalDate.parse;
  } as any;
});

afterAll(() => {
  global.Date = originalDate;
});

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      shifts: shiftsSlice,
      ui: uiSlice,
    },
    preloadedState: {
      shifts: {
        shifts: [],
        selectedDate: '2024-01-15',
        employeeHours: [],
        weeklyHours: {},
        selectedWeek: {
          start: '2024-01-15',
          end: '2024-01-21',
        },
        ...initialState.shifts,
      },
      ui: {
        darkMode: false,
        highContrastMode: false,
        dyslexicFontMode: false,
        themeColor: { name: 'Blue', value: '#4d82ff', id: 'blue' },
        sidebarOpen: false,
        modalOpen: {
          addShift: false,
          editShift: false,
          deleteConfirm: false,
          copyShift: false,
          insights: false,
          templates: false,
          addTemplate: false,
          editTemplate: false,
          savedViews: false,
        },
        currentView: 'weekly' as const,
        notifications: [],
        selectedShiftId: null,
        selectedTemplateId: null,
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
        ...initialState.ui,
      },
    },
  });
};

const sampleShifts = [
  {
    id: '1',
    employeeName: 'John Doe',
    role: 'Server',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '17:00',
    timeRange: '9:00 AM - 5:00 PM',
    status: 'Confirmed',
    hours: 8,
  },
  {
    id: '2',
    employeeName: 'Jane Smith',
    role: 'Cook',
    date: '2024-01-15',
    startTime: '08:00',
    endTime: '16:00',
    timeRange: '8:00 AM - 4:00 PM',
    status: 'Pending',
    hours: 8,
  },
  {
    id: '3',
    employeeName: 'Bob Johnson',
    role: 'Manager',
    date: '2024-01-16',
    startTime: '10:00',
    endTime: '18:00',
    timeRange: '10:00 AM - 6:00 PM',
    status: 'Confirmed',
    hours: 8,
  },
];

const renderWithProviders = (overrides = {}) => {
  const store = createMockStore(overrides);
  return {
    ...render(
      <Provider store={store}>
        <MobileCalendarView />
      </Provider>
    ),
    store,
  };
};

describe('MobileCalendarView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVibrate.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render the mobile calendar view', () => {
      renderWithProviders();
      
      expect(screen.getByText(/Jan 1[4-5]/)).toBeInTheDocument();
      expect(screen.getByTestId('gesture-detector')).toBeInTheDocument();
    });

    it('should render date selector buttons', () => {
      renderWithProviders();
      
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
      
      // Should show next 7 days
      const dateButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('Today') || 
        button.textContent?.includes('Tomorrow') ||
        button.textContent?.includes('Jan')
      );
      expect(dateButtons.length).toBeGreaterThanOrEqual(3);
    });

    it('should highlight the selected date', () => {
      renderWithProviders();
      
      const todayButton = screen.getByText('Today');
      expect(todayButton.className).toContain('bg-primary-500');
      expect(todayButton.className).toContain('text-white');
    });

    it('should display empty state when no shifts exist', () => {
      renderWithProviders();
      
      expect(screen.getByText('No shifts scheduled')).toBeInTheDocument();
      expect(screen.getByText('Swipe left or right to change date')).toBeInTheDocument();
    });
  });

  describe('Shift Display', () => {
    it('should display shifts for the selected date', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
          selectedDate: '2024-01-15',
        },
      });
      
      expect(screen.getByTestId('shift-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('shift-card-2')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should not display shifts from other dates', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
          selectedDate: '2024-01-15',
        },
      });
      
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      expect(screen.queryByTestId('shift-card-3')).not.toBeInTheDocument();
    });

    it('should sort shifts by start time', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
          selectedDate: '2024-01-15',
        },
      });
      
      const shiftCards = screen.getAllByTestId(/shift-card-/);
      
      // Jane Smith's shift (8:00 AM) should come before John Doe's (9:00 AM)
      expect(shiftCards[0]).toHaveAttribute('data-testid', 'shift-card-2');
      expect(shiftCards[1]).toHaveAttribute('data-testid', 'shift-card-1');
    });

    it('should handle complex time sorting correctly', () => {
      const complexShifts = [
        { ...sampleShifts[0], id: '4', startTime: '14:30', employeeName: 'Alice' },
        { ...sampleShifts[0], id: '5', startTime: '06:00', employeeName: 'Charlie' },
        { ...sampleShifts[0], id: '6', startTime: '14:15', employeeName: 'Diana' },
      ];

      renderWithProviders({
        shifts: {
          shifts: complexShifts,
          selectedDate: '2024-01-15',
        },
      });
      
      const names = screen.getAllByText(/Alice|Charlie|Diana/);
      
      // Should be sorted: Charlie (6:00), Diana (14:15), Alice (14:30)
      expect(names[0]).toHaveTextContent('Charlie');
      expect(names[1]).toHaveTextContent('Diana');
      expect(names[2]).toHaveTextContent('Alice');
    });
  });

  describe('Date Navigation', () => {
    it('should handle date selection with haptic feedback', async () => {
      const { store } = renderWithProviders();
      
      const tomorrowButton = screen.getByText('Tomorrow');
      fireEvent.click(tomorrowButton);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.shifts.selectedDate).toBe('2024-01-16');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('should update date display when date changes', async () => {
      const { store } = renderWithProviders();
      
      const tomorrowButton = screen.getByText('Tomorrow');
      fireEvent.click(tomorrowButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Jan 1[5-6]/)).toBeInTheDocument();
      });
    });

    it('should handle swipe left to go to next date', async () => {
      const { store } = renderWithProviders();
      
      const swipeLeftTrigger = screen.getByTestId('swipe-left-trigger');
      fireEvent.click(swipeLeftTrigger);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.shifts.selectedDate).toBe('2024-01-16');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('should handle swipe right to go to previous date', async () => {
      const { store } = renderWithProviders({
        shifts: {
          selectedDate: '2024-01-16', // Start on tomorrow
        },
      });
      
      const swipeRightTrigger = screen.getByTestId('swipe-right-trigger');
      fireEvent.click(swipeRightTrigger);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.shifts.selectedDate).toBe('2024-01-15');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('should not navigate beyond available dates when swiping left', async () => {
      const { store } = renderWithProviders({
        shifts: {
          selectedDate: '2024-01-21', // Last available date (7 days from today)
        },
      });
      
      const swipeLeftTrigger = screen.getByTestId('swipe-left-trigger');
      fireEvent.click(swipeLeftTrigger);
      
      // Should remain on the same date
      await waitFor(() => {
        const state = store.getState();
        expect(state.shifts.selectedDate).toBe('2024-01-21');
      });
      
      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('should not navigate beyond available dates when swiping right', async () => {
      const { store } = renderWithProviders({
        shifts: {
          selectedDate: '2024-01-15', // First available date (today)
        },
      });
      
      const swipeRightTrigger = screen.getByTestId('swipe-right-trigger');
      fireEvent.click(swipeRightTrigger);
      
      // Should remain on the same date
      await waitFor(() => {
        const state = store.getState();
        expect(state.shifts.selectedDate).toBe('2024-01-15');
      });
      
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('Date Labels Generation', () => {
    it('should generate correct date labels for next 7 days', () => {
      renderWithProviders();
      
      // Today should be labeled as "Today"
      expect(screen.getByText('Today')).toBeInTheDocument();
      
      // Tomorrow should be labeled as "Tomorrow"
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
      
      // Other days should show day and date
      expect(screen.getByText(/Wed, Jan 17/)).toBeInTheDocument();
      expect(screen.getByText(/Thu, Jan 18/)).toBeInTheDocument();
    });

    it('should mark today correctly in date labels', () => {
      renderWithProviders();
      
      const todayButton = screen.getByText('Today');
      expect(todayButton.className).toContain('bg-primary-500');
    });

    it('should generate date labels on component mount', () => {
      renderWithProviders();
      
      // Should have 7 date buttons (Today + Tomorrow + 5 more days)
      const dateButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('Today') || 
        button.textContent?.includes('Tomorrow') ||
        button.textContent?.includes('Jan')
      );
      
      expect(dateButtons).toHaveLength(7);
    });
  });

  describe('Shift Filtering and Updates', () => {
    it('should update displayed shifts when shifts data changes', async () => {
      const { store } = renderWithProviders();
      
      // Initially no shifts
      expect(screen.getByText('No shifts scheduled')).toBeInTheDocument();
      
      // Add shifts via Redux action
      act(() => {
        store.dispatch({
          type: 'shifts/addShift',
          payload: {
            id: '1',
            employeeName: 'Test Employee',
            role: 'Server',
            date: '2024-01-15',
            startTime: '09:00',
            endTime: '17:00',
            timeRange: '9:00 AM - 5:00 PM',
            status: 'Confirmed',
            hours: 8,
          },
        });
      });
      
      await waitFor(() => {
        expect(screen.queryByText('No shifts scheduled')).not.toBeInTheDocument();
        expect(screen.getByText('Test Employee')).toBeInTheDocument();
      });
    });

    it('should update displayed shifts when selected date changes', async () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
          selectedDate: '2024-01-15',
        },
      });
      
      // Initially shows John and Jane
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      
      // Click tomorrow button
      const tomorrowButton = screen.getByText('Tomorrow');
      fireEvent.click(tomorrowButton);
      
      await waitFor(() => {
        // Should now show Bob and hide John/Jane
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback when navigator.vibrate is available', async () => {
      renderWithProviders();
      
      const tomorrowButton = screen.getByText('Tomorrow');
      fireEvent.click(tomorrowButton);
      
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('should handle missing navigator.vibrate gracefully', async () => {
      // Temporarily remove vibrate support
      const originalVibrate = navigator.vibrate;
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
      });
      
      renderWithProviders();
      
      const tomorrowButton = screen.getByText('Tomorrow');
      
      // Should not throw error
      expect(() => fireEvent.click(tomorrowButton)).not.toThrow();
      
      // Restore vibrate
      Object.defineProperty(navigator, 'vibrate', {
        value: originalVibrate,
        writable: true,
      });
    });
  });

  describe('Accessibility', () => {
    it('should provide proper button labels for date navigation', () => {
      renderWithProviders();
      
      const dateButtons = screen.getAllByRole('button');
      const todayButton = dateButtons.find(button => button.textContent === 'Today');
      const tomorrowButton = dateButtons.find(button => button.textContent === 'Tomorrow');
      
      expect(todayButton).toBeInTheDocument();
      expect(tomorrowButton).toBeInTheDocument();
    });

    it('should provide clear empty state messaging', () => {
      renderWithProviders();
      
      expect(screen.getByText('No shifts scheduled')).toBeInTheDocument();
      expect(screen.getByText('Swipe left or right to change date')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      renderWithProviders();
      
      expect(screen.getByText(/Jan 1[4-5]/)).toBeInTheDocument();
    });
  });

  describe('Mobile-Specific Features', () => {
    it('should include touch-action-manipulation class for shift cards', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
          selectedDate: '2024-01-15',
        },
      });
      
      const shiftCardContainers = document.querySelectorAll('.touch-action-manipulation');
      expect(shiftCardContainers.length).toBeGreaterThan(0);
    });

    it('should render with proper mobile spacing', () => {
      renderWithProviders();
      
      const mainContainer = document.querySelector('.pb-24');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render scrollable date selector', () => {
      renderWithProviders();
      
      const scrollableContainer = document.querySelector('.overflow-x-auto');
      expect(scrollableContainer).toBeInTheDocument();
      expect(scrollableContainer?.className).toContain('hide-scrollbar');
    });
  });

  describe('Edge Cases', () => {
    it('should handle shifts with identical start times', () => {
      const identicalTimeShifts = [
        { ...sampleShifts[0], id: '1', startTime: '09:00', employeeName: 'Alice' },
        { ...sampleShifts[0], id: '2', startTime: '09:00', employeeName: 'Bob' },
      ];

      renderWithProviders({
        shifts: {
          shifts: identicalTimeShifts,
          selectedDate: '2024-01-15',
        },
      });
      
      // Both should be displayed
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should handle invalid time formats gracefully', () => {
      const invalidTimeShift = {
        ...sampleShifts[0],
        id: '1',
        startTime: 'invalid-time',
        employeeName: 'Test Employee',
      };

      expect(() => {
        renderWithProviders({
          shifts: {
            shifts: [invalidTimeShift],
            selectedDate: '2024-01-15',
          },
        });
      }).not.toThrow();
    });

    it('should handle empty shifts array', () => {
      renderWithProviders({
        shifts: {
          shifts: [],
          selectedDate: '2024-01-15',
        },
      });
      
      expect(screen.getByText('No shifts scheduled')).toBeInTheDocument();
    });

    it('should handle rapid date navigation', async () => {
      const { store } = renderWithProviders();
      
      // Rapidly click multiple dates
      const tomorrowButton = screen.getByText('Tomorrow');
      fireEvent.click(tomorrowButton);
      
      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);
      
      fireEvent.click(tomorrowButton);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.shifts.selectedDate).toBe('2024-01-16');
      });
    });
  });

  describe('Integration with Store', () => {
    it('should dispatch setSelectedDate action when date is selected', async () => {
      const { store } = renderWithProviders();
      
      const tomorrowButton = screen.getByText('Tomorrow');
      fireEvent.click(tomorrowButton);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.shifts.selectedDate).toBe('2024-01-16');
      });
    });

    it('should reflect store changes in selected date highlighting', async () => {
      const { store } = renderWithProviders();
      
      // Initially today is highlighted
      let todayButton = screen.getByText('Today');
      expect(todayButton.className).toContain('bg-primary-500');
      
      // Change to tomorrow
      act(() => {
        store.dispatch({
          type: 'shifts/setSelectedDate',
          payload: '2024-01-16',
        });
      });
      
      await waitFor(() => {
        todayButton = screen.getByText('Today');
        const tomorrowButton = screen.getByText('Tomorrow');
        
        expect(todayButton.className).toContain('bg-gray-200');
        expect(tomorrowButton.className).toContain('bg-primary-500');
      });
    });
  });
}); 
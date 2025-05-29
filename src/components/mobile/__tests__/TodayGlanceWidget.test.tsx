import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TodayGlanceWidget from '../TodayGlanceWidget';
import shiftsSlice from '../../../store/shiftsSlice';
import uiSlice from '../../../store/uiSlice';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileTap, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, whileTap, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock window.innerWidth for mobile testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 375,
});

// Mock GestureDetector component
jest.mock('../GestureDetector', () => {
  return function MockGestureDetector({ children, onSwipeUp, onSwipeDown }: any) {
    return (
      <div data-testid="gesture-detector">
        <button data-testid="swipe-up-trigger" onClick={onSwipeUp}>
          Swipe Up
        </button>
        <button data-testid="swipe-down-trigger" onClick={onSwipeDown}>
          Swipe Down
        </button>
        {children}
      </div>
    );
  };
});

// Mock sound effects hook
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: jest.fn(),
  }),
}));

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Mock Date to have consistent test results
const mockDate = new Date('2024-01-15T10:30:00.000Z');
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
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '18:00',
    timeRange: '10:00 AM - 6:00 PM',
    status: 'Confirmed',
    hours: 8,
  },
  {
    id: '4',
    employeeName: 'Alice Brown',
    role: 'Host',
    date: '2024-01-15',
    startTime: '11:00',
    endTime: '19:00',
    timeRange: '11:00 AM - 7:00 PM',
    status: 'Draft',
    hours: 8,
  },
];

const renderWithProviders = (overrides = {}) => {
  const store = createMockStore(overrides);
  return {
    ...render(
      <Provider store={store}>
        <TodayGlanceWidget />
      </Provider>
    ),
    store,
  };
};

describe('TodayGlanceWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVibrate.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render the today glance widget header', () => {
      renderWithProviders();
      
      expect(screen.getByText("Today at a Glance")).toBeInTheDocument();
      expect(screen.getByTestId('gesture-detector')).toBeInTheDocument();
    });

    it('should start collapsed when there are no shifts', () => {
      renderWithProviders();
      
      expect(screen.getByText("Today at a Glance")).toBeInTheDocument();
      expect(screen.queryByText("Today's Schedule")).not.toBeInTheDocument();
    });

    it('should expand automatically when there are shifts for today', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
        },
      });
      
      expect(screen.getByText("Today at a Glance")).toBeInTheDocument();
      expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
    });

    it('should show empty state when expanded with no shifts', () => {
      renderWithProviders();
      
      // Click to expand the widget
      const toggleButton = screen.getByText("Today at a Glance");
      fireEvent.click(toggleButton);
      
      expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
      expect(screen.getByText('No shifts scheduled for today')).toBeInTheDocument();
    });

    it('should render with proper styling classes', () => {
      renderWithProviders();
      
      const widget = document.querySelector('.bg-white');
      expect(widget).toBeInTheDocument();
      expect(widget?.className).toContain('shadow-sm');
    });
  });

  describe('Widget Toggle Functionality', () => {
    it('should toggle visibility when header is clicked', () => {
      renderWithProviders();
      
      const toggleButton = screen.getByText("Today at a Glance");
      
      // Initially collapsed
      expect(screen.queryByText("Today's Schedule")).not.toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(toggleButton);
      expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
      
      // Click to collapse
      fireEvent.click(toggleButton);
      expect(screen.queryByText("Today's Schedule")).not.toBeInTheDocument();
    });

    it('should trigger haptic feedback when toggling', () => {
      renderWithProviders();
      
      const toggleButton = screen.getByText("Today at a Glance");
      fireEvent.click(toggleButton);
      
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('should rotate chevron icon when expanded', () => {
      renderWithProviders();
      
      const toggleButton = screen.getByText("Today at a Glance");
      fireEvent.click(toggleButton);
      
      const chevronIcon = document.querySelector('.rotate-180');
      expect(chevronIcon).toBeInTheDocument();
    });
  });

  describe('Shift Display', () => {
    it('should display shifts for today when expanded', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
        },
      });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    });

    it('should display shift details correctly', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
        },
      });
      
      expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Server')).toBeInTheDocument();
      
      // There are multiple "Confirmed" statuses, so check for at least one
      const confirmedStatuses = screen.getAllByText('Confirmed');
      expect(confirmedStatuses.length).toBeGreaterThan(0);
    });

    it('should sort shifts by start time', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
        },
      });
      
      const employeeNames = screen.getAllByText(/John Doe|Jane Smith|Bob Johnson|Alice Brown/);
      
      // Jane Smith (8:00 AM) should come first, then John Doe (9:00 AM), then Bob (10:00 AM), then Alice (11:00 AM)
      expect(employeeNames[0]).toHaveTextContent('Jane Smith');
      expect(employeeNames[1]).toHaveTextContent('John Doe');
      expect(employeeNames[2]).toHaveTextContent('Bob Johnson');
      expect(employeeNames[3]).toHaveTextContent('Alice Brown');
    });

    it('should display status indicators with correct styling', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
        },
      });
      
      const confirmedStatus = screen.getAllByText('Confirmed');
      expect(confirmedStatus[0].className).toContain('text-green-600');
      
      const pendingStatus = screen.getByText('Pending');
      expect(pendingStatus.className).toContain('text-yellow-600');
    });

    it('should not display shifts from other dates', () => {
      const shiftsWithOtherDates = [
        ...sampleShifts,
        {
          id: '5',
          employeeName: 'Tomorrow Worker',
          role: 'Server',
          date: '2024-01-16',
          startTime: '09:00',
          endTime: '17:00',
          timeRange: '9:00 AM - 5:00 PM',
          status: 'Confirmed',
          hours: 8,
        },
      ];

      renderWithProviders({
        shifts: {
          shifts: shiftsWithOtherDates,
        },
      });
      
      expect(screen.queryByText('Tomorrow Worker')).not.toBeInTheDocument();
    });
  });

  describe('Gesture Controls', () => {
    it('should expand when swiping up (while collapsed)', () => {
      renderWithProviders();
      
      // Initially collapsed
      expect(screen.queryByText("Today's Schedule")).not.toBeInTheDocument();
      
      // Swipe up to expand
      const swipeUpTrigger = screen.getByTestId('swipe-up-trigger');
      fireEvent.click(swipeUpTrigger);
      
      expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
    });

    it('should collapse when swiping down (while expanded)', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
        },
      });
      
      // Initially expanded (has shifts)
      expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
      
      // Swipe down to collapse
      const swipeDownTrigger = screen.getByTestId('swipe-down-trigger');
      fireEvent.click(swipeDownTrigger);
      
      expect(screen.queryByText("Today's Schedule")).not.toBeInTheDocument();
    });

    it('should not respond to swipe down when already collapsed', () => {
      renderWithProviders();
      
      // Initially collapsed
      expect(screen.queryByText("Today's Schedule")).not.toBeInTheDocument();
      
      // Try to swipe down (should do nothing)
      const swipeDownTrigger = screen.getByTestId('swipe-down-trigger');
      fireEvent.click(swipeDownTrigger);
      
      expect(screen.queryByText("Today's Schedule")).not.toBeInTheDocument();
    });

    it('should not respond to swipe up when already expanded', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
        },
      });
      
      // Initially expanded
      expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
      
      // Try to swipe up (should do nothing)
      const swipeUpTrigger = screen.getByTestId('swipe-up-trigger');
      fireEvent.click(swipeUpTrigger);
      
      expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
    });
  });

  describe('Role Badge Styling', () => {
    it('should apply correct colors for different roles', () => {
      renderWithProviders({
        shifts: {
          shifts: sampleShifts,
        },
      });
      
      const serverBadge = screen.getByText('Server');
      expect(serverBadge.className).toContain('bg-purple-100');
      
      const cookBadge = screen.getByText('Cook');
      expect(cookBadge.className).toContain('bg-red-100');
      
      const managerBadge = screen.getByText('Manager');
      expect(managerBadge.className).toContain('bg-yellow-100');
      
      const hostBadge = screen.getByText('Host');
      expect(hostBadge.className).toContain('bg-gray-100');
    });
  });

  describe('Responsive Design', () => {
    it('should not render on desktop (window width >= 768)', () => {
      // Set desktop width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { container } = renderWithProviders();
      
      expect(container.firstChild).toBeNull();
      
      // Reset to mobile width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('should provide proper spacing div for content below', () => {
      renderWithProviders();
      
      const spacingDiv = document.querySelector('[style*="height"]');
      expect(spacingDiv).toBeInTheDocument();
      expect(spacingDiv?.className).toContain('w-full');
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes when enabled', () => {
      renderWithProviders({
        ui: {
          darkMode: true,
        },
      });
      
      const widget = document.querySelector('.dark\\:bg-dark-700');
      expect(widget).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shifts array', () => {
      renderWithProviders({
        shifts: {
          shifts: [],
        },
      });
      
      const toggleButton = screen.getByText("Today at a Glance");
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('No shifts scheduled for today')).toBeInTheDocument();
    });

    it('should handle shifts with invalid time formats gracefully', () => {
      const invalidTimeShifts = [
        {
          id: '1',
          employeeName: 'Invalid Worker',
          role: 'Server',
          date: '2024-01-15',
          startTime: 'invalid-time',
          endTime: 'also-invalid',
          timeRange: 'Invalid Time',
          status: 'Confirmed',
          hours: 8,
        },
      ];

      expect(() => {
        renderWithProviders({
          shifts: {
            shifts: invalidTimeShifts,
          },
        });
      }).not.toThrow();
      
      expect(screen.getByText('Invalid Worker')).toBeInTheDocument();
    });

    it('should handle missing navigator.vibrate gracefully', () => {
      // Temporarily remove vibrate support
      const originalVibrate = navigator.vibrate;
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
      });
      
      renderWithProviders();
      
      const toggleButton = screen.getByText("Today at a Glance");
      
      // Should not throw error
      expect(() => fireEvent.click(toggleButton)).not.toThrow();
      
      // Restore vibrate
      Object.defineProperty(navigator, 'vibrate', {
        value: originalVibrate,
        writable: true,
      });
    });

    it('should handle very large number of shifts', () => {
      const manyShifts = Array.from({ length: 20 }, (_, i) => ({
        id: `shift-${i}`,
        employeeName: `Employee ${i}`,
        role: 'Server',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '17:00',
        timeRange: '9:00 AM - 5:00 PM',
        status: 'Confirmed',
        hours: 8,
      }));

      expect(() => {
        renderWithProviders({
          shifts: {
            shifts: manyShifts,
          },
        });
      }).not.toThrow();
      
      expect(screen.getByText('Employee 0')).toBeInTheDocument();
      expect(screen.getByText('Employee 19')).toBeInTheDocument();
    });
  });

  describe('Updates and State Changes', () => {
    it('should update when shifts data changes', async () => {
      const { store } = renderWithProviders();
      
      // Initially no content expanded
      expect(screen.queryByText("Today's Schedule")).not.toBeInTheDocument();
      
      // Add a shift
      act(() => {
        store.dispatch({
          type: 'shifts/addShift',
          payload: {
            id: '1',
            employeeName: 'New Employee',
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
        expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
        expect(screen.getByText('New Employee')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button for toggle functionality', () => {
      renderWithProviders();
      
      const toggleButton = screen.getByRole('button', { name: /today at a glance/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should have semantic heading structure', () => {
      renderWithProviders();
      
      const toggleButton = screen.getByText("Today at a Glance");
      fireEvent.click(toggleButton);
      
      const heading = screen.getByText("Today's Schedule");
      expect(heading.tagName).toBe('H2');
    });

    it('should provide clear empty state messaging', () => {
      renderWithProviders();
      
      const toggleButton = screen.getByText("Today at a Glance");
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('No shifts scheduled for today')).toBeInTheDocument();
    });
  });
}); 
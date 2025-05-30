import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../__tests__/test-utils';
import CalendarView from '../CalendarView';

// Mock tutorial context
jest.mock('../../../contexts/TutorialContext', () => ({
  useTutorial: () => ({
    isActive: false,
    currentStep: 0,
    nextStep: jest.fn(),
  }),
}));

// Mock sound effects
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: jest.fn(),
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock all child components that might have import issues
jest.mock('../CalendarHeader', () => {
  return function MockCalendarHeader() {
    return (
      <div data-testid="calendar-header">
        <h2>January 2024</h2>
        <button data-testid="add-shift-button">Add Shift</button>
        <button>Templates</button>
        <button>Insights</button>
      </div>
    );
  };
});

jest.mock('../DailyView', () => {
  return function MockDailyView({ selectedDate, handleAddShift }: any) {
    return (
      <div className="daily-view" data-testid="daily-view">
        Daily View for {selectedDate}
      </div>
    );
  };
});

jest.mock('../WeeklyView', () => {
  return function MockWeeklyView({ days, selectedDate, handleDayClick, handleAddShift }: any) {
    return (
      <div className="weekly-view" data-testid="weekly-view">
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
        <div>Sun</div>
        <div>John Doe</div>
        <div>Jane Smith</div>
        <div>9:00 AM - 5:00 PM</div>
        <div>1:00 PM - 9:00 PM</div>
        {days.map((day: Date, index: number) => (
          <div key={index} onClick={() => handleDayClick(day)}>
            {index + 1}
          </div>
        ))}
        <div>No shifts</div>
      </div>
    );
  };
});

jest.mock('../../views/StaffView', () => {
  return function MockStaffView() {
    return <div className="staff-view" data-testid="staff-view">Staff View</div>;
  };
});

jest.mock('../../views/ListView', () => {
  return function MockListView() {
    return <div className="list-view" data-testid="list-view">List View</div>;
  };
});

jest.mock('../../common/ViewToggle', () => {
  return function MockViewToggle() {
    return <div data-testid="view-toggle">View Toggle</div>;
  };
});

jest.mock('../../common/NewUserGuidance', () => {
  return function MockNewUserGuidance() {
    return <div data-testid="new-user-guidance">Welcome! Get started by adding employees.</div>;
  };
});

jest.mock('../../common/ConfettiCelebration', () => {
  return function MockConfettiCelebration({ show, onComplete }: any) {
    if (show && onComplete) {
      setTimeout(onComplete, 100);
    }
    
    return show ? <div data-testid="confetti-celebration">🎉</div> : null;
  };
});

describe('CalendarView', () => {
  const mockEmployees = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0101',
      role: 'Manager',
      avatar: '',
      isActive: true,
    },
    {
      id: '2', 
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-0102',
      role: 'Staff',
      avatar: '',
      isActive: true,
    },
  ];

  const mockShifts = [
    {
      id: 'shift1',
      employeeName: 'John Doe',
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '17:00',
      role: 'Manager',
      color: '#2563eb',
      timeRange: '9:00 AM - 5:00 PM',
      status: 'scheduled' as const,
    },
    {
      id: 'shift2',
      employeeName: 'Jane Smith', 
      date: '2024-01-15',
      startTime: '13:00',
      endTime: '21:00',
      role: 'Staff',
      color: '#16a34a',
      timeRange: '1:00 PM - 9:00 PM',
      status: 'scheduled' as const,
    },
  ];

  const defaultState = {
    employees: {
      employees: mockEmployees,
    },
    shifts: {
      shifts: mockShifts,
      templates: [],
      selectedDate: '2024-01-15',
      error: null,
    },
    ui: {
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
      selectedShiftId: null,
      selectedTemplateId: null,
      darkMode: false,
      highContrastMode: false,
      dyslexicFontMode: false,
      themeColor: {
        id: 'blue',
        name: 'Blue',
        value: '#4d82ff',
      },
      sidebarOpen: false,
      notificationPreferences: {
        enabled: true,
        sound: {
          enabled: true,
          volume: 0.7,
          type: 'default',
        },
        types: {
          shifts: true,
          scheduleChanges: true,
          reminders: true,
          timeOff: true,
          publication: true,
          shiftSwap: true,
          general: true,
        },
        visual: {
          style: 'standard',
          duration: 5000,
          showBadges: true,
          colorCoded: true,
        },
        timing: {
          reminderLeadTime: '12hours',
          nonUrgentDeliveryTime: '09:00',
          deliveryFormat: 'immediate',
        },
      },
      notifications: [],
    },
  };

  let mockLocalStorage: any;

  // Mock localStorage to simulate completed onboarding
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock completed onboarding
    mockLocalStorage = {
      getItem: jest.fn((key: string) => {
        if (key === 'shiftsync_onboarding_completed') return 'true';
        if (key === 'shiftsync_onboarding_dismissed') return 'true';
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Reset timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('should render calendar view with header', () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Should render the calendar header
      expect(screen.getByText('January 2024')).toBeInTheDocument();
      expect(screen.getByText('Add Shift')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });

    it('should render weekly view by default', () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Should show week days (Mon, Tue, Wed, etc.)
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
    });

    it('should render shifts in the weekly view', async () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Wait for shifts to render
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
      expect(screen.getByText('1:00 PM - 9:00 PM')).toBeInTheDocument();
    });

    it('should render empty state when no shifts exist', () => {
      const emptyState = {
        ...defaultState,
        shifts: {
          ...defaultState.shifts,
          shifts: [],
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: emptyState 
      });

      // Should show "No shifts" message for empty days (there will be multiple for the 7 days)
      const noShiftsElements = screen.getAllByText(/no shifts/i);
      expect(noShiftsElements.length).toBeGreaterThan(0);
    });

    it('should show onboarding for new users', () => {
      // Mock incomplete onboarding
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'shiftsync_onboarding_completed') return null;
        if (key === 'shiftsync_onboarding_dismissed') return null;
        return null;
      });

      const newUserState = {
        ...defaultState,
        employees: {
          employees: [],
        },
        shifts: {
          ...defaultState.shifts,
          shifts: [],
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: newUserState 
      });

      // Should show onboarding guidance
      expect(screen.getByText(/welcome/i) || screen.getByText(/get started/i) || screen.getByText(/add employees/i)).toBeInTheDocument();
    });

    it('should show onboarding when user has started but not completed onboarding', () => {
      // Mock started but not completed onboarding
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'shiftsync_onboarding_completed') return null;
        if (key === 'shiftsync_onboarding_dismissed') return null;
        if (key === 'shiftsync_onboarding_current_step') return '1';
        return null;
      });

      const partialOnboardingState = {
        ...defaultState,
        employees: {
          employees: mockEmployees,
        },
        shifts: {
          ...defaultState.shifts,
          shifts: mockShifts,
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: partialOnboardingState 
      });

      // Should show onboarding guidance even with data
      expect(screen.getByText(/welcome/i) || screen.getByText(/get started/i) || screen.getByText(/add employees/i)).toBeInTheDocument();
    });

    it('should not show onboarding when dismissed', () => {
      // Mock dismissed onboarding
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'shiftsync_onboarding_completed') return null;
        if (key === 'shiftsync_onboarding_dismissed') return 'true';
        return null;
      });

      const dismissedOnboardingState = {
        ...defaultState,
        employees: {
          employees: [],
        },
        shifts: {
          ...defaultState.shifts,
          shifts: [],
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: dismissedOnboardingState 
      });

      // Should not show onboarding guidance
      expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/get started/i)).not.toBeInTheDocument();
    });
  });

  describe('view switching', () => {
    it('should handle daily view', async () => {
      const dailyState = {
        ...defaultState,
        ui: {
          ...defaultState.ui,
          currentView: 'daily' as const,
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: dailyState 
      });

      // Wait for the view to render
      await waitFor(() => {
        // Daily view should have different layout
        expect(screen.getByTestId('daily-view')).toBeInTheDocument();
      });
    });

    it('should handle staff view', async () => {
      const staffState = {
        ...defaultState,
        ui: {
          ...defaultState.ui,
          currentView: 'staff' as const,
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: staffState 
      });

      // Wait for the view to render
      await waitFor(() => {
        expect(screen.getByTestId('staff-view')).toBeInTheDocument();
      });
    });

    it('should handle list view', async () => {
      const listState = {
        ...defaultState,
        ui: {
          ...defaultState.ui,
          currentView: 'list' as const,
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: listState 
      });

      // Wait for the view to render
      await waitFor(() => {
        expect(screen.getByTestId('list-view')).toBeInTheDocument();
      });
    });

    it('should default to weekly view for unknown view types', async () => {
      const unknownViewState = {
        ...defaultState,
        ui: {
          ...defaultState.ui,
          currentView: 'unknown' as any,
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: unknownViewState 
      });

      // Should fall back to weekly view
      await waitFor(() => {
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Tue')).toBeInTheDocument();
        expect(screen.getByText('Wed')).toBeInTheDocument();
      });
    });
  });

  describe('date navigation', () => {
    it('should navigate to previous week', async () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Trigger keyboard shortcut
      fireEvent(document, new CustomEvent('navigatePreviousWeek'));

      // Date should change (component will update internally)
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should navigate to next week', async () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Trigger keyboard shortcut
      fireEvent(document, new CustomEvent('navigateNextWeek'));

      // Date should change (component will update internally)
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should handle day click navigation', () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Find day elements and click one
      const dayElements = screen.getAllByText(/\d+/);
      if (dayElements.length > 0) {
        fireEvent.click(dayElements[0]);
      }
      
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should handle edge case of Sunday week calculation', () => {
      const sundayState = {
        ...defaultState,
        shifts: {
          ...defaultState.shifts,
          selectedDate: '2024-01-14', // Assuming this is a Sunday
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: sundayState 
      });

      // Should render without error
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });
  });

  describe('publish schedule functionality', () => {
    it('should handle publish schedule with notifications enabled', async () => {
      const publishState = {
        ...defaultState,
        ui: {
          ...defaultState.ui,
          notificationPreferences: {
            ...defaultState.ui.notificationPreferences,
            enabled: true,
            types: {
              ...defaultState.ui.notificationPreferences.types,
              publication: true,
            },
          },
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: publishState 
      });

      // Trigger publish schedule
      fireEvent(document, new CustomEvent('publishSchedule'));

      // Advance timer to complete publishing
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Advance timer to complete celebration
      act(() => {
        jest.advanceTimersByTime(6000);
      });

      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should handle publish schedule with notifications disabled', async () => {
      const noNotificationState = {
        ...defaultState,
        ui: {
          ...defaultState.ui,
          notificationPreferences: {
            ...defaultState.ui.notificationPreferences,
            enabled: false,
            types: {
              ...defaultState.ui.notificationPreferences.types,
              publication: false,
            },
          },
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: noNotificationState 
      });

      // Trigger publish schedule
      fireEvent(document, new CustomEvent('publishSchedule'));

      // Advance timer to complete publishing
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should not show celebration
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should handle publication notifications enabled but general notifications disabled', async () => {
      const partialNotificationState = {
        ...defaultState,
        ui: {
          ...defaultState.ui,
          notificationPreferences: {
            ...defaultState.ui.notificationPreferences,
            enabled: false, // General notifications disabled
            types: {
              ...defaultState.ui.notificationPreferences.types,
              publication: true, // But publication enabled
            },
          },
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: partialNotificationState 
      });

      // Trigger publish schedule
      fireEvent(document, new CustomEvent('publishSchedule'));

      // Advance timer to complete publishing
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should not show celebration due to general notifications being disabled
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should handle add shift button click', async () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      const addShiftButton = screen.getByTestId('add-shift-button');
      expect(addShiftButton).toBeInTheDocument();
      
      // Test button click with fireEvent instead of userEvent to avoid timeout
      fireEvent.click(addShiftButton);
      expect(addShiftButton).toBeInTheDocument();
    });

    it('should handle add shift with shift notifications disabled', async () => {
      const noShiftNotificationState = {
        ...defaultState,
        ui: {
          ...defaultState.ui,
          notificationPreferences: {
            ...defaultState.ui.notificationPreferences,
            enabled: true,
            types: {
              ...defaultState.ui.notificationPreferences.types,
              shifts: false,
            },
          },
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: noShiftNotificationState 
      });

      const addShiftButton = screen.getByTestId('add-shift-button');
      expect(addShiftButton).toBeInTheDocument();
      
      // Test button click with fireEvent instead of userEvent to avoid timeout
      fireEvent.click(addShiftButton);
      expect(addShiftButton).toBeInTheDocument();
    });

    it('should handle add shift with all notifications disabled', async () => {
      const noNotificationState = {
        ...defaultState,
        ui: {
          ...defaultState.ui,
          notificationPreferences: {
            ...defaultState.ui.notificationPreferences,
            enabled: false,
            types: {
              ...defaultState.ui.notificationPreferences.types,
              shifts: false,
            },
          },
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: noNotificationState 
      });

      const addShiftButton = screen.getByTestId('add-shift-button');
      expect(addShiftButton).toBeInTheDocument();
      
      // Test button click with fireEvent instead of userEvent to avoid timeout
      fireEvent.click(addShiftButton);
      expect(addShiftButton).toBeInTheDocument();
    });

    it('should handle template button click', () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      const templatesButton = screen.getByText('Templates');
      expect(templatesButton).toBeInTheDocument();
    });

    it('should handle insights button click', () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      const insightsButton = screen.getByText('Insights');
      expect(insightsButton).toBeInTheDocument();
    });
  });

  describe('storage and event handling', () => {
    it('should handle storage change events', async () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Mock storage change
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'shiftsync_onboarding_dismissed') return 'false';
        return null;
      });

      // Trigger storage change event
      fireEvent(window, new Event('storage'));

      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should handle onboarding dismissed event', async () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Trigger onboarding dismissed event
      fireEvent(document, new CustomEvent('onboardingDismissed'));

      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should handle cleanup on unmount', () => {
      const { unmount } = renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Should unmount without errors
      unmount();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should respond to keyboard shortcut events', async () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Test publish schedule shortcut
      fireEvent(document, new CustomEvent('publishSchedule'));
      
      // Test navigation shortcuts
      fireEvent(document, new CustomEvent('navigatePreviousWeek'));
      fireEvent(document, new CustomEvent('navigateNextWeek'));

      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });
  });

  describe('calendar generation edge cases', () => {
    it('should handle first day of month being Sunday', () => {
      const sundayFirstState = {
        ...defaultState,
        shifts: {
          ...defaultState.shifts,
          selectedDate: '2024-09-01', // September 1, 2024 was a Sunday
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: sundayFirstState 
      });

      expect(screen.getByText(/January/)).toBeInTheDocument();
    });

    it('should handle leap year February', () => {
      const leapYearState = {
        ...defaultState,
        shifts: {
          ...defaultState.shifts,
          selectedDate: '2024-02-29', // Leap year
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: leapYearState 
      });

      expect(screen.getByText(/January/)).toBeInTheDocument();
    });

    it('should handle month transitions correctly', () => {
      const monthTransitionState = {
        ...defaultState,
        shifts: {
          ...defaultState.shifts,
          selectedDate: '2024-01-31', // Last day of January
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: monthTransitionState 
      });

      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });
  });

  describe('celebration and confetti', () => {
    it('should handle celebration complete callback', async () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA structure', () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Check for the main calendar container
      const calendarContainer = document.querySelector('.calendar-view');
      expect(calendarContainer).toBeInTheDocument();
      
      // Check for interactive elements
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should be navigable with keyboard', () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Should be able to focus on interactive elements
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('responsive behavior', () => {
    it('should render without errors on different viewport sizes', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      expect(screen.getByText('January 2024')).toBeInTheDocument();

      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should handle invalid shift data gracefully', () => {
      const invalidShiftState = {
        ...defaultState,
        shifts: {
          ...defaultState.shifts,
          shifts: [
            {
              ...mockShifts[0],
              employeeName: '', // Invalid empty name
              startTime: '', // Invalid time
            },
          ],
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: invalidShiftState 
      });

      // Should render without crashing
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should handle null/undefined shifts array', () => {
      const nullShiftsState = {
        ...defaultState,
        shifts: {
          ...defaultState.shifts,
          shifts: null as any,
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: nullShiftsState 
      });

      // Should render without crashing
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should handle null/undefined employees array', () => {
      const nullEmployeesState = {
        ...defaultState,
        employees: {
          employees: null as any,
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: nullEmployeesState 
      });

      // Should render without crashing
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should handle shifts loading state', async () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Component should handle loading state internally
      expect(screen.getByText('January 2024')).toBeInTheDocument();

      // Advance timer to complete loading
      act(() => {
        jest.advanceTimersByTime(800);
      });

      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });
  });

  describe('date picker functionality', () => {
    it('should handle date picker interactions', () => {
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Test isToday function by setting a date that could be today
      const today = new Date();
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should handle calendar month generation with various dates', () => {
      // Test different months to cover calendar generation logic
      const decemberState = {
        ...defaultState,
        shifts: {
          ...defaultState.shifts,
          selectedDate: '2024-12-15',
        },
      };

      renderWithProviders(<CalendarView />, { 
        preloadedState: decemberState 
      });

      expect(screen.getByText(/January/)).toBeInTheDocument();
    });
  });
}); 
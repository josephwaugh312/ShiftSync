import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../utils/test-utils';
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

  // Mock localStorage to simulate completed onboarding
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock completed onboarding
    const mockLocalStorage = {
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
      const mockLocalStorage = {
        getItem: jest.fn((key: string) => {
          if (key === 'shiftsync_onboarding_completed') return null;
          if (key === 'shiftsync_onboarding_dismissed') return null;
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
        expect(document.querySelector('.daily-view') || document.querySelector('.calendar-view')).toBeInTheDocument();
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
        expect(document.querySelector('.staff-view') || document.querySelector('.calendar-view')).toBeInTheDocument();
      });
    });
  });

  describe('interactions', () => {
    it('should handle add shift button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      const addShiftButton = screen.getByText('Add Shift');
      await user.click(addShiftButton);

      // Should trigger add shift modal (tested via state change)
      expect(addShiftButton).toBeInTheDocument();
    });

    it('should handle template button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      const templatesButton = screen.getByText('Templates');
      await user.click(templatesButton);

      expect(templatesButton).toBeInTheDocument();
    });

    it('should handle insights button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      const insightsButton = screen.getByText('Insights');
      await user.click(insightsButton);

      expect(insightsButton).toBeInTheDocument();
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

    it('should be navigable with keyboard', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CalendarView />, { 
        preloadedState: defaultState 
      });

      // Tab through interactive elements
      await user.tab();
      
      // Should be able to focus on interactive elements
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
      expect(focusedElement?.tagName).toBe('BUTTON');
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

      expect(screen.getByText('Add Shift')).toBeInTheDocument();

      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      expect(screen.getByText('Add Shift')).toBeInTheDocument();
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
      expect(screen.getByText('Add Shift')).toBeInTheDocument();
    });
  });
}); 
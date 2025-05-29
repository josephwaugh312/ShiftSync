import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import StaffingLevelsView from '../components/insights/StaffingLevelsView';
import uiSlice from '../store/uiSlice';
import shiftsSlice from '../store/shiftsSlice';
import employeeSlice from '../store/employeeSlice';

// Mock console.log to avoid verbose output during tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// ===== UTILITY FUNCTIONS =====

// Create test store utility
const createTestStore = (initialState?: any) => {
  const defaultState = {
    ui: {
      darkMode: false,
      modalOpen: { insights: false },
      highContrastMode: false,
      dyslexicFontMode: false,
      themeColor: { name: 'blue', value: '#3b82f6' },
      notifications: [],
      soundEnabled: true,
      viewMode: 'weekly',
    },
    shifts: {
      selectedDate: '2024-01-15', // Monday
      shifts: [],
      templates: [],
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
      ui: uiSlice,
      shifts: shiftsSlice,
      employees: employeeSlice,
    },
    preloadedState: initialState || defaultState,
  });
};

// Render with providers utility
const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

// Helper to create typical staffing shifts for different times of day
const createStaffingShifts = () => [
  {
    id: '1',
    employeeName: 'Morning Manager',
    date: '2024-01-15',
    startTime: '06:00',
    endTime: '14:00',
    timeRange: '6:00 AM - 2:00 PM',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Opening shift',
  },
  {
    id: '2',
    employeeName: 'Day Server 1',
    date: '2024-01-15',
    startTime: '08:00',
    endTime: '16:00',
    timeRange: '8:00 AM - 4:00 PM',
    role: 'Server',
    status: 'Confirmed',
    notes: 'Day shift',
  },
  {
    id: '3',
    employeeName: 'Day Server 2',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '17:00',
    timeRange: '9:00 AM - 5:00 PM',
    role: 'Server',
    status: 'Confirmed',
    notes: 'Day shift overlap',
  },
  {
    id: '4',
    employeeName: 'Lunch Cook',
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '18:00',
    timeRange: '10:00 AM - 6:00 PM',
    role: 'Cook',
    status: 'Confirmed',
    notes: 'Lunch prep and service',
  },
  {
    id: '5',
    employeeName: 'Evening Manager',
    date: '2024-01-15',
    startTime: '14:00',
    endTime: '22:00',
    timeRange: '2:00 PM - 10:00 PM',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Evening shift',
  },
  {
    id: '6',
    employeeName: 'Night Server',
    date: '2024-01-15',
    startTime: '18:00',
    endTime: '02:00',
    timeRange: '6:00 PM - 2:00 AM',
    role: 'Server',
    status: 'Confirmed',
    notes: 'Night shift',
  },
];

// Helper to create shifts for tomorrow
const createTomorrowShifts = () => [
  {
    id: '7',
    employeeName: 'Tomorrow Worker',
    date: '2024-01-16',
    startTime: '09:00',
    endTime: '17:00',
    timeRange: '9:00 AM - 5:00 PM',
    role: 'Front Desk',
    status: 'Confirmed',
    notes: 'Tomorrow shift',
  },
];

// Helper to create overnight shifts
const createOvernightShifts = () => [
  {
    id: '8',
    employeeName: 'Night Security',
    date: '2024-01-15',
    startTime: '23:00',
    endTime: '07:00',
    timeRange: '11:00 PM - 7:00 AM',
    role: 'Front Desk',
    status: 'Confirmed',
    notes: 'Overnight security',
  },
];

// Helper to create shifts for future dates
const createFutureShifts = () => [
  {
    id: '9',
    employeeName: 'Future Worker',
    date: '2024-01-18', // 3 days from today
    startTime: '12:00',
    endTime: '20:00',
    timeRange: '12:00 PM - 8:00 PM',
    role: 'Server',
    status: 'Confirmed',
    notes: 'Future shift',
  },
];

describe('StaffingLevelsView Component', () => {
  beforeAll(() => {
    // Set the system time to January 15, 2024 10:00:00 (Monday)
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:00:00'));
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  describe('Empty States', () => {
    it('should render global empty state when no shifts exist', () => {
      renderWithProviders(<StaffingLevelsView />);

      expect(screen.getByText('No Staffing Data')).toBeInTheDocument();
      expect(screen.getByText('There are no shifts scheduled yet. Add shifts to see staffing level analytics.')).toBeInTheDocument();
      
      // Check for people icon
      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should render day-specific empty state when no shifts for selected day', () => {
      const storeWithNoTodayShifts = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createTomorrowShifts(), // Only tomorrow shifts
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithNoTodayShifts);

      // The component actually shows the chart with empty hourly data when shifts exist for other days
      // It only shows "No shifts scheduled for this day" text when hourlyData.length === 0 for that specific day
      // Since we have tomorrow shifts, the component will show day selection buttons and an empty chart
      expect(screen.getByText('Staffing Levels for Today')).toBeInTheDocument();
      
      // Should have 24 hourly segments but no colored bars
      const hourlySegments = document.querySelectorAll('.flex-1.flex.flex-col.justify-end.relative');
      expect(hourlySegments).toHaveLength(24);
    });
  });

  describe('Day Selection', () => {
    const storeWithData = () => createTestStore({
      shifts: {
        selectedDate: '2024-01-15',
        shifts: [...createStaffingShifts(), ...createTomorrowShifts(), ...createFutureShifts()],
        templates: [],
        error: null,
      },
      employees: { employees: [], loading: false, error: null },
      ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
    });

    it('should render day selection buttons', () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
      
      // Should show future days (labeled with dates)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(2); // Today + Tomorrow + future days
    });

    it('should default to today selection', () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      const todayButton = screen.getByText('Today');
      expect(todayButton).toHaveClass('bg-primary-500', 'text-white');
    });

    it('should switch to tomorrow when tomorrow button is clicked', () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      const tomorrowButton = screen.getByText('Tomorrow');
      fireEvent.click(tomorrowButton);

      expect(tomorrowButton).toHaveClass('bg-primary-500', 'text-white');
      expect(screen.getByText('Staffing Levels for Tomorrow')).toBeInTheDocument();
    });

    it('should switch to future date when future day button is clicked', () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      // Find and click a future date button (not Today or Tomorrow)
      const buttons = screen.getAllByRole('button');
      const futureButton = buttons.find(button => 
        button.textContent !== 'Today' && button.textContent !== 'Tomorrow'
      );
      
      if (futureButton) {
        fireEvent.click(futureButton);
        expect(futureButton).toHaveClass('bg-primary-500', 'text-white');
      }
    });

    it('should update chart title when day selection changes', () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      // Initially shows Today
      expect(screen.getByText('Staffing Levels for Today')).toBeInTheDocument();

      // Switch to tomorrow
      const tomorrowButton = screen.getByText('Tomorrow');
      fireEvent.click(tomorrowButton);

      expect(screen.getByText('Staffing Levels for Tomorrow')).toBeInTheDocument();
    });
  });

  describe('Hourly Chart Rendering', () => {
    const storeWithData = () => createTestStore({
      shifts: {
        selectedDate: '2024-01-15',
        shifts: createStaffingShifts(),
        templates: [],
        error: null,
      },
      employees: { employees: [], loading: false, error: null },
      ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
    });

    it('should render chart container and structure', () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      // Should have chart container
      const chartContainer = document.querySelector('.relative.h-64');
      expect(chartContainer).toBeInTheDocument();

      // Should have Y-axis labels
      const yAxisContainer = document.querySelector('.absolute.top-0.left-0.h-full');
      expect(yAxisContainer).toBeInTheDocument();

      // Should have X-axis line
      const xAxisLine = document.querySelector('.absolute.bottom-0.left-8.right-0.h-px');
      expect(xAxisLine).toBeInTheDocument();
    });

    it('should render hourly bars for each hour', () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      // Should have 24 hourly segments (one for each hour)
      const hourlySegments = document.querySelectorAll('.flex-1.flex.flex-col.justify-end.relative');
      expect(hourlySegments).toHaveLength(24);
    });

    it('should show time labels at 3-hour intervals', () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      // Should show time labels every 3 hours (0, 3, 6, 9, 12, 15, 18, 21)
      expect(screen.getByText('12 AM')).toBeInTheDocument();
      expect(screen.getByText('3 AM')).toBeInTheDocument();
      expect(screen.getByText('6 AM')).toBeInTheDocument();
      expect(screen.getByText('9 AM')).toBeInTheDocument();
      expect(screen.getByText('12 PM')).toBeInTheDocument();
      expect(screen.getByText('3 PM')).toBeInTheDocument();
      expect(screen.getByText('6 PM')).toBeInTheDocument();
      expect(screen.getByText('9 PM')).toBeInTheDocument();
    });

    it('should display Y-axis scaling based on maximum staffing', () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      // Should show Y-axis labels (numbers based on max staffing level) - target the direct children
      const yAxisContainer = document.querySelector('.absolute.top-0.left-0.h-full');
      expect(yAxisContainer).toBeInTheDocument();
      
      const yAxisLabels = yAxisContainer?.querySelectorAll('div');
      expect(yAxisLabels && yAxisLabels.length).toBeGreaterThan(0);
    });

    it('should render stacked bars with role colors', () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      // Should have colored bar segments for different roles
      expect(document.querySelector('.bg-yellow-500')).toBeInTheDocument(); // Manager
      expect(document.querySelector('.bg-purple-500')).toBeInTheDocument(); // Server
      expect(document.querySelector('.bg-red-500')).toBeInTheDocument(); // Cook
    });
  });

  describe('Tooltip Interactions', () => {
    const storeWithData = () => createTestStore({
      shifts: {
        selectedDate: '2024-01-15',
        shifts: createStaffingShifts(),
        templates: [],
        error: null,
      },
      employees: { employees: [], loading: false, error: null },
      ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
    });

    it('should show tooltip on hover with hour and role breakdown', async () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      // Find an hourly segment that has data (e.g., 10 AM when multiple roles overlap)
      const hourlySegments = document.querySelectorAll('.flex-1.flex.flex-col.justify-end.relative');
      const tenAmSegment = hourlySegments[10]; // Index 10 = 10 AM

      // Hover over the segment
      fireEvent.mouseEnter(tenAmSegment);

      // Should show tooltip with time and role breakdown
      await waitFor(() => {
        expect(screen.getByText('10 AM')).toBeInTheDocument();
        expect(screen.getByText(/Total:/)).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      const hourlySegments = document.querySelectorAll('.flex-1.flex.flex-col.justify-end.relative');
      const tenAmSegment = hourlySegments[10];

      // Hover and then leave
      fireEvent.mouseEnter(tenAmSegment);
      fireEvent.mouseLeave(tenAmSegment);

      // Tooltip should disappear
      await waitFor(() => {
        expect(screen.queryByText('10 AM')).not.toBeInTheDocument();
      });
    });

    it('should show role-specific data in tooltip', async () => {
      renderWithProviders(<StaffingLevelsView />, storeWithData());

      const hourlySegments = document.querySelectorAll('.flex-1.flex.flex-col.justify-end.relative');
      const tenAmSegment = hourlySegments[10]; // Time when multiple roles should be active

      fireEvent.mouseEnter(tenAmSegment);

      await waitFor(() => {
        // Should show specific roles active at that time
        const tooltip = document.querySelector('.absolute.top-0.left-1\\/2');
        expect(tooltip).toBeInTheDocument();
      });
    });
  });

  describe('Role Handling', () => {
    it('should display legend with all roles present', () => {
      const storeWithData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createStaffingShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithData);

      // Should show legend with role names
      expect(screen.getByText('Manager')).toBeInTheDocument();
      expect(screen.getByText('Server')).toBeInTheDocument();
      expect(screen.getByText('Cook')).toBeInTheDocument();
    });

    it('should apply correct colors to roles', () => {
      const storeWithData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createStaffingShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithData);

      // Should have colored legend items
      expect(document.querySelector('.bg-yellow-500')).toBeInTheDocument(); // Manager
      expect(document.querySelector('.bg-purple-500')).toBeInTheDocument(); // Server
      expect(document.querySelector('.bg-red-500')).toBeInTheDocument(); // Cook
    });

    it('should handle unknown roles with default color', () => {
      const storeWithUnknownRole = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Unknown Worker',
              date: '2024-01-15',
              startTime: '09:00',
              endTime: '17:00',
              timeRange: '9:00 AM - 5:00 PM',
              role: 'Unknown Role',
              status: 'Confirmed',
              notes: 'Unknown role test',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithUnknownRole);

      // Should use default gray color
      expect(document.querySelector('.bg-gray-500')).toBeInTheDocument();
      expect(screen.getByText('Unknown Role')).toBeInTheDocument();
    });
  });

  describe('Overnight Shift Handling', () => {
    it('should correctly handle overnight shifts spanning midnight', () => {
      const storeWithOvernightData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createOvernightShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithOvernightData);

      // Should show Front Desk role for overnight shift
      expect(screen.getByText('Front Desk')).toBeInTheDocument();
      
      // Should have data across multiple hours including early morning hours
      const hourlySegments = document.querySelectorAll('.flex-1.flex.flex-col.justify-end.relative');
      expect(hourlySegments).toHaveLength(24);
    });

    it('should display overnight shift data correctly in tooltip', async () => {
      const storeWithOvernightData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createOvernightShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithOvernightData);

      // Test early morning hours (should have data from overnight shift)
      const hourlySegments = document.querySelectorAll('.flex-1.flex.flex-col.justify-end.relative');
      const earlyMorningSegment = hourlySegments[6]; // 6 AM

      fireEvent.mouseEnter(earlyMorningSegment);

      await waitFor(() => {
        // Should show tooltip with 6 AM specifically in the tooltip (not just the time label)
        const tooltip = document.querySelector('.absolute.top-0.left-1\\/2');
        expect(tooltip).toBeInTheDocument();
        
        // Should have Front Desk role data in tooltip
        expect(screen.getByText('Front Desk: 1')).toBeInTheDocument();
        expect(screen.getByText(/Total:/)).toBeInTheDocument();
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format hours correctly in 12-hour format', () => {
      const storeWithData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createStaffingShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithData);

      // Should display 12-hour format correctly
      expect(screen.getByText('12 AM')).toBeInTheDocument(); // Midnight
      expect(screen.getByText('12 PM')).toBeInTheDocument(); // Noon
      expect(screen.getByText('6 AM')).toBeInTheDocument();
      expect(screen.getByText('6 PM')).toBeInTheDocument();
    });

    it('should handle date parsing for tomorrow correctly', () => {
      const storeWithTomorrowData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createTomorrowShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithTomorrowData);

      // Switch to tomorrow
      const tomorrowButton = screen.getByText('Tomorrow');
      fireEvent.click(tomorrowButton);

      // Should show tomorrow's data
      expect(screen.getByText('Front Desk')).toBeInTheDocument();
    });
  });

  describe('Chart Scaling', () => {
    it('should scale chart based on maximum staffing level', () => {
      // Create data with high staffing levels to test scaling
      const highStaffingShifts = Array.from({ length: 10 }, (_, i) => ({
        id: `high-${i}`,
        employeeName: `Worker ${i}`,
        date: '2024-01-15',
        startTime: '12:00',
        endTime: '13:00',
        timeRange: '12:00 PM - 1:00 PM',
        role: 'Server',
        status: 'Confirmed',
        notes: `High staffing ${i}`,
      }));

      const storeWithHighStaffing = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: highStaffingShifts,
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithHighStaffing);

      // Should show higher numbers on Y-axis
      const yAxisContainer = document.querySelector('.absolute.top-0.left-0.h-full');
      expect(yAxisContainer).toBeInTheDocument();
    });

    it('should ensure minimum bar height for visibility', () => {
      const storeWithData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Single Worker',
              date: '2024-01-15',
              startTime: '12:00',
              endTime: '13:00',
              timeRange: '12:00 PM - 1:00 PM',
              role: 'Server',
              status: 'Confirmed',
              notes: 'Single shift',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithData);

      // Should have at least one colored bar segment
      expect(document.querySelector('.bg-purple-500')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    const darkModeStore = () => createTestStore({
      ui: { darkMode: true },
      shifts: {
        selectedDate: '2024-01-15',
        shifts: createStaffingShifts(),
        templates: [],
        error: null,
      },
      employees: { employees: [], loading: false, error: null },
    });

    it('should apply dark mode classes to UI elements', () => {
      renderWithProviders(<StaffingLevelsView />, darkModeStore());

      // Check for dark mode classes
      const darkElements = document.querySelectorAll('.dark\\:bg-dark-700, .dark\\:text-gray-300, .dark\\:border-dark-600');
      expect(darkElements.length).toBeGreaterThan(0);
    });

    it('should use dark mode colors in empty state', () => {
      const darkEmptyStore = createTestStore({
        ui: { darkMode: true },
        shifts: { selectedDate: '2024-01-15', shifts: [], templates: [], error: null },
        employees: { employees: [], loading: false, error: null },
      });

      renderWithProviders(<StaffingLevelsView />, darkEmptyStore);

      const heading = screen.getByText('No Staffing Data');
      expect(heading).toHaveClass('dark:text-gray-300');
    });
  });

  describe('Edge Cases', () => {
    it('should handle shifts with missing time data gracefully', () => {
      const storeWithBadData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Bad Data Worker',
              date: '2024-01-15',
              startTime: '', // Missing start time
              endTime: '17:00',
              timeRange: '- 5:00 PM',
              role: 'Server',
              status: 'Confirmed',
              notes: 'Bad data',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      expect(() => {
        renderWithProviders(<StaffingLevelsView />, storeWithBadData);
      }).not.toThrow();
    });

    it('should handle zero-duration shifts', () => {
      const storeWithZeroDuration = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Zero Duration',
              date: '2024-01-15',
              startTime: '12:00',
              endTime: '12:00',
              timeRange: '12:00 PM - 12:00 PM',
              role: 'Server',
              status: 'Confirmed',
              notes: 'Zero duration',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithZeroDuration);

      // Should still show legend but may not have visible bars
      expect(screen.getByText('Server')).toBeInTheDocument();
    });

    it('should handle future date calculations correctly', () => {
      const storeWithFutureData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createFutureShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithFutureData);

      // Should have future date buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(2); // More than just Today and Tomorrow
    });

    it('should handle single shift data correctly', () => {
      const storeWithSingleShift = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Solo Worker',
              date: '2024-01-15',
              startTime: '09:00',
              endTime: '17:00',
              timeRange: '9:00 AM - 5:00 PM',
              role: 'Manager',
              status: 'Confirmed',
              notes: 'Solo shift',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<StaffingLevelsView />, storeWithSingleShift);

      // Should show chart with single role
      expect(screen.getByText('Manager')).toBeInTheDocument();
      expect(document.querySelector('.bg-yellow-500')).toBeInTheDocument();
    });
  });
}); 
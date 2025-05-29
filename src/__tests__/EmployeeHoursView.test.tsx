import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EmployeeHoursView from '../components/insights/EmployeeHoursView';
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
      selectedDate: '2024-01-15',
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

// Helper to create shifts for this week (Jan 14-20, 2024: Sunday to Saturday)
const createWeeklyShifts = () => [
  {
    id: '1',
    employeeName: 'John Doe',
    date: '2024-01-14', // Sunday
    startTime: '09:00',
    endTime: '17:00',
    timeRange: '9:00 AM - 5:00 PM',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Opening shift',
  },
  {
    id: '2',
    employeeName: 'John Doe',
    date: '2024-01-15', // Monday
    startTime: '10:00',
    endTime: '18:00',
    timeRange: '10:00 AM - 6:00 PM',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Regular shift',
  },
  {
    id: '3',
    employeeName: 'Jane Smith',
    date: '2024-01-15', // Monday
    startTime: '08:00',
    endTime: '16:00',
    timeRange: '8:00 AM - 4:00 PM',
    role: 'Server',
    status: 'Confirmed',
    notes: 'Morning shift',
  },
  {
    id: '4',
    employeeName: 'Jane Smith',
    date: '2024-01-16', // Tuesday
    startTime: '14:00',
    endTime: '22:00',
    timeRange: '2:00 PM - 10:00 PM',
    role: 'Cook',
    status: 'Confirmed',
    notes: 'Evening shift',
  },
  {
    id: '5',
    employeeName: 'Bob Johnson',
    date: '2024-01-17', // Wednesday
    startTime: '06:00',
    endTime: '14:00',
    timeRange: '6:00 AM - 2:00 PM',
    role: 'Cook',
    status: 'Confirmed',
    notes: 'Early shift',
  },
];

// Helper to create shifts outside current week for filtering tests
const createMixedShifts = () => [
  ...createWeeklyShifts(),
  {
    id: '6',
    employeeName: 'Alice Brown',
    date: '2024-01-08', // Previous week
    startTime: '09:00',
    endTime: '17:00',
    timeRange: '9:00 AM - 5:00 PM',
    role: 'Front Desk',
    status: 'Confirmed',
    notes: 'Previous week shift',
  },
  {
    id: '7',
    employeeName: 'Charlie Wilson',
    date: '2024-02-15', // Next month
    startTime: '10:00',
    endTime: '18:00',
    timeRange: '10:00 AM - 6:00 PM',
    role: 'Server',
    status: 'Confirmed',
    notes: 'Future shift',
  },
];

// Helper to create 12-hour format shifts
const create12HourShifts = () => [
  {
    id: '1',
    employeeName: 'Test Worker',
    date: '2024-01-15',
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    timeRange: '9:00 AM - 5:00 PM',
    role: 'Server',
    status: 'Confirmed',
    notes: '12h format test',
  },
  {
    id: '2',
    employeeName: 'Night Worker',
    date: '2024-01-15',
    startTime: '11:30 PM',
    endTime: '7:30 AM',
    timeRange: '11:30 PM - 7:30 AM',
    role: 'Front Desk',
    status: 'Confirmed',
    notes: 'Overnight 12h format',
  },
];

// Helper to create overtime shifts (>40 hours in week)
const createOvertimeShifts = () => [
  {
    id: '1',
    employeeName: 'Overtime Employee',
    date: '2024-01-14',
    startTime: '08:00',
    endTime: '20:00', // 12 hours
    timeRange: '8:00 AM - 8:00 PM',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Long shift 1',
  },
  {
    id: '2',
    employeeName: 'Overtime Employee',
    date: '2024-01-15',
    startTime: '08:00',
    endTime: '20:00', // 12 hours
    timeRange: '8:00 AM - 8:00 PM',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Long shift 2',
  },
  {
    id: '3',
    employeeName: 'Overtime Employee',
    date: '2024-01-16',
    startTime: '08:00',
    endTime: '20:00', // 12 hours
    timeRange: '8:00 AM - 8:00 PM',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Long shift 3',
  },
  {
    id: '4',
    employeeName: 'Overtime Employee',
    date: '2024-01-17',
    startTime: '08:00',
    endTime: '20:00', // 12 hours (48 total > 40)
    timeRange: '8:00 AM - 8:00 PM',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Overtime trigger',
  },
];

describe('EmployeeHoursView Component', () => {
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
      renderWithProviders(<EmployeeHoursView />);

      expect(screen.getByText('No Hours Data')).toBeInTheDocument();
      expect(screen.getByText('There are no shifts scheduled yet. Add shifts to see employee hours analytics.')).toBeInTheDocument();
      
      // Check for clock icon
      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should render table empty state when no shifts in timeframe', () => {
      const storeWithFutureShifts = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Future Worker',
              date: '2024-02-15', // Next month
              startTime: '09:00',
              endTime: '17:00',
              timeRange: '9:00 AM - 5:00 PM',
              role: 'Server',
              status: 'Confirmed',
              notes: 'Future shift',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<EmployeeHoursView />, storeWithFutureShifts);

      expect(screen.getByText('No employee data available for this timeframe')).toBeInTheDocument();
    });
  });

  describe('Timeframe Selection', () => {
    const storeWithData = () => createTestStore({
      shifts: {
        selectedDate: '2024-01-15',
        shifts: createWeeklyShifts(),
        templates: [],
        error: null,
      },
      employees: { employees: [], loading: false, error: null },
      ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
    });

    it('should render timeframe selection buttons', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('should default to week timeframe', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      const weekButton = screen.getByText('This Week');
      expect(weekButton).toHaveClass('bg-primary-500', 'text-white');
    });

    it('should switch to month timeframe when month button is clicked', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      const monthButton = screen.getByText('This Month');
      fireEvent.click(monthButton);

      expect(monthButton).toHaveClass('bg-primary-500', 'text-white');
    });

    it('should update overtime threshold when switching timeframes', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      // Initially should show weekly threshold (40 hours)
      expect(screen.getByText((content, element) => {
        return content.includes('40 hours in the selected timeframe');
      })).toBeInTheDocument();

      // Switch to month
      const monthButton = screen.getByText('This Month');
      fireEvent.click(monthButton);

      // Should show monthly threshold (160 hours)
      expect(screen.getByText((content, element) => {
        return content.includes('160 hours in the selected timeframe');
      })).toBeInTheDocument();
    });
  });

  describe('Employee Data Processing', () => {
    it('should process and display employee hours correctly', () => {
      const storeWithData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createWeeklyShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<EmployeeHoursView />, storeWithData);

      // Should display employees
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

      // John Doe: 8 + 8 = 16 hours, 2 shifts
      // Jane Smith: 8 + 8 = 16 hours, 2 shifts  
      const sixteenHourElements = screen.getAllByText('16.0');
      expect(sixteenHourElements).toHaveLength(2); // John and Jane both have 16 hours

      // Bob Johnson: 8 hours, 1 shift
      expect(screen.getByText('8.0')).toBeInTheDocument();
    });

    it('should filter shifts correctly for current week', () => {
      const storeWithMixedData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createMixedShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<EmployeeHoursView />, storeWithMixedData);

      // Should only show employees from current week
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

      // Should not show employees from other timeframes
      expect(screen.queryByText('Alice Brown')).not.toBeInTheDocument();
      expect(screen.queryByText('Charlie Wilson')).not.toBeInTheDocument();
    });

    it('should handle role breakdown correctly', () => {
      const storeWithData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createWeeklyShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<EmployeeHoursView />, storeWithData);

      // Should show role breakdown with colored progress bars
      const progressBars = document.querySelectorAll('.bg-gray-200.dark\\:bg-dark-600.rounded-full');
      expect(progressBars.length).toBeGreaterThan(0);

      // Should show role hours in breakdown
      expect(screen.getByText('16.0h')).toBeInTheDocument(); // Manager hours for John
      const eightHourElements = screen.getAllByText('8.0h');
      expect(eightHourElements.length).toBeGreaterThan(0); // Server and Cook hours for Jane and Bob
    });
  });

  describe('Time Format Handling', () => {
    it('should handle 12-hour time format correctly', () => {
      const storeWith12HourData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: create12HourShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<EmployeeHoursView />, storeWith12HourData);

      expect(screen.getByText('Test Worker')).toBeInTheDocument();
      expect(screen.getByText('Night Worker')).toBeInTheDocument();

      // Both workers have 8 hours
      const hourValues = screen.getAllByText('8.0');
      expect(hourValues).toHaveLength(2);
    });

    it('should handle overnight shifts correctly', () => {
      const storeWithOvernightData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Night Worker',
              date: '2024-01-15',
              startTime: '23:00',
              endTime: '07:00',
              timeRange: '11:00 PM - 7:00 AM',
              role: 'Front Desk',
              status: 'Confirmed',
              notes: 'Overnight shift',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<EmployeeHoursView />, storeWithOvernightData);

      expect(screen.getByText('Night Worker')).toBeInTheDocument();
      // 23:00 to 07:00 = 8 hours
      expect(screen.getByText('8.0')).toBeInTheDocument();
    });

    it('should handle invalid time formats gracefully', () => {
      const storeWithInvalidData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Test Worker',
              date: '2024-01-15',
              startTime: 'invalid',
              endTime: 'also-invalid',
              timeRange: 'invalid - also-invalid',
              role: 'Server',
              status: 'Confirmed',
              notes: 'Invalid times',
            },
            {
              id: '2',
              employeeName: 'Valid Worker',
              date: '2024-01-15',
              startTime: '09:00',
              endTime: '17:00',
              timeRange: '9:00 AM - 5:00 PM',
              role: 'Cook',
              status: 'Confirmed',
              notes: 'Valid times',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      expect(() => {
        renderWithProviders(<EmployeeHoursView />, storeWithInvalidData);
      }).not.toThrow();

      // Should only show the valid worker
      expect(screen.getByText('Valid Worker')).toBeInTheDocument();
      expect(screen.queryByText('Test Worker')).not.toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    const storeWithData = () => createTestStore({
      shifts: {
        selectedDate: '2024-01-15',
        shifts: createWeeklyShifts(),
        templates: [],
        error: null,
      },
      employees: { employees: [], loading: false, error: null },
      ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
    });

    it('should render sortable column headers', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      expect(screen.getByText('Employee')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Shifts')).toBeInTheDocument();
      expect(screen.getByText('Breakdown')).toBeInTheDocument();
    });

    it('should default to sorting by hours descending', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      // Should show down arrow for hours column
      const hoursHeader = screen.getByText('Hours').closest('th');
      const downArrow = hoursHeader?.querySelector('svg path[d*="M19 9l-7 7-7-7"]');
      expect(downArrow).toBeInTheDocument();
    });

    it('should sort by name when name header is clicked', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      const nameHeader = screen.getByText('Employee');
      fireEvent.click(nameHeader);

      // Should show up arrow for name column (ascending)
      const nameHeaderElement = nameHeader.closest('th');
      const upArrow = nameHeaderElement?.querySelector('svg path[d*="M5 15l7-7 7 7"]');
      expect(upArrow).toBeInTheDocument();
    });

    it('should toggle sort direction when clicking same column', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      const hoursHeader = screen.getByText('Hours');
      
      // Initially descending (down arrow)
      let hoursHeaderElement = hoursHeader.closest('th');
      let downArrow = hoursHeaderElement?.querySelector('svg path[d*="M19 9l-7 7-7-7"]');
      expect(downArrow).toBeInTheDocument();

      // Click to toggle to ascending
      fireEvent.click(hoursHeader);

      // Should now show up arrow
      hoursHeaderElement = hoursHeader.closest('th');
      const upArrow = hoursHeaderElement?.querySelector('svg path[d*="M5 15l7-7 7 7"]');
      expect(upArrow).toBeInTheDocument();
    });

    it('should sort by shifts when shifts header is clicked', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      const shiftsHeader = screen.getByText('Shifts');
      fireEvent.click(shiftsHeader);

      // Should show down arrow for shifts column (descending)
      const shiftsHeaderElement = shiftsHeader.closest('th');
      const downArrow = shiftsHeaderElement?.querySelector('svg path[d*="M19 9l-7 7-7-7"]');
      expect(downArrow).toBeInTheDocument();
    });
  });

  describe('Overtime Detection', () => {
    it('should highlight employees with overtime in weekly view', () => {
      const storeWithOvertimeData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createOvertimeShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<EmployeeHoursView />, storeWithOvertimeData);

      // Should show overtime badge
      expect(screen.getByText('Overtime')).toBeInTheDocument();
      
      // Should show 48 hours (4 × 12-hour shifts)
      expect(screen.getByText('48.0')).toBeInTheDocument();

      // Row should have overtime highlighting class
      const overtimeRow = document.querySelector('.bg-danger-50');
      expect(overtimeRow).toBeInTheDocument();
    });

    it('should not highlight employees under overtime threshold', () => {
      const storeWithRegularData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createWeeklyShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<EmployeeHoursView />, storeWithRegularData);

      // Should not show overtime badge
      expect(screen.queryByText('Overtime')).not.toBeInTheDocument();
      
      // Should not have overtime highlighting
      const overtimeRows = document.querySelectorAll('.bg-danger-50');
      expect(overtimeRows).toHaveLength(0);
    });
  });

  describe('Expandable Employee Details', () => {
    const storeWithData = () => createTestStore({
      shifts: {
        selectedDate: '2024-01-15',
        shifts: createWeeklyShifts(),
        templates: [],
        error: null,
      },
      employees: { employees: [], loading: false, error: null },
      ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
    });

    it('should show expand/collapse arrows in employee names', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      // Should show right arrows (collapsed state)
      const rightArrows = document.querySelectorAll('svg path[d*="M9 5l7 7-7 7"]');
      expect(rightArrows.length).toBeGreaterThan(0);
    });

    it('should expand employee details when name is clicked', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      const johnDoeRow = screen.getByText('John Doe');
      fireEvent.click(johnDoeRow);

      // Should show expanded details
      expect(screen.getByText('Included Shifts (2):')).toBeInTheDocument();
      
      // Should show down arrow (expanded state)
      const downArrows = document.querySelectorAll('svg path[d*="M19 9l-7 7-7-7"]');
      expect(downArrows.length).toBeGreaterThan(0);
    });

    it('should show individual shift details in expanded view', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      const johnDoeRow = screen.getByText('John Doe');
      fireEvent.click(johnDoeRow);

      // Should show individual shift details
      expect(screen.getByText('2024-01-14')).toBeInTheDocument();
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM - 6:00 PM')).toBeInTheDocument();
    });

    it('should collapse details when clicking expanded employee again', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      const johnDoeRow = screen.getByText('John Doe');
      
      // Expand
      fireEvent.click(johnDoeRow);
      expect(screen.getByText('Included Shifts (2):')).toBeInTheDocument();
      
      // Collapse
      fireEvent.click(johnDoeRow);
      expect(screen.queryByText('Included Shifts (2):')).not.toBeInTheDocument();
    });

    it('should switch between expanded employees', () => {
      renderWithProviders(<EmployeeHoursView />, storeWithData());

      const johnDoeRow = screen.getByText('John Doe');
      const janeSmithRow = screen.getByText('Jane Smith');
      
      // Expand John
      fireEvent.click(johnDoeRow);
      expect(screen.getByText('Included Shifts (2):')).toBeInTheDocument();
      
      // Expand Jane (should collapse John)
      fireEvent.click(janeSmithRow);
      
      // Should still show expanded details but for Jane now
      expect(screen.getByText('Included Shifts (2):')).toBeInTheDocument();
      
      // Should show Jane's shift details
      expect(screen.getByText('8:00 AM - 4:00 PM')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM - 10:00 PM')).toBeInTheDocument();
    });
  });

  describe('Role Color Coding', () => {
    it('should apply correct colors to role breakdown', () => {
      const storeWithData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createWeeklyShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<EmployeeHoursView />, storeWithData);

      // Should have colored progress bar segments
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
              employeeName: 'Test Worker',
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

      renderWithProviders(<EmployeeHoursView />, storeWithUnknownRole);

      // Should use default gray color
      expect(document.querySelector('.bg-gray-500')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    const darkModeStore = () => createTestStore({
      ui: { darkMode: true },
      shifts: {
        selectedDate: '2024-01-15',
        shifts: createWeeklyShifts(),
        templates: [],
        error: null,
      },
      employees: { employees: [], loading: false, error: null },
    });

    it('should apply dark mode classes to UI elements', () => {
      renderWithProviders(<EmployeeHoursView />, darkModeStore());

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

      renderWithProviders(<EmployeeHoursView />, darkEmptyStore);

      const heading = screen.getByText('No Hours Data');
      expect(heading).toHaveClass('dark:text-gray-300');
    });
  });

  describe('Edge Cases', () => {
    it('should handle shifts with missing time data', () => {
      const storeWithMissingData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Test Worker',
              date: '2024-01-15',
              startTime: '',
              endTime: '',
              timeRange: '',
              role: 'Server',
              status: 'Confirmed',
              notes: 'Missing times',
            },
            {
              id: '2',
              employeeName: 'Valid Worker',
              date: '2024-01-15',
              startTime: '09:00',
              endTime: '17:00',
              timeRange: '9:00 AM - 5:00 PM',
              role: 'Cook',
              status: 'Confirmed',
              notes: 'Valid times',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      expect(() => {
        renderWithProviders(<EmployeeHoursView />, storeWithMissingData);
      }).not.toThrow();

      // Should only show the valid worker
      expect(screen.getByText('Valid Worker')).toBeInTheDocument();
      expect(screen.queryByText('Test Worker')).not.toBeInTheDocument();
    });

    it('should handle shifts with empty dates', () => {
      const storeWithEmptyDates = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Test Worker',
              date: '',
              startTime: '09:00',
              endTime: '17:00',
              timeRange: '9:00 AM - 5:00 PM',
              role: 'Server',
              status: 'Confirmed',
              notes: 'Empty date',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      expect(() => {
        renderWithProviders(<EmployeeHoursView />, storeWithEmptyDates);
      }).not.toThrow();

      // Should show empty timeframe message
      expect(screen.getByText('No employee data available for this timeframe')).toBeInTheDocument();
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
              startTime: '09:00',
              endTime: '09:00',
              timeRange: '9:00 AM - 9:00 AM',
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

      renderWithProviders(<EmployeeHoursView />, storeWithZeroDuration);

      expect(screen.getByText('Zero Duration')).toBeInTheDocument();
      expect(screen.getByText('0.0')).toBeInTheDocument(); // 0 hours
    });

    it('should handle missing shift details in expanded view', () => {
      const storeWithMissingShift = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Test Worker',
              date: '2024-01-15',
              startTime: '09:00',
              endTime: '17:00',
              timeRange: '9:00 AM - 5:00 PM',
              role: 'Server',
              status: 'Confirmed',
              notes: 'Valid shift',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<EmployeeHoursView />, storeWithMissingShift);

      const workerRow = screen.getByText('Test Worker');
      fireEvent.click(workerRow);

      // Should show details normally
      expect(screen.getByText('Included Shifts (1):')).toBeInTheDocument();
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });
  });

  describe('Month Timeframe', () => {
    it('should use correct overtime threshold for monthly view', () => {
      const storeWithData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createWeeklyShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<EmployeeHoursView />, storeWithData);

      // Switch to month view
      const monthButton = screen.getByText('This Month');
      fireEvent.click(monthButton);

      // Should show monthly threshold
      expect(screen.getByText((content, element) => {
        return content.includes('160 hours in the selected timeframe');
      })).toBeInTheDocument();
    });
  });
}); 
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DashboardView from '../components/insights/DashboardView';
import uiSlice from '../store/uiSlice';
import shiftsSlice from '../store/shiftsSlice';
import employeeSlice from '../store/employeeSlice';

// Mock console methods to capture logs
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

// Create sample employee data
const createSampleEmployees = () => [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Manager' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Server' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Cook' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'Front Desk' },
];

// Create sample shift data
const createSampleShifts = () => [
  {
    id: '1',
    employeeName: 'John Doe',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '17:00',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Morning shift',
  },
  {
    id: '2',
    employeeName: 'Jane Smith',
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '18:00',
    role: 'Server',
    status: 'Confirmed',
    notes: 'Lunch shift',
  },
  {
    id: '3',
    employeeName: 'Bob Johnson',
    date: '2024-01-16',
    startTime: '11:00',
    endTime: '19:00',
    role: 'Cook',
    status: 'Pending',
    notes: 'Dinner prep',
  },
  {
    id: '4',
    employeeName: 'Alice Brown',
    date: '2024-01-15',
    startTime: '08:00',
    endTime: '16:00',
    role: 'Front Desk',
    status: 'Confirmed',
    notes: 'Reception',
  },
  {
    id: '5',
    employeeName: 'John Doe',
    date: '2024-01-17',
    startTime: '14:00',
    endTime: '22:00',
    role: 'Manager',
    status: 'Canceled',
    notes: 'Evening shift',
  },
];

describe('DashboardView Component', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  describe('Empty State', () => {
    it('should render empty state when no shifts are scheduled', () => {
      renderWithProviders(<DashboardView />);

      expect(screen.getByText('No Shifts Scheduled')).toBeInTheDocument();
      expect(screen.getByText('There are no shifts scheduled yet. Add shifts to the calendar to see insights and analytics.')).toBeInTheDocument();
    });

    it('should display calendar icon in empty state', () => {
      renderWithProviders(<DashboardView />);

      // SVG doesn't have role="img" by default, so query directly
      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });
  });

  describe('Metrics Display with Data', () => {
    const storeWithData = () => createTestStore({
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
        shifts: createSampleShifts(),
        templates: [],
        error: null,
      },
      employees: {
        employees: createSampleEmployees(),
        loading: false,
        error: null,
      },
    });

    it('should display total shifts metric', () => {
      renderWithProviders(<DashboardView />, storeWithData());

      expect(screen.getByText('Total Shifts')).toBeInTheDocument();
      
      // Use getAllByText and check the first occurrence (total shifts metric)
      const scheduledTexts = screen.getAllByText('scheduled');
      expect(scheduledTexts).toHaveLength(2); // Total shifts and shifts today both show "scheduled"
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display unique employees metric', () => {
      renderWithProviders(<DashboardView />, storeWithData());

      expect(screen.getByText('Active Employees')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument(); // 4 unique employees
      expect(screen.getByText('of 4 total')).toBeInTheDocument();
    });

    it('should calculate and display total hours correctly', () => {
      renderWithProviders(<DashboardView />, storeWithData());

      expect(screen.getByText('Total Hours')).toBeInTheDocument();
      // John: 8 hours + 8 hours = 16, Jane: 8 hours, Bob: 8 hours, Alice: 8 hours = 40 total
      expect(screen.getByText('40.0')).toBeInTheDocument();
      expect(screen.getByText('hours')).toBeInTheDocument();
    });

    it('should calculate shifts today correctly', () => {
      renderWithProviders(<DashboardView />, storeWithData());

      expect(screen.getByText('Shifts Today')).toBeInTheDocument();
      
      // Find the shifts today section specifically
      const shiftsToday = screen.getByText('Shifts Today').closest('div');
      expect(shiftsToday?.textContent).toContain('3');
    });
  });

  describe('Status Breakdown', () => {
    const storeWithData = () => createTestStore({
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
        shifts: createSampleShifts(),
        templates: [],
        error: null,
      },
      employees: {
        employees: createSampleEmployees(),
        loading: false,
        error: null,
      },
    });

    it('should display status breakdown with correct counts', () => {
      renderWithProviders(<DashboardView />, storeWithData());

      expect(screen.getByText('Status Breakdown')).toBeInTheDocument();
      
      // Check for status indicators
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Canceled')).toBeInTheDocument();
      
      // Check counts by finding the status breakdown section specifically
      const statusBreakdown = screen.getByText('Status Breakdown').closest('div');
      expect(statusBreakdown?.textContent).toContain('Confirmed');
      expect(statusBreakdown?.textContent).toContain('Pending');
      expect(statusBreakdown?.textContent).toContain('Canceled');
      
      // Verify the status breakdown section contains the right counts
      const confirmedRow = screen.getByText('Confirmed').closest('div');
      const pendingRow = screen.getByText('Pending').closest('div');
      const canceledRow = screen.getByText('Canceled').closest('div');
      
      expect(confirmedRow?.textContent).toContain('3');
      expect(pendingRow?.textContent).toContain('1');
      expect(canceledRow?.textContent).toContain('1');
    });

    it('should display correct status colors', () => {
      renderWithProviders(<DashboardView />, storeWithData());

      const statusElements = screen.getAllByRole('generic').filter(el => 
        el.className.includes('h-3 w-3 rounded-full')
      );

      // Should have status indicators with correct colors
      expect(statusElements.some(el => el.className.includes('bg-success-500'))).toBe(true); // Confirmed
      expect(statusElements.some(el => el.className.includes('bg-warning-500'))).toBe(true); // Pending
      expect(statusElements.some(el => el.className.includes('bg-danger-500'))).toBe(true); // Canceled
    });

    it('should show no status data message when no status data available', () => {
      const emptyStore = createTestStore({
        shifts: { selectedDate: '2024-01-15', shifts: [], templates: [], error: null },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<DashboardView />, emptyStore);

      expect(screen.getByText('No Shifts Scheduled')).toBeInTheDocument();
    });
  });

  describe('Role Distribution', () => {
    const storeWithData = () => createTestStore({
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
        shifts: createSampleShifts(),
        templates: [],
        error: null,
      },
      employees: {
        employees: createSampleEmployees(),
        loading: false,
        error: null,
      },
    });

    it('should display role distribution with correct counts', () => {
      renderWithProviders(<DashboardView />, storeWithData());

      expect(screen.getByText('Role Distribution')).toBeInTheDocument();
      
      // Check for roles
      expect(screen.getByText('Manager')).toBeInTheDocument();
      expect(screen.getByText('Server')).toBeInTheDocument();
      expect(screen.getByText('Cook')).toBeInTheDocument();
      expect(screen.getByText('Front Desk')).toBeInTheDocument();
      
      // Check counts - Manager has 2 shifts, others have 1 each
      const allText = screen.getAllByText('2');
      const allTextOne = screen.getAllByText('1');
      expect(allText.length).toBeGreaterThan(0); // Manager count
      expect(allTextOne.length).toBeGreaterThan(0); // Other roles count
    });

    it('should display role progress bars with correct colors', () => {
      renderWithProviders(<DashboardView />, storeWithData());

      const progressBars = screen.getAllByRole('generic').filter(el => 
        el.className.includes('h-2 rounded-full')
      );

      // Should have progress bars with different colors for different roles
      expect(progressBars.some(el => el.className.includes('bg-blue-500'))).toBe(true); // Front Desk
      expect(progressBars.some(el => el.className.includes('bg-purple-500'))).toBe(true); // Server
      expect(progressBars.some(el => el.className.includes('bg-yellow-500'))).toBe(true); // Manager
      expect(progressBars.some(el => el.className.includes('bg-red-500'))).toBe(true); // Cook
    });

    it('should calculate progress bar widths correctly', () => {
      renderWithProviders(<DashboardView />, storeWithData());

      const progressBars = screen.getAllByRole('generic').filter(el => 
        el.className.includes('h-2 rounded-full') && 
        !el.className.includes('bg-gray-200') &&
        !el.className.includes('bg-dark-600')
      );

      // Manager has 2/5 = 40% width, others have 1/5 = 20% width
      expect(progressBars.some(el => el.style.width === '40%')).toBe(true);
      expect(progressBars.some(el => el.style.width === '20%')).toBe(true);
    });
  });

  describe('Date Handling and Logging', () => {
    const storeWithData = () => createTestStore({
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
        shifts: createSampleShifts(),
        templates: [],
        error: null,
      },
      employees: {
        employees: createSampleEmployees(),
        loading: false,
        error: null,
      },
    });

    it('should log selected date usage', () => {
      renderWithProviders(<DashboardView />, storeWithData());

      expect(mockConsoleLog).toHaveBeenCalledWith('DashboardView: Using selected date: 2024-01-15');
    });

    it('should log sample shift dates when shifts exist', () => {
      renderWithProviders(<DashboardView />, storeWithData());

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('DashboardView: Sample shift dates:')
      );
    });

    it('should handle date mismatches and log them', () => {
      const storeWithMismatchedDates = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'John Doe',
              date: '2024-01-16', // Different date
              startTime: '09:00',
              endTime: '17:00',
              role: 'Manager',
              status: 'Confirmed',
              notes: 'Test',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: createSampleEmployees(), loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<DashboardView />, storeWithMismatchedDates);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Shift date')
      );
    });

    it('should handle date formatting errors gracefully', () => {
      const storeWithBadDate = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'John Doe',
              date: 'invalid-date', // Bad date format that will cause error
              startTime: '09:00',
              endTime: '17:00',
              role: 'Manager',
              status: 'Confirmed',
              notes: 'Test',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      expect(() => {
        renderWithProviders(<DashboardView />, storeWithBadDate);
      }).not.toThrow();

      // The component should still render even with bad date data
      expect(screen.getByText('Total Shifts')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle overnight shifts correctly', () => {
      const storeWithOvernightShift = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Night Worker',
              date: '2024-01-15',
              startTime: '23:00',
              endTime: '07:00', // Next day
              role: 'Security',
              status: 'Confirmed',
              notes: 'Overnight shift',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [{ id: '1', name: 'Night Worker' }], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<DashboardView />, storeWithOvernightShift);

      expect(screen.getByText('Total Hours')).toBeInTheDocument();
      expect(screen.getByText('8.0')).toBeInTheDocument(); // 23:00 to 07:00 = 8 hours
    });

    it('should handle shifts with same start and end time', () => {
      const storeWithZeroHourShift = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Test Worker',
              date: '2024-01-15',
              startTime: '09:00',
              endTime: '09:00',
              role: 'Test',
              status: 'Confirmed',
              notes: 'Zero hour shift',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [{ id: '1', name: 'Test Worker' }], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<DashboardView />, storeWithZeroHourShift);

      expect(screen.getByText('Total Hours')).toBeInTheDocument();
      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('should handle shifts with minutes correctly', () => {
      const storeWithMinutes = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Test Worker',
              date: '2024-01-15',
              startTime: '09:30',
              endTime: '17:45',
              role: 'Test',
              status: 'Confirmed',
              notes: 'Shift with minutes',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [{ id: '1', name: 'Test Worker' }], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<DashboardView />, storeWithMinutes);

      expect(screen.getByText('Total Hours')).toBeInTheDocument();
      expect(screen.getByText('8.3')).toBeInTheDocument(); // 8 hours 15 minutes = 8.25 hours, rounded to 8.3
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes in empty state', () => {
      const darkModeStore = createTestStore({
        ui: {
          darkMode: true,
          modalOpen: { insights: false },
          themeColor: { name: 'blue', value: '#3b82f6' },
        },
        shifts: { selectedDate: '2024-01-15', shifts: [], templates: [], error: null },
        employees: { employees: [], loading: false, error: null },
      });

      renderWithProviders(<DashboardView />, darkModeStore);

      // In empty state, check for dark mode classes
      const emptyStateContent = screen.getByText('No Shifts Scheduled');
      expect(emptyStateContent).toBeInTheDocument();
      
      // Check for dark mode classes by querying elements that should have them
      const h3Element = screen.getByText('No Shifts Scheduled');
      const pElement = screen.getByText(/There are no shifts scheduled yet/);
      
      expect(h3Element).toHaveClass('dark:text-gray-300');
      expect(pElement).toHaveClass('dark:text-gray-400');
    });

    it('should apply dark mode classes with data', () => {
      const darkModeStoreWithData = createTestStore({
        ui: {
          darkMode: true,
          modalOpen: { insights: false },
          themeColor: { name: 'blue', value: '#3b82f6' },
        },
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createSampleShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: createSampleEmployees(), loading: false, error: null },
      });

      renderWithProviders(<DashboardView />, darkModeStoreWithData);

      // Check that dark mode classes are applied to metric cards
      const cards = screen.getAllByRole('generic').filter(el => 
        el.className.includes('dark:bg-dark-700')
      );
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Grid Layout', () => {
    it('should render metrics in proper grid layout', () => {
      const storeWithData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createSampleShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: createSampleEmployees(), loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<DashboardView />, storeWithData);

      const gridContainer = screen.getByText('Total Shifts').closest('div')?.parentElement;
      expect(gridContainer).toHaveClass('grid', 'gap-4', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should render all metric cards', () => {
      const storeWithData = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createSampleShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: createSampleEmployees(), loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<DashboardView />, storeWithData);

      expect(screen.getByText('Total Shifts')).toBeInTheDocument();
      expect(screen.getByText('Active Employees')).toBeInTheDocument();
      expect(screen.getByText('Total Hours')).toBeInTheDocument();
      expect(screen.getByText('Shifts Today')).toBeInTheDocument();
      expect(screen.getByText('Status Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Role Distribution')).toBeInTheDocument();
    });
  });
}); 
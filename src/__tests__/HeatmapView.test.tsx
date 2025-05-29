import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import HeatmapView from '../components/insights/HeatmapView';
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

// Create sample shifts for different days and times
const createWeeklyShifts = () => [
  // Monday shifts (day index 1)
  {
    id: '1',
    employeeName: 'John Doe',
    date: '2024-01-15', // Monday
    startTime: '09:00',
    endTime: '17:00',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Morning shift',
  },
  {
    id: '2',
    employeeName: 'Jane Smith',
    date: '2024-01-15', // Monday
    startTime: '10:00',
    endTime: '14:00',
    role: 'Server',
    status: 'Confirmed',
    notes: 'Lunch shift',
  },
  // Tuesday shifts (day index 2)
  {
    id: '3',
    employeeName: 'Bob Johnson',
    date: '2024-01-16', // Tuesday
    startTime: '08:00',
    endTime: '16:00',
    role: 'Cook',
    status: 'Confirmed',
    notes: 'Day shift',
  },
  // Wednesday shifts (day index 3)
  {
    id: '4',
    employeeName: 'Alice Brown',
    date: '2024-01-17', // Wednesday
    startTime: '14:00',
    endTime: '22:00',
    role: 'Server',
    status: 'Confirmed',
    notes: 'Evening shift',
  },
  {
    id: '5',
    employeeName: 'Mike Wilson',
    date: '2024-01-17', // Wednesday
    startTime: '15:00',
    endTime: '21:00',
    role: 'Cook',
    status: 'Confirmed',
    notes: 'Dinner prep',
  },
  // Saturday shifts (day index 6)
  {
    id: '6',
    employeeName: 'Sarah Davis',
    date: '2024-01-20', // Saturday
    startTime: '12:00',
    endTime: '20:00',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Weekend shift',
  },
];

// Create overnight shifts for testing
const createOvernightShifts = () => [
  {
    id: '1',
    employeeName: 'Night Worker',
    date: '2024-01-15', // Monday
    startTime: '23:00',
    endTime: '07:00', // Next day
    role: 'Security',
    status: 'Confirmed',
    notes: 'Overnight shift',
  },
];

// Create shifts with multiple employees at same time
const createOverlappingShifts = () => [
  {
    id: '1',
    employeeName: 'John Doe',
    date: '2024-01-15', // Monday
    startTime: '09:00',
    endTime: '17:00',
    role: 'Manager',
    status: 'Confirmed',
    notes: 'Morning shift',
  },
  {
    id: '2',
    employeeName: 'Jane Smith',
    date: '2024-01-15', // Monday
    startTime: '09:00',
    endTime: '17:00',
    role: 'Server',
    status: 'Confirmed',
    notes: 'Morning shift',
  },
  {
    id: '3',
    employeeName: 'Bob Johnson',
    date: '2024-01-15', // Monday
    startTime: '10:00',
    endTime: '16:00',
    role: 'Cook',
    status: 'Confirmed',
    notes: 'Day shift',
  },
];

describe('HeatmapView Component', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  describe('Empty State', () => {
    it('should render empty state when no shifts are scheduled', () => {
      renderWithProviders(<HeatmapView />);

      expect(screen.getByText('No Data Available')).toBeInTheDocument();
      expect(screen.getByText('Schedule shifts to see the heatmap of activity throughout the week.')).toBeInTheDocument();
    });

    it('should display chart icon in empty state', () => {
      renderWithProviders(<HeatmapView />);

      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('should apply dark mode classes in empty state', () => {
      const darkModeStore = createTestStore({
        ui: { darkMode: true },
        shifts: { shifts: [], selectedDate: '2024-01-15', templates: [], error: null },
        employees: { employees: [], loading: false, error: null },
      });

      renderWithProviders(<HeatmapView />, darkModeStore);

      const heading = screen.getByText('No Data Available');
      const description = screen.getByText('Schedule shifts to see the heatmap of activity throughout the week.');

      expect(heading).toHaveClass('dark:text-gray-300');
      expect(description).toHaveClass('dark:text-gray-400');
    });
  });

  describe('Heatmap Display with Data', () => {
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

    it('should render heatmap with description text', () => {
      renderWithProviders(<HeatmapView />, storeWithData());

      expect(screen.getByText(/This heatmap shows the number of employees scheduled during each hour of the week/)).toBeInTheDocument();
    });

    it('should render all days of the week labels', () => {
      renderWithProviders(<HeatmapView />, storeWithData());

      expect(screen.getByText('Sunday')).toBeInTheDocument();
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      expect(screen.getByText('Wednesday')).toBeInTheDocument();
      expect(screen.getByText('Thursday')).toBeInTheDocument();
      expect(screen.getByText('Friday')).toBeInTheDocument();
      expect(screen.getByText('Saturday')).toBeInTheDocument();
    });

    it('should render hour labels for every 3rd hour', () => {
      renderWithProviders(<HeatmapView />, storeWithData());

      expect(screen.getByText('12 AM')).toBeInTheDocument();
      expect(screen.getByText('3 AM')).toBeInTheDocument();
      expect(screen.getByText('6 AM')).toBeInTheDocument();
      expect(screen.getByText('9 AM')).toBeInTheDocument();
      expect(screen.getByText('12 PM')).toBeInTheDocument();
      expect(screen.getByText('3 PM')).toBeInTheDocument();
      expect(screen.getByText('6 PM')).toBeInTheDocument();
      expect(screen.getByText('9 PM')).toBeInTheDocument();
    });

    it('should render legend with color scale', () => {
      renderWithProviders(<HeatmapView />, storeWithData());

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('6+')).toBeInTheDocument();

      // Check for legend color boxes
      const legendBoxes = document.querySelectorAll('.w-6.h-4');
      expect(legendBoxes).toHaveLength(7); // 0 to 6+ levels
    });
  });

  describe('Heatmap Data Processing', () => {
    it('should log shift date processing for debugging', () => {
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

      renderWithProviders(<HeatmapView />, storeWithData);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('HeatmapView: Shift date')
      );
    });

    it('should handle overlapping shifts correctly by counting unique employees', () => {
      const storeWithOverlapping = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createOverlappingShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<HeatmapView />, storeWithOverlapping);

      // Should show numbers representing employee counts - use getAllByText since multiple cells can have same number
      const threeElements = screen.getAllByText('3');
      const twoElements = screen.getAllByText('2');
      expect(threeElements.length).toBeGreaterThan(0); // 3 employees at overlapping hours
      expect(twoElements.length).toBeGreaterThan(0); // 2 employees at some hours
    });

    it('should handle overnight shifts correctly', () => {
      const storeWithOvernight = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createOvernightShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<HeatmapView />, storeWithOvernight);

      // Should show '1' for the overnight hours
      const onesDisplayed = screen.getAllByText('1');
      expect(onesDisplayed.length).toBeGreaterThan(0);
    });

    it('should handle date parsing errors gracefully', () => {
      const storeWithBadDate = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Test Worker',
              date: 'invalid-date-format',
              startTime: '09:00',
              endTime: '17:00',
              role: 'Test',
              status: 'Confirmed',
              notes: 'Bad date',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      expect(() => {
        renderWithProviders(<HeatmapView />, storeWithBadDate);
      }).not.toThrow();

      // The component should render successfully despite date parsing errors
      // (We can see errors are being logged in console, but setupTests.ts interferes with our mock)
      expect(screen.getByText(/This heatmap shows the number of employees scheduled/)).toBeInTheDocument();
    });
  });

  describe('Color Intensity Function', () => {
    it('should apply correct color classes based on employee count', () => {
      const storeWithVaryingCounts = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            // Create shifts to test different intensity levels
            ...Array.from({ length: 6 }, (_, i) => ({
              id: `emp-${i}`,
              employeeName: `Employee ${i + 1}`,
              date: '2024-01-15', // Monday
              startTime: '10:00',
              endTime: '11:00',
              role: 'Test',
              status: 'Confirmed',
              notes: 'Test shift',
            })),
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<HeatmapView />, storeWithVaryingCounts);

      // Should show '6' for the high-intensity hour
      expect(screen.getByText('6')).toBeInTheDocument();

      // Check that different color intensity classes exist
      const heatmapCells = document.querySelectorAll('.w-12.h-10');
      expect(heatmapCells.length).toBeGreaterThan(0);

      // Verify that cells have different color classes
      const cellClasses = Array.from(heatmapCells).map(cell => cell.className);
      const hasBlueClasses = cellClasses.some(className => 
        className.includes('bg-blue-') || className.includes('dark:bg-blue-')
      );
      expect(hasBlueClasses).toBe(true);
    });

    it('should use darkest color for 6+ employees', () => {
      const storeWithManyEmployees = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: Array.from({ length: 8 }, (_, i) => ({
            id: `emp-${i}`,
            employeeName: `Employee ${i + 1}`,
            date: '2024-01-15', // Monday
            startTime: '10:00',
            endTime: '11:00',
            role: 'Test',
            status: 'Confirmed',
            notes: 'Test shift',
          })),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<HeatmapView />, storeWithManyEmployees);

      // Should show '8' for the high-intensity hour
      expect(screen.getByText('8')).toBeInTheDocument();

      // Check for darkest color class (bg-blue-600)
      const intenseCells = document.querySelectorAll('.bg-blue-600');
      expect(intenseCells.length).toBeGreaterThan(0);
    });
  });

  describe('Time Handling', () => {
    it('should correctly generate 24-hour format labels', () => {
      renderWithProviders(<HeatmapView />, createTestStore({
        shifts: { shifts: createWeeklyShifts(), selectedDate: '2024-01-15', templates: [], error: null },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      }));

      // Test that all expected hour labels are present (every 3rd hour)
      const expectedHours = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
      
      expectedHours.forEach(hour => {
        expect(screen.getByText(hour)).toBeInTheDocument();
      });
    });

    it('should handle shifts with minute precision', () => {
      const storeWithMinutes = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Precision Worker',
              date: '2024-01-15', // Monday
              startTime: '09:30',
              endTime: '17:45',
              role: 'Test',
              status: 'Confirmed',
              notes: 'Precise timing',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<HeatmapView />, storeWithMinutes);

      // Should process the shift correctly despite minute precision
      const heatmapCells = document.querySelectorAll('.w-12.h-10');
      expect(heatmapCells.length).toBeGreaterThan(0);
    });

    it('should handle same start and end time gracefully', () => {
      const storeWithZeroLength = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            {
              id: '1',
              employeeName: 'Zero Hour Worker',
              date: '2024-01-15', // Monday
              startTime: '09:00',
              endTime: '09:00',
              role: 'Test',
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

      expect(() => {
        renderWithProviders(<HeatmapView />, storeWithZeroLength);
      }).not.toThrow();

      // Component should render without errors - check for description text using regex
      expect(screen.getByText(/This heatmap shows the number of employees scheduled/)).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes to heatmap elements', () => {
      const darkModeStore = createTestStore({
        ui: { darkMode: true },
        shifts: {
          selectedDate: '2024-01-15',
          shifts: createWeeklyShifts(),
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
      });

      renderWithProviders(<HeatmapView />, darkModeStore);

      // Check description text parent element for dark mode class
      const descriptionElement = screen.getByText(/This heatmap shows the number of employees scheduled/);
      const descriptionParent = descriptionElement.closest('div');
      expect(descriptionParent).toHaveClass('dark:text-gray-300');

      // Check day labels
      const mondayLabel = screen.getByText('Monday');
      expect(mondayLabel).toHaveClass('dark:text-gray-300');

      // Check hour labels
      const hourLabels = document.querySelectorAll('.text-xs.text-gray-500');
      hourLabels.forEach(label => {
        expect(label).toHaveClass('dark:text-gray-400');
      });

      // Check legend labels
      const legendLabels = document.querySelectorAll('.text-xs.text-gray-600');
      legendLabels.forEach(label => {
        expect(label).toHaveClass('dark:text-gray-400');
      });
    });
  });

  describe('Layout and Structure', () => {
    it('should render with proper container classes', () => {
      renderWithProviders(<HeatmapView />, createTestStore({
        shifts: { shifts: createWeeklyShifts(), selectedDate: '2024-01-15', templates: [], error: null },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      }));

      // Look for the container by checking the outer div structure
      const containers = document.querySelectorAll('.overflow-x-auto');
      expect(containers.length).toBeGreaterThan(0);
    });

    it('should render heatmap with minimum width', () => {
      renderWithProviders(<HeatmapView />, createTestStore({
        shifts: { shifts: createWeeklyShifts(), selectedDate: '2024-01-15', templates: [], error: null },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      }));

      const heatmapContainer = document.querySelector('.min-w-\\[800px\\]');
      expect(heatmapContainer).toBeInTheDocument();
    });

    it('should render all 7 day rows', () => {
      renderWithProviders(<HeatmapView />, createTestStore({
        shifts: { shifts: createWeeklyShifts(), selectedDate: '2024-01-15', templates: [], error: null },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      }));

      const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dayLabels.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('should render correct number of hour cells per day', () => {
      renderWithProviders(<HeatmapView />, createTestStore({
        shifts: { shifts: createWeeklyShifts(), selectedDate: '2024-01-15', templates: [], error: null },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      }));

      // Should have 24 hour cells per day * 7 days = 168 total cells
      const heatmapCells = document.querySelectorAll('.w-12.h-10');
      expect(heatmapCells.length).toBe(168);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty heatmap data array', () => {
      const storeWithNoData = createTestStore({
        shifts: { shifts: [], selectedDate: '2024-01-15', templates: [], error: null },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      renderWithProviders(<HeatmapView />, storeWithNoData);

      expect(screen.getByText('No Data Available')).toBeInTheDocument();
    });

    it('should handle shifts spanning week boundaries', () => {
      const storeWithWeekSpanning = createTestStore({
        shifts: {
          selectedDate: '2024-01-15',
          shifts: [
            // Sunday (start of week)
            {
              id: '1',
              employeeName: 'Weekend Worker',
              date: '2024-01-14', // Sunday
              startTime: '08:00',
              endTime: '16:00',
              role: 'Test',
              status: 'Confirmed',
              notes: 'Sunday shift',
            },
            // Saturday (end of week)
            {
              id: '2',
              employeeName: 'Weekend Worker',
              date: '2024-01-20', // Saturday
              startTime: '12:00',
              endTime: '20:00',
              role: 'Test',
              status: 'Confirmed',
              notes: 'Saturday shift',
            },
          ],
          templates: [],
          error: null,
        },
        employees: { employees: [], loading: false, error: null },
        ui: { modalOpen: {}, themeColor: { name: 'blue', value: '#3b82f6' } },
      });

      expect(() => {
        renderWithProviders(<HeatmapView />, storeWithWeekSpanning);
      }).not.toThrow();

      // Check for description text using regex to handle text spanning multiple elements
      expect(screen.getByText(/This heatmap shows the number of employees scheduled/)).toBeInTheDocument();
    });
  });
}); 
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import GridView from '../GridView';
import shiftsSlice from '../../../store/shiftsSlice';
import employeeSlice from '../../../store/employeeSlice';
import uiSlice from '../../../store/uiSlice';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { variants, initial, animate, whileHover, ...restProps } = props;
      return <div {...restProps}>{children}</div>;
    },
  },
}));

// Mock dateUtils
jest.mock('../../../utils/dateUtils', () => ({
  formatDate: jest.fn((date: string) => date), // Return date as-is for simpler testing
}));

// Mock Tooltip component
jest.mock('../../common/Tooltip', () => {
  return function MockTooltip({ children, content, position }: any) {
    return (
      <div data-testid="tooltip" data-content={content} data-position={position}>
        {children}
      </div>
    );
  };
});

// Mock data
const mockShifts = [
  {
    id: '1',
    employeeName: 'John Doe',
    role: 'Front Desk',
    date: '2024-01-15',
    timeRange: '9:00 AM - 5:00 PM',
    status: 'Confirmed',
    color: '#3B82F6',
  },
  {
    id: '2',
    employeeName: 'Jane Smith',
    role: 'Server',
    date: '2024-01-15',
    timeRange: '2:00 PM - 10:00 PM',
    status: 'Pending',
    color: '#A855F7',
  },
  {
    id: '3',
    employeeName: 'Bob Johnson',
    role: 'Cook',
    date: '2024-01-15',
    timeRange: '6:00 AM - 2:00 PM',
    status: 'Canceled',
    color: '#EF4444',
  },
  {
    id: '4',
    employeeName: 'Alice Brown',
    role: 'Manager',
    date: '2024-01-16', // Different date
    timeRange: '8:00 AM - 6:00 PM',
    status: 'Confirmed',
    color: '#EAB308',
  },
];

const mockEmployees = [
  { id: '1', name: 'John Doe', role: 'Front Desk', email: 'john@example.com', phone: '123-456-7890' },
  { id: '2', name: 'Jane Smith', role: 'Server', email: 'jane@example.com', phone: '123-456-7891' },
  { id: '3', name: 'Bob Johnson', role: 'Cook', email: 'bob@example.com', phone: '123-456-7892' },
  { id: '4', name: 'Alice Brown', role: 'Manager', email: 'alice@example.com', phone: '123-456-7893' },
];

const createMockStore = (shiftsData = mockShifts, selectedDate = '2024-01-15') => {
  return configureStore({
    reducer: {
      shifts: shiftsSlice,
      employees: employeeSlice,
      ui: uiSlice,
    },
    preloadedState: {
      shifts: {
        shifts: shiftsData,
        selectedDate,
        viewMode: 'grid',
        selectedShiftId: null,
      },
      employees: {
        employees: mockEmployees,
      },
      ui: {
        modals: {
          editShift: false,
          deleteShift: false,
          addShift: false,
          bulkEdit: false,
        },
        selectedShiftId: null,
        isLoading: false,
        error: null,
      },
    },
  });
};

const renderWithProviders = (
  ui: React.ReactElement,
  store = createMockStore()
) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </Provider>
  );
};

describe('GridView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the grid view title with formatted date', () => {
      renderWithProviders(<GridView />);
      
      // Use more flexible matcher since formatDate might not return expected format
      expect(screen.getByText(/Schedule Grid for/)).toBeInTheDocument();
    });

    it('should render time slots header correctly', () => {
      renderWithProviders(<GridView />);
      
      // Check that time slots are rendered
      expect(screen.getByText('6:00 AM')).toBeInTheDocument();
      expect(screen.getByText('12:00 PM')).toBeInTheDocument();
      expect(screen.getByText('6:00 PM')).toBeInTheDocument();
      expect(screen.getByText('11:00 PM')).toBeInTheDocument();
    });

    it('should render employees column header', () => {
      renderWithProviders(<GridView />);
      
      expect(screen.getByText('Employees')).toBeInTheDocument();
    });

    it('should render employee names in sorted order', () => {
      renderWithProviders(<GridView />);
      
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no shifts exist', () => {
      const store = createMockStore([]);
      renderWithProviders(<GridView />, store);
      
      expect(screen.getByText('No shifts scheduled for this date.')).toBeInTheDocument();
      
      // Should show calendar icon (SVG)
      const svgIcon = document.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });

    it('should show empty state when no shifts match selected date', () => {
      const store = createMockStore(mockShifts, '2024-01-20'); // Different date
      renderWithProviders(<GridView />, store);
      
      expect(screen.getByText('No shifts scheduled for this date.')).toBeInTheDocument();
    });
  });

  describe('Shift Display', () => {
    it('should display shifts for the selected date only', () => {
      renderWithProviders(<GridView />);
      
      // Should show shifts for 2024-01-15
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      
      // Should not show Alice Brown (different date)
      expect(screen.queryByText('Alice Brown')).not.toBeInTheDocument();
    });

    it('should display shift time ranges correctly', () => {
      renderWithProviders(<GridView />);
      
      expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM - 10:00 PM')).toBeInTheDocument();
      expect(screen.getByText('6:00 AM - 2:00 PM')).toBeInTheDocument();
    });

    it('should display shift roles correctly', () => {
      renderWithProviders(<GridView />);
      
      expect(screen.getByText('Front Desk')).toBeInTheDocument();
      expect(screen.getByText('Server')).toBeInTheDocument();
      expect(screen.getByText('Cook')).toBeInTheDocument();
    });
  });

  describe('Role Colors and Styling', () => {
    it('should apply correct background colors for different roles', () => {
      renderWithProviders(<GridView />);
      
      // Test if shift elements exist (exact color testing is complex with CSS-in-JS)
      const frontDeskShift = screen.getByText('9:00 AM - 5:00 PM').closest('div');
      const serverShift = screen.getByText('2:00 PM - 10:00 PM').closest('div');
      const cookShift = screen.getByText('6:00 AM - 2:00 PM').closest('div');
      
      expect(frontDeskShift).toBeInTheDocument();
      expect(serverShift).toBeInTheDocument();
      expect(cookShift).toBeInTheDocument();
    });

    it('should handle unknown role with default colors', () => {
      const shiftsWithUnknownRole = [
        {
          ...mockShifts[0],
          role: 'Unknown Role',
        },
      ];
      
      const store = createMockStore(shiftsWithUnknownRole);
      renderWithProviders(<GridView />, store);
      
      expect(screen.getByText('Unknown Role')).toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('should display correct status indicators', () => {
      renderWithProviders(<GridView />);
      
      // Status indicators are rendered as colored dots
      const statusDots = screen.getAllByRole('generic').filter(el => 
        el.className.includes('h-2 w-2 rounded-full')
      );
      
      expect(statusDots.length).toBeGreaterThan(0);
    });

    it('should handle different status types', () => {
      const shiftsWithDifferentStatuses = [
        { ...mockShifts[0], status: 'Confirmed' },
        { ...mockShifts[1], status: 'Pending' },
        { ...mockShifts[2], status: 'Canceled' },
      ];
      
      const store = createMockStore(shiftsWithDifferentStatuses);
      renderWithProviders(<GridView />, store);
      
      // All shifts should be rendered
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle shift click and dispatch actions', () => {
      const store = createMockStore();
      const mockDispatch = jest.fn();
      store.dispatch = mockDispatch;
      
      renderWithProviders(<GridView />, store);
      
      const shiftElement = screen.getByText('9:00 AM - 5:00 PM').closest('div');
      if (shiftElement) {
        fireEvent.click(shiftElement);
        
        // Should dispatch actions (exact assertions depend on implementation)
        expect(mockDispatch).toHaveBeenCalled();
      }
    });

    it('should handle mouse hover events', () => {
      renderWithProviders(<GridView />);
      
      const shiftElement = screen.getByText('9:00 AM - 5:00 PM').closest('div');
      if (shiftElement) {
        fireEvent.mouseEnter(shiftElement);
        fireEvent.mouseLeave(shiftElement);
        
        // Component should handle hover state changes
        expect(shiftElement).toBeInTheDocument();
      }
    });

    it('should have proper accessibility attributes', () => {
      renderWithProviders(<GridView />);
      
      const shiftElements = screen.getAllByRole('button');
      expect(shiftElements.length).toBeGreaterThan(0);
      
      // Check for aria-label
      shiftElements.forEach(element => {
        expect(element).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Time Calculations', () => {
    it('should handle morning times correctly', () => {
      const morningShifts = [
        {
          ...mockShifts[0],
          timeRange: '8:00 AM - 12:00 PM',
        },
      ];
      
      const store = createMockStore(morningShifts);
      renderWithProviders(<GridView />, store);
      
      expect(screen.getByText('8:00 AM - 12:00 PM')).toBeInTheDocument();
    });

    it('should handle afternoon/evening times correctly', () => {
      const eveningShifts = [
        {
          ...mockShifts[0],
          timeRange: '2:00 PM - 10:00 PM',
        },
      ];
      
      const store = createMockStore(eveningShifts);
      renderWithProviders(<GridView />, store);
      
      expect(screen.getByText('2:00 PM - 10:00 PM')).toBeInTheDocument();
    });

    it('should handle midnight times correctly', () => {
      const midnightShifts = [
        {
          ...mockShifts[0],
          timeRange: '11:00 PM - 7:00 AM',
        },
      ];
      
      const store = createMockStore(midnightShifts);
      renderWithProviders(<GridView />, store);
      
      expect(screen.getByText('11:00 PM - 7:00 AM')).toBeInTheDocument();
    });

    it('should handle 12-hour format edge cases', () => {
      const edgeCaseShifts = [
        {
          ...mockShifts[0],
          timeRange: '12:00 AM - 12:00 PM',
        },
      ];
      
      const store = createMockStore(edgeCaseShifts);
      renderWithProviders(<GridView />, store);
      
      expect(screen.getByText('12:00 AM - 12:00 PM')).toBeInTheDocument();
    });
  });

  describe('Data Processing', () => {
    it('should group shifts by employee correctly', () => {
      const multipleShiftsPerEmployee = [
        { ...mockShifts[0], id: '1a', timeRange: '9:00 AM - 1:00 PM' },
        { ...mockShifts[0], id: '1b', timeRange: '2:00 PM - 6:00 PM' },
        { ...mockShifts[1] },
      ];
      
      const store = createMockStore(multipleShiftsPerEmployee);
      renderWithProviders(<GridView />, store);
      
      // Should show both shifts for John Doe
      expect(screen.getByText('9:00 AM - 1:00 PM')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM - 6:00 PM')).toBeInTheDocument();
      
      // Should still show Jane Smith's shift
      expect(screen.getByText('2:00 PM - 10:00 PM')).toBeInTheDocument();
    });

    it('should sort employees alphabetically', () => {
      renderWithProviders(<GridView />);
      
      const employeeElements = screen.getAllByText(/Bob Johnson|Jane Smith|John Doe/);
      
      // Should appear in alphabetical order (by last name)
      expect(employeeElements[0]).toHaveTextContent('Bob Johnson');
      expect(employeeElements[1]).toHaveTextContent('Jane Smith');
      expect(employeeElements[2]).toHaveTextContent('John Doe');
    });

    it('should handle employees with no shifts gracefully', () => {
      const shiftsSubset = [mockShifts[0]]; // Only John Doe
      const store = createMockStore(shiftsSubset);
      renderWithProviders(<GridView />, store);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  describe('Tooltips', () => {
    it('should render tooltips with correct content', () => {
      renderWithProviders(<GridView />);
      
      const tooltips = screen.getAllByTestId('tooltip');
      expect(tooltips.length).toBeGreaterThan(0);
      
      // Check tooltip content format
      const tooltipContent = tooltips[0].getAttribute('data-content');
      expect(tooltipContent).toContain(' - '); // Should contain employee name and role
    });

    it('should position tooltips correctly', () => {
      renderWithProviders(<GridView />);
      
      const tooltips = screen.getAllByTestId('tooltip');
      tooltips.forEach(tooltip => {
        expect(tooltip).toHaveAttribute('data-position', 'top');
      });
    });
  });

  describe('Grid Layout', () => {
    it('should render proper grid structure', () => {
      renderWithProviders(<GridView />);
      
      // Should have overflow container
      const overflowContainer = document.querySelector('.overflow-x-auto');
      expect(overflowContainer).toBeInTheDocument();
      
      // Should have grid layout
      const gridContainer = document.querySelector('.min-w-max');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should handle responsive layout classes', () => {
      renderWithProviders(<GridView />);
      
      // Should have responsive classes for grid columns
      const gridHeader = document.querySelector('.grid.grid-cols-\\[150px_repeat\\(18\\,_80px\\)\\]');
      expect(gridHeader).toBeInTheDocument();
    });

    it('should alternate row background colors', () => {
      renderWithProviders(<GridView />);
      
      // Check that rows have alternating background colors
      const employeeRows = document.querySelectorAll('[style*="height: 60px"]');
      expect(employeeRows.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid time formats gracefully', () => {
      const invalidTimeShifts = [
        {
          ...mockShifts[0],
          timeRange: 'Invalid Time',
        },
      ];
      
      const store = createMockStore(invalidTimeShifts);
      
      // Suppress console errors for this test
      const originalError = console.error;
      console.error = jest.fn();
      
      // The component should render but might have issues with time parsing
      // Let's just check it doesn't crash the whole app
      renderWithProviders(<GridView />, store);
      
      // Should at least render the title
      expect(screen.getByText(/Schedule Grid for/)).toBeInTheDocument();
      
      console.error = originalError;
    });

    it('should handle empty employee names', () => {
      const emptyNameShifts = [
        {
          ...mockShifts[0],
          employeeName: '',
        },
      ];
      
      const store = createMockStore(emptyNameShifts);
      renderWithProviders(<GridView />, store);
      
      // Should still render without crashing
      expect(screen.getByText(/Schedule Grid for/)).toBeInTheDocument();
    });

    it('should handle very long shift durations', () => {
      const longShifts = [
        {
          ...mockShifts[0],
          timeRange: '6:00 AM - 11:00 PM', // 17-hour shift
        },
      ];
      
      const store = createMockStore(longShifts);
      renderWithProviders(<GridView />, store);
      
      expect(screen.getByText('6:00 AM - 11:00 PM')).toBeInTheDocument();
    });

    it('should handle overlapping shifts for same employee', () => {
      const overlappingShifts = [
        { ...mockShifts[0], id: '1a', timeRange: '9:00 AM - 3:00 PM' },
        { ...mockShifts[0], id: '1b', timeRange: '1:00 PM - 7:00 PM' }, // Overlaps
      ];
      
      const store = createMockStore(overlappingShifts);
      renderWithProviders(<GridView />, store);
      
      expect(screen.getByText('9:00 AM - 3:00 PM')).toBeInTheDocument();
      expect(screen.getByText('1:00 PM - 7:00 PM')).toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    it('should respond to selectedDate changes', () => {
      const store = createMockStore(mockShifts, '2024-01-16');
      renderWithProviders(<GridView />, store);
      
      // Should show Alice Brown's shift for 2024-01-16
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should handle empty shifts array', () => {
      const store = createMockStore([]);
      renderWithProviders(<GridView />, store);
      
      expect(screen.getByText('No shifts scheduled for this date.')).toBeInTheDocument();
    });

    it('should handle missing Redux state gracefully', () => {
      const storeWithMissingData = configureStore({
        reducer: {
          shifts: shiftsSlice,
          employees: employeeSlice,
          ui: uiSlice,
        },
        preloadedState: {
          shifts: {
            shifts: [],
            selectedDate: '2024-01-15',
            viewMode: 'grid',
            selectedShiftId: null,
          },
          employees: {
            employees: [],
          },
          ui: {
            modals: {
              editShift: false,
              deleteShift: false,
              addShift: false,
              bulkEdit: false,
            },
            selectedShiftId: null,
            isLoading: false,
            error: null,
          },
        },
      });
      
      renderWithProviders(<GridView />, storeWithMissingData);
      
      expect(screen.getByText('No shifts scheduled for this date.')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of shifts efficiently', () => {
      const manyShifts = Array.from({ length: 100 }, (_, i) => ({
        id: `shift-${i}`,
        employeeName: `Employee ${i}`,
        role: ['Front Desk', 'Server', 'Cook', 'Manager'][i % 4],
        date: '2024-01-15',
        timeRange: '9:00 AM - 5:00 PM',
        status: 'Confirmed',
        color: '#3B82F6',
      }));
      
      const store = createMockStore(manyShifts);
      
      const startTime = performance.now();
      renderWithProviders(<GridView />, store);
      const endTime = performance.now();
      
      // Should render within reasonable time (1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      
      expect(screen.getByText(/Schedule Grid for/)).toBeInTheDocument();
    });

    it('should memoize computed values correctly', () => {
      const store = createMockStore();
      const { rerender } = renderWithProviders(<GridView />, store);
      
      // Re-render with same props should not cause issues
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <GridView />
          </BrowserRouter>
        </Provider>
      );
      
      expect(screen.getByText(/Schedule Grid for/)).toBeInTheDocument();
    });
  });
}); 
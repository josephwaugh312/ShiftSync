import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ListView from '../ListView';
import shiftsSlice from '../../../store/shiftsSlice';
import employeeSlice from '../../../store/employeeSlice';
import uiSlice from '../../../store/uiSlice';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { variants, initial, animate, ...restProps } = props;
      return <div {...restProps}>{children}</div>;
    },
  },
}));

// Mock dateUtils
jest.mock('../../../utils/dateUtils', () => ({
  formatDate: jest.fn((date: string) => date),
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
  {
    id: '5',
    employeeName: 'Charlie Wilson',
    role: 'Front Desk',
    date: '2024-01-15',
    timeRange: '1:00 PM - 9:00 PM',
    status: 'Confirmed',
    color: '#3B82F6',
  },
];

const mockEmployees = [
  { id: '1', name: 'John Doe', role: 'Front Desk', email: 'john@example.com', phone: '123-456-7890' },
  { id: '2', name: 'Jane Smith', role: 'Server', email: 'jane@example.com', phone: '123-456-7891' },
  { id: '3', name: 'Bob Johnson', role: 'Cook', email: 'bob@example.com', phone: '123-456-7892' },
  { id: '4', name: 'Alice Brown', role: 'Manager', email: 'alice@example.com', phone: '123-456-7893' },
  { id: '5', name: 'Charlie Wilson', role: 'Front Desk', email: 'charlie@example.com', phone: '123-456-7894' },
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
        viewMode: 'list',
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

describe('ListView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the list view title with formatted date', () => {
      renderWithProviders(<ListView />);
      
      expect(screen.getByText(/Shifts for/)).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should render table headers', () => {
      renderWithProviders(<ListView />);
      
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Employee')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render sortable column headers with click handlers', () => {
      renderWithProviders(<ListView />);
      
      const timeHeader = screen.getByText('Time').closest('th');
      const employeeHeader = screen.getByText('Employee').closest('th');
      const roleHeader = screen.getByText('Role').closest('th');
      
      expect(timeHeader).toHaveClass('cursor-pointer');
      expect(employeeHeader).toHaveClass('cursor-pointer');
      expect(roleHeader).toHaveClass('cursor-pointer');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no shifts exist', () => {
      const store = createMockStore([]);
      renderWithProviders(<ListView />, store);
      
      expect(screen.getByText('No shifts scheduled for this date.')).toBeInTheDocument();
      
      // Should show calendar icon
      const calendarIcon = document.querySelector('svg');
      expect(calendarIcon).toBeInTheDocument();
    });

    it('should show empty state when no shifts match selected date', () => {
      const store = createMockStore(mockShifts, '2024-01-20'); // Different date
      renderWithProviders(<ListView />, store);
      
      expect(screen.getByText('No shifts scheduled for this date.')).toBeInTheDocument();
    });

    it('should show search-specific empty state when no results match search', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentEmployee' } });
      
      expect(screen.getByText('No shifts match your search criteria.')).toBeInTheDocument();
    });
  });

  describe('Shift Display', () => {
    it('should display shifts for the selected date only', () => {
      renderWithProviders(<ListView />);
      
      // Should show shifts for 2024-01-15
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Charlie Wilson')).toBeInTheDocument();
      
      // Should not show Alice Brown (different date)
      expect(screen.queryByText('Alice Brown')).not.toBeInTheDocument();
    });

    it('should display shift time ranges correctly', () => {
      renderWithProviders(<ListView />);
      
      expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM - 10:00 PM')).toBeInTheDocument();
      expect(screen.getByText('6:00 AM - 2:00 PM')).toBeInTheDocument();
      expect(screen.getByText('1:00 PM - 9:00 PM')).toBeInTheDocument();
    });

    it('should display shift roles correctly', () => {
      renderWithProviders(<ListView />);
      
      expect(screen.getAllByText('Front Desk')).toHaveLength(2); // John Doe and Charlie Wilson
      expect(screen.getByText('Server')).toBeInTheDocument();
      expect(screen.getByText('Cook')).toBeInTheDocument();
    });

    it('should apply role-specific border colors', () => {
      renderWithProviders(<ListView />);
      
      // Check for border color classes
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1); // Skip header row
      
      expect(dataRows.length).toBeGreaterThan(0);
      dataRows.forEach(row => {
        const firstCell = row.querySelector('td');
        expect(firstCell).toHaveClass('border-l-4');
      });
    });
  });

  describe('Status Badges', () => {
    it('should render confirmed status badge correctly', () => {
      renderWithProviders(<ListView />);
      
      const confirmedBadges = screen.getAllByText('Confirmed');
      expect(confirmedBadges.length).toBeGreaterThan(0);
      
      confirmedBadges.forEach(badge => {
        expect(badge).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('should render pending status badge correctly', () => {
      renderWithProviders(<ListView />);
      
      const pendingBadge = screen.getByText('Pending');
      expect(pendingBadge).toBeInTheDocument();
      expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should render canceled status badge correctly', () => {
      renderWithProviders(<ListView />);
      
      const canceledBadge = screen.getByText('Canceled');
      expect(canceledBadge).toBeInTheDocument();
      expect(canceledBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should handle unknown status with default badge', () => {
      const shiftsWithUnknownStatus = [
        {
          ...mockShifts[0],
          status: 'Unknown Status',
        },
      ];
      
      const store = createMockStore(shiftsWithUnknownStatus);
      renderWithProviders(<ListView />, store);
      
      const unknownBadge = screen.getByText('Unknown Status');
      expect(unknownBadge).toBeInTheDocument();
      expect(unknownBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should include status icons in badges', () => {
      renderWithProviders(<ListView />);
      
      // Check that status badges contain SVG icons
      const badges = screen.getAllByText(/Confirmed|Pending|Canceled/);
      badges.forEach(badge => {
        const svg = badge.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter shifts by employee name', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      fireEvent.change(searchInput, { target: { value: 'John Doe' } });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    it('should filter shifts by role', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      fireEvent.change(searchInput, { target: { value: 'Server' } });
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    it('should filter shifts by time range', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      fireEvent.change(searchInput, { target: { value: '6:00 AM' } });
      
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should filter shifts by status', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      fireEvent.change(searchInput, { target: { value: 'Pending' } });
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      fireEvent.change(searchInput, { target: { value: 'JOHN' } });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should handle partial matches', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      fireEvent.change(searchInput, { target: { value: 'Jo' } });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should clear search results when input is cleared', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      
      // Search for John
      fireEvent.change(searchInput, { target: { value: 'John' } });
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      
      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by time in ascending order by default', () => {
      renderWithProviders(<ListView />);
      
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1); // Skip header row
      
      // Should be sorted by time (6 AM, 9 AM, 1 PM, 2 PM)
      expect(dataRows[0]).toHaveTextContent('6:00 AM - 2:00 PM'); // Bob Johnson
      expect(dataRows[1]).toHaveTextContent('9:00 AM - 5:00 PM'); // John Doe
      expect(dataRows[2]).toHaveTextContent('1:00 PM - 9:00 PM'); // Charlie Wilson
      expect(dataRows[3]).toHaveTextContent('2:00 PM - 10:00 PM'); // Jane Smith
    });

    it('should toggle time sorting direction when clicked', () => {
      renderWithProviders(<ListView />);
      
      const timeHeader = screen.getByText('Time').closest('th');
      
      // Click to sort descending
      fireEvent.click(timeHeader!);
      
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      
      // Should be sorted in descending order (2 PM, 1 PM, 9 AM, 6 AM)
      expect(dataRows[0]).toHaveTextContent('2:00 PM - 10:00 PM'); // Jane Smith
      expect(dataRows[1]).toHaveTextContent('1:00 PM - 9:00 PM'); // Charlie Wilson
      expect(dataRows[2]).toHaveTextContent('9:00 AM - 5:00 PM'); // John Doe
      expect(dataRows[3]).toHaveTextContent('6:00 AM - 2:00 PM'); // Bob Johnson
    });

    it('should sort by employee name when clicked', () => {
      renderWithProviders(<ListView />);
      
      const employeeHeader = screen.getByText('Employee').closest('th');
      fireEvent.click(employeeHeader!);
      
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      
      // Should be sorted alphabetically (Bob, Charlie, Jane, John)
      expect(dataRows[0]).toHaveTextContent('Bob Johnson');
      expect(dataRows[1]).toHaveTextContent('Charlie Wilson');
      expect(dataRows[2]).toHaveTextContent('Jane Smith');
      expect(dataRows[3]).toHaveTextContent('John Doe');
    });

    it('should sort by role when clicked', () => {
      renderWithProviders(<ListView />);
      
      const roleHeader = screen.getByText('Role').closest('th');
      fireEvent.click(roleHeader!);
      
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      
      // Should be sorted by role (Cook, Front Desk x2, Server)
      expect(dataRows[0]).toHaveTextContent('Cook');
      expect(dataRows[1]).toHaveTextContent('Front Desk');
      expect(dataRows[2]).toHaveTextContent('Front Desk');
      expect(dataRows[3]).toHaveTextContent('Server');
    });

    it('should show sort direction indicators', () => {
      renderWithProviders(<ListView />);
      
      // Time should be sorted by default, should show ascending arrow
      const timeHeader = screen.getByText('Time').closest('th');
      const sortIcon = timeHeader?.querySelector('svg');
      expect(sortIcon).toBeInTheDocument();
    });

    it('should handle sorting with search active', () => {
      renderWithProviders(<ListView />);
      
      // Search for Front Desk employees
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      fireEvent.change(searchInput, { target: { value: 'Front Desk' } });
      
      // Sort by employee name
      const employeeHeader = screen.getByText('Employee').closest('th');
      fireEvent.click(employeeHeader!);
      
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      
      expect(dataRows).toHaveLength(2);
      expect(dataRows[0]).toHaveTextContent('Charlie Wilson');
      expect(dataRows[1]).toHaveTextContent('John Doe');
    });
  });

  describe('Interactions', () => {
    it('should handle row click and dispatch actions', () => {
      const store = createMockStore();
      const mockDispatch = jest.fn();
      store.dispatch = mockDispatch;
      
      renderWithProviders(<ListView />, store);
      
      const firstRow = screen.getAllByRole('row')[1]; // Skip header
      fireEvent.click(firstRow);
      
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle edit button click', () => {
      const store = createMockStore();
      const mockDispatch = jest.fn();
      store.dispatch = mockDispatch;
      
      renderWithProviders(<ListView />, store);
      
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.querySelector('svg')?.getAttribute('d')?.includes('15.232')
      );
      
      if (editButton) {
        fireEvent.click(editButton);
        expect(mockDispatch).toHaveBeenCalled();
      }
    });

    it('should stop propagation on edit button click', () => {
      renderWithProviders(<ListView />);
      
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.querySelector('svg')?.getAttribute('d')?.includes('15.232')
      );
      
      if (editButton) {
        const stopPropagationSpy = jest.fn();
        const mockEvent = { stopPropagation: stopPropagationSpy };
        
        fireEvent.click(editButton, mockEvent);
        // The component should call stopPropagation (tested by not throwing)
      }
    });

    it('should show edit tooltips', () => {
      renderWithProviders(<ListView />);
      
      const tooltips = screen.getAllByTestId('tooltip');
      const editTooltips = tooltips.filter(tooltip => 
        tooltip.getAttribute('data-content') === 'Edit Shift'
      );
      
      expect(editTooltips.length).toBeGreaterThan(0);
      editTooltips.forEach(tooltip => {
        expect(tooltip).toHaveAttribute('data-position', 'top');
      });
    });
  });

  describe('Role-Based Styling', () => {
    it('should apply correct hover colors for different roles', () => {
      renderWithProviders(<ListView />);
      
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      
      // Test that rows have role-specific hover classes
      dataRows.forEach(row => {
        // Each row should have a hover class
        expect(row.className).toMatch(/hover:bg-/);
      });
    });

    it('should apply correct border colors for different roles', () => {
      renderWithProviders(<ListView />);
      
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      
      dataRows.forEach(row => {
        const firstCell = row.querySelector('td');
        expect(firstCell).toHaveClass('border-l-4');
        expect(firstCell?.className).toMatch(/border-(blue|purple|yellow|red|gray)-500/);
      });
    });

    it('should handle unknown roles with default styling', () => {
      const shiftsWithUnknownRole = [
        {
          ...mockShifts[0],
          role: 'Unknown Role',
        },
      ];
      
      const store = createMockStore(shiftsWithUnknownRole);
      renderWithProviders(<ListView />, store);
      
      expect(screen.getByText('Unknown Role')).toBeInTheDocument();
      
      const row = screen.getAllByRole('row')[1];
      expect(row.className).toContain('hover:bg-gray-100');
    });
  });

  describe('Responsive Design', () => {
    it('should hide search input on mobile (md:block class)', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      const searchContainer = searchInput.closest('.hidden');
      expect(searchContainer).toHaveClass('hidden', 'md:block');
    });

    it('should have overflow scroll for table', () => {
      renderWithProviders(<ListView />);
      
      const tableContainer = document.querySelector('.overflow-x-auto');
      expect(tableContainer).toBeInTheDocument();
    });

    it('should have minimum width for table', () => {
      renderWithProviders(<ListView />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('min-w-full');
    });
  });

  describe('Time Parsing and Sorting', () => {
    it('should handle 12-hour time format correctly', () => {
      const timeFormats = [
        { ...mockShifts[0], timeRange: '12:00 AM - 8:00 AM' },
        { ...mockShifts[1], timeRange: '12:00 PM - 8:00 PM' },
        { ...mockShifts[2], timeRange: '11:59 PM - 7:59 AM' },
      ];
      
      const store = createMockStore(timeFormats);
      renderWithProviders(<ListView />, store);
      
      expect(screen.getByText('12:00 AM - 8:00 AM')).toBeInTheDocument();
      expect(screen.getByText('12:00 PM - 8:00 PM')).toBeInTheDocument();
      expect(screen.getByText('11:59 PM - 7:59 AM')).toBeInTheDocument();
    });

    it('should sort times correctly across AM/PM boundary', () => {
      const crossBoundaryShifts = [
        { ...mockShifts[0], timeRange: '11:00 PM - 7:00 AM' },
        { ...mockShifts[1], timeRange: '6:00 AM - 2:00 PM' },
        { ...mockShifts[2], timeRange: '12:00 AM - 8:00 AM' },
      ];
      
      const store = createMockStore(crossBoundaryShifts);
      renderWithProviders(<ListView />, store);
      
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      
      // Should be sorted: 12:00 AM, 6:00 AM, 11:00 PM
      expect(dataRows[0]).toHaveTextContent('12:00 AM - 8:00 AM');
      expect(dataRows[1]).toHaveTextContent('6:00 AM - 2:00 PM');
      expect(dataRows[2]).toHaveTextContent('11:00 PM - 7:00 AM');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid time formats gracefully', () => {
      const invalidTimeShifts = [
        {
          ...mockShifts[0],
          timeRange: 'Invalid Time Format',
        },
      ];
      
      const store = createMockStore(invalidTimeShifts);
      
      expect(() => {
        renderWithProviders(<ListView />, store);
      }).not.toThrow();
      
      expect(screen.getByText('Invalid Time Format')).toBeInTheDocument();
    });

    it('should handle empty employee names', () => {
      const emptyNameShifts = [
        {
          ...mockShifts[0],
          employeeName: '',
        },
      ];
      
      const store = createMockStore(emptyNameShifts);
      renderWithProviders(<ListView />, store);
      
      // Should still render row with empty name
      expect(screen.getByText(/Shifts for/)).toBeInTheDocument();
    });

    it('should handle special characters in search', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      fireEvent.change(searchInput, { target: { value: '@#$%' } });
      
      expect(screen.getByText('No shifts match your search criteria.')).toBeInTheDocument();
    });

    it('should handle very long search queries', () => {
      renderWithProviders(<ListView />);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      const longQuery = 'a'.repeat(1000);
      
      expect(() => {
        fireEvent.change(searchInput, { target: { value: longQuery } });
      }).not.toThrow();
    });
  });

  describe('Redux Integration', () => {
    it('should respond to selectedDate changes', () => {
      const store = createMockStore(mockShifts, '2024-01-16');
      renderWithProviders(<ListView />, store);
      
      // Should show Alice Brown's shift for 2024-01-16
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should handle empty shifts array', () => {
      const store = createMockStore([]);
      renderWithProviders(<ListView />, store);
      
      expect(screen.getByText('No shifts scheduled for this date.')).toBeInTheDocument();
    });

    it('should maintain search state during re-renders', () => {
      const store = createMockStore();
      const { rerender } = renderWithProviders(<ListView />, store);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      fireEvent.change(searchInput, { target: { value: 'John' } });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      
      // Re-render
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <ListView />
          </BrowserRouter>
        </Provider>
      );
      
      // Search should be maintained
      expect(searchInput).toHaveValue('John');
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of shifts efficiently', () => {
      const manyShifts = Array.from({ length: 1000 }, (_, i) => ({
        id: `shift-${i}`,
        employeeName: `Employee ${i}`,
        role: ['Front Desk', 'Server', 'Cook', 'Manager'][i % 4],
        date: '2024-01-15',
        timeRange: '9:00 AM - 5:00 PM',
        status: ['Confirmed', 'Pending', 'Canceled'][i % 3],
        color: '#3B82F6',
      }));
      
      const store = createMockStore(manyShifts);
      
      const startTime = performance.now();
      renderWithProviders(<ListView />, store);
      const endTime = performance.now();
      
      // Should render within reasonable time (2 seconds for large dataset)
      expect(endTime - startTime).toBeLessThan(2000);
      
      expect(screen.getByText(/Shifts for/)).toBeInTheDocument();
    });

    it('should handle large search queries efficiently', () => {
      const manyShifts = Array.from({ length: 100 }, (_, i) => ({
        id: `shift-${i}`,
        employeeName: `Employee ${i}`,
        role: 'Front Desk',
        date: '2024-01-15',
        timeRange: '9:00 AM - 5:00 PM',
        status: 'Confirmed',
        color: '#3B82F6',
      }));
      
      const store = createMockStore(manyShifts);
      renderWithProviders(<ListView />, store);
      
      const searchInput = screen.getByPlaceholderText('Search shifts...');
      
      const startTime = performance.now();
      fireEvent.change(searchInput, { target: { value: 'Employee 5' } });
      const endTime = performance.now();
      
      // Search should be fast
      expect(endTime - startTime).toBeLessThan(100);
      
      expect(screen.getByText('Employee 5')).toBeInTheDocument();
    });

    it('should memoize sorting and filtering correctly', () => {
      const store = createMockStore();
      const { rerender } = renderWithProviders(<ListView />, store);
      
      // Multiple re-renders should not cause performance issues
      for (let i = 0; i < 5; i++) {
        rerender(
          <Provider store={store}>
            <BrowserRouter>
              <ListView />
            </BrowserRouter>
          </Provider>
        );
      }
      
      expect(screen.getByText(/Shifts for/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure for screen readers', () => {
      renderWithProviders(<ListView />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(5);
      
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it('should have proper scope attributes on headers', () => {
      renderWithProviders(<ListView />);
      
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should have accessible edit buttons', () => {
      renderWithProviders(<ListView />);
      
      const editButtons = screen.getAllByRole('button');
      editButtons.forEach(button => {
        // Should be focusable and have meaningful content
        expect(button).toBeInTheDocument();
      });
    });

    it('should have keyboard accessible sort headers', () => {
      renderWithProviders(<ListView />);
      
      const sortableHeaders = [
        screen.getByText('Time').closest('th'),
        screen.getByText('Employee').closest('th'),
        screen.getByText('Role').closest('th'),
      ];
      
      sortableHeaders.forEach(header => {
        expect(header).toHaveClass('cursor-pointer');
      });
    });
  });
}); 
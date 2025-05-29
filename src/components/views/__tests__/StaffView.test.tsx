import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import StaffView from '../StaffView';
import shiftsSlice from '../../../store/shiftsSlice';
import employeeSlice from '../../../store/employeeSlice';
import { Shift, Employee } from '../../../types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock dateUtils
jest.mock('../../../utils/dateUtils', () => ({
  formatDate: jest.fn((date) => `Formatted: ${date}`),
}));

// Create test store
const createTestStore = (shifts: Shift[] = [], employees: Employee[] = [], selectedDate = '2024-01-15') => {
  return configureStore({
    reducer: {
      shifts: shiftsSlice,
      employees: employeeSlice,
    },
    preloadedState: {
      shifts: {
        shifts,
        selectedDate,
        templates: [],
        error: null,
      },
      employees: {
        employees,
        error: null,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

// Mock data
const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'Manager',
    email: 'john@example.com',
    phone: '555-0101',
    color: 'bg-blue-500',
    availability: {},
  },
  {
    id: '2',
    name: 'Jane Smith',
    role: 'Server',
    email: 'jane@example.com',
    phone: '555-0102',
    color: 'bg-purple-500',
    availability: {},
  },
  {
    id: '3',
    name: 'Bob Wilson',
    role: 'Cook',
    email: 'bob@example.com',
    phone: '555-0103',
    color: 'bg-red-500',
    availability: {},
  },
  {
    id: '4',
    name: 'Alice Brown',
    role: 'Front Desk',
    email: 'alice@example.com',
    phone: '555-0104',
    color: 'bg-green-500',
    availability: {},
  },
];

const mockShifts: Shift[] = [
  {
    id: '1',
    employeeName: 'John Doe',
    role: 'Manager',
    date: '2024-01-15',
    timeRange: '9:00 AM - 5:00 PM',
    status: 'Confirmed',
  },
  {
    id: '2',
    employeeName: 'Jane Smith',
    role: 'Server',
    date: '2024-01-15',
    timeRange: '11:00 AM - 7:00 PM',
    status: 'Pending',
  },
  {
    id: '3',
    employeeName: 'Bob Wilson',
    role: 'Cook',
    date: '2024-01-15',
    timeRange: '10:00 AM - 6:00 PM',
    status: 'Canceled',
  },
  {
    id: '4',
    employeeName: 'Alice Brown',
    role: 'Front Desk',
    date: '2024-01-15',
    timeRange: '8:00 AM - 4:00 PM',
    status: 'Confirmed',
  },
  {
    id: '5',
    employeeName: 'John Doe',
    role: 'Manager',
    date: '2024-01-15',
    timeRange: '6:00 PM - 10:00 PM',
    status: 'Pending',
  },
  // Different date shifts (should not appear)
  {
    id: '6',
    employeeName: 'Jane Smith',
    role: 'Server',
    date: '2024-01-16',
    timeRange: '12:00 PM - 8:00 PM',
    status: 'Confirmed',
  },
];

describe('StaffView', () => {
  describe('basic rendering', () => {
    it('should render staff view with title', () => {
      renderWithProvider(<StaffView />);
      
      expect(screen.getByText(/Staff Schedule for/)).toBeInTheDocument();
    });

    it('should render empty state when no shifts are scheduled', () => {
      renderWithProvider(<StaffView />);
      
      expect(screen.getByText('No staff scheduled for this date.')).toBeInTheDocument();
      // Check for the SVG element by its class or parent element
      const svgIcon = document.querySelector('.w-16.h-16.text-gray-400');
      expect(svgIcon).toBeInTheDocument();
    });
  });

  describe('shift grouping and display', () => {
    it('should group shifts by employee name', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      // Should show employees with shifts on selected date
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    });

    it('should display correct number of shifts per employee', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      // John Doe has 2 shifts
      expect(screen.getByText('2 shifts')).toBeInTheDocument();
      
      // Others have 1 shift each
      const singleShiftElements = screen.getAllByText('1 shift');
      expect(singleShiftElements).toHaveLength(3);
    });

    it('should filter shifts by selected date', () => {
      const store = createTestStore(mockShifts, mockEmployees, '2024-01-16');
      renderWithProvider(<StaffView />, store);
      
      // Only Jane Smith should appear for 2024-01-16
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
      expect(screen.queryByText('Alice Brown')).not.toBeInTheDocument();
    });

    it('should display shift details correctly', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      // Check time ranges
      expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
      expect(screen.getByText('11:00 AM - 7:00 PM')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM - 6:00 PM')).toBeInTheDocument();
      expect(screen.getByText('8:00 AM - 4:00 PM')).toBeInTheDocument();
      expect(screen.getByText('6:00 PM - 10:00 PM')).toBeInTheDocument();
    });
  });

  describe('employee information display', () => {
    it('should display employee initials in avatar', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      // Check for first letter of each employee name (using getAllByText since multiple 'J's exist)
      expect(screen.getAllByText('J').length).toBeGreaterThanOrEqual(2); // John and Jane
      expect(screen.getByText('B')).toBeInTheDocument(); // Bob
      expect(screen.getByText('A')).toBeInTheDocument(); // Alice
    });

    it('should display employee roles when employee data is available', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      // Should show role badges for each employee (some roles appear multiple times due to shift details)
      expect(screen.getAllByText('Manager').length).toBeGreaterThanOrEqual(1); // In badge
      expect(screen.getAllByText('Server').length).toBeGreaterThanOrEqual(1); // In badge  
      expect(screen.getAllByText('Cook').length).toBeGreaterThanOrEqual(1); // In badge
      expect(screen.getAllByText('Front Desk').length).toBeGreaterThanOrEqual(1); // In badge
    });

    it('should handle missing employee data gracefully', () => {
      const store = createTestStore(mockShifts, []); // No employees data
      renderWithProvider(<StaffView />, store);
      
      // Should still display employee names from shifts
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      
      // Should show default avatar background
      const avatars = document.querySelectorAll('.bg-gray-400');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('role badge colors', () => {
    it('should apply correct colors for Manager role', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      // Get all Manager text elements and find the badge one
      const managerElements = screen.getAllByText('Manager');
      const managerBadge = managerElements.find(el => el.closest('span')?.classList.contains('inline-block'));
      expect(managerBadge?.closest('span')).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should apply correct colors for Server role', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      // Get all Server text elements and find the badge one
      const serverElements = screen.getAllByText('Server');
      const serverBadge = serverElements.find(el => el.closest('span')?.classList.contains('inline-block'));
      expect(serverBadge?.closest('span')).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('should apply correct colors for Cook role', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      // Get all Cook text elements and find the badge one
      const cookElements = screen.getAllByText('Cook');
      const cookBadge = cookElements.find(el => el.closest('span')?.classList.contains('inline-block'));
      expect(cookBadge?.closest('span')).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should apply correct colors for Front Desk role', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      // Get all Front Desk text elements and find the badge one
      const frontDeskElements = screen.getAllByText('Front Desk');
      const frontDeskBadge = frontDeskElements.find(el => el.closest('span')?.classList.contains('inline-block'));
      expect(frontDeskBadge?.closest('span')).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should apply default colors for unknown role', () => {
      const customEmployee: Employee = {
        id: '5',
        name: 'Custom Person',
        role: 'Unknown Role',
        email: 'custom@example.com',
        phone: '555-0105',
        color: 'bg-gray-500',
        availability: {},
      };

      const customShift: Shift = {
        id: '7',
        employeeName: 'Custom Person',
        role: 'Unknown Role',
        date: '2024-01-15',
        timeRange: '1:00 PM - 2:00 PM',
        status: 'Confirmed',
      };

      const store = createTestStore([customShift], [customEmployee]);
      renderWithProvider(<StaffView />, store);
      
      // Get all Unknown Role text elements and find the badge one
      const unknownElements = screen.getAllByText('Unknown Role');
      const unknownBadge = unknownElements.find(el => el.closest('span')?.classList.contains('inline-block'));
      expect(unknownBadge?.closest('span')).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('status badges', () => {
    it('should display Confirmed status with check icon', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      const confirmedBadges = screen.getAllByText('Confirmed');
      expect(confirmedBadges.length).toBeGreaterThan(0);
      
      confirmedBadges.forEach(badge => {
        const span = badge.closest('span');
        expect(span).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('should display Pending status with clock icon', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      const pendingBadges = screen.getAllByText('Pending');
      expect(pendingBadges.length).toBeGreaterThan(0);
      
      pendingBadges.forEach(badge => {
        const span = badge.closest('span');
        expect(span).toHaveClass('bg-yellow-100', 'text-yellow-800');
      });
    });

    it('should display Canceled status with X icon', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      const canceledBadges = screen.getAllByText('Canceled');
      expect(canceledBadges.length).toBeGreaterThan(0);
      
      canceledBadges.forEach(badge => {
        const span = badge.closest('span');
        expect(span).toHaveClass('bg-red-100', 'text-red-800');
      });
    });

    it('should handle unknown status with default styling', () => {
      const customShift: Shift = {
        id: '8',
        employeeName: 'Test Employee',
        role: 'Server',
        date: '2024-01-15',
        timeRange: '1:00 PM - 2:00 PM',
        status: 'Unknown Status',
      };

      const store = createTestStore([customShift], mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      const unknownBadge = screen.getByText('Unknown Status').closest('span');
      expect(unknownBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('role styling for shifts', () => {
    it('should apply correct border and background colors for different roles', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      // Check that shift items have role-based styling
      const shiftItems = document.querySelectorAll('li');
      expect(shiftItems.length).toBeGreaterThan(0);
      
      // Check for border colors (role-based)
      const frontDeskBorder = document.querySelector('.border-blue-500');
      const serverBorder = document.querySelector('.border-purple-500');
      const managerBorder = document.querySelector('.border-yellow-500');
      const cookBorder = document.querySelector('.border-red-500');
      
      expect(frontDeskBorder).toBeInTheDocument();
      expect(serverBorder).toBeInTheDocument();
      expect(managerBorder).toBeInTheDocument();
      expect(cookBorder).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty shift arrays correctly', () => {
      // Test the "skip empty shift arrays" logic
      const emptyShifts: Shift[] = [];
      const store = createTestStore(emptyShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      expect(screen.getByText('No staff scheduled for this date.')).toBeInTheDocument();
    });

    it('should handle shifts with same employee name but different roles', () => {
      const mixedRoleShifts: Shift[] = [
        {
          id: '1',
          employeeName: 'Flexible Employee',
          role: 'Server',
          date: '2024-01-15',
          timeRange: '9:00 AM - 1:00 PM',
          status: 'Confirmed',
        },
        {
          id: '2',
          employeeName: 'Flexible Employee',
          role: 'Cook',
          date: '2024-01-15',
          timeRange: '2:00 PM - 6:00 PM',
          status: 'Confirmed',
        },
      ];

      const flexibleEmployee: Employee = {
        id: '1',
        name: 'Flexible Employee',
        role: 'Server', // Primary role
        email: 'flexible@example.com',
        phone: '555-0199',
        color: 'bg-green-500',
        availability: {},
      };

      const store = createTestStore(mixedRoleShifts, [flexibleEmployee]);
      renderWithProvider(<StaffView />, store);
      
      expect(screen.getByText('Flexible Employee')).toBeInTheDocument();
      expect(screen.getByText('2 shifts')).toBeInTheDocument();
      expect(screen.getAllByText('Server')).toHaveLength(2); // In badge and shift details
      expect(screen.getByText('Cook')).toBeInTheDocument(); // In shift details
    });
  });

  describe('responsive layout', () => {
    it('should apply responsive grid classes', () => {
      const store = createTestStore(mockShifts, mockEmployees);
      renderWithProvider(<StaffView />, store);
      
      const grid = document.querySelector('.grid');
      expect(grid).toHaveClass('gap-6', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });
}); 
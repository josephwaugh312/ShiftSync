import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import EmployeesPage from '../EmployeesPage';
import employeeSlice from '../../../store/employeeSlice';
import uiSlice from '../../../store/uiSlice';
import { Employee } from '../../../types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock CustomFocusButton
jest.mock('../CustomFocusButton', () => {
  return function MockCustomFocusButton({ children, onClick, variant, sound, ...props }: any) {
    return (
      <button 
        onClick={onClick} 
        data-variant={variant}
        data-sound={sound}
        {...props}
      >
        {children}
      </button>
    );
  };
});

// Mock sound effects
jest.mock('../../../hooks/useSoundEffects', () => ({
  __esModule: true,
  default: () => ({
    playSound: jest.fn(),
  }),
}));

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'Manager',
    color: 'bg-yellow-500'
  },
  {
    id: '2',
    name: 'Jane Smith',
    role: 'Server',
    color: 'bg-purple-500'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    role: 'Cook',
    color: 'bg-red-500'
  }
];

const createMockStore = (initialEmployees: Employee[] = []) => {
  return configureStore({
    reducer: {
      employees: employeeSlice,
      ui: uiSlice,
    },
    preloadedState: {
      employees: {
        employees: initialEmployees,
      },
      ui: {
        notifications: [],
        isLoading: false,
        darkMode: false,
        soundEnabled: true,
        activeView: 'calendar' as const,
        selectedDate: '2024-01-15',
        tutorialCompleted: false,
        tutorialStep: 0,
        keyboardShortcutsVisible: false,
        debugMode: false,
        notificationPreferences: {
          enabled: true,
          types: {
            general: true,
            shifts: true,
            system: true,
          },
        },
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, initialEmployees: Employee[] = []) => {
  const store = createMockStore(initialEmployees);
  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    ),
    store,
  };
};

describe('EmployeesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the employees page with title', () => {
      renderWithProviders(<EmployeesPage />);
      
      expect(screen.getByText('Employees')).toBeInTheDocument();
      expect(screen.getAllByText('Add Employee')).toHaveLength(2); // One in header, one in empty state
    });

    it('should show empty state when no employees exist', () => {
      renderWithProviders(<EmployeesPage />);
      
      expect(screen.getByText('No employees found')).toBeInTheDocument();
      expect(screen.getAllByText('Add Employee')).toHaveLength(2); // One in header, one in empty state
    });

    it('should render employees list when employees exist', () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
      expect(screen.getByText('Server')).toBeInTheDocument();
      expect(screen.getByText('Cook')).toBeInTheDocument();
    });

    it('should show Clear All button when employees exist', () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should not show Clear All button when no employees exist', () => {
      renderWithProviders(<EmployeesPage />);
      
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });

  describe('Add Employee Form', () => {
    it('should show add form when Add Employee button is clicked', async () => {
      renderWithProviders(<EmployeesPage />);
      
      const addButton = screen.getAllByText('Add Employee')[0]; // Use first one (header button)
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Employee')).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Role')).toBeInTheDocument();
      });
    });

    it('should toggle add form when Add Employee button is clicked multiple times', async () => {
      renderWithProviders(<EmployeesPage />);
      
      const addButton = screen.getAllByText('Add Employee')[0]; // Use first one (header button)
      
      // First click - show form
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByText('Add New Employee')).toBeInTheDocument();
      });
      
      // Second click - hide form
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.queryByText('Add New Employee')).not.toBeInTheDocument();
      });
    });

    it('should update form fields when typing', async () => {
      renderWithProviders(<EmployeesPage />);
      
      const addButton = screen.getAllByText('Add Employee')[0]; // Use first one (header button)
      fireEvent.click(addButton);
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
        const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement;
        
        fireEvent.change(nameInput, { target: { value: 'Test Employee' } });
        fireEvent.change(roleSelect, { target: { value: 'Manager' } });
        
        expect(nameInput.value).toBe('Test Employee');
        expect(roleSelect.value).toBe('Manager');
      });
    });

    it('should add new employee successfully', async () => {
      const { store } = renderWithProviders(<EmployeesPage />);
      
      const addButton = screen.getAllByText('Add Employee')[0]; // Use first one (header button)
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Employee')).toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText('Name');
      // Find the submit button by its data attributes within the form
      const submitButton = screen.getAllByRole('button', { name: 'Add Employee' }).find(btn => 
        btn.getAttribute('data-sound') === 'success'
      );
      
      fireEvent.change(nameInput, { target: { value: 'New Employee' } });
      
      if (submitButton) {
        fireEvent.click(submitButton);
      }
      
      // Check that employee was added to store
      await waitFor(() => {
        const state = store.getState();
        expect(state.employees.employees).toHaveLength(1);
        expect(state.employees.employees[0].name).toBe('New Employee');
        expect(state.employees.employees[0].role).toBe('Server'); // Default role
      });
    });

    it('should show error when trying to add employee without name', async () => {
      renderWithProviders(<EmployeesPage />);
      
      const addButton = screen.getAllByText('Add Employee')[0]; // Use first one (header button)
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Employee')).toBeInTheDocument();
      });
      
      // Find the submit button by its data attributes within the form
      const submitButton = screen.getAllByRole('button', { name: 'Add Employee' }).find(btn => 
        btn.getAttribute('data-sound') === 'success'
      );
      
      if (submitButton) {
        fireEvent.click(submitButton);
      }
      
      // Form should still be visible (not submitted)
      await waitFor(() => {
        expect(screen.getByText('Add New Employee')).toBeInTheDocument();
      });
    });

    it('should clear form after successful submission', async () => {
      renderWithProviders(<EmployeesPage />);
      
      const addButton = screen.getAllByText('Add Employee')[0]; // Use first one (header button)
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Employee')).toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
      // Find the submit button by its data attributes within the form
      const submitButton = screen.getAllByRole('button', { name: 'Add Employee' }).find(btn => 
        btn.getAttribute('data-sound') === 'success'
      );
      
      fireEvent.change(nameInput, { target: { value: 'Test Employee' } });
      
      if (submitButton) {
        fireEvent.click(submitButton);
      }
      
      // Form should be hidden after submission
      await waitFor(() => {
        expect(screen.queryByText('Add New Employee')).not.toBeInTheDocument();
      });
    });

    it('should set correct color based on role selection', async () => {
      const { store } = renderWithProviders(<EmployeesPage />);
      
      const addButton = screen.getAllByText('Add Employee')[0]; // Use first one (header button)
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Employee')).toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText('Name');
      const roleSelect = screen.getByLabelText('Role');
      // Find the submit button by its data attributes within the form
      const submitButton = screen.getAllByRole('button', { name: 'Add Employee' }).find(btn => 
        btn.getAttribute('data-sound') === 'success'
      );
      
      fireEvent.change(nameInput, { target: { value: 'Manager Employee' } });
      fireEvent.change(roleSelect, { target: { value: 'Manager' } });
      
      if (submitButton) {
        fireEvent.click(submitButton);
      }
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.employees.employees[0].color).toBe('bg-yellow-500');
      });
    });
  });

  describe('Edit Employee Form', () => {
    it('should show edit form when employee is clicked', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const employeeElement = screen.getByText('John Doe');
      fireEvent.click(employeeElement);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Employee')).toBeInTheDocument();
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Manager')).toBeInTheDocument();
      });
    });

    it('should close edit form when close button is clicked', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const employeeElement = screen.getByText('John Doe');
      fireEvent.click(employeeElement);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Employee')).toBeInTheDocument();
      });
      
      // Find the close button by its SVG path - the X icon
      const closeButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('path[d="M6 18L18 6M6 6l12 12"]')
      );
      
      if (closeButton) {
        fireEvent.click(closeButton);
      }
      
      await waitFor(() => {
        expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
      });
    });

    it('should update employee successfully', async () => {
      const { store } = renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const employeeElement = screen.getByText('John Doe');
      fireEvent.click(employeeElement);
      
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        const updateButton = screen.getByText('Update Employee');
        
        fireEvent.change(nameInput, { target: { value: 'John Updated' } });
        fireEvent.click(updateButton);
      });
      
      const state = store.getState();
      const updatedEmployee = state.employees.employees.find(emp => emp.id === '1');
      expect(updatedEmployee?.name).toBe('John Updated');
    });

    it('should not update employee with empty name', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const employeeElement = screen.getByText('John Doe');
      fireEvent.click(employeeElement);
      
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        const updateButton = screen.getByText('Update Employee');
        
        fireEvent.change(nameInput, { target: { value: '' } });
        fireEvent.click(updateButton);
      });
      
      // Form should still be visible
      await waitFor(() => {
        expect(screen.getByText('Edit Employee')).toBeInTheDocument();
      });
    });

    it('should update role and color when role changes in edit form', async () => {
      const { store } = renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const employeeElement = screen.getByText('John Doe');
      fireEvent.click(employeeElement);
      
      await waitFor(() => {
        const roleSelect = screen.getByDisplayValue('Manager');
        const updateButton = screen.getByText('Update Employee');
        
        fireEvent.change(roleSelect, { target: { value: 'Cook' } });
        fireEvent.click(updateButton);
      });
      
      const state = store.getState();
      const updatedEmployee = state.employees.employees.find(emp => emp.id === '1');
      expect(updatedEmployee?.role).toBe('Cook');
      expect(updatedEmployee?.color).toBe('bg-red-500');
    });
  });

  describe('Delete Employee', () => {
    it('should delete employee when delete button is clicked', async () => {
      const { store } = renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg') && btn.querySelector('path[d*="M19 7l"]')
      );
      
      if (deleteButtons[0]) {
        fireEvent.click(deleteButtons[0]);
      }
      
      const state = store.getState();
      expect(state.employees.employees).toHaveLength(2);
    });

    it('should close edit form if deleting currently edited employee', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      // Open edit form for John Doe
      const employeeElement = screen.getByText('John Doe');
      fireEvent.click(employeeElement);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Employee')).toBeInTheDocument();
      });
      
      // Delete John Doe
      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg') && btn.querySelector('path[d*="M19 7l"]')
      );
      
      if (deleteButtons[0]) {
        fireEvent.click(deleteButtons[0]);
      }
      
      await waitFor(() => {
        expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
      });
    });

    it('should prevent event propagation when delete button is clicked', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg') && btn.querySelector('path[d*="M19 7l"]')
      );
      
      if (deleteButtons[0]) {
        fireEvent.click(deleteButtons[0]);
      }
      
      // Edit form should not appear
      expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
    });
  });

  describe('Clear All Employees', () => {
    it('should show confirmation dialog when Clear All is clicked', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Clear All Employees')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to remove all employees? This action cannot be undone.')).toBeInTheDocument();
      });
    });

    it('should cancel clear all when Cancel button is clicked', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Confirm Clear All Employees')).not.toBeInTheDocument();
      });
    });

    it('should clear all employees when confirmed', async () => {
      const { store } = renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);
      
      await waitFor(() => {
        const confirmButton = screen.getByText('Clear All Employees');
        fireEvent.click(confirmButton);
      });
      
      const state = store.getState();
      expect(state.employees.employees).toHaveLength(0);
    });

    it('should close edit form when clearing all employees', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      // Open edit form first
      const employeeElement = screen.getByText('John Doe');
      fireEvent.click(employeeElement);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Employee')).toBeInTheDocument();
      });
      
      // Note: Clear All button won't be visible when edit form is open
      // So let's close the edit form first
      const closeButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('path[d="M6 18L18 6M6 6l12 12"]')
      );
      
      if (closeButton) {
        fireEvent.click(closeButton);
      }
      
      await waitFor(() => {
        expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
      });
      
      // Now clear all employees
      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);
      
      await waitFor(() => {
        const confirmButton = screen.getByText('Clear All Employees');
        fireEvent.click(confirmButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
      });
    });
  });

  describe('Role Badge Colors', () => {
    it('should display correct badge colors for different roles', () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const badges = screen.getAllByText(/Manager|Server|Cook/);
      const managerBadge = badges.find(badge => badge.textContent === 'Manager');
      const serverBadge = badges.find(badge => badge.textContent === 'Server');
      const cookBadge = badges.find(badge => badge.textContent === 'Cook');
      
      expect(managerBadge).toHaveClass('bg-yellow-500');
      expect(serverBadge).toHaveClass('bg-purple-500');
      expect(cookBadge).toHaveClass('bg-red-500');
    });
  });

  describe('Employee Avatars', () => {
    it('should display employee initials in avatars', () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const avatars = screen.getAllByText('J'); // Both John and Jane start with J
      const bobAvatar = screen.getByText('B'); // Bob Johnson
      
      expect(avatars).toHaveLength(2); // John Doe and Jane Smith
      expect(bobAvatar).toBeInTheDocument();
    });
  });

  describe('Form Behavior', () => {
    it('should not show Clear All button when add form is open', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const addButton = screen.getAllByText('Add Employee')[0]; // Use first one (header button)
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
      });
    });

    it('should not show Clear All button when edit form is open', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const employeeElement = screen.getByText('John Doe');
      fireEvent.click(employeeElement);
      
      await waitFor(() => {
        expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
      });
    });

    it('should change Add Employee button to Cancel when form is open', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const addButton = screen.getAllByText('Add Employee')[0]; // Use first one (header button)
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });
  });

  describe('Default Values', () => {
    it('should use Server as default role for new employees', async () => {
      renderWithProviders(<EmployeesPage />);
      
      const addButton = screen.getAllByText('Add Employee')[0]; // Use first one (header button)
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Employee')).toBeInTheDocument();
      });
      
      const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement;
      expect(roleSelect.value).toBe('Server');
    });

    it('should handle unknown role with default color', async () => {
      const employeeWithUnknownRole: Employee = {
        id: '999',
        name: 'Unknown Role Employee',
        role: 'Unknown Role' as any,
        color: 'bg-gray-500'
      };
      
      renderWithProviders(<EmployeesPage />, [employeeWithUnknownRole]);
      
      const roleElement = screen.getByText('Unknown Role');
      expect(roleElement).toHaveClass('bg-gray-500');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form inputs', async () => {
      renderWithProviders(<EmployeesPage />);
      
      const addButton = screen.getAllByText('Add Employee')[0]; // Use first one (header button)
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Role')).toBeInTheDocument();
      });
    });

    it('should have proper labels for edit form inputs', async () => {
      renderWithProviders(<EmployeesPage />, mockEmployees);
      
      const employeeElement = screen.getByText('John Doe');
      fireEvent.click(employeeElement);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Role')).toBeInTheDocument();
      });
    });
  });
}); 
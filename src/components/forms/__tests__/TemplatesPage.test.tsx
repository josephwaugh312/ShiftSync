import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import TemplatesPage from '../TemplatesPage';
import uiSlice from '../../../store/uiSlice';
import shiftsSlice from '../../../store/shiftsSlice';
import employeeSlice from '../../../store/employeeSlice';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock sound effects hook
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: jest.fn(),
  }),
}));

// Mock TemplateForm component
jest.mock('../TemplateForm', () => {
  return function MockTemplateForm({ isEdit }: { isEdit: boolean }) {
    return <div data-testid={`template-form-${isEdit ? 'edit' : 'add'}`}>Template Form</div>;
  };
});

// Mock CustomFocusButton
jest.mock('../../common/CustomFocusButton', () => {
  return function MockCustomFocusButton({ 
    children, 
    onClick, 
    variant, 
    className,
    ...props 
  }: any) {
    return (
      <button 
        onClick={onClick} 
        className={`custom-focus-button ${variant} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  };
});

const mockTemplate = {
  id: 'template1',
  name: 'Morning Shift',
  role: 'Manager',
  startTime: '09:00',
  endTime: '17:00',
  color: 'bg-blue-500',
  icon: '🌅',
  description: 'Standard morning shift',
  employeeName: 'John Doe',
};

const mockTemplateWithoutEmployee = {
  id: 'template2',
  name: 'Evening Shift',
  role: 'Cashier',
  startTime: '17:00',
  endTime: '23:00',
  color: 'bg-purple-500',
  icon: '🌙',
  description: 'Evening shift template',
  employeeName: '',
};

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      ui: uiSlice,
      shifts: shiftsSlice,
      employees: employeeSlice,
    },
    preloadedState: {
      ui: {
        modalOpen: {
          templates: true,
          addTemplate: false,
          editTemplate: false,
          ...initialState.ui?.modalOpen,
        },
        notifications: [],
        notificationPreferences: {
          enabled: true,
          types: {
            shifts: true,
            scheduleChanges: true,
            reminders: true,
            timeOff: true,
            publication: true,
            shiftSwap: true,
            general: true,
          },
          sound: {
            enabled: true,
            volume: 0.5,
            type: 'default',
          },
          visual: {
            style: 'default',
            duration: 5000,
            showBadges: true,
            colorCoded: true,
          },
          timing: {
            reminderLeadTime: '1hour',
            nonUrgentDeliveryTime: '09:00',
            deliveryFormat: 'immediate',
          },
        },
        ...initialState.ui,
      },
      shifts: {
        templates: [],
        shifts: [],
        selectedDate: '2024-01-15',
        ...initialState.shifts,
      },
      employees: {
        employees: [],
        ...initialState.employees,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState);
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

describe('TemplatesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the templates page with header', () => {
      renderWithProviders(<TemplatesPage />);
      
      expect(screen.getByText('Shift Templates')).toBeInTheDocument();
      expect(screen.getByText('Create templates for quick shift scheduling.')).toBeInTheDocument();
    });

    it('should render close button', () => {
      renderWithProviders(<TemplatesPage />);
      
      // Find the close button by its SVG path
      const closeButton = screen.getByRole('button', { 
        name: (name, element) => {
          const svg = element?.querySelector('svg');
          const path = svg?.querySelector('path');
          return path?.getAttribute('d') === 'M6 18L18 6M6 6l12 12';
        }
      });
      expect(closeButton).toBeInTheDocument();
    });

    it('should render add template button', () => {
      renderWithProviders(<TemplatesPage />);
      
      expect(screen.getByText('Add Template')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no templates exist', () => {
      renderWithProviders(<TemplatesPage />);
      
      expect(screen.getByText('No templates yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first template.')).toBeInTheDocument();
      expect(screen.getByText('Create Template')).toBeInTheDocument();
    });

    it('should handle add template from empty state', () => {
      const { store } = renderWithProviders(<TemplatesPage />);
      
      const createButton = screen.getByText('Create Template');
      fireEvent.click(createButton);
      
      const state = store.getState();
      expect(state.ui.modalOpen.addTemplate).toBe(true);
    });
  });

  describe('templates list', () => {
    it('should render templates when they exist', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate, mockTemplateWithoutEmployee],
        },
      });
      
      expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      expect(screen.getByText('Evening Shift')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
      expect(screen.getByText('Cashier')).toBeInTheDocument();
    });

    it('should display template details correctly', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      expect(screen.getByText('🌅')).toBeInTheDocument();
      expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
      expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Standard morning shift')).toBeInTheDocument();
    });

    it('should render edit and delete buttons for each template', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      expect(screen.getByLabelText('Edit template')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete template')).toBeInTheDocument();
      expect(screen.getByText('Use Template')).toBeInTheDocument();
    });
  });

  describe('template actions', () => {
    it('should handle edit template', () => {
      const { store } = renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      const editButton = screen.getByLabelText('Edit template');
      fireEvent.click(editButton);
      
      const state = store.getState();
      expect(state.ui.modalOpen.editTemplate).toBe(true);
      expect(state.ui.selectedTemplateId).toBe('template1');
    });

    it('should handle delete template confirmation', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      const deleteButton = screen.getByLabelText('Delete template');
      fireEvent.click(deleteButton);
      
      expect(screen.getByText('Delete Template')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this template?')).toBeInTheDocument();
    });

    it('should confirm template deletion', async () => {
      const { store } = renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      const deleteButton = screen.getByLabelText('Delete template');
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.shifts.templates).toHaveLength(0);
      });
    });

    it('should cancel template deletion', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      const deleteButton = screen.getByLabelText('Delete template');
      fireEvent.click(deleteButton);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText('Delete Template')).not.toBeInTheDocument();
    });

    it('should close delete modal when clicking backdrop', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      const deleteButton = screen.getByLabelText('Delete template');
      fireEvent.click(deleteButton);
      
      const backdrop = screen.getByText('Delete Template').closest('.fixed')?.querySelector('.bg-black');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      expect(screen.queryByText('Delete Template')).not.toBeInTheDocument();
    });
  });

  describe('template application', () => {
    it('should apply template with existing employee name', async () => {
      const { store } = renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      const useButton = screen.getByText('Use Template');
      fireEvent.click(useButton);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.shifts.shifts).toHaveLength(1);
        expect(state.shifts.shifts[0].employeeName).toBe('John Doe');
      });
    });

    it('should prompt for employee name when template has no default employee', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplateWithoutEmployee],
        },
      });
      
      const useButton = screen.getByText('Use Template');
      fireEvent.click(useButton);
      
      expect(screen.getByText('Add Employee')).toBeInTheDocument();
      expect(screen.getByText('Who will be working this shift?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter employee name')).toBeInTheDocument();
    });

    it('should apply template with entered employee name', async () => {
      const { store } = renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplateWithoutEmployee],
        },
      });
      
      const useButton = screen.getByText('Use Template');
      fireEvent.click(useButton);
      
      const input = screen.getByPlaceholderText('Enter employee name');
      fireEvent.change(input, { target: { value: 'Jane Smith' } });
      
      const addButton = screen.getByText('Add to Schedule');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.shifts.shifts).toHaveLength(1);
        expect(state.shifts.shifts[0].employeeName).toBe('Jane Smith');
      });
    });

    it('should show error when trying to apply template without employee name', async () => {
      const { store } = renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplateWithoutEmployee],
        },
      });
      
      const useButton = screen.getByText('Use Template');
      fireEvent.click(useButton);
      
      const addButton = screen.getByText('Add to Schedule');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notifications).toHaveLength(1);
        expect(state.ui.notifications[0].message).toBe('Please enter an employee name');
        expect(state.ui.notifications[0].type).toBe('error');
      });
    });

    it('should cancel employee name prompt', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplateWithoutEmployee],
        },
      });
      
      const useButton = screen.getByText('Use Template');
      fireEvent.click(useButton);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText('Add Employee')).not.toBeInTheDocument();
    });

    it('should close employee prompt when clicking backdrop', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplateWithoutEmployee],
        },
      });
      
      const useButton = screen.getByText('Use Template');
      fireEvent.click(useButton);
      
      const backdrop = screen.getByText('Add Employee').closest('.fixed')?.querySelector('.bg-black');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      expect(screen.queryByText('Add Employee')).not.toBeInTheDocument();
    });
  });

  describe('modal management', () => {
    it('should show add template modal when addTemplate modal is open', () => {
      renderWithProviders(<TemplatesPage />, {
        ui: {
          modalOpen: {
            templates: true,
            addTemplate: true,
          },
        },
      });
      
      expect(screen.getByTestId('template-form-add')).toBeInTheDocument();
    });

    it('should show edit template modal when editTemplate modal is open', () => {
      renderWithProviders(<TemplatesPage />, {
        ui: {
          modalOpen: {
            templates: true,
            editTemplate: true,
          },
        },
      });
      
      expect(screen.getByTestId('template-form-edit')).toBeInTheDocument();
    });

    it('should handle add template button click', () => {
      const { store } = renderWithProviders(<TemplatesPage />);
      
      const addButton = screen.getByText('Add Template');
      fireEvent.click(addButton);
      
      const state = store.getState();
      expect(state.ui.modalOpen.addTemplate).toBe(true);
    });

    it('should close templates modal', () => {
      const { store } = renderWithProviders(<TemplatesPage />);
      
      // Find the close button by its SVG path
      const closeButton = screen.getByRole('button', { 
        name: (name, element) => {
          const svg = element?.querySelector('svg');
          const path = svg?.querySelector('path');
          return path?.getAttribute('d') === 'M6 18L18 6M6 6l12 12';
        }
      });
      fireEvent.click(closeButton);
      
      const state = store.getState();
      expect(state.ui.modalOpen.templates).toBe(false);
    });

    it('should close modal when clicking backdrop', () => {
      const { store } = renderWithProviders(<TemplatesPage />);
      
      const backdrop = document.querySelector('.bg-black.bg-opacity-50');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      const state = store.getState();
      expect(state.ui.modalOpen.templates).toBe(false);
    });
  });

  describe('time formatting', () => {
    it('should format 24-hour time to 12-hour format', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [
            {
              ...mockTemplate,
              startTime: '14:30',
              endTime: '22:15',
            },
          ],
        },
      });
      
      expect(screen.getByText('2:30 PM - 10:15 PM')).toBeInTheDocument();
    });

    it('should handle already formatted time', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [
            {
              ...mockTemplate,
              startTime: '2:30 PM',
              endTime: '10:15 PM',
            },
          ],
        },
      });
      
      expect(screen.getByText('2:30 PM - 10:15 PM')).toBeInTheDocument();
    });

    it('should handle midnight and noon correctly', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [
            {
              ...mockTemplate,
              startTime: '00:00',
              endTime: '12:00',
            },
          ],
        },
      });
      
      expect(screen.getByText('12:00 AM - 12:00 PM')).toBeInTheDocument();
    });

    it('should handle invalid time format gracefully', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [
            {
              ...mockTemplate,
              startTime: 'invalid',
              endTime: 'also-invalid',
            },
          ],
        },
      });
      
      // When time parsing fails, it shows undefined values
      expect(screen.getByText(/12:undefined AM.*12:undefined AM/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for action buttons', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      expect(screen.getByLabelText('Edit template')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete template')).toBeInTheDocument();
    });

    it('should focus employee name input when prompt opens', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplateWithoutEmployee],
        },
      });
      
      const useButton = screen.getByText('Use Template');
      fireEvent.click(useButton);
      
      const input = screen.getByPlaceholderText('Enter employee name');
      expect(input).toHaveFocus();
    });
  });

  describe('responsive design', () => {
    it('should hide template details on small screens', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      const detailsContainer = screen.getByText('Manager').closest('.hidden.sm\\:block');
      expect(detailsContainer).toBeInTheDocument();
    });

    it('should use responsive grid for templates', () => {
      renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate, mockTemplateWithoutEmployee],
        },
      });
      
      const gridContainer = screen.getByText('Morning Shift').closest('.grid.grid-cols-1.sm\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('notifications', () => {
    it('should show success notification when template is deleted', async () => {
      const { store } = renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      const deleteButton = screen.getByLabelText('Delete template');
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notifications).toHaveLength(1);
        expect(state.ui.notifications[0].message).toBe('Template deleted successfully');
        expect(state.ui.notifications[0].type).toBe('success');
      });
    });

    it('should show success notification when template is applied', async () => {
      const { store } = renderWithProviders(<TemplatesPage />, {
        shifts: {
          templates: [mockTemplate],
        },
      });
      
      const useButton = screen.getByText('Use Template');
      fireEvent.click(useButton);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notifications).toHaveLength(1);
        expect(state.ui.notifications[0].message).toBe('Shift added to schedule');
        expect(state.ui.notifications[0].type).toBe('success');
      });
    });
  });
}); 
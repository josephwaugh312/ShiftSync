import React, { PropsWithChildren } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import type { RootState } from '../store';
import shiftsReducer from '../store/shiftsSlice';
import employeeReducer from '../store/employeeSlice';
import uiReducer from '../store/uiSlice';

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: any;
}

// Create a separate function for test store creation
function createTestStore(preloadedState?: any) {
  return configureStore({
    reducer: {
      shifts: shiftsReducer,
      ui: uiReducer,
      employees: employeeReducer,
    },
    preloadedState,
  });
}

// Enhanced test router with future flags
const TestRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}
  >
    {children}
  </BrowserRouter>
);

// AllTheProviders component with enhanced router
const AllTheProviders: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store = createTestStore() 
}) => {
  return (
    <Provider store={store}>
      <TestRouter>
        {children}
      </TestRouter>
    </Provider>
  );
};

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { store?: any }
) => {
  const { store, ...renderOptions } = options || {};
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders store={store}>{children}</AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { TestRouter };

// Create mock data for testing
export const mockShifts = [
  {
    id: '1',
    employeeId: 'emp1',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '17:00',
    role: 'Manager',
    notes: 'Opening shift',
    recurring: null,
    status: 'scheduled' as const,
  },
  {
    id: '2',
    employeeId: 'emp2',
    date: '2024-01-15',
    startTime: '13:00',
    endTime: '21:00',
    role: 'Barista',
    notes: 'Afternoon shift',
    recurring: null,
    status: 'scheduled' as const,
  },
];

export const mockEmployees = [
  {
    id: 'emp1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0101',
    role: 'Manager',
    avatar: '',
    isActive: true,
  },
  {
    id: 'emp2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-0102',
    role: 'Barista',
    avatar: '',
    isActive: true,
  },
];

export const mockInitialState: Partial<RootState> = {
  shifts: {
    shifts: mockShifts,
    templates: [],
    selectedDate: '2024-01-15',
    error: null,
  },
  employees: {
    employees: mockEmployees,
    error: null,
  },
  ui: {
    modalOpen: {
      addShift: false,
      editShift: false,
      templates: false,
      copyShift: false,
      insights: false,
    },
    currentView: 'weekly',
    selectedShift: null,
    selectedEmployee: null,
    darkMode: false,
    theme: {
      id: 'blue',
      name: 'Professional Blue',
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      accent: '#3b82f6',
    },
    notificationPreferences: {
      enabled: true,
      types: {
        shifts: true,
        employees: true,
        schedules: true,
        publication: true,
        reminders: true,
        conflicts: true,
        updates: true,
      },
      methods: {
        inApp: true,
        email: false,
        push: false,
      },
      timing: {
        immediate: true,
        digest: false,
        scheduled: false,
      },
    },
    notifications: [],
  },
};

// Mock user events helper
export const mockUserEvent = {
  click: jest.fn(),
  type: jest.fn(),
  clear: jest.fn(),
  selectOptions: jest.fn(),
  upload: jest.fn(),
  hover: jest.fn(),
  unhover: jest.fn(),
  tab: jest.fn(),
  keyboard: jest.fn(),
};

// This test prevents Jest from complaining about empty test suites
// Since this is a utility file, not an actual test file
describe('test-utils', () => {
  it('should export renderWithProviders utility', () => {
    expect(customRender).toBeDefined();
  });
}); 
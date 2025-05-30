import React, { PropsWithChildren } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
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

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const testStore = store || createTestStore(preloadedState);

  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return (
      <Provider store={testStore}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    );
  }

  // Return an object with the store and all of RTL's query functions
  return { store: testStore, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

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
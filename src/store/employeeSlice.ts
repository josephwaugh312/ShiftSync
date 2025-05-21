import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Employee } from '../types';

interface EmployeeState {
  employees: Employee[];
}

// Try to load employees from localStorage if available
const loadEmployeesFromStorage = (): Employee[] => {
  try {
    const storedEmployees = localStorage.getItem('employees');
    if (storedEmployees) {
      return JSON.parse(storedEmployees);
    }
  } catch (error) {
    console.error('Error loading employees from localStorage:', error);
  }
  return [];
};

const initialState: EmployeeState = {
  employees: loadEmployeesFromStorage(),
};

// Helper function to save employees to localStorage
const saveEmployeesToStorage = (employees: Employee[]) => {
  try {
    localStorage.setItem('employees', JSON.stringify(employees));
  } catch (error) {
    console.error('Error saving employees to localStorage:', error);
  }
};

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    addEmployee: (state, action: PayloadAction<Employee>) => {
      state.employees.push(action.payload);
      saveEmployeesToStorage(state.employees);
    },
    updateEmployee: (state, action: PayloadAction<Employee>) => {
      const index = state.employees.findIndex(employee => employee.id === action.payload.id);
      if (index !== -1) {
        state.employees[index] = action.payload;
        saveEmployeesToStorage(state.employees);
      }
    },
    deleteEmployee: (state, action: PayloadAction<string>) => {
      state.employees = state.employees.filter(employee => employee.id !== action.payload);
      saveEmployeesToStorage(state.employees);
    },
    clearAllEmployees: (state) => {
      state.employees = [];
      saveEmployeesToStorage(state.employees);
    },
  },
});

export const { addEmployee, updateEmployee, deleteEmployee, clearAllEmployees } = employeeSlice.actions;
export default employeeSlice.reducer; 
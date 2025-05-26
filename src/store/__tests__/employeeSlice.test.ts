import employeesReducer, {
  addEmployee,
  updateEmployee,
  deleteEmployee,
  clearAllEmployees,
} from '../employeeSlice';
import type { EmployeeState } from '../employeeSlice';

const initialState: EmployeeState = {
  employees: [],
};

const mockEmployee = {
  id: 'emp1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0101',
  role: 'Manager',
  avatar: '',
  isActive: true,
};

describe('employeeSlice', () => {
  describe('reducers', () => {
    it('should return the initial state', () => {
      expect(employeesReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle addEmployee', () => {
      const actual = employeesReducer(initialState, addEmployee(mockEmployee));
      expect(actual.employees).toHaveLength(1);
      expect(actual.employees[0]).toEqual(mockEmployee);
    });

    it('should handle updateEmployee', () => {
      const stateWithEmployee = {
        ...initialState,
        employees: [mockEmployee],
      };
      
      const updatedEmployee = {
        ...mockEmployee,
        name: 'John Smith',
        role: 'Senior Manager',
      };

      const actual = employeesReducer(stateWithEmployee, updateEmployee(updatedEmployee));
      expect(actual.employees[0].name).toBe('John Smith');
      expect(actual.employees[0].role).toBe('Senior Manager');
    });

    it('should handle deleteEmployee', () => {
      const stateWithEmployee = {
        ...initialState,
        employees: [mockEmployee],
      };

      const actual = employeesReducer(stateWithEmployee, deleteEmployee('emp1'));
      expect(actual.employees).toHaveLength(0);
    });

    it('should handle clearAllEmployees', () => {
      const stateWithEmployees = {
        ...initialState,
        employees: [mockEmployee, { ...mockEmployee, id: 'emp2', name: 'Jane Doe' }],
      };

      const actual = employeesReducer(stateWithEmployees, clearAllEmployees());
      expect(actual.employees).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should not update non-existent employee', () => {
      const updatedEmployee = {
        ...mockEmployee,
        id: 'non-existent',
      };

      const actual = employeesReducer(initialState, updateEmployee(updatedEmployee));
      expect(actual.employees).toHaveLength(0);
    });

    it('should not delete non-existent employee', () => {
      const stateWithEmployee = {
        ...initialState,
        employees: [mockEmployee],
      };

      const actual = employeesReducer(stateWithEmployee, deleteEmployee('non-existent'));
      expect(actual.employees).toHaveLength(1);
    });

    it('should handle adding employee with same email', () => {
      const stateWithEmployee = {
        ...initialState,
        employees: [mockEmployee],
      };

      const duplicateEmailEmployee = {
        ...mockEmployee,
        id: 'emp2',
        name: 'Jane Doe',
      };

      const actual = employeesReducer(stateWithEmployee, addEmployee(duplicateEmailEmployee));
      expect(actual.employees).toHaveLength(2);
      expect(actual.employees.filter(emp => emp.email === mockEmployee.email)).toHaveLength(2);
    });
  });

  describe('employee validation', () => {
    it('should handle employee with minimal required fields', () => {
      const minimalEmployee = {
        id: 'emp2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '',
        role: 'Barista',
        avatar: '',
        isActive: true,
      };

      const actual = employeesReducer(initialState, addEmployee(minimalEmployee));
      expect(actual.employees[0]).toEqual(minimalEmployee);
    });

    it('should handle setting employee as inactive', () => {
      const stateWithEmployee = {
        ...initialState,
        employees: [mockEmployee],
      };

      const inactiveEmployee = {
        ...mockEmployee,
        isActive: false,
      };

      const actual = employeesReducer(stateWithEmployee, updateEmployee(inactiveEmployee));
      expect(actual.employees[0].isActive).toBe(false);
    });
  });

  describe('data integrity', () => {
    it('should maintain employee list order when updating', () => {
      const employee2 = { ...mockEmployee, id: 'emp2', name: 'Jane Doe' };
      const employee3 = { ...mockEmployee, id: 'emp3', name: 'Bob Smith' };
      
      let state = employeesReducer(initialState, addEmployee(mockEmployee));
      state = employeesReducer(state, addEmployee(employee2));
      state = employeesReducer(state, addEmployee(employee3));

      // Update middle employee
      const updatedEmployee2 = { ...employee2, role: 'Senior Barista' };
      state = employeesReducer(state, updateEmployee(updatedEmployee2));

      expect(state.employees).toHaveLength(3);
      expect(state.employees[1].name).toBe('Jane Doe');
      expect(state.employees[1].role).toBe('Senior Barista');
      expect(state.employees[0].name).toBe('John Doe');
      expect(state.employees[2].name).toBe('Bob Smith');
    });
  });
}); 
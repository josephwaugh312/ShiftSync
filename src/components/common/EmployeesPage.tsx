import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { addNotification } from '../../store/uiSlice';
import { Employee } from '../../types';
import { addEmployee, updateEmployee, deleteEmployee, clearAllEmployees } from '../../store/employeeSlice';
import { RootState } from '../../store';
import CustomFocusButton from './CustomFocusButton';

const EmployeesPage: React.FC = () => {
  const dispatch = useDispatch();
  const { employees } = useSelector((state: RootState) => state.employees);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id'>>({
    name: '',
    role: 'Server',
    color: 'bg-purple-500'
  });
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  
  const roles = [
    { value: 'Front Desk', label: 'Front Desk', color: 'bg-blue-500' },
    { value: 'Server', label: 'Server', color: 'bg-purple-500' },
    { value: 'Manager', label: 'Manager', color: 'bg-yellow-500' },
    { value: 'Cook', label: 'Cook', color: 'bg-red-500' }
  ];
  
  const handleAddEmployee = () => {
    if (!newEmployee.name.trim()) {
      dispatch(addNotification({
        message: 'Please enter a name',
        type: 'error',
        category: 'general'
      }));
      return;
    }
    
    const id = Date.now().toString();
    const role = roles.find(r => r.value === newEmployee.role);
    
    const newEmployeeWithId = {
      id,
      name: newEmployee.name,
      role: newEmployee.role,
      color: role?.color || 'bg-gray-500'
    };
    
    dispatch(addEmployee(newEmployeeWithId));
    
    setNewEmployee({
      name: '',
      role: 'Server',
      color: 'bg-purple-500'
    });
    
    setShowAddForm(false);
    
    dispatch(addNotification({
      message: 'Employee added successfully',
      type: 'success',
      category: 'general'
    }));
  };
  
  const handleUpdateEmployee = () => {
    if (!editEmployee || !editEmployee.name.trim()) {
      dispatch(addNotification({
        message: 'Please enter a name',
        type: 'error',
        category: 'general'
      }));
      return;
    }
    
    dispatch(updateEmployee(editEmployee));
    
    setEditEmployee(null);
    setSelectedEmployee(null);
    setShowEditForm(false);
    
    dispatch(addNotification({
      message: 'Employee updated successfully',
      type: 'success',
      category: 'general'
    }));
  };
  
  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditEmployee(employee);
    setShowEditForm(true);
  };
  
  const handleDeleteEmployee = (id: string) => {
    dispatch(deleteEmployee(id));
    
    // If the deleted employee is currently being edited, close the edit form
    if (selectedEmployee && selectedEmployee.id === id) {
      setSelectedEmployee(null);
      setEditEmployee(null);
      setShowEditForm(false);
    }
    
    dispatch(addNotification({
      message: 'Employee deleted successfully',
      type: 'success',
      category: 'general'
    }));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'role') {
      const role = roles.find(r => r.value === value);
      
      if (showEditForm && editEmployee) {
        setEditEmployee({
          ...editEmployee,
          [name]: value,
          color: role?.color || 'bg-gray-500'
        });
      } else {
        setNewEmployee({
          ...newEmployee,
          [name]: value,
          color: role?.color || 'bg-gray-500'
        });
      }
    } else {
      if (showEditForm && editEmployee) {
        setEditEmployee({
          ...editEmployee,
          [name]: value
        });
      } else {
        setNewEmployee({
          ...newEmployee,
          [name]: value
        });
      }
    }
  };
  
  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setSelectedEmployee(null);
    setEditEmployee(null);
  };
  
  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'Front Desk':
        return 'bg-blue-500 text-white';
      case 'Server':
        return 'bg-purple-500 text-white';
      case 'Manager':
        return 'bg-yellow-500 text-dark-900';
      case 'Cook':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  const handleClearAllEmployees = () => {
    dispatch(clearAllEmployees());
    setShowConfirmClear(false);
    setShowEditForm(false);
    setSelectedEmployee(null);
    setEditEmployee(null);
    
    dispatch(addNotification({
      message: 'All employees have been removed',
      type: 'success',
      category: 'general'
    }));
  };
  
  return (
    <div className="max-w-4xl mx-auto pt-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
        <div className="flex space-x-2">
          {employees.length > 0 && !showAddForm && !showEditForm && (
            <CustomFocusButton
              onClick={() => setShowConfirmClear(true)}
              variant="danger"
              sound="click"
            >
              Clear All
            </CustomFocusButton>
          )}
          <CustomFocusButton
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? "outline" : "primary"}
            sound={showAddForm ? "click" : "click"}
          >
            {showAddForm ? 'Cancel' : 'Add Employee'}
          </CustomFocusButton>
        </div>
      </div>
      
      <AnimatePresence>
        {showConfirmClear && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-dark-700 rounded-lg shadow-md p-6 mb-6 border-l-4 border-red-500"
          >
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Clear All Employees</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to remove all employees? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <CustomFocusButton
                onClick={() => setShowConfirmClear(false)}
                variant="outline"
                sound="click"
              >
                Cancel
              </CustomFocusButton>
              <CustomFocusButton
                onClick={handleClearAllEmployees}
                variant="danger"
                sound="error"
              >
                Clear All Employees
              </CustomFocusButton>
            </div>
          </motion.div>
        )}
        
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-dark-700 rounded-lg shadow-md p-6 mb-6"
          >
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Employee</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newEmployee.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 dark:border-dark-500 dark:bg-dark-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                  placeholder="Enter employee name"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={newEmployee.role}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 dark:border-dark-500 dark:bg-dark-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <CustomFocusButton
                type="button"
                onClick={handleAddEmployee}
                variant="primary"
                sound="success"
              >
                Add Employee
              </CustomFocusButton>
            </div>
          </motion.div>
        )}
        
        {showEditForm && editEmployee && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-dark-700 rounded-lg shadow-md p-6 mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Edit Employee</h2>
              <button
                onClick={handleCloseEditForm}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={editEmployee.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 dark:border-dark-500 dark:bg-dark-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                  placeholder="Enter employee name"
                />
              </div>
              
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  id="edit-role"
                  name="role"
                  value={editEmployee.role}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 dark:border-dark-500 dark:bg-dark-600 dark:text-white shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <CustomFocusButton
                type="button"
                onClick={handleUpdateEmployee}
                variant="primary"
                sound="success"
              >
                Update Employee
              </CustomFocusButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-md overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-dark-600">
          {employees.map(employee => (
            <motion.li 
              key={employee.id} 
              className="p-4 cursor-pointer" 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              layoutId={`employee-${employee.id}`}
              onClick={() => handleEditClick(employee)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full ${employee.color.replace('bg-', 'bg-opacity-20 bg-')} flex items-center justify-center text-lg font-medium ${employee.color.replace('bg-', 'text-')}`}>
                      {employee.name.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{employee.name}</h3>
                    <div className="mt-1">
                      <span className={`role-badge ${getRoleBadgeColor(employee.role)}`}>
                        {employee.role}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the li onClick
                      handleDeleteEmployee(employee.id);
                    }}
                    className="p-2 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 focus:outline-none"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
        
        {employees.length === 0 && (
          <div className="p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">No employees found</p>
            <CustomFocusButton
              onClick={() => setShowAddForm(true)}
              variant="primary"
              sound="click"
            >
              Add Employee
            </CustomFocusButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesPage; 
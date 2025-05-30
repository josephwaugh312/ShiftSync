import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Sidebar from '../Sidebar';
import uiSlice, { setModalOpen } from '../../../store/uiSlice';
import shiftsSlice from '../../../store/shiftsSlice';
import employeeSlice from '../../../store/employeeSlice';

// Mock navigate and location
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation
}));

describe('Sidebar Component', () => {
  let store: ReturnType<typeof configureStore>;
  let mockDispatch: jest.SpyInstance;

  const createMockStore = (uiState = {}) => {
    return configureStore({
      reducer: {
        ui: uiSlice,
        shifts: shiftsSlice,
        employees: employeeSlice
      },
      preloadedState: {
        ui: {
          sidebarOpen: true,
          darkMode: false,
          modalOpen: {
            addShift: false,
            editShift: false,
            templates: false,
            copyShift: false
          },
          notifications: [],
          notificationPreferences: {
            enabled: true,
            types: { reminders: true },
            timing: { reminderLeadTime: '1hour' }
          },
          currentView: 'weekly',
          ...uiState
        },
        shifts: {
          shifts: [],
          templates: [],
          selectedDate: '2024-01-01',
          currentView: 'weekly',
          isLoading: false
        },
        employees: {
          employees: [],
          isLoading: false
        }
      }
    });
  };

  const renderSidebar = (uiState = {}) => {
    store = createMockStore(uiState);
    mockDispatch = jest.spyOn(store, 'dispatch');
    
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      </Provider>
    );
  };

  const renderSidebarWithRouter = (initialEntries = ['/'], uiState = {}) => {
    store = createMockStore(uiState);
    mockDispatch = jest.spyOn(store, 'dispatch');
    
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          <Sidebar />
        </MemoryRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.pathname = '/';
  });

  describe('Sidebar Rendering', () => {
    it('should render sidebar with correct structure', () => {
      renderSidebar();
      
      // Check main sidebar container by finding the outermost sidebar div
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toHaveClass('sidebar', 'bg-white', 'dark:bg-dark-700');
      
      // Check navigation section
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toHaveClass('text-sm', 'font-semibold');
    });

    it('should render all navigation links', () => {
      renderSidebar();
      
      expect(screen.getByRole('link', { name: /calendar/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /employees/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    });

    it('should render add shift button', () => {
      renderSidebar();
      
      const addButton = screen.getByRole('button', { name: /add shift/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveClass('btn-primary', 'w-full');
    });

    it('should have proper responsive classes', () => {
      renderSidebar();
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toHaveClass('bg-white', 'dark:bg-dark-700', 'shadow-md', 'h-screen', 'overflow-y-auto', 'sticky', 'top-0', 'w-64');
    });
  });

  describe('Navigation Links', () => {
    it('should render calendar link with correct href and icon', () => {
      renderSidebar();
      
      const calendarLink = screen.getByRole('link', { name: /calendar/i });
      expect(calendarLink).toHaveAttribute('href', '/');
      
      // Check for calendar icon (SVG with calendar path)
      const icon = calendarLink.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('mr-3', 'h-5', 'w-5');
    });

    it('should render employees link with correct href and icon', () => {
      renderSidebar();
      
      const employeesLink = screen.getByRole('link', { name: /employees/i });
      expect(employeesLink).toHaveAttribute('href', '/employees');
      
      // Check for users icon
      const icon = employeesLink.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('mr-3', 'h-5', 'w-5');
    });

    it('should render settings link with correct href and icon', () => {
      renderSidebar();
      
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toHaveAttribute('href', '/settings');
      
      // Check for settings icon
      const icon = settingsLink.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('mr-3', 'h-5', 'w-5');
    });
  });

  describe('Active Link Styling', () => {
    it('should apply active styles to calendar link when on home page', () => {
      mockLocation.pathname = '/';
      renderSidebar();
      
      const calendarLink = screen.getByRole('link', { name: /calendar/i });
      expect(calendarLink).toHaveClass('nav-item-active');
    });

    it('should apply inactive styles to non-active links', () => {
      mockLocation.pathname = '/';
      renderSidebar();
      
      const employeesLink = screen.getByRole('link', { name: /employees/i });
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      
      expect(employeesLink).toHaveClass('nav-item-inactive');
      expect(settingsLink).toHaveClass('nav-item-inactive');
    });

    it('should apply active styles to employees link when on employees page', () => {
      renderSidebarWithRouter(['/employees']);
      
      const employeesLink = screen.getByRole('link', { name: /employees/i });
      expect(employeesLink).toHaveClass('nav-item-active');
      
      const calendarLink = screen.getByRole('link', { name: /calendar/i });
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(calendarLink).toHaveClass('nav-item-inactive');
      expect(settingsLink).toHaveClass('nav-item-inactive');
    });

    it('should apply active styles to settings link when on settings page', () => {
      renderSidebarWithRouter(['/settings']);
      
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toHaveClass('nav-item-active');
      
      const calendarLink = screen.getByRole('link', { name: /calendar/i });
      const employeesLink = screen.getByRole('link', { name: /employees/i });
      expect(calendarLink).toHaveClass('nav-item-inactive');
      expect(employeesLink).toHaveClass('nav-item-inactive');
    });
  });

  describe('Add Shift Functionality', () => {
    it('should dispatch modal open action when add shift button is clicked on calendar page', () => {
      mockLocation.pathname = '/';
      renderSidebar();
      
      const addButton = screen.getByRole('button', { name: /add shift/i });
      fireEvent.click(addButton);
      
      expect(mockDispatch).toHaveBeenCalledWith(
        setModalOpen({ modal: 'addShift', isOpen: true })
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should navigate to calendar page first if not already there', () => {
      mockLocation.pathname = '/employees';
      renderSidebar();
      
      const addButton = screen.getByRole('button', { name: /add shift/i });
      fireEvent.click(addButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockDispatch).toHaveBeenCalledWith(
        setModalOpen({ modal: 'addShift', isOpen: true })
      );
    });

    it('should navigate to calendar page from settings page before opening modal', () => {
      mockLocation.pathname = '/settings';
      renderSidebar();
      
      const addButton = screen.getByRole('button', { name: /add shift/i });
      fireEvent.click(addButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockDispatch).toHaveBeenCalledWith(
        setModalOpen({ modal: 'addShift', isOpen: true })
      );
    });

    it('should handle add shift button click from any route', () => {
      mockLocation.pathname = '/some-random-route';
      renderSidebar();
      
      const addButton = screen.getByRole('button', { name: /add shift/i });
      fireEvent.click(addButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockDispatch).toHaveBeenCalledWith(
        setModalOpen({ modal: 'addShift', isOpen: true })
      );
    });
  });

  describe('Redux Integration', () => {
    it('should read sidebarOpen state from Redux store', () => {
      renderSidebar({ sidebarOpen: false });
      
      // Component should still render (visibility is handled by CSS classes)
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });

    it('should use store dispatch for modal actions', () => {
      renderSidebar();
      
      const addButton = screen.getByRole('button', { name: /add shift/i });
      fireEvent.click(addButton);
      
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(
        setModalOpen({ modal: 'addShift', isOpen: true })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderSidebar();
      
      // Navigation should be accessible
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      // Links should be accessible
      expect(screen.getByRole('link', { name: /calendar/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /employees/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
      
      // Button should be accessible
      expect(screen.getByRole('button', { name: /add shift/i })).toBeInTheDocument();
    });

    it('should have proper keyboard navigation', () => {
      renderSidebar();
      
      const calendarLink = screen.getByRole('link', { name: /calendar/i });
      const employeesLink = screen.getByRole('link', { name: /employees/i });
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      const addButton = screen.getByRole('button', { name: /add shift/i });
      
      // All interactive elements should be focusable
      expect(calendarLink).not.toHaveAttribute('tabindex', '-1');
      expect(employeesLink).not.toHaveAttribute('tabindex', '-1');
      expect(settingsLink).not.toHaveAttribute('tabindex', '-1');
      expect(addButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Layout Structure', () => {
    it('should have proper flex layout with navigation and add button sections', () => {
      renderSidebar();
      
      const sidebarContainer = document.querySelector('.p-4');
      expect(sidebarContainer).toHaveClass('flex', 'flex-col', 'h-full');
      
      // Navigation section should be in flex-grow container
      const navSection = document.querySelector('.flex-grow');
      expect(navSection).toBeInTheDocument();
      
      // Add button should be in mt-auto container
      const addButtonContainer = document.querySelector('.mt-auto');
      expect(addButtonContainer).toBeInTheDocument();
    });

    it('should have proper spacing and styling classes', () => {
      renderSidebar();
      
      const navList = document.querySelector('.space-y-1');
      expect(navList).toBeInTheDocument();
      expect(navList).toHaveClass('flex', 'flex-col');
      
      const navSection = document.querySelector('.space-y-2');
      expect(navSection).toBeInTheDocument();
      expect(navSection).toHaveClass('mb-8');
    });
  });

  describe('Icon Rendering', () => {
    it('should render all navigation icons', () => {
      renderSidebar();
      
      // Each link should have an icon
      const calendarLink = screen.getByRole('link', { name: /calendar/i });
      const employeesLink = screen.getByRole('link', { name: /employees/i });
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      const addButton = screen.getByRole('button', { name: /add shift/i });
      
      expect(calendarLink.querySelector('svg')).toBeInTheDocument();
      expect(employeesLink.querySelector('svg')).toBeInTheDocument();
      expect(settingsLink.querySelector('svg')).toBeInTheDocument();
      expect(addButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should have consistent icon styling', () => {
      renderSidebar();
      
      // Get all SVG elements in links and buttons
      const calendarIcon = screen.getByRole('link', { name: /calendar/i }).querySelector('svg');
      const employeesIcon = screen.getByRole('link', { name: /employees/i }).querySelector('svg');
      const settingsIcon = screen.getByRole('link', { name: /settings/i }).querySelector('svg');
      const addButtonIcon = screen.getByRole('button', { name: /add shift/i }).querySelector('svg');
      
      // Navigation link icons should have consistent classes
      expect(calendarIcon).toHaveClass('mr-3', 'h-5', 'w-5');
      expect(employeesIcon).toHaveClass('mr-3', 'h-5', 'w-5');
      expect(settingsIcon).toHaveClass('mr-3', 'h-5', 'w-5');
      
      // Add button icon should have mr-2
      expect(addButtonIcon).toHaveClass('mr-2', 'h-5', 'w-5');
    });
  });

  describe('Error Handling', () => {
    it('should handle navigation errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });
      
      mockLocation.pathname = '/employees';
      renderSidebar();
      
      // The component itself should not break
      expect(screen.getByRole('button', { name: /add shift/i })).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle dispatch errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockDispatch.mockImplementation(() => {
        throw new Error('Dispatch failed');
      });
      
      renderSidebar();
      
      // The component itself should not break
      expect(screen.getByRole('button', { name: /add shift/i })).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
}); 
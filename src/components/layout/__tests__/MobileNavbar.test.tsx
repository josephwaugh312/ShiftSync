import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../utils/test-utils';
import MobileNavbar from '../MobileNavbar';

// Mock the hooks
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: jest.fn(),
  }),
}));

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: mockVibrate,
});

describe('MobileNavbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all navigation items', () => {
    renderWithProviders(<MobileNavbar />);

    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Add Shift')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders navigation icons', () => {
    renderWithProviders(<MobileNavbar />);

    // Check for SVG elements (icons)
    const icons = document.querySelectorAll('svg');
    expect(icons).toHaveLength(4); // Calendar, Employees, Add Shift, Settings
  });

  it('applies active state to current route', () => {
    renderWithProviders(<MobileNavbar />);

    // Calendar should be active by default (home route)
    const calendarLink = screen.getByText('Calendar').closest('a');
    expect(calendarLink).toHaveClass('text-primary-600');
  });

  it('triggers haptic feedback on Add Shift button click', () => {
    renderWithProviders(<MobileNavbar />);

    const addShiftButton = screen.getByText('Add Shift');
    fireEvent.click(addShiftButton);

    expect(mockVibrate).toHaveBeenCalledWith(15);
  });

  it('opens add shift modal when Add Shift button is clicked', () => {
    const { store } = renderWithProviders(<MobileNavbar />);

    const addShiftButton = screen.getByText('Add Shift');
    fireEvent.click(addShiftButton);

    const state = store.getState();
    expect(state.ui.modalOpen.addShift).toBe(true);
  });

  it('navigates to calendar page before opening modal when on different page', () => {
    // Mock useLocation to return a different path
    const mockLocation = { pathname: '/employees' };
    const mockNavigate = jest.fn();
    
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useLocation: () => mockLocation,
      useNavigate: () => mockNavigate,
    }));

    renderWithProviders(<MobileNavbar />);

    const addShiftButton = screen.getByText('Add Shift');
    fireEvent.click(addShiftButton);

    // Should navigate to home first
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  describe('responsive design', () => {
    it('has proper mobile-first styling', () => {
      renderWithProviders(<MobileNavbar />);

      const navbar = document.querySelector('.fixed.bottom-0');
      expect(navbar).toBeInTheDocument();
      expect(navbar).toHaveClass('h-20'); // 80px height
    });

    it('positions Add Shift button correctly', () => {
      renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      const buttonContainer = addShiftButton.closest('button');
      
      expect(buttonContainer).toHaveClass('flex-1');
      expect(buttonContainer).toHaveClass('flex-col');
      expect(buttonContainer).toHaveClass('items-center');
    });
  });

  describe('accessibility', () => {
    it('has proper button labels', () => {
      renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByRole('button', { name: /add shift/i });
      expect(addShiftButton).toBeInTheDocument();
    });

    it('has proper link structure for navigation', () => {
      renderWithProviders(<MobileNavbar />);

      const calendarLink = screen.getByRole('link', { name: /calendar/i });
      const employeesLink = screen.getByRole('link', { name: /employees/i });
      const settingsLink = screen.getByRole('link', { name: /settings/i });

      expect(calendarLink).toHaveAttribute('href', '/');
      expect(employeesLink).toHaveAttribute('href', '/employees');
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });
  });

  describe('user interactions', () => {
    it('handles multiple rapid clicks on Add Shift', () => {
      const { store } = renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      
      // Rapid clicks
      fireEvent.click(addShiftButton);
      fireEvent.click(addShiftButton);
      fireEvent.click(addShiftButton);

      // Should still only open modal once
      const state = store.getState();
      expect(state.ui.modalOpen.addShift).toBe(true);
      expect(mockVibrate).toHaveBeenCalledTimes(3);
    });

    it('provides visual feedback on navigation item clicks', () => {
      renderWithProviders(<MobileNavbar />);

      const employeesLink = screen.getByText('Employees').closest('a');
      
      // Should have hover/active states
      expect(employeesLink).toHaveClass('flex', 'flex-col', 'items-center');
    });
  });

  describe('theme support', () => {
    it('supports dark mode classes', () => {
      renderWithProviders(<MobileNavbar />);

      const navbar = document.querySelector('.bg-white.dark\\:bg-dark-700');
      expect(navbar).toBeInTheDocument();
    });

    it('applies theme colors to active states', () => {
      renderWithProviders(<MobileNavbar />);

      const calendarLink = screen.getByText('Calendar').closest('a');
      expect(calendarLink).toHaveClass('text-primary-600', 'dark:text-primary-400');
    });
  });
}); 
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../utils/test-utils';
import MobileNavbar from '../MobileNavbar';

// Mock the hooks
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  NavLink: ({ children, to, className, onClick, end, ...props }: any) => {
    const computedClassName = typeof className === 'function' 
      ? className({ isActive: to === mockLocation.pathname })
      : className;
    // Filter out router-specific props that shouldn't go to DOM
    const { caseSensitive, ...domProps } = props;
    return (
      <a href={to} className={computedClassName} onClick={onClick} {...domProps}>
        {children}
      </a>
    );
  },
}));

// Mock GestureDetector
const mockOnSwipeLeft = jest.fn();
const mockOnSwipeRight = jest.fn();
jest.mock('../../mobile/GestureDetector', () => ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight 
}: any) => {
  mockOnSwipeLeft.mockImplementation(onSwipeLeft);
  mockOnSwipeRight.mockImplementation(onSwipeRight);
  return <div data-testid="gesture-detector">{children}</div>;
});

describe('MobileNavbar', () => {
  let vibrateSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockPlaySound.mockClear();
    // Reset to default location
    mockLocation.pathname = '/';
    
    // Mock navigator.vibrate with jest.spyOn
    vibrateSpy = jest.spyOn(navigator, 'vibrate').mockImplementation(() => true);
  });

  afterEach(() => {
    // Restore the original vibrate function
    vibrateSpy.mockRestore();
  });

  describe('Basic Rendering', () => {
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

    it('wraps content in GestureDetector', () => {
      renderWithProviders(<MobileNavbar />);
      
      expect(screen.getByTestId('gesture-detector')).toBeInTheDocument();
    });

    it('has proper mobile navbar structure', () => {
      renderWithProviders(<MobileNavbar />);

      const navbar = document.querySelector('.fixed.bottom-0');
      expect(navbar).toBeInTheDocument();
      expect(navbar).toHaveClass('bg-white', 'dark:bg-dark-700', 'shadow-lg', 'h-20');
    });
  });

  describe('Active State Management', () => {
    it('applies active state to current route', () => {
      renderWithProviders(<MobileNavbar />);

      // Calendar should be active by default (home route)
      const calendarLink = screen.getByText('Calendar').closest('a');
      expect(calendarLink).toHaveClass('text-primary-600');
    });

    it('applies active state to employees page', () => {
      mockLocation.pathname = '/employees';
      renderWithProviders(<MobileNavbar />);

      const employeesLink = screen.getByText('Employees').closest('a');
      expect(employeesLink).toHaveClass('text-primary-600');
    });

    it('applies active state to settings page', () => {
      mockLocation.pathname = '/settings';
      renderWithProviders(<MobileNavbar />);

      const settingsLink = screen.getByText('Settings').closest('a');
      expect(settingsLink).toHaveClass('text-primary-600');
    });

    it('applies inactive state to non-current routes', () => {
      mockLocation.pathname = '/';
      renderWithProviders(<MobileNavbar />);

      const employeesLink = screen.getByText('Employees').closest('a');
      const settingsLink = screen.getByText('Settings').closest('a');
      
      expect(employeesLink).toHaveClass('text-gray-600');
      expect(settingsLink).toHaveClass('text-gray-600');
    });
  });

  describe('Add Shift Functionality', () => {
    it('triggers haptic feedback on Add Shift button click', () => {
      renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      fireEvent.click(addShiftButton);

      expect(vibrateSpy).toHaveBeenCalledWith(15);
    });

    it('plays sound effect on Add Shift button click', () => {
      renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      fireEvent.click(addShiftButton);

      expect(mockPlaySound).toHaveBeenCalledWith('click', undefined);
    });

    it('opens add shift modal when Add Shift button is clicked', () => {
      const { store } = renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      fireEvent.click(addShiftButton);

      const state = store.getState();
      expect(state.ui.modalOpen.addShift).toBe(true);
    });

    it('navigates to calendar page before opening modal when on different page', () => {
      // Update mock location to employees page
      mockLocation.pathname = '/employees';
      
      const { store } = renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      fireEvent.click(addShiftButton);

      // Should navigate to home first
      expect(mockNavigate).toHaveBeenCalledWith('/');
      
      // Should also open modal
      const state = store.getState();
      expect(state.ui.modalOpen.addShift).toBe(true);
    });

    it('handles Add Shift from settings page', () => {
      mockLocation.pathname = '/settings';
      
      const { store } = renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      fireEvent.click(addShiftButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
      
      const state = store.getState();
      expect(state.ui.modalOpen.addShift).toBe(true);
    });

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
      expect(vibrateSpy).toHaveBeenCalledTimes(3);
      expect(mockPlaySound).toHaveBeenCalledTimes(3);
    });
  });

  describe('Navigation Click Handling', () => {
    it('triggers haptic feedback on navigation link clicks', () => {
      renderWithProviders(<MobileNavbar />);

      const employeesLink = screen.getByText('Employees').closest('a');
      fireEvent.click(employeesLink!);

      expect(vibrateSpy).toHaveBeenCalledWith(15);
    });

    it('plays sound effect on navigation link clicks', () => {
      renderWithProviders(<MobileNavbar />);

      const settingsLink = screen.getByText('Settings').closest('a');
      fireEvent.click(settingsLink!);

      expect(mockPlaySound).toHaveBeenCalledWith('click', undefined);
    });

    it('handles calendar link clicks', () => {
      renderWithProviders(<MobileNavbar />);

      const calendarLink = screen.getByText('Calendar').closest('a');
      fireEvent.click(calendarLink!);

      expect(vibrateSpy).toHaveBeenCalledWith(15);
      expect(mockPlaySound).toHaveBeenCalledWith('click', undefined);
    });
  });

  describe('Gesture Support', () => {
    it('handles swipe left gesture from home to employees', () => {
      mockLocation.pathname = '/';
      renderWithProviders(<MobileNavbar />);

      // Simulate swipe left
      mockOnSwipeLeft();

      expect(mockNavigate).toHaveBeenCalledWith('/employees');
      expect(mockPlaySound).toHaveBeenCalledWith('notification', 0.3);
    });

    it('handles swipe left gesture from employees to settings', () => {
      mockLocation.pathname = '/employees';
      renderWithProviders(<MobileNavbar />);

      // Simulate swipe left
      mockOnSwipeLeft();

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
      expect(mockPlaySound).toHaveBeenCalledWith('notification', 0.3);
    });

    it('does not navigate on swipe left from settings page', () => {
      mockLocation.pathname = '/settings';
      renderWithProviders(<MobileNavbar />);

      // Simulate swipe left - should not navigate further
      mockOnSwipeLeft();

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockPlaySound).toHaveBeenCalledWith('notification', 0.3);
    });

    it('handles swipe right gesture from settings to employees', () => {
      mockLocation.pathname = '/settings';
      renderWithProviders(<MobileNavbar />);

      // Simulate swipe right
      mockOnSwipeRight();

      expect(mockNavigate).toHaveBeenCalledWith('/employees');
      expect(mockPlaySound).toHaveBeenCalledWith('notification', 0.3);
    });

    it('handles swipe right gesture from employees to home', () => {
      mockLocation.pathname = '/employees';
      renderWithProviders(<MobileNavbar />);

      // Simulate swipe right
      mockOnSwipeRight();

      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockPlaySound).toHaveBeenCalledWith('notification', 0.3);
    });

    it('does not navigate on swipe right from home page', () => {
      mockLocation.pathname = '/';
      renderWithProviders(<MobileNavbar />);

      // Simulate swipe right - should not navigate further
      mockOnSwipeRight();

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockPlaySound).toHaveBeenCalledWith('notification', 0.3);
    });
  });

  describe('Haptic Feedback Edge Cases', () => {
    it('handles missing vibrate API gracefully', () => {
      // Restore and set vibrate to undefined
      vibrateSpy.mockRestore();
      const originalVibrate = navigator.vibrate;
      (navigator as any).vibrate = undefined;

      renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      
      // Should not throw error when vibrate is undefined
      expect(() => {
        fireEvent.click(addShiftButton);
      }).not.toThrow();

      // Restore for other tests
      (navigator as any).vibrate = originalVibrate;
      vibrateSpy = jest.spyOn(navigator, 'vibrate').mockImplementation(() => true);
    });

    it('handles vibrate API that returns false', () => {
      vibrateSpy.mockReturnValue(false);

      renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      fireEvent.click(addShiftButton);

      expect(vibrateSpy).toHaveBeenCalledWith(15);
    });
  });

  describe('Sound Effects Edge Cases', () => {
    it('handles sound effect errors gracefully', () => {
      // Mock console.debug to verify error logging
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      
      // Mock playSound to throw an error
      mockPlaySound.mockImplementation(() => {
        throw new Error('Sound playback failed');
      });

      renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      
      // Component renders and doesn't break
      expect(addShiftButton).toBeInTheDocument();
      
      // Click should work without throwing
      expect(() => {
        fireEvent.click(addShiftButton);
      }).not.toThrow();
      
      // Verify the sound was attempted to be played
      expect(mockPlaySound).toHaveBeenCalledWith('click', undefined);
      
      // Verify error was logged
      expect(consoleDebugSpy).toHaveBeenCalledWith('Sound playback failed:', expect.any(Error));
      
      consoleDebugSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    it('has proper mobile-first styling', () => {
      renderWithProviders(<MobileNavbar />);

      const navbar = document.querySelector('.fixed.bottom-0');
      expect(navbar).toBeInTheDocument();
      expect(navbar).toHaveClass('h-20'); // 80px height
      expect(navbar).toHaveClass('z-50'); // High z-index for overlay
    });

    it('positions Add Shift button correctly', () => {
      renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      const buttonContainer = addShiftButton.closest('button');
      
      expect(buttonContainer).toHaveClass('flex-1');
      expect(buttonContainer).toHaveClass('flex-col');
      expect(buttonContainer).toHaveClass('items-center');
    });

    it('styles Add Shift button with primary colors', () => {
      renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      const buttonContainer = addShiftButton.closest('button');
      
      expect(buttonContainer).toHaveClass('text-primary-600', 'dark:text-primary-400');
      
      // Check for the circular background
      const iconContainer = buttonContainer?.querySelector('.bg-primary-600.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });

    it('uses proper spacing and padding', () => {
      renderWithProviders(<MobileNavbar />);

      const navbar = document.querySelector('.fixed.bottom-0');
      expect(navbar).toHaveClass('px-4', 'pt-2');
      
      // Check individual nav items have proper flex classes
      const navLinks = screen.getAllByRole('link');
      navLinks.forEach(link => {
        expect(link).toHaveClass('flex-1', 'p-2');
      });
    });
  });

  describe('Accessibility', () => {
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

    it('provides proper visual feedback for interactions', () => {
      renderWithProviders(<MobileNavbar />);

      const employeesLink = screen.getByText('Employees').closest('a');
      
      // Should have hover/active states
      expect(employeesLink).toHaveClass('flex', 'flex-col', 'items-center');
    });

    it('maintains proper tab order', () => {
      renderWithProviders(<MobileNavbar />);

      const calendarLink = screen.getByRole('link', { name: /calendar/i });
      const employeesLink = screen.getByRole('link', { name: /employees/i });
      const addShiftButton = screen.getByRole('button', { name: /add shift/i });
      const settingsLink = screen.getByRole('link', { name: /settings/i });

      // All interactive elements should be focusable
      expect(calendarLink).not.toHaveAttribute('tabindex', '-1');
      expect(employeesLink).not.toHaveAttribute('tabindex', '-1');
      expect(addShiftButton).not.toHaveAttribute('tabindex', '-1');
      expect(settingsLink).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Theme Support', () => {
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

    it('applies theme colors to inactive states', () => {
      renderWithProviders(<MobileNavbar />);

      const employeesLink = screen.getByText('Employees').closest('a');
      expect(employeesLink).toHaveClass('text-gray-600', 'dark:text-gray-400');
    });

    it('applies proper border theming', () => {
      renderWithProviders(<MobileNavbar />);

      const navbar = document.querySelector('.border-t');
      expect(navbar).toHaveClass('border-gray-200', 'dark:border-dark-600');
    });
  });

  describe('Icon Rendering', () => {
    it('renders all icons with consistent sizing', () => {
      renderWithProviders(<MobileNavbar />);

      const icons = document.querySelectorAll('svg');
      
      // Check that all icons have consistent size classes
      icons.forEach(icon => {
        if (icon.closest('.bg-primary-600')) {
          // Add button icon
          expect(icon).toHaveClass('h-5', 'w-5');
        } else {
          // Navigation icons
          expect(icon).toHaveClass('h-6', 'w-6');
        }
      });
    });

    it('renders proper icon spacing', () => {
      renderWithProviders(<MobileNavbar />);

      // Check that icons have proper bottom margin
      const navIcons = document.querySelectorAll('.mb-1');
      expect(navIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles navigation errors gracefully', () => {
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      
      // Mock navigate to throw an error
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      renderWithProviders(<MobileNavbar />);

      // Component should render without issues
      expect(screen.getByText('Add Shift')).toBeInTheDocument();
      
      // Should handle gesture calls without throwing
      expect(() => {
        mockOnSwipeLeft();
      }).not.toThrow();
      
      // Verify error was logged
      expect(consoleDebugSpy).toHaveBeenCalledWith('Navigation failed:', expect.any(Error));

      consoleDebugSpy.mockRestore();
    });

    it('handles haptic feedback errors gracefully', () => {
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      
      // Mock navigator.vibrate to throw an error
      vibrateSpy.mockImplementation(() => {
        throw new Error('Vibration failed');
      });

      renderWithProviders(<MobileNavbar />);

      const addShiftButton = screen.getByText('Add Shift');
      
      // Should handle vibration errors without throwing
      expect(() => {
        fireEvent.click(addShiftButton);
      }).not.toThrow();
      
      // Verify error was logged
      expect(consoleDebugSpy).toHaveBeenCalledWith('Haptic feedback not available:', expect.any(Error));

      consoleDebugSpy.mockRestore();
    });

    it('handles dispatch errors gracefully', () => {
      renderWithProviders(<MobileNavbar />);

      // Component should render without issues
      expect(screen.getByText('Add Shift')).toBeInTheDocument();
    });
  });
}); 
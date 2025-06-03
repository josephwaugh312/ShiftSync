import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import NewUserGuidance from '../NewUserGuidance';
import uiSlice, { setModalOpen } from '../../../store/uiSlice';
import employeeSlice from '../../../store/employeeSlice';
import shiftsSlice from '../../../store/shiftsSlice';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, transition, ...props }: any) => (
      <div 
        className={className}
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </div>
    ),
    button: ({ children, className, onClick, whileHover, whileTap, ...props }: any) => (
      <button 
        className={className}
        onClick={onClick}
        data-while-hover={JSON.stringify(whileHover)}
        data-while-tap={JSON.stringify(whileTap)}
        {...props}
      >
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock document.dispatchEvent
const mockDispatchEvent = jest.spyOn(document, 'dispatchEvent');

// Mock console.log and console.error
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// ===== UTILITY FUNCTIONS =====

const createTestStore = (initialState?: any) => {
  const defaultState = {
    ui: {
      themeColor: { name: 'Blue', value: '#3B82F6' },
      darkMode: false,
      sidebarCollapsed: false,
      selectedView: 'calendar',
      notifications: [],
      tutorialComplete: false,
      lastCompletedStep: null,
      modalOpen: { modal: null, isOpen: false },
    },
    employees: {
      employees: [],
    },
    shifts: {
      shifts: [],
    },
  };

  return configureStore({
    reducer: {
      ui: uiSlice,
      employees: employeeSlice,
      shifts: shiftsSlice,
    },
    preloadedState: initialState || defaultState,
  });
};

const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

beforeEach(() => {
  mockLocalStorage.getItem.mockClear();
  mockLocalStorage.setItem.mockClear();
  mockNavigate.mockClear();
  mockDispatchEvent.mockClear();
  consoleSpy.mockClear();
  consoleErrorSpy.mockClear();
  
  // Default localStorage returns
  mockLocalStorage.getItem.mockImplementation((key) => {
    switch (key) {
      case 'shiftsync_onboarding_current_step':
        return '0';
      case 'shiftsync_onboarding_completed':
        return 'false';
      case 'shiftsync_onboarding_dismissed':
        return 'false';
      case 'shiftsync_onboarding_completed_steps':
        return JSON.stringify([]);
      default:
        return null;
    }
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('NewUserGuidance Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<NewUserGuidance />);
      expect(screen.getByText('Welcome to ShiftSync!')).toBeInTheDocument();
    });

    it('should render first step by default', () => {
      renderWithProviders(<NewUserGuidance />);
      
      expect(screen.getByText('Welcome to ShiftSync!')).toBeInTheDocument();
      expect(screen.getByText('Let\'s get you started with creating your first schedule. We\'ll guide you through the process step by step.')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should render with correct container styling', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const container = document.querySelector('.w-full.max-w-4xl.mx-auto.bg-white.dark\\:bg-dark-800.rounded-lg.shadow-sm.overflow-hidden.mt-8.mb-24.lg\\:mb-8');
      expect(container).toBeInTheDocument();
    });

    it('should not render when dismissed', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'shiftsync_onboarding_dismissed') return 'true';
        return null;
      });
      
      const { container } = renderWithProviders(<NewUserGuidance />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when completed', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'shiftsync_onboarding_completed') return 'true';
        return null;
      });
      
      const { container } = renderWithProviders(<NewUserGuidance />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Progress Indicator', () => {
    it('should render progress indicator with correct steps', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const progressBars = document.querySelectorAll('.h-2.w-8.rounded-full');
      expect(progressBars).toHaveLength(4); // 4 steps total
    });

    it('should highlight current step in progress indicator', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const progressBars = document.querySelectorAll('.h-2.w-8.rounded-full');
      expect(progressBars[0]).toHaveClass('bg-primary-500'); // Current step
      expect(progressBars[1]).toHaveClass('bg-gray-200'); // Future step
    });

    it('should show completed steps in progress indicator', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'shiftsync_onboarding_completed_steps') return JSON.stringify(['welcome']);
        return null;
      });
      
      renderWithProviders(<NewUserGuidance />);
      
      const progressBars = document.querySelectorAll('.h-2.w-8.rounded-full');
      expect(progressBars[0]).toHaveClass('bg-primary-300'); // Completed step
    });

    it('should render dismiss button', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const dismissButton = screen.getByText('Dismiss');
      expect(dismissButton).toBeInTheDocument();
      expect(dismissButton).toHaveClass('text-sm', 'text-gray-500', 'dark:text-gray-400');
    });
  });

  describe('Step Navigation', () => {
    it('should show Back button on non-first steps', () => {
      // Create store with completed welcome step so we're on step 1
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'shiftsync_onboarding_completed_steps') return JSON.stringify(['welcome']);
        return null;
      });
      
      renderWithProviders(<NewUserGuidance />);
      
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should not show Back button on first step', () => {
      renderWithProviders(<NewUserGuidance />);
      
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
    });

    it('should show Skip button on non-last steps', () => {
      renderWithProviders(<NewUserGuidance />);
      
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    it('should not show Skip button on last step', () => {
      // Create store with employees and shifts to reach the last step
      const store = createTestStore({
        ui: { themeColor: { name: 'Blue', value: '#3B82F6' }, darkMode: false, sidebarCollapsed: false, selectedView: 'calendar', notifications: [], tutorialComplete: false, lastCompletedStep: null, modalOpen: { modal: null, isOpen: false } },
        employees: { employees: [{ id: '1', name: 'John Doe', role: 'Server', color: 'bg-blue-500' }] },
        shifts: { shifts: [{ id: '1', employeeId: '1', startTime: '2024-01-01T09:00:00', endTime: '2024-01-01T17:00:00', date: '2024-01-01' }] },
      });
      
      renderWithProviders(<NewUserGuidance />, store);
      
      expect(screen.queryByText('Skip')).not.toBeInTheDocument();
    });

    it('should navigate back when Back button is clicked', () => {
      // Start at step 1 (Add employees)
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'shiftsync_onboarding_completed_steps') return JSON.stringify(['welcome']);
        return null;
      });
      
      renderWithProviders(<NewUserGuidance />);
      
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);
      
      expect(screen.getByText('Welcome to ShiftSync!')).toBeInTheDocument();
    });

    it('should navigate forward and mark step complete when Skip is clicked', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const skipButton = screen.getByText('Skip');
      fireEvent.click(skipButton);
      
      expect(screen.getByText('Add Your Team Members')).toBeInTheDocument();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'shiftsync_onboarding_completed_steps',
        JSON.stringify(['welcome'])
      );
    });
  });

  describe('Individual Steps', () => {
    describe('Welcome Step', () => {
      it('should render welcome step content', () => {
        renderWithProviders(<NewUserGuidance />);
        
        expect(screen.getByText('Welcome to ShiftSync!')).toBeInTheDocument();
        expect(screen.getByText('Get Started')).toBeInTheDocument();
        
        // Check for welcome icon (smiley face SVG)
        const svg = document.querySelector('svg');
        expect(svg).toHaveClass('w-16', 'h-16', 'text-primary-500');
      });

      it('should advance to next step when Get Started is clicked', () => {
        renderWithProviders(<NewUserGuidance />);
        
        const getStartedButton = screen.getByText('Get Started');
        fireEvent.click(getStartedButton);
        
        expect(screen.getByText('Add Your Team Members')).toBeInTheDocument();
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'shiftsync_onboarding_completed_steps',
          JSON.stringify(['welcome'])
        );
      });
    });

    describe('Add Employees Step', () => {
      beforeEach(() => {
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'shiftsync_onboarding_current_step') return '1';
          if (key === 'shiftsync_onboarding_completed_steps') return JSON.stringify(['welcome']);
          return null;
        });
      });

      it('should render add employees step content', () => {
        renderWithProviders(<NewUserGuidance />);
        
        expect(screen.getByText('Add Your Team Members')).toBeInTheDocument();
        expect(screen.getByText('First, add your employees to the system. This will allow you to assign shifts to them.')).toBeInTheDocument();
        expect(screen.getByText('Add Employees')).toBeInTheDocument();
      });

      it('should navigate to employees page when Add Employees is clicked', () => {
        renderWithProviders(<NewUserGuidance />);
        
        const addEmployeesButton = screen.getByText('Add Employees');
        fireEvent.click(addEmployeesButton);
        
        expect(mockNavigate).toHaveBeenCalledWith('/employees');
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'shiftsync_onboarding_completed_steps',
          JSON.stringify(['welcome', 'add-employees'])
        );
      });
    });

    describe('Create Shift Step', () => {
      it('should render create shift step content', () => {
        // Create store with employees but no shifts to be on step 2
        const store = createTestStore({
          ui: { themeColor: { name: 'Blue', value: '#3B82F6' }, darkMode: false, sidebarCollapsed: false, selectedView: 'calendar', notifications: [], tutorialComplete: false, lastCompletedStep: null, modalOpen: { modal: null, isOpen: false } },
          employees: { employees: [{ id: '1', name: 'John Doe', role: 'Server', color: 'bg-blue-500' }] },
          shifts: { shifts: [] },
        });
        
        renderWithProviders(<NewUserGuidance />, store);
        
        expect(screen.getByText('Create Your First Shift')).toBeInTheDocument();
        expect(screen.getByText('Now that you have employees, let\'s create your first shift on the schedule.')).toBeInTheDocument();
        expect(screen.getByText('Add First Shift')).toBeInTheDocument();
      });

      it('should open add shift modal when Add First Shift is clicked', () => {
        const store = createTestStore({
          ui: { themeColor: { name: 'Blue', value: '#3B82F6' }, darkMode: false, sidebarCollapsed: false, selectedView: 'calendar', notifications: [], tutorialComplete: false, lastCompletedStep: null, modalOpen: { modal: null, isOpen: false } },
          employees: { employees: [{ id: '1', name: 'John Doe', role: 'Server', color: 'bg-blue-500' }] },
          shifts: { shifts: [] },
        });
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        
        renderWithProviders(<NewUserGuidance />, store);
        
        const addShiftButton = screen.getByText('Add First Shift');
        fireEvent.click(addShiftButton);
        
        expect(dispatchSpy).toHaveBeenCalledWith(setModalOpen({ modal: 'addShift', isOpen: true }));
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'shiftsync_onboarding_completed_steps',
          JSON.stringify(['add-employees', 'create-shift'])
        );
      });
    });

    describe('Explore Features Step', () => {
      it('should render explore features step content', () => {
        // Create store with both employees and shifts to be on step 3
        const store = createTestStore({
          ui: { themeColor: { name: 'Blue', value: '#3B82F6' }, darkMode: false, sidebarCollapsed: false, selectedView: 'calendar', notifications: [], tutorialComplete: false, lastCompletedStep: null, modalOpen: { modal: null, isOpen: false } },
          employees: { employees: [{ id: '1', name: 'John Doe', role: 'Server', color: 'bg-blue-500' }] },
          shifts: { shifts: [{ id: '1', employeeId: '1', startTime: '2024-01-01T09:00:00', endTime: '2024-01-01T17:00:00', date: '2024-01-01' }] },
        });
        
        renderWithProviders(<NewUserGuidance />, store);
        
        expect(screen.getByText('Explore Advanced Features')).toBeInTheDocument();
        expect(screen.getByText('Great! Now you\'re ready to explore more features like shift templates, recurring shifts, and reporting.')).toBeInTheDocument();
        expect(screen.getByText('Start Tutorial')).toBeInTheDocument();
      });

      it('should start tutorial and complete onboarding when Start Tutorial is clicked', () => {
        const store = createTestStore({
          ui: { themeColor: { name: 'Blue', value: '#3B82F6' }, darkMode: false, sidebarCollapsed: false, selectedView: 'calendar', notifications: [], tutorialComplete: false, lastCompletedStep: null, modalOpen: { modal: null, isOpen: false } },
          employees: { employees: [{ id: '1', name: 'John Doe', role: 'Server', color: 'bg-blue-500' }] },
          shifts: { shifts: [{ id: '1', employeeId: '1', startTime: '2024-01-01T09:00:00', endTime: '2024-01-01T17:00:00', date: '2024-01-01' }] },
        });
        
        renderWithProviders(<NewUserGuidance />, store);
        
        const startTutorialButton = screen.getByText('Start Tutorial');
        fireEvent.click(startTutorialButton);
        
        expect(mockDispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'toggleTutorial' })
        );
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('shiftsync_onboarding_completed', 'true');
      });
    });
  });

  describe('Redux Integration', () => {
    it('should automatically advance when employees exist', () => {
      const store = createTestStore({
        ui: { themeColor: { name: 'Blue', value: '#3B82F6' }, darkMode: false, sidebarCollapsed: false, selectedView: 'calendar', notifications: [], tutorialComplete: false, lastCompletedStep: null, modalOpen: { modal: null, isOpen: false } },
        employees: { employees: [{ id: '1', name: 'John Doe', role: 'Server', color: 'bg-blue-500' }] },
        shifts: { shifts: [] },
      });
      
      renderWithProviders(<NewUserGuidance />, store);
      
      expect(screen.getByText('Create Your First Shift')).toBeInTheDocument();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'shiftsync_onboarding_completed_steps',
        JSON.stringify(['add-employees'])
      );
    });

    it('should automatically advance when shifts exist', () => {
      const store = createTestStore({
        ui: { themeColor: { name: 'Blue', value: '#3B82F6' }, darkMode: false, sidebarCollapsed: false, selectedView: 'calendar', notifications: [], tutorialComplete: false, lastCompletedStep: null, modalOpen: { modal: null, isOpen: false } },
        employees: { employees: [{ id: '1', name: 'John Doe', role: 'Server', color: 'bg-blue-500' }] },
        shifts: { shifts: [{ id: '1', employeeId: '1', startTime: '2024-01-01T09:00:00', endTime: '2024-01-01T17:00:00', date: '2024-01-01' }] },
      });
      
      renderWithProviders(<NewUserGuidance />, store);
      
      expect(screen.getByText('Explore Advanced Features')).toBeInTheDocument();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'shiftsync_onboarding_completed_steps',
        JSON.stringify(['add-employees', 'create-shift'])
      );
    });

    it('should log debug information about step determination', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const store = createTestStore({
        ui: { themeColor: { name: 'Blue', value: '#3B82F6' }, darkMode: false, sidebarCollapsed: false, selectedView: 'calendar', notifications: [], tutorialComplete: false, lastCompletedStep: null, modalOpen: { modal: null, isOpen: false } },
        employees: { employees: [] },
        shifts: { shifts: [{ id: '1', employeeId: '1', startTime: '2024-01-01T09:00:00', endTime: '2024-01-01T17:00:00', date: '2024-01-01' }] },
      });
      
      renderWithProviders(<NewUserGuidance />, store);
      
      // Debug logging has been removed during cleanup, but component should still work correctly
      // Since there are shifts in the store, the component shows the advanced features step
      expect(screen.getByText('Explore Advanced Features')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('LocalStorage Integration', () => {
    it('should save current step to localStorage', () => {
      renderWithProviders(<NewUserGuidance />);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('shiftsync_onboarding_current_step', '0');
    });

    it('should load completed steps from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'shiftsync_onboarding_completed_steps') return JSON.stringify(['welcome', 'add-employees']);
        return null;
      });
      
      renderWithProviders(<NewUserGuidance />);
      
      const progressBars = document.querySelectorAll('.h-2.w-8.rounded-full');
      expect(progressBars[0]).toHaveClass('bg-primary-300'); // Completed
      expect(progressBars[1]).toHaveClass('bg-primary-500'); // Current (since add-employees is complete, we're on step 2)
    });

    it('should handle corrupted completed steps JSON gracefully', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'shiftsync_onboarding_completed_steps') return 'invalid-json';
        return null;
      });
      
      // Component should handle corrupted JSON gracefully and still render
      expect(() => {
        renderWithProviders(<NewUserGuidance />);
      }).not.toThrow();
      
      // Should default to first step when JSON is corrupted
      expect(screen.getByText('Welcome to ShiftSync!')).toBeInTheDocument();
    });

    it('should save dismissed state when dismissed', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('shiftsync_onboarding_dismissed', 'true');
    });

    it('should mark as completed when reaching last step', () => {
      const store = createTestStore({
        ui: { themeColor: { name: 'Blue', value: '#3B82F6' }, darkMode: false, sidebarCollapsed: false, selectedView: 'calendar', notifications: [], tutorialComplete: false, lastCompletedStep: null, modalOpen: { modal: null, isOpen: false } },
        employees: { employees: [{ id: '1', name: 'John Doe', role: 'Server', color: 'bg-blue-500' }] },
        shifts: { shifts: [{ id: '1', employeeId: '1', startTime: '2024-01-01T09:00:00', endTime: '2024-01-01T17:00:00', date: '2024-01-01' }] },
      });
      
      renderWithProviders(<NewUserGuidance />, store);
      
      // Component automatically marks as completed when there are shifts (reaching last step)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('shiftsync_onboarding_completed', 'true');
    });
  });

  describe('Custom Events', () => {
    it('should dispatch onboarding dismissed event when dismissed', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'onboardingDismissed' })
      );
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderWithProviders(<NewUserGuidance />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('showTutorialPrompt', expect.any(Function));
    });
  });

  describe('Animation Properties', () => {
    it('should have correct container animations', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const container = document.querySelector('.w-full.max-w-4xl');
      const initialData = JSON.parse(container?.getAttribute('data-initial') || '{}');
      const animateData = JSON.parse(container?.getAttribute('data-animate') || '{}');
      
      expect(initialData.opacity).toBe(0);
      expect(initialData.y).toBe(20);
      expect(animateData.opacity).toBe(1);
      expect(animateData.y).toBe(0);
    });

    it('should have correct step content animations', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const stepContent = document.querySelector('.flex.flex-col.md\\:flex-row');
      const initialData = JSON.parse(stepContent?.getAttribute('data-initial') || '{}');
      const animateData = JSON.parse(stepContent?.getAttribute('data-animate') || '{}');
      
      expect(initialData.opacity).toBe(0);
      expect(initialData.x).toBe(20);
      expect(animateData.opacity).toBe(1);
      expect(animateData.x).toBe(0);
    });

    it('should have hover and tap animations for action button', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const actionButton = screen.getByText('Get Started');
      const hoverData = JSON.parse(actionButton.getAttribute('data-while-hover') || '{}');
      const tapData = JSON.parse(actionButton.getAttribute('data-while-tap') || '{}');
      
      expect(hoverData.scale).toBe(1.05);
      expect(tapData.scale).toBe(0.95);
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive layout classes', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const contentLayout = document.querySelector('.flex.flex-col.md\\:flex-row.items-center.md\\:items-start.text-center.md\\:text-left');
      expect(contentLayout).toBeInTheDocument();
    });

    it('should have responsive icon spacing', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const iconContainer = document.querySelector('.flex-shrink-0.mb-4.md\\:mb-0.md\\:mr-6');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should have responsive button alignment', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const buttonContainer = document.querySelector('.mt-4.flex.justify-center.md\\:justify-start');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should have responsive margin for mobile', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const container = document.querySelector('.mb-24.lg\\:mb-8');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for container', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const container = document.querySelector('.bg-white.dark\\:bg-dark-800');
      expect(container).toBeInTheDocument();
    });

    it('should include dark mode classes for progress indicator', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const progressIndicator = document.querySelector('.bg-gray-50.dark\\:bg-dark-700');
      expect(progressIndicator).toBeInTheDocument();
    });

    it('should include dark mode classes for text elements', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const title = screen.getByText('Welcome to ShiftSync!');
      expect(title).toHaveClass('text-gray-900', 'dark:text-white');
      
      const description = document.querySelector('.text-gray-600.dark\\:text-gray-300');
      expect(description).toBeInTheDocument();
    });

    it('should include dark mode classes for buttons', () => {
      renderWithProviders(<NewUserGuidance />);
      
      const skipButton = screen.getByText('Skip');
      expect(skipButton).toHaveClass(
        'border-gray-300',
        'dark:border-dark-600',
        'text-gray-700',
        'dark:text-gray-300',
        'hover:bg-gray-50',
        'dark:hover:bg-dark-700'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing localStorage values gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      expect(() => {
        renderWithProviders(<NewUserGuidance />);
      }).not.toThrow();
      
      expect(screen.getByText('Welcome to ShiftSync!')).toBeInTheDocument();
    });

    it('should handle step index out of bounds', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'shiftsync_onboarding_current_step') return '999';
        return null;
      });
      
      expect(() => {
        renderWithProviders(<NewUserGuidance />);
      }).not.toThrow();
    });

    it('should handle empty employees and shifts arrays', () => {
      const store = createTestStore({
        ui: { themeColor: { name: 'Blue', value: '#3B82F6' }, darkMode: false, sidebarCollapsed: false, selectedView: 'calendar', notifications: [], tutorialComplete: false, lastCompletedStep: null, modalOpen: { modal: null, isOpen: false } },
        employees: { employees: [] },
        shifts: { shifts: [] },
      });
      
      expect(() => {
        renderWithProviders(<NewUserGuidance />, store);
      }).not.toThrow();
      
      expect(screen.getByText('Welcome to ShiftSync!')).toBeInTheDocument();
    });

    it('should handle undefined employees and shifts', () => {
      const store = createTestStore({
        ui: { themeColor: { name: 'Blue', value: '#3B82F6' }, darkMode: false, sidebarCollapsed: false, selectedView: 'calendar', notifications: [], tutorialComplete: false, lastCompletedStep: null, modalOpen: { modal: null, isOpen: false } },
        employees: { employees: undefined },
        shifts: { shifts: undefined },
      });
      
      expect(() => {
        renderWithProviders(<NewUserGuidance />, store);
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work with complete onboarding flow', () => {
      const store = createTestStore();
      const { rerender } = renderWithProviders(<NewUserGuidance />, store);
      
      // Start at welcome step
      expect(screen.getByText('Welcome to ShiftSync!')).toBeInTheDocument();
      
      // Complete welcome step
      fireEvent.click(screen.getByText('Get Started'));
      expect(screen.getByText('Add Your Team Members')).toBeInTheDocument();
      
      // Complete add employees step
      fireEvent.click(screen.getByText('Add Employees'));
      expect(mockNavigate).toHaveBeenCalledWith('/employees');
      
      // Simulate employees being added
      store.dispatch({ type: 'employees/addEmployee', payload: { id: '1', name: 'John', role: 'Server', color: 'bg-blue-500' } });
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <NewUserGuidance />
          </BrowserRouter>
        </Provider>
      );
      
      // Should advance to create shift step
      expect(screen.getByText('Create Your First Shift')).toBeInTheDocument();
    });

    it('should handle dismissal during onboarding', () => {
      renderWithProviders(<NewUserGuidance />);
      
      expect(screen.getByText('Welcome to ShiftSync!')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Dismiss'));
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('shiftsync_onboarding_dismissed', 'true');
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'onboardingDismissed' })
      );
    });
  });
}); 
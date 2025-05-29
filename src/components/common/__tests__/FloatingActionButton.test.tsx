import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import FloatingActionButton from '../FloatingActionButton';
import uiSlice, { setModalOpen } from '../../../store/uiSlice';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, className, onClick, onMouseEnter, onMouseLeave, disabled, ...props }: any) => (
      <button 
        className={className} 
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        disabled={disabled}
        style={props.style}
        data-testid="floating-action-button"
        {...(props['aria-label'] && { 'aria-label': props['aria-label'] })}
      >
        {children}
      </button>
    ),
  },
}));

// Mock BrandedSpinner
jest.mock('../BrandedSpinner', () => {
  return function MockBrandedSpinner({ color, size }: any) {
    return (
      <div data-testid="branded-spinner" data-color={color} data-size={size}>
        Loading Spinner
      </div>
    );
  };
});

// Mock Tooltip
jest.mock('../Tooltip', () => {
  return function MockTooltip({ children, content, shortcut, position }: any) {
    return (
      <div data-testid="tooltip" data-content={content} data-shortcut={shortcut} data-position={position}>
        {children}
      </div>
    );
  };
});

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock useSoundEffects
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

// Mock timers
jest.useFakeTimers();

// ===== UTILITY FUNCTIONS =====

const createTestStore = (initialState?: any) => {
  const defaultState = {
    ui: {
      darkMode: false,
      modalOpen: { addShift: false },
      themeColor: { name: 'blue', value: '#3b82f6' },
      notifications: [],
      soundEnabled: true,
    },
  };

  return configureStore({
    reducer: {
      ui: uiSlice,
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

describe('FloatingActionButton Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPlaySound.mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      expect(button).toBeInTheDocument();
    });

    it('should render with correct CSS classes', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      expect(button).toHaveClass(
        'fixed',
        'bottom-10',
        'right-10',
        'bg-primary-600',
        'hover:bg-primary-700',
        'text-white',
        'rounded-full',
        'w-20',
        'h-20',
        'shadow-2xl',
        'z-[9999]',
        'hidden',
        'lg:flex',
        'items-center',
        'justify-center'
      );
    });

    it('should have correct accessibility attributes', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      expect(button).toHaveAttribute('aria-label', 'Add Shift');
    });

    it('should render tooltip with correct props', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip).toHaveAttribute('data-content', 'Add new shift');
      expect(tooltip).toHaveAttribute('data-shortcut', 'shift+n');
      expect(tooltip).toHaveAttribute('data-position', 'left');
    });

    it('should render plus icon by default', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('h-10', 'w-10');
      expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('Hover Effects', () => {
    it('should update shadow on hover', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      
      // Initially should have default shadow
      expect(button.style.boxShadow).toBe('0 0 15px rgba(59, 130, 246, 0.5)');
      
      // Hover should change shadow
      fireEvent.mouseEnter(button);
      expect(button.style.boxShadow).toBe('0 0 20px rgba(59, 130, 246, 0.8)');
      
      // Leave should reset shadow
      fireEvent.mouseLeave(button);
      expect(button.style.boxShadow).toBe('0 0 15px rgba(59, 130, 246, 0.5)');
    });
  });

  describe('Click Functionality - Already on Calendar Page', () => {
    beforeEach(() => {
      // Mock location to be on calendar page
      Object.defineProperty(mockLocation, 'pathname', {
        value: '/',
        writable: true,
      });
    });

    it('should play sound when clicked', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      expect(mockPlaySound).toHaveBeenCalledWith('click');
    });

    it('should show processing state immediately after click', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      // Should show spinner
      expect(screen.getByTestId('branded-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('branded-spinner')).toHaveAttribute('data-color', 'white');
      expect(screen.getByTestId('branded-spinner')).toHaveAttribute('data-size', 'medium');
      
      // Should be disabled
      expect(button).toBeDisabled();
    });

    it('should dispatch modal open after short delay', async () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<FloatingActionButton />, store);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      // Fast-forward time by 600ms
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          setModalOpen({ modal: 'addShift', isOpen: true })
        );
      });
    });

    it('should hide processing state after delay', async () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      // Initially processing
      expect(screen.getByTestId('branded-spinner')).toBeInTheDocument();
      
      // Fast-forward time
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      
      await waitFor(() => {
        expect(screen.queryByTestId('branded-spinner')).not.toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });

    it('should not navigate when already on calendar page', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Click Functionality - Not on Calendar Page', () => {
    beforeEach(() => {
      // Mock location to be on different page
      Object.defineProperty(mockLocation, 'pathname', {
        value: '/settings',
        writable: true,
      });
    });

    it('should navigate to calendar page when not already there', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should dispatch modal open after longer delay when navigating', async () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<FloatingActionButton />, store);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      // Fast-forward time by 1000ms (longer delay for navigation)
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          setModalOpen({ modal: 'addShift', isOpen: true })
        );
      });
    });

    it('should hide processing state after navigation delay', async () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      // Initially processing
      expect(screen.getByTestId('branded-spinner')).toBeInTheDocument();
      
      // Fast-forward time by navigation delay
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByTestId('branded-spinner')).not.toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Processing State', () => {
    it('should prevent multiple clicks during processing', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<FloatingActionButton />, store);
      
      const button = screen.getByTestId('floating-action-button');
      
      // First click
      fireEvent.click(button);
      expect(button).toBeDisabled();
      
      // Second click should be ignored
      fireEvent.click(button);
      
      // Should only play sound once
      expect(mockPlaySound).toHaveBeenCalledTimes(1);
    });

    it('should show spinner during processing', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      const spinner = screen.getByTestId('branded-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('data-color', 'white');
      expect(spinner).toHaveAttribute('data-size', 'medium');
    });

    it('should hide plus icon during processing', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      
      // Initially should have plus icon
      expect(document.querySelector('svg')).toBeInTheDocument();
      
      // Click to start processing
      fireEvent.click(button);
      
      // Plus icon should be replaced by spinner
      expect(document.querySelector('svg')).not.toBeInTheDocument();
      expect(screen.getByTestId('branded-spinner')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should maintain aria-label during processing', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      
      // Initially should have aria-label
      expect(button).toHaveAttribute('aria-label', 'Add Shift');
      
      // Should maintain aria-label during processing
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-label', 'Add Shift');
    });

    it('should be disabled during processing for accessibility', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      expect(button).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicking gracefully', () => {
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      
      // Rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Should only process first click
      expect(mockPlaySound).toHaveBeenCalledTimes(1);
      expect(button).toBeDisabled();
    });

    it('should handle various pathname formats', () => {
      // Test with trailing slash
      Object.defineProperty(mockLocation, 'pathname', {
        value: '//',
        writable: true,
      });
      
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      // Should still navigate since '//' !== '/'
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should handle empty pathname', () => {
      Object.defineProperty(mockLocation, 'pathname', {
        value: '',
        writable: true,
      });
      
      renderWithProviders(<FloatingActionButton />);
      
      const button = screen.getByTestId('floating-action-button');
      fireEvent.click(button);
      
      // Should navigate since '' !== '/'
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should work when store has no modal state initially', () => {
      const incompleteStore = configureStore({
        reducer: {
          ui: uiSlice,
        },
        preloadedState: {
          ui: {}, // Missing modalOpen
        },
      });
      
      expect(() => {
        renderWithProviders(<FloatingActionButton />, incompleteStore);
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end on calendar page', async () => {
      Object.defineProperty(mockLocation, 'pathname', {
        value: '/',
        writable: true,
      });
      
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<FloatingActionButton />, store);
      
      const button = screen.getByTestId('floating-action-button');
      
      // Click button
      fireEvent.click(button);
      
      // Should immediately show processing
      expect(screen.getByTestId('branded-spinner')).toBeInTheDocument();
      expect(button).toBeDisabled();
      expect(mockPlaySound).toHaveBeenCalledWith('click');
      
      // Fast-forward time
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      
      // Should complete processing and open modal
      await waitFor(() => {
        expect(screen.queryByTestId('branded-spinner')).not.toBeInTheDocument();
        expect(button).not.toBeDisabled();
        expect(dispatchSpy).toHaveBeenCalledWith(
          setModalOpen({ modal: 'addShift', isOpen: true })
        );
      });
    });

    it('should work end-to-end when navigating', async () => {
      Object.defineProperty(mockLocation, 'pathname', {
        value: '/settings',
        writable: true,
      });
      
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<FloatingActionButton />, store);
      
      const button = screen.getByTestId('floating-action-button');
      
      // Click button
      fireEvent.click(button);
      
      // Should navigate and show processing
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(screen.getByTestId('branded-spinner')).toBeInTheDocument();
      expect(button).toBeDisabled();
      
      // Fast-forward time by navigation delay
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should complete processing and open modal
      await waitFor(() => {
        expect(screen.queryByTestId('branded-spinner')).not.toBeInTheDocument();
        expect(button).not.toBeDisabled();
        expect(dispatchSpy).toHaveBeenCalledWith(
          setModalOpen({ modal: 'addShift', isOpen: true })
        );
      });
    });
  });
}); 
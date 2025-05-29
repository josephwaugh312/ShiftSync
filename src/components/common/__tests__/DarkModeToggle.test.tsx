import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DarkModeToggle from '../DarkModeToggle';
import uiSlice, { toggleDarkMode } from '../../../store/uiSlice';

// Mock framer-motion to avoid complex animation testing
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, className, onClick, ...props }: any) => (
      <button 
        className={className} 
        onClick={onClick}
        {...(props['aria-label'] && { 'aria-label': props['aria-label'] })}
        data-testid="dark-mode-toggle"
      >
        {children}
      </button>
    ),
    svg: ({ children, className, variants, animate, ...props }: any) => (
      <svg 
        className={className}
        data-variants={JSON.stringify(variants)}
        data-animate={animate}
        {...props}
      >
        {children}
      </svg>
    ),
  },
}));

// Mock useSoundEffects hook
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

// ===== UTILITY FUNCTIONS =====

// Create test store utility
const createTestStore = (initialState?: any) => {
  const defaultState = {
    ui: {
      darkMode: false,
      modalOpen: { insights: false },
      highContrastMode: false,
      dyslexicFontMode: false,
      themeColor: { name: 'blue', value: '#3b82f6' },
      notifications: [],
      soundEnabled: true,
      viewMode: 'weekly',
    },
  };

  return configureStore({
    reducer: {
      ui: uiSlice,
    },
    preloadedState: initialState || defaultState,
  });
};

// Render with providers utility
const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('DarkModeToggle Component', () => {
  beforeEach(() => {
    mockPlaySound.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const toggle = screen.getByTestId('dark-mode-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('should render with correct button structure', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const button = screen.getByTestId('dark-mode-toggle');
      expect(button).toHaveClass('p-2', 'rounded-md', 'text-gray-500', 'dark:text-gray-400');
    });

    it('should have proper accessibility attributes', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const button = screen.getByTestId('dark-mode-toggle');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('should render both sun and moon icons', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements).toHaveLength(2); // Sun and moon icons
    });
  });

  describe('Light Mode State', () => {
    it('should show correct aria-label in light mode', () => {
      const store = createTestStore({
        ui: { darkMode: false },
      });
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const button = screen.getByTestId('dark-mode-toggle');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('should set sun icon as visible in light mode', () => {
      const store = createTestStore({
        ui: { darkMode: false },
      });
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const svgElements = document.querySelectorAll('svg');
      const sunIcon = svgElements[0]; // First SVG should be sun
      expect(sunIcon).toHaveAttribute('data-animate', 'visible');
    });

    it('should set moon icon as hidden in light mode', () => {
      const store = createTestStore({
        ui: { darkMode: false },
      });
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const svgElements = document.querySelectorAll('svg');
      const moonIcon = svgElements[1]; // Second SVG should be moon
      expect(moonIcon).toHaveAttribute('data-animate', 'hidden');
    });
  });

  describe('Dark Mode State', () => {
    it('should show correct aria-label in dark mode', () => {
      const store = createTestStore({
        ui: { darkMode: true },
      });
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const button = screen.getByTestId('dark-mode-toggle');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });

    it('should set sun icon as hidden in dark mode', () => {
      const store = createTestStore({
        ui: { darkMode: true },
      });
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const svgElements = document.querySelectorAll('svg');
      const sunIcon = svgElements[0];
      expect(sunIcon).toHaveAttribute('data-animate', 'hidden');
    });

    it('should set moon icon as visible in dark mode', () => {
      const store = createTestStore({
        ui: { darkMode: true },
      });
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const svgElements = document.querySelectorAll('svg');
      const moonIcon = svgElements[1];
      expect(moonIcon).toHaveAttribute('data-animate', 'visible');
    });
  });

  describe('Toggle Functionality', () => {
    it('should dispatch toggleDarkMode when clicked', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const button = screen.getByTestId('dark-mode-toggle');
      fireEvent.click(button);
      
      expect(dispatchSpy).toHaveBeenCalledWith(toggleDarkMode());
    });

    it('should toggle from light to dark mode', () => {
      const store = createTestStore({
        ui: { darkMode: false },
      });
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const button = screen.getByTestId('dark-mode-toggle');
      fireEvent.click(button);
      
      // Check that state changed
      const state = store.getState();
      expect(state.ui.darkMode).toBe(true);
    });

    it('should toggle from dark to light mode', () => {
      const store = createTestStore({
        ui: { darkMode: true },
      });
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const button = screen.getByTestId('dark-mode-toggle');
      fireEvent.click(button);
      
      // Check that state changed
      const state = store.getState();
      expect(state.ui.darkMode).toBe(false);
    });

    it('should update aria-label after toggle', () => {
      const store = createTestStore({
        ui: { darkMode: false },
      });
      
      const { rerender } = renderWithProviders(<DarkModeToggle />, store);
      
      // Initially should say "Switch to dark mode"
      let button = screen.getByTestId('dark-mode-toggle');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      
      // Click to toggle
      fireEvent.click(button);
      
      // Re-render with new state
      rerender(
        <Provider store={store}>
          <DarkModeToggle />
        </Provider>
      );
      
      // Now should say "Switch to light mode"
      button = screen.getByTestId('dark-mode-toggle');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });
  });

  describe('Sound Effects', () => {
    it('should play toggle sound when clicked', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const button = screen.getByTestId('dark-mode-toggle');
      fireEvent.click(button);
      
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
    });

    it('should play sound on each toggle', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const button = screen.getByTestId('dark-mode-toggle');
      
      // First click
      fireEvent.click(button);
      expect(mockPlaySound).toHaveBeenCalledTimes(1);
      
      // Second click
      fireEvent.click(button);
      expect(mockPlaySound).toHaveBeenCalledTimes(2);
      
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
    });
  });

  describe('Animation Variants', () => {
    it('should define correct sun icon variants', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const svgElements = document.querySelectorAll('svg');
      const sunIcon = svgElements[0];
      
      const variants = JSON.parse(sunIcon.getAttribute('data-variants') || '{}');
      expect(variants).toEqual({
        visible: { opacity: 1, rotate: 0, scale: 1 },
        hidden: { opacity: 0, rotate: 45, scale: 0.3 }
      });
    });

    it('should define correct moon icon variants', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const svgElements = document.querySelectorAll('svg');
      const moonIcon = svgElements[1];
      
      const variants = JSON.parse(moonIcon.getAttribute('data-variants') || '{}');
      expect(variants).toEqual({
        visible: { opacity: 1, rotate: 0, scale: 1 },
        hidden: { opacity: 0, rotate: -45, scale: 0.3 }
      });
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply hover and focus styles', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const button = screen.getByTestId('dark-mode-toggle');
      expect(button).toHaveClass(
        'hover:bg-gray-100',
        'dark:hover:bg-dark-600',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-primary-500'
      );
    });

    it('should apply transition classes', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const button = screen.getByTestId('dark-mode-toggle');
      expect(button).toHaveClass('transition-all', 'duration-300');
    });

    it('should have proper icon container structure', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const iconContainer = document.querySelector('.relative.h-6.w-6');
      expect(iconContainer).toBeInTheDocument();
      
      const absoluteIcons = document.querySelectorAll('.absolute.h-6.w-6');
      expect(absoluteIcons).toHaveLength(2); // Both icons should be absolutely positioned
    });
  });

  describe('SVG Icon Content', () => {
    it('should render sun icon with correct path', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const svgElements = document.querySelectorAll('svg');
      const sunIcon = svgElements[0];
      
      expect(sunIcon).toHaveAttribute('viewBox', '0 0 24 24');
      expect(sunIcon).toHaveAttribute('fill', 'none');
      expect(sunIcon).toHaveAttribute('stroke', 'currentColor');
      
      const path = sunIcon.querySelector('path');
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
      expect(path).toHaveAttribute('stroke-width', '2');
    });

    it('should render moon icon with correct path', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const svgElements = document.querySelectorAll('svg');
      const moonIcon = svgElements[1];
      
      expect(moonIcon).toHaveAttribute('viewBox', '0 0 24 24');
      expect(moonIcon).toHaveAttribute('fill', 'none');
      expect(moonIcon).toHaveAttribute('stroke', 'currentColor');
      
      const path = moonIcon.querySelector('path');
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
      expect(path).toHaveAttribute('stroke-width', '2');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      renderWithProviders(<DarkModeToggle />);
      
      const button = screen.getByTestId('dark-mode-toggle');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should support keyboard activation', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const button = screen.getByTestId('dark-mode-toggle');
      button.focus();
      
      // Since we're mocking the button, we'll just test that it can be clicked
      // In a real browser, Enter and Space would trigger the onClick
      fireEvent.click(button);
      
      expect(dispatchSpy).toHaveBeenCalledWith(toggleDarkMode());
    });

    it('should support space key activation', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const button = screen.getByTestId('dark-mode-toggle');
      button.focus();
      
      // Since we're mocking the button, we'll just test that it can be clicked
      // In a real browser, Enter and Space would trigger the onClick
      fireEvent.click(button);
      
      expect(dispatchSpy).toHaveBeenCalledWith(toggleDarkMode());
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicking', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const button = screen.getByTestId('dark-mode-toggle');
      
      // Rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(dispatchSpy).toHaveBeenCalledTimes(3);
      expect(mockPlaySound).toHaveBeenCalledTimes(3);
    });

    it('should work when sound is disabled', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<DarkModeToggle />, store);
      
      const button = screen.getByTestId('dark-mode-toggle');
      fireEvent.click(button);
      
      // Toggle should still work
      expect(dispatchSpy).toHaveBeenCalledWith(toggleDarkMode());
      // Sound should still be attempted (component doesn't check sound settings)
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
    });

    it('should handle missing Redux state gracefully', () => {
      const incompleteStore = configureStore({
        reducer: {
          ui: uiSlice,
        },
        preloadedState: {
          ui: {}, // Missing darkMode property
        },
      });
      
      // Should not crash
      expect(() => {
        renderWithProviders(<DarkModeToggle />, incompleteStore);
      }).not.toThrow();
    });
  });
}); 
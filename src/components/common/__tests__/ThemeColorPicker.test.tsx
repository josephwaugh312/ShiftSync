import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ThemeColorPicker from '../ThemeColorPicker';
import uiSlice, { setThemeColor, themeColors } from '../../../store/uiSlice';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, className, onClick, onFocus, onBlur, style, whileHover, whileTap, ...props }: any) => (
      <button 
        className={className} 
        onClick={onClick}
        onFocus={onFocus}
        onBlur={onBlur}
        style={style}
        data-while-hover={JSON.stringify(whileHover)}
        data-while-tap={JSON.stringify(whileTap)}
        {...(props.type && { type: props.type })}
        {...(props['aria-label'] && { 'aria-label': props['aria-label'] })}
        data-testid={`color-button-${props['aria-label']?.split(' ')[1]?.toLowerCase()}`}
      >
        {children}
      </button>
    ),
  },
}));

// Mock colorUtils
jest.mock('../../../utils/colorUtils', () => ({
  applyThemeColor: jest.fn(),
}));

// Mock useSoundEffects hook
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

// ===== UTILITY FUNCTIONS =====

const createTestStore = (initialState?: any) => {
  const defaultState = {
    ui: {
      themeColor: themeColors[0], // Default to first theme color
      darkMode: false,
      sidebarCollapsed: false,
      selectedView: 'calendar',
      notifications: [],
      tutorialComplete: false,
      lastCompletedStep: null,
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
      {component}
    </Provider>
  );
};

describe('ThemeColorPicker Component', () => {
  beforeEach(() => {
    mockPlaySound.mockClear();
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      expect(screen.getByText('Theme Color')).toBeInTheDocument();
    });

    it('should render header with title and description', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      const title = screen.getByText('Theme Color');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-sm', 'font-medium', 'text-gray-700', 'dark:text-gray-300');
      
      const description = screen.getByText('Choose your preferred accent color');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-xs', 'text-gray-500', 'dark:text-gray-400', 'mt-1');
    });

    it('should render correct grid layout', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      const grid = document.querySelector('.grid.grid-cols-4.sm\\:grid-cols-8.gap-4');
      expect(grid).toBeInTheDocument();
    });

    it('should render color buttons for all theme colors', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      themeColors.forEach((color) => {
        const button = screen.getByLabelText(`Select ${color.name} theme`);
        expect(button).toBeInTheDocument();
        expect(button).toHaveStyle({ backgroundColor: color.value });
      });
    });

    it('should render color names', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      themeColors.forEach((color) => {
        expect(screen.getByText(color.name)).toBeInTheDocument();
      });
    });
  });

  describe('Theme Color Selection', () => {
    it('should show current theme color as selected', () => {
      const store = createTestStore({
        ui: {
          themeColor: themeColors[2], // Select third color
          darkMode: false,
          sidebarCollapsed: false,
          selectedView: 'calendar',
          notifications: [],
          tutorialComplete: false,
          lastCompletedStep: null,
        },
      });

      renderWithProviders(<ThemeColorPicker />, store);
      
      const selectedButton = screen.getByLabelText(`Select ${themeColors[2].name} theme`);
      expect(selectedButton).toHaveClass('ring-2', 'ring-offset-2', 'ring-gray-700', 'dark:ring-white');
      
      // Should show checkmark for selected color
      const checkmark = selectedButton.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
      expect(checkmark).toHaveClass('h-4', 'w-4', 'text-white');
    });

    it('should not show selection ring for non-selected colors', () => {
      const store = createTestStore({
        ui: {
          themeColor: themeColors[1], // Select second color
          darkMode: false,
          sidebarCollapsed: false,
          selectedView: 'calendar',
          notifications: [],
          tutorialComplete: false,
          lastCompletedStep: null,
        },
      });

      renderWithProviders(<ThemeColorPicker />, store);
      
      const nonSelectedButton = screen.getByLabelText(`Select ${themeColors[0].name} theme`);
      expect(nonSelectedButton).not.toHaveClass('ring-2');
      
      // Should not show checkmark for non-selected colors
      const checkmark = nonSelectedButton.querySelector('svg');
      expect(checkmark).not.toBeInTheDocument();
    });

    it('should dispatch action when different color is selected', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<ThemeColorPicker />, store);
      
      // Click on second color (different from default first color)
      const button = screen.getByLabelText(`Select ${themeColors[1].name} theme`);
      fireEvent.click(button);
      
      expect(dispatchSpy).toHaveBeenCalledWith(setThemeColor(themeColors[1]));
    });

    it('should not dispatch action when same color is clicked', () => {
      const store = createTestStore({
        ui: {
          themeColor: themeColors[1],
          darkMode: false,
          sidebarCollapsed: false,
          selectedView: 'calendar',
          notifications: [],
          tutorialComplete: false,
          lastCompletedStep: null,
        },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<ThemeColorPicker />, store);
      
      // Click on the already selected color
      const button = screen.getByLabelText(`Select ${themeColors[1].name} theme`);
      fireEvent.click(button);
      
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should apply theme color immediately when different color is selected', () => {
      const { applyThemeColor } = require('../../../utils/colorUtils');
      const store = createTestStore();
      
      renderWithProviders(<ThemeColorPicker />, store);
      
      // Click on second color
      const button = screen.getByLabelText(`Select ${themeColors[1].name} theme`);
      fireEvent.click(button);
      
      expect(applyThemeColor).toHaveBeenCalledWith(themeColors[1].value);
    });

    it('should not apply theme color when same color is clicked', () => {
      const { applyThemeColor } = require('../../../utils/colorUtils');
      const store = createTestStore({
        ui: {
          themeColor: themeColors[1],
          darkMode: false,
          sidebarCollapsed: false,
          selectedView: 'calendar',
          notifications: [],
          tutorialComplete: false,
          lastCompletedStep: null,
        },
      });
      
      renderWithProviders(<ThemeColorPicker />, store);
      
      // Click on the already selected color
      const button = screen.getByLabelText(`Select ${themeColors[1].name} theme`);
      fireEvent.click(button);
      
      expect(applyThemeColor).not.toHaveBeenCalled();
    });
  });

  describe('Sound Effects', () => {
    it('should play sound when different color is selected', () => {
      const store = createTestStore();
      
      renderWithProviders(<ThemeColorPicker />, store);
      
      // Click on second color
      const button = screen.getByLabelText(`Select ${themeColors[1].name} theme`);
      fireEvent.click(button);
      
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
    });

    it('should not play sound when same color is clicked', () => {
      const store = createTestStore({
        ui: {
          themeColor: themeColors[1],
          darkMode: false,
          sidebarCollapsed: false,
          selectedView: 'calendar',
          notifications: [],
          tutorialComplete: false,
          lastCompletedStep: null,
        },
      });
      
      renderWithProviders(<ThemeColorPicker />, store);
      
      // Click on the already selected color
      const button = screen.getByLabelText(`Select ${themeColors[1].name} theme`);
      fireEvent.click(button);
      
      expect(mockPlaySound).not.toHaveBeenCalled();
    });
  });

  describe('Animation Properties', () => {
    it('should have correct hover animation properties', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      const button = screen.getByLabelText(`Select ${themeColors[0].name} theme`);
      const hoverData = JSON.parse(button.getAttribute('data-while-hover') || '{}');
      expect(hoverData.scale).toBe(1.1);
    });

    it('should have correct tap animation properties', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      const button = screen.getByLabelText(`Select ${themeColors[0].name} theme`);
      const tapData = JSON.parse(button.getAttribute('data-while-tap') || '{}');
      expect(tapData.scale).toBe(0.95);
    });
  });

  describe('Styling and CSS Classes', () => {
    it('should apply correct button classes', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      const button = screen.getByLabelText(`Select ${themeColors[0].name} theme`);
      expect(button).toHaveClass(
        'w-8',
        'h-8',
        'rounded-full',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'focus:ring-primary-500',
        'transition-shadow',
        'flex',
        'items-center',
        'justify-center'
      );
    });

    it('should apply correct color name styling', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      const colorName = screen.getByText(themeColors[0].name);
      expect(colorName).toHaveClass('text-xs', 'mt-1', 'text-gray-600', 'dark:text-gray-400');
    });

    it('should apply correct layout styling', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      const container = document.querySelector('.space-y-3');
      expect(container).toBeInTheDocument();
      
      const colorColumn = document.querySelector('.flex.flex-col.items-center');
      expect(colorColumn).toBeInTheDocument();
    });

    it('should set correct background color for each button', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      themeColors.forEach((color) => {
        const button = screen.getByLabelText(`Select ${color.name} theme`);
        expect(button).toHaveStyle({ backgroundColor: color.value });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button type', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      const button = screen.getByLabelText(`Select ${themeColors[0].name} theme`);
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have descriptive aria-labels', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      themeColors.forEach((color) => {
        const button = screen.getByLabelText(`Select ${color.name} theme`);
        expect(button).toHaveAttribute('aria-label', `Select ${color.name} theme`);
      });
    });

    it('should be focusable and have proper focus styling', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      const button = screen.getByLabelText(`Select ${themeColors[0].name} theme`);
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-primary-500');
    });

    it('should be keyboard navigable', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      const button = screen.getByLabelText(`Select ${themeColors[0].name} theme`);
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Checkmark Icon', () => {
    it('should show checkmark for selected color', () => {
      const store = createTestStore({
        ui: {
          themeColor: themeColors[2],
          darkMode: false,
          sidebarCollapsed: false,
          selectedView: 'calendar',
          notifications: [],
          tutorialComplete: false,
          lastCompletedStep: null,
        },
      });

      renderWithProviders(<ThemeColorPicker />, store);
      
      const selectedButton = screen.getByLabelText(`Select ${themeColors[2].name} theme`);
      const checkmark = selectedButton.querySelector('svg');
      
      expect(checkmark).toBeInTheDocument();
      expect(checkmark).toHaveAttribute('viewBox', '0 0 20 20');
      expect(checkmark).toHaveAttribute('fill', 'currentColor');
      expect(checkmark).toHaveClass('h-4', 'w-4', 'text-white');
    });

    it('should have correct checkmark path', () => {
      const store = createTestStore({
        ui: {
          themeColor: themeColors[1],
          darkMode: false,
          sidebarCollapsed: false,
          selectedView: 'calendar',
          notifications: [],
          tutorialComplete: false,
          lastCompletedStep: null,
        },
      });

      renderWithProviders(<ThemeColorPicker />, store);
      
      const selectedButton = screen.getByLabelText(`Select ${themeColors[1].name} theme`);
      const checkmarkPath = selectedButton.querySelector('path');
      
      expect(checkmarkPath).toBeInTheDocument();
      expect(checkmarkPath).toHaveAttribute('fill-rule', 'evenodd');
      expect(checkmarkPath).toHaveAttribute('clip-rule', 'evenodd');
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for text', () => {
      renderWithProviders(<ThemeColorPicker />);
      
      const title = screen.getByText('Theme Color');
      expect(title).toHaveClass('dark:text-gray-300');
      
      const description = screen.getByText('Choose your preferred accent color');
      expect(description).toHaveClass('dark:text-gray-400');
      
      const colorName = screen.getByText(themeColors[0].name);
      expect(colorName).toHaveClass('dark:text-gray-400');
    });

    it('should include dark mode classes for selected color ring', () => {
      const store = createTestStore({
        ui: {
          themeColor: themeColors[0],
          darkMode: false,
          sidebarCollapsed: false,
          selectedView: 'calendar',
          notifications: [],
          tutorialComplete: false,
          lastCompletedStep: null,
        },
      });

      renderWithProviders(<ThemeColorPicker />, store);
      
      const selectedButton = screen.getByLabelText(`Select ${themeColors[0].name} theme`);
      expect(selectedButton).toHaveClass('dark:ring-white');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing theme colors gracefully', () => {
      // Mock empty theme colors
      jest.doMock('../../../store/uiSlice', () => ({
        ...jest.requireActual('../../../store/uiSlice'),
        themeColors: [],
      }));

      expect(() => {
        renderWithProviders(<ThemeColorPicker />);
      }).not.toThrow();
    });

    it('should handle rapid clicking', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<ThemeColorPicker />, store);
      
      const button = screen.getByLabelText(`Select ${themeColors[1].name} theme`);
      
      // Rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Should only dispatch once for the first click (same color won't trigger subsequent dispatches)
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle clicking all colors in sequence', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<ThemeColorPicker />, store);
      
      // Click each color
      themeColors.slice(1).forEach((color, index) => {
        const button = screen.getByLabelText(`Select ${color.name} theme`);
        fireEvent.click(button);
        
        expect(dispatchSpy).toHaveBeenNthCalledWith(index + 1, setThemeColor(color));
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work with full color selection cycle', () => {
      const { applyThemeColor } = require('../../../utils/colorUtils');
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<ThemeColorPicker />, store);
      
      // Select a new color
      const newColor = themeColors[3];
      const button = screen.getByLabelText(`Select ${newColor.name} theme`);
      fireEvent.click(button);
      
      // Should apply color, dispatch action, and play sound
      expect(applyThemeColor).toHaveBeenCalledWith(newColor.value);
      expect(dispatchSpy).toHaveBeenCalledWith(setThemeColor(newColor));
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
    });

    it('should update selection visual when Redux state changes', () => {
      const store = createTestStore();
      
      const { rerender } = renderWithProviders(<ThemeColorPicker />, store);
      
      // Initially first color should be selected
      let selectedButton = screen.getByLabelText(`Select ${themeColors[0].name} theme`);
      expect(selectedButton).toHaveClass('ring-2');
      
      // Change store state
      act(() => {
        store.dispatch(setThemeColor(themeColors[2]));
      });
      rerender(<Provider store={store}><ThemeColorPicker /></Provider>);
      
      // New color should be selected
      selectedButton = screen.getByLabelText(`Select ${themeColors[2].name} theme`);
      expect(selectedButton).toHaveClass('ring-2');
      
      // Old color should not be selected
      const oldButton = screen.getByLabelText(`Select ${themeColors[0].name} theme`);
      expect(oldButton).not.toHaveClass('ring-2');
    });
  });
}); 
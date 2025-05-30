import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ViewToggle from '../ViewToggle';
import uiSlice, { setCurrentView } from '../../../store/uiSlice';
import { useSoundEffects } from '../../../hooks/useSoundEffects';

// Mock the sound effects hook
jest.mock('../../../hooks/useSoundEffects');
const mockUseSoundEffects = useSoundEffects as jest.MockedFunction<typeof useSoundEffects>;

// Create test store
const createTestStore = (initialState = { currentView: 'daily' }) => {
  return configureStore({
    reducer: {
      ui: uiSlice,
    },
    preloadedState: {
      ui: initialState,
    },
  });
};

const renderWithProvider = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('ViewToggle', () => {
  const mockPlaySound = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSoundEffects.mockReturnValue({
      playSound: mockPlaySound,
      enableSounds: true,
      toggleSounds: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('should render all view options', () => {
      renderWithProvider(<ViewToggle />);
      
      // Check that all view buttons are rendered
      expect(screen.getByRole('tab', { name: /day/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /week/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /staff/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /list/i })).toBeInTheDocument();
    });

    it('should render icons for all view options', () => {
      renderWithProvider(<ViewToggle />);
      
      // All buttons should have SVG icons
      const buttons = screen.getAllByRole('tab');
      expect(buttons).toHaveLength(4);
      
      buttons.forEach(button => {
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass('w-5', 'h-5');
      });
    });

    it('should have proper container styling', () => {
      const { container } = renderWithProvider(<ViewToggle />);
      
      const toggleContainer = container.firstChild as HTMLElement;
      expect(toggleContainer).toHaveClass(
        'flex',
        'items-center',
        'justify-center',
        'bg-white',
        'dark:bg-dark-700',
        'shadow-sm',
        'rounded-lg',
        'border',
        'border-gray-200',
        'dark:border-dark-600',
        'p-1',
        'mb-4'
      );
    });
  });

  describe('active view highlighting', () => {
    it('should highlight the current view (daily)', () => {
      const store = createTestStore({ currentView: 'daily' });
      renderWithProvider(<ViewToggle />, store);
      
      const dailyButton = screen.getByRole('tab', { name: /day/i });
      expect(dailyButton).toHaveClass('bg-primary-100', 'text-primary-600');
      expect(dailyButton).toHaveAttribute('aria-selected', 'true');
    });

    it('should highlight the current view (weekly)', () => {
      const store = createTestStore({ currentView: 'weekly' });
      renderWithProvider(<ViewToggle />, store);
      
      const weeklyButton = screen.getByRole('tab', { name: /week/i });
      expect(weeklyButton).toHaveClass('bg-primary-100', 'text-primary-600');
      expect(weeklyButton).toHaveAttribute('aria-selected', 'true');
    });

    it('should highlight the current view (staff)', () => {
      const store = createTestStore({ currentView: 'staff' });
      renderWithProvider(<ViewToggle />, store);
      
      const staffButton = screen.getByRole('tab', { name: /staff/i });
      expect(staffButton).toHaveClass('bg-primary-100', 'text-primary-600');
      expect(staffButton).toHaveAttribute('aria-selected', 'true');
    });

    it('should highlight the current view (list)', () => {
      const store = createTestStore({ currentView: 'list' });
      renderWithProvider(<ViewToggle />, store);
      
      const listButton = screen.getByRole('tab', { name: /list/i });
      expect(listButton).toHaveClass('bg-primary-100', 'text-primary-600');
      expect(listButton).toHaveAttribute('aria-selected', 'true');
    });

    it('should not highlight inactive views', () => {
      const store = createTestStore({ currentView: 'daily' });
      renderWithProvider(<ViewToggle />, store);
      
      const weeklyButton = screen.getByRole('tab', { name: /week/i });
      expect(weeklyButton).not.toHaveClass('bg-primary-100', 'text-primary-600');
      expect(weeklyButton).toHaveClass('text-gray-600', 'hover:bg-gray-100');
      expect(weeklyButton).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('interaction behavior', () => {
    it('should dispatch setCurrentView when clicking a different view', () => {
      const store = createTestStore({ currentView: 'daily' });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProvider(<ViewToggle />, store);
      
      const weeklyButton = screen.getByRole('tab', { name: /week/i });
      fireEvent.click(weeklyButton);
      
      expect(dispatchSpy).toHaveBeenCalledWith(setCurrentView('weekly'));
    });

    it('should play toggle sound when switching views', () => {
      const store = createTestStore({ currentView: 'daily' });
      renderWithProvider(<ViewToggle />, store);
      
      const staffButton = screen.getByRole('tab', { name: /staff/i });
      fireEvent.click(staffButton);
      
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
    });

    it('should not dispatch or play sound when clicking the same view', () => {
      const store = createTestStore({ currentView: 'daily' });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProvider(<ViewToggle />, store);
      
      const dailyButton = screen.getByRole('tab', { name: /day/i });
      fireEvent.click(dailyButton);
      
      expect(dispatchSpy).not.toHaveBeenCalled();
      expect(mockPlaySound).not.toHaveBeenCalled();
    });

    it('should handle clicks on all view options', () => {
      const store = createTestStore({ currentView: 'daily' });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProvider(<ViewToggle />, store);
      
      // Test each view option
      const viewOptions = [
        { button: screen.getByRole('tab', { name: /week/i }), view: 'weekly' },
        { button: screen.getByRole('tab', { name: /staff/i }), view: 'staff' },
        { button: screen.getByRole('tab', { name: /list/i }), view: 'list' },
      ];
      
      viewOptions.forEach(({ button, view }) => {
        fireEvent.click(button);
        expect(dispatchSpy).toHaveBeenCalledWith(setCurrentView(view));
      });
      
      expect(mockPlaySound).toHaveBeenCalledTimes(3);
    });

    it('should dispatch setCurrentView action when view is changed', () => {
      const store = createTestStore({ currentView: 'daily' });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProvider(<ViewToggle />, store);
      
      const listButton = screen.getByRole('tab', { name: /list/i });
      fireEvent.click(listButton);
      
      expect(dispatchSpy).toHaveBeenCalledWith(setCurrentView('list'));
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProvider(<ViewToggle />);
      
      const buttons = screen.getAllByRole('tab');
      
      buttons.forEach((button, index) => {
        expect(button).toHaveAttribute('role', 'tab');
        expect(button).toHaveAttribute('aria-selected');
        expect(button).toHaveAttribute('aria-controls');
      });
    });

    it('should have proper aria-controls attributes', () => {
      renderWithProvider(<ViewToggle />);
      
      expect(screen.getByRole('tab', { name: /day/i })).toHaveAttribute('aria-controls', 'daily-view');
      expect(screen.getByRole('tab', { name: /week/i })).toHaveAttribute('aria-controls', 'weekly-view');
      expect(screen.getByRole('tab', { name: /staff/i })).toHaveAttribute('aria-controls', 'staff-view');
      expect(screen.getByRole('tab', { name: /list/i })).toHaveAttribute('aria-controls', 'list-view');
    });

    it('should have focus outline styles', () => {
      renderWithProvider(<ViewToggle />);
      
      const buttons = screen.getAllByRole('tab');
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none');
      });
    });
  });

  describe('responsive behavior', () => {
    it('should hide labels on small screens', () => {
      renderWithProvider(<ViewToggle />);
      
      // Labels should have hidden sm:inline classes
      const dayLabel = screen.getByText('Day');
      expect(dayLabel).toHaveClass('hidden', 'sm:inline');
      
      const weekLabel = screen.getByText('Week');
      expect(weekLabel).toHaveClass('hidden', 'sm:inline');
    });

    it('should always show icons', () => {
      renderWithProvider(<ViewToggle />);
      
      const buttons = screen.getAllByRole('tab');
      buttons.forEach(button => {
        const icon = button.querySelector('svg');
        expect(icon).toBeInTheDocument();
        // Icons don't have hidden classes
        expect(icon).not.toHaveClass('hidden');
      });
    });
  });

  describe('dark mode support', () => {
    it('should include dark mode classes', () => {
      const { container } = renderWithProvider(<ViewToggle />);
      
      const toggleContainer = container.firstChild as HTMLElement;
      expect(toggleContainer).toHaveClass('dark:bg-dark-700', 'dark:border-dark-600');
    });

    it('should have dark mode button styles', () => {
      renderWithProvider(<ViewToggle />);
      
      const inactiveButton = screen.getByRole('tab', { name: /week/i });
      expect(inactiveButton).toHaveClass('dark:text-gray-300', 'dark:hover:bg-dark-600');
    });

    it('should have dark mode active styles', () => {
      const store = createTestStore({ currentView: 'daily' });
      renderWithProvider(<ViewToggle />, store);
      
      const activeButton = screen.getByRole('tab', { name: /day/i });
      expect(activeButton).toHaveClass('dark:bg-primary-900', 'dark:text-primary-300');
    });
  });

  describe('motion animations', () => {
    it('should render motion buttons', () => {
      renderWithProvider(<ViewToggle />);
      
      // All buttons should be motion.button components (they render as buttons with motion props)
      const buttons = screen.getAllByRole('tab');
      expect(buttons).toHaveLength(4);
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('button styling', () => {
    it('should have consistent button classes', () => {
      renderWithProvider(<ViewToggle />);
      
      const buttons = screen.getAllByRole('tab');
      buttons.forEach(button => {
        expect(button).toHaveClass(
          'flex',
          'items-center',
          'justify-center',
          'px-3',
          'py-2',
          'rounded-md',
          'mx-1',
          'text-sm',
          'focus:outline-none',
          'transition-colors'
        );
      });
    });

    it('should have proper icon and label layout', () => {
      renderWithProvider(<ViewToggle />);
      
      const dayButton = screen.getByRole('tab', { name: /day/i });
      const iconSpan = dayButton.querySelector('span:first-child');
      const labelSpan = dayButton.querySelector('span:last-child');
      
      expect(iconSpan).toHaveClass('mr-1');
      expect(labelSpan).toHaveClass('hidden', 'sm:inline');
      expect(labelSpan).toHaveTextContent('Day');
    });
  });

  describe('edge cases', () => {
    it('should handle unknown current view gracefully', () => {
      const store = createTestStore({ currentView: 'unknown' as any });
      
      expect(() => {
        renderWithProvider(<ViewToggle />, store);
      }).not.toThrow();
      
      // No button should be highlighted
      const buttons = screen.getAllByRole('tab');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-selected', 'false');
      });
    });

    it('should handle multiple rapid clicks', () => {
      const store = createTestStore({ currentView: 'daily' });
      renderWithProvider(<ViewToggle />, store);
      
      const weeklyButton = screen.getByRole('tab', { name: /week/i });
      
      // Rapid clicks
      fireEvent.click(weeklyButton);
      fireEvent.click(weeklyButton);
      fireEvent.click(weeklyButton);
      
      // Only first click should trigger sound/dispatch (others are same view)
      expect(mockPlaySound).toHaveBeenCalledTimes(1);
    });
  });
}); 
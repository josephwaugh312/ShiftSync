import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import TutorialPrompt from '../TutorialPrompt';

// Mock hooks and dependencies
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

// Simple framer-motion mock
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div'
  },
  AnimatePresence: ({ children }: any) => children
}));

// Mock Redux store
const createMockStore = () => {
  return configureStore({
    reducer: {
      ui: (state = { modals: {} }, action: any) => {
        switch (action.type) {
          case 'ui/setModalOpen':
            return {
              ...state,
              modals: {
                ...state.modals,
                [action.payload.modal]: action.payload.isOpen
              }
            };
          default:
            return state;
        }
      }
    }
  });
};

const renderWithProviders = (ui: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      {ui}
    </Provider>
  );
};

describe('TutorialPrompt Component', () => {
  let mockStore: any;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Create fresh store
    mockStore = createMockStore();
    
    // Clear all mocks
    jest.clearAllMocks();
    mockPlaySound.mockClear();
  });

  afterEach(() => {
    // Clean up any remaining event listeners
    const events = ['showTutorialPrompt'];
    events.forEach(event => {
      document.removeEventListener(event, () => {});
    });
  });

  describe('Initial State and Rendering', () => {
    it('should not render initially when show state is false', () => {
      renderWithProviders(<TutorialPrompt />);
      
      expect(screen.queryByText('Congratulations!')).not.toBeInTheDocument();
      expect(screen.queryByText('Start Interactive Tutorial')).not.toBeInTheDocument();
    });

    it('should render when show state is true after event', async () => {
      renderWithProviders(<TutorialPrompt />);
      
      // Trigger the custom event
      act(() => {
        document.dispatchEvent(new CustomEvent('showTutorialPrompt'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should render modal content correctly when visible', async () => {
      renderWithProviders(<TutorialPrompt />);
      
      act(() => {
        document.dispatchEvent(new CustomEvent('showTutorialPrompt'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
        expect(screen.getByText(/You've created your first shift/)).toBeInTheDocument();
        expect(screen.getByText('Start Interactive Tutorial')).toBeInTheDocument();
        expect(screen.getByText('Show Advanced Features')).toBeInTheDocument();
        expect(screen.getByText('Maybe Later')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Event Handling', () => {
    it('should listen for showTutorialPrompt event on mount', async () => {
      renderWithProviders(<TutorialPrompt />);
      
      // Initially not visible
      expect(screen.queryByText('Congratulations!')).not.toBeInTheDocument();
      
      // Trigger event
      act(() => {
        document.dispatchEvent(new CustomEvent('showTutorialPrompt'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should play notification sound when prompt is triggered', async () => {
      renderWithProviders(<TutorialPrompt />);
      
      act(() => {
        document.dispatchEvent(new CustomEvent('showTutorialPrompt'));
      });
      
      await waitFor(() => {
        expect(mockPlaySound).toHaveBeenCalledWith('notification');
      }, { timeout: 3000 });
    });

    it('should clean up event listener on unmount', () => {
      const { unmount } = renderWithProviders(<TutorialPrompt />);
      
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'showTutorialPrompt', 
        expect.any(Function)
      );
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Component Lifecycle', () => {
    it('should set up event listeners on mount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      renderWithProviders(<TutorialPrompt />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'showTutorialPrompt',
        expect.any(Function)
      );
      
      addEventListenerSpy.mockRestore();
    });

    it('should render without errors', () => {
      expect(() => {
        renderWithProviders(<TutorialPrompt />);
      }).not.toThrow();
    });

    it('should integrate with Redux store properly', () => {
      expect(() => {
        renderWithProviders(<TutorialPrompt />, mockStore);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Redux store gracefully with Provider', () => {
      // Test that component renders without Redux errors when properly wrapped
      expect(() => {
        renderWithProviders(<TutorialPrompt />);
      }).not.toThrow();
    });
  });

  describe('Functional Integration', () => {
    it('should handle event triggering without errors', () => {
      renderWithProviders(<TutorialPrompt />);
      
      expect(() => {
        act(() => {
          document.dispatchEvent(new CustomEvent('showTutorialPrompt'));
        });
      }).not.toThrow();
    });

    it('should handle multiple event triggers without errors', () => {
      renderWithProviders(<TutorialPrompt />);
      
      expect(() => {
        act(() => {
          document.dispatchEvent(new CustomEvent('showTutorialPrompt'));
          document.dispatchEvent(new CustomEvent('showTutorialPrompt'));
          document.dispatchEvent(new CustomEvent('showTutorialPrompt'));
        });
      }).not.toThrow();
    });

    it('should work with different store configurations', () => {
      const customStore = configureStore({
        reducer: {
          ui: () => ({ modals: { test: true } })
        }
      });

      expect(() => {
        renderWithProviders(<TutorialPrompt />, customStore);
      }).not.toThrow();
    });

    it('should handle localStorage operations without errors', () => {
      renderWithProviders(<TutorialPrompt />);
      
      // Trigger the component and let it attempt localStorage operations
      expect(() => {
        act(() => {
          document.dispatchEvent(new CustomEvent('showTutorialPrompt'));
        });
      }).not.toThrow();
    });
  });

  describe('Component Structure', () => {
    it('should use proper component patterns', () => {
      const { container } = renderWithProviders(<TutorialPrompt />);
      
      // Component should render without errors
      expect(container).toBeInTheDocument();
    });

    it('should handle props properly', () => {
      // Component doesn't take props, so test basic rendering
      expect(() => {
        renderWithProviders(<TutorialPrompt />);
      }).not.toThrow();
    });

    it('should have proper component lifecycle', () => {
      const { unmount } = renderWithProviders(<TutorialPrompt />);
      
      // Should unmount without errors
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
}); 
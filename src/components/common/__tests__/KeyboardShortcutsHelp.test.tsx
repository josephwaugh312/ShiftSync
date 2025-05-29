import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import KeyboardShortcutsHelp from '../KeyboardShortcutsHelp';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, initial, animate, exit, transition, ...props }: any) => (
      <div 
        className={className}
        onClick={onClick}
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-exit={JSON.stringify(exit)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Tooltip component
jest.mock('../Tooltip', () => {
  return function MockTooltip({ children }: { children: React.ReactNode }) {
    return <div data-testid="tooltip">{children}</div>;
  };
});

beforeEach(() => {
  // Clear any global window properties
  // @ts-ignore
  delete window.showKeyboardShortcutsHelp;
  
  // Clear any existing event listeners
  document.removeEventListener('keydown', jest.fn());
  document.removeEventListener('showKeyboardShortcuts', jest.fn());
});

afterEach(() => {
  // Clean up any event listeners
  jest.clearAllMocks();
});

describe('KeyboardShortcutsHelp Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<KeyboardShortcutsHelp />);
      // Component renders but modal is closed by default
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });

    it('should not show modal by default', () => {
      render(<KeyboardShortcutsHelp />);
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
      expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
    });

    it('should render modal when opened', async () => {
      render(<KeyboardShortcutsHelp />);
      
      // Open modal with keyboard shortcut
      await act(async () => {
        fireEvent.keyDown(document, { key: '?', shiftKey: true });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should open modal when ? key is pressed', async () => {
      render(<KeyboardShortcutsHelp />);
      
      await act(async () => {
        fireEvent.keyDown(document, { key: '?' });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });
    });

    it('should open modal when Shift + / is pressed', async () => {
      render(<KeyboardShortcutsHelp />);
      
      await act(async () => {
        fireEvent.keyDown(document, { key: '/', shiftKey: true });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });
    });

    it('should close modal when Escape is pressed', async () => {
      render(<KeyboardShortcutsHelp />);
      
      // Open modal first
      await act(async () => {
        fireEvent.keyDown(document, { key: '?' });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });
      
      // Close with Escape
      await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
      });
    });

    it('should not close modal with Escape when modal is not open', () => {
      render(<KeyboardShortcutsHelp />);
      
      // Try to close when modal is not open
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Should not cause any errors
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });

  describe('Custom Event Handling', () => {
    it('should open modal when showKeyboardShortcuts event is dispatched', async () => {
      render(<KeyboardShortcutsHelp />);
      
      await act(async () => {
        const event = new CustomEvent('showKeyboardShortcuts');
        document.dispatchEvent(event);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });
    });

    it('should register global function on window', () => {
      render(<KeyboardShortcutsHelp />);
      
      // @ts-ignore
      expect(typeof window.showKeyboardShortcutsHelp).toBe('function');
    });

    it('should open modal when global function is called', async () => {
      render(<KeyboardShortcutsHelp />);
      
      await act(async () => {
        // @ts-ignore
        window.showKeyboardShortcutsHelp();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });
    });
  });

  describe('Event Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<KeyboardShortcutsHelp />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('showKeyboardShortcuts', expect.any(Function));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('showKeyboardShortcuts', expect.any(Function));
    });

    it('should remove global window function on unmount', () => {
      const { unmount } = render(<KeyboardShortcutsHelp />);
      
      // @ts-ignore
      expect(typeof window.showKeyboardShortcutsHelp).toBe('function');
      
      unmount();
      
      // @ts-ignore
      expect(window.showKeyboardShortcutsHelp).toBeUndefined();
    });
  });
}); 
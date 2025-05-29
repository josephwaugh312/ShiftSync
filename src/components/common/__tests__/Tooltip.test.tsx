import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Tooltip from '../Tooltip';

// Mock getBoundingClientRect for position calculations
const mockGetBoundingClientRect = jest.fn();

beforeEach(() => {
  mockGetBoundingClientRect.mockReturnValue({
    top: 100,
    left: 100,
    bottom: 120,
    right: 200,
    width: 100,
    height: 20,
  });
  
  // Mock HTMLElement.getBoundingClientRect
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: mockGetBoundingClientRect,
  });

  // Clear all timers
  jest.clearAllTimers();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('Tooltip Component', () => {
  const defaultProps = {
    children: <button>Hover me</button>,
    content: 'Tooltip content',
  };

  describe('Basic Rendering', () => {
    it('should render children without tooltip initially', () => {
      render(<Tooltip {...defaultProps} />);
      
      expect(screen.getByText('Hover me')).toBeInTheDocument();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should render children in wrapper div', () => {
      render(<Tooltip {...defaultProps} />);
      
      const wrapper = document.querySelector('.relative.inline-block');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toContainElement(screen.getByText('Hover me'));
    });
  });

  describe('Tooltip Display on Hover', () => {
    it('should show tooltip after delay on mouse enter', async () => {
      render(<Tooltip {...defaultProps} delay={100} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
        
        // Should not show immediately
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        
        // Fast-forward timers
        jest.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText('Tooltip content')).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      render(<Tooltip {...defaultProps} delay={100} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
        jest.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
      
      await act(async () => {
        fireEvent.mouseLeave(trigger);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should cancel tooltip display if mouse leaves before delay', async () => {
      render(<Tooltip {...defaultProps} delay={300} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
        
        // Leave before delay completes
        jest.advanceTimersByTime(150);
        fireEvent.mouseLeave(trigger);
        
        // Complete the original delay
        jest.advanceTimersByTime(150);
      });
      
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should handle rapid mouse enter/leave cycles', async () => {
      render(<Tooltip {...defaultProps} delay={100} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        // Rapid enter/leave
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseLeave(trigger);
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseLeave(trigger);
        fireEvent.mouseEnter(trigger);
        
        jest.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Position Variants', () => {
    it('should apply correct classes for bottom position (default)', async () => {
      render(<Tooltip {...defaultProps} delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('transform', '-translate-x-1/2', 'mt-2');
      });
    });

    it('should apply correct classes for top position', async () => {
      render(<Tooltip {...defaultProps} position="top" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('transform', '-translate-x-1/2', '-translate-y-full', 'mb-2');
      });
    });

    it('should apply correct classes for left position', async () => {
      render(<Tooltip {...defaultProps} position="left" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('transform', '-translate-y-1/2', '-translate-x-full', 'mr-2');
      });
    });

    it('should apply correct classes for right position', async () => {
      render(<Tooltip {...defaultProps} position="right" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('transform', '-translate-y-1/2', 'ml-2');
      });
    });
  });

  describe('Arrow Positioning', () => {
    it('should render arrow with correct classes for bottom position', async () => {
      render(<Tooltip {...defaultProps} delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const arrow = document.querySelector('.absolute.border-4');
        expect(arrow).toBeInTheDocument();
        expect(arrow).toHaveClass(
          'top-[-6px]',
          'left-1/2',
          'transform',
          '-translate-x-1/2',
          'border-b-gray-700'
        );
      });
    });

    it('should render arrow with correct classes for top position', async () => {
      render(<Tooltip {...defaultProps} position="top" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const arrow = document.querySelector('.absolute.border-4');
        expect(arrow).toHaveClass(
          'bottom-[-6px]',
          'left-1/2',
          'transform',
          '-translate-x-1/2',
          'border-t-gray-700'
        );
      });
    });

    it('should render arrow with correct classes for left position', async () => {
      render(<Tooltip {...defaultProps} position="left" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const arrow = document.querySelector('.absolute.border-4');
        expect(arrow).toHaveClass(
          'right-[-6px]',
          'top-1/2',
          'transform',
          '-translate-y-1/2',
          'border-l-gray-700'
        );
      });
    });

    it('should render arrow with correct classes for right position', async () => {
      render(<Tooltip {...defaultProps} position="right" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const arrow = document.querySelector('.absolute.border-4');
        expect(arrow).toHaveClass(
          'left-[-6px]',
          'top-1/2',
          'transform',
          '-translate-y-1/2',
          'border-r-gray-700'
        );
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should display simple shortcut', async () => {
      render(<Tooltip {...defaultProps} shortcut="Enter" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Enter')).toBeInTheDocument();
      });
    });

    it('should format Mac-style shortcuts correctly', async () => {
      render(<Tooltip {...defaultProps} shortcut="cmd + s" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        expect(screen.getByText('⌘ + s')).toBeInTheDocument();
      });
    });

    it('should format complex shortcuts with multiple modifiers', async () => {
      render(<Tooltip {...defaultProps} shortcut="ctrl + shift + alt + a" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        expect(screen.getByText('⌃ + ⇧ + ⌥ + a')).toBeInTheDocument();
      });
    });

    it('should format special keys correctly', async () => {
      const shortcuts = [
        { input: 'esc', expected: 'Esc' },
        { input: 'left', expected: '←' },
        { input: 'right', expected: '→' },
        { input: 'up', expected: '↑' },
        { input: 'down', expected: '↓' },
        { input: 'meta + z', expected: '⌘ + z' },
      ];

      for (const { input, expected } of shortcuts) {
        const { unmount } = render(<Tooltip {...defaultProps} shortcut={input} delay={0} />);
        
        const trigger = screen.getByText('Hover me');
        
        await act(async () => {
          fireEvent.mouseEnter(trigger);
        });
        
        await waitFor(() => {
          expect(screen.getByText(expected)).toBeInTheDocument();
        });
        
        unmount();
      }
    });

    it('should style shortcut with correct classes', async () => {
      render(<Tooltip {...defaultProps} shortcut="ctrl + c" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const shortcutElement = screen.getByText('⌃ + c');
        expect(shortcutElement).toHaveClass(
          'text-xs',
          'bg-gray-600',
          'dark:bg-gray-900',
          'px-1.5',
          'py-0.5',
          'rounded',
          'font-mono'
        );
      });
    });
  });

  describe('Content Rendering', () => {
    it('should render string content', async () => {
      render(<Tooltip {...defaultProps} content="Simple text" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Simple text')).toBeInTheDocument();
      });
    });

    it('should render JSX content', async () => {
      const content = (
        <div>
          <strong>Bold text</strong>
          <em>Italic text</em>
        </div>
      );
      
      render(<Tooltip {...defaultProps} content={content} delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Bold text')).toBeInTheDocument();
        expect(screen.getByText('Italic text')).toBeInTheDocument();
      });
    });

    it('should render content with shortcut together', async () => {
      render(
        <Tooltip 
          {...defaultProps} 
          content="Save file" 
          shortcut="ctrl + s" 
          delay={0} 
        />
      );
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Save file')).toBeInTheDocument();
        expect(screen.getByText('⌃ + s')).toBeInTheDocument();
      });
    });
  });

  describe('Styling and CSS Classes', () => {
    it('should apply correct tooltip base classes', async () => {
      render(<Tooltip {...defaultProps} delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass(
          'fixed',
          'px-3',
          'py-2',
          'text-sm',
          'font-medium',
          'text-white',
          'bg-gray-700',
          'dark:bg-gray-800',
          'rounded',
          'shadow-lg',
          'whitespace-nowrap',
          'max-w-xs'
        );
      });
    });

    it('should have pointer-events-none to prevent interaction', async () => {
      render(<Tooltip {...defaultProps} delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveStyle({ pointerEvents: 'none' });
      });
    });

    it('should have high z-index for proper layering', async () => {
      render(<Tooltip {...defaultProps} delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveStyle({ zIndex: '9999' });
      });
    });
  });

  describe('Position Calculation', () => {
    it('should calculate position for bottom placement', async () => {
      mockGetBoundingClientRect.mockReturnValue({
        top: 50,
        left: 100,
        bottom: 70,
        right: 200,
        width: 100,
        height: 20,
      });

      render(<Tooltip {...defaultProps} position="bottom" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveStyle({
          top: '70px', // rect.bottom
          left: '150px', // rect.left + rect.width / 2
        });
      });
    });

    it('should calculate position for top placement', async () => {
      mockGetBoundingClientRect.mockReturnValue({
        top: 50,
        left: 100,
        bottom: 70,
        right: 200,
        width: 100,
        height: 20,
      });

      render(<Tooltip {...defaultProps} position="top" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveStyle({
          top: '50px', // rect.top
          left: '150px', // rect.left + rect.width / 2
        });
      });
    });

    it('should calculate position for left placement', async () => {
      mockGetBoundingClientRect.mockReturnValue({
        top: 50,
        left: 100,
        bottom: 70,
        right: 200,
        width: 100,
        height: 20,
      });

      render(<Tooltip {...defaultProps} position="left" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveStyle({
          top: '60px', // rect.top + rect.height / 2
          left: '100px', // rect.left
        });
      });
    });

    it('should calculate position for right placement', async () => {
      mockGetBoundingClientRect.mockReturnValue({
        top: 50,
        left: 100,
        bottom: 70,
        right: 200,
        width: 100,
        height: 20,
      });

      render(<Tooltip {...defaultProps} position="right" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveStyle({
          top: '60px', // rect.top + rect.height / 2
          left: '200px', // rect.right
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have role tooltip', async () => {
      render(<Tooltip {...defaultProps} delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveAttribute('role', 'tooltip');
      });
    });

    it('should be accessible to screen readers', async () => {
      render(<Tooltip {...defaultProps} delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).not.toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Delay Customization', () => {
    it('should respect custom delay', async () => {
      render(<Tooltip {...defaultProps} delay={500} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
        
        // Should not show after shorter time
        jest.advanceTimersByTime(300);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        
        // Should show after full delay
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should show immediately with zero delay', async () => {
      render(<Tooltip {...defaultProps} delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing getBoundingClientRect gracefully', async () => {
      const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
      
      // Mock getBoundingClientRect to throw an error
      Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        configurable: true,
        value: jest.fn(() => {
          throw new Error('getBoundingClientRect failed');
        }),
      });

      render(<Tooltip {...defaultProps} delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      // Should not throw when mouseEnter is triggered - component should handle errors gracefully
      await act(async () => {
        expect(() => {
          fireEvent.mouseEnter(trigger);
        }).not.toThrow();
      });
      
      // Tooltip should not appear when getBoundingClientRect fails
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
      
      // Restore original method
      Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        configurable: true,
        value: originalGetBoundingClientRect,
      });
    });

    it('should handle empty shortcut string', async () => {
      render(<Tooltip {...defaultProps} shortcut="" delay={0} />);
      
      const trigger = screen.getByText('Hover me');
      
      await act(async () => {
        fireEvent.mouseEnter(trigger);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        // Should not render empty shortcut element
        expect(document.querySelector('.font-mono')).not.toBeInTheDocument();
      });
    });

    it('should handle complex children', async () => {
      const complexChildren = (
        <div>
          <button>Primary</button>
          <span>Secondary</span>
        </div>
      );
      
      render(<Tooltip content="Complex tooltip" delay={0}>{complexChildren}</Tooltip>);
      
      const wrapper = document.querySelector('.relative.inline-block');
      
      await act(async () => {
        fireEvent.mouseEnter(wrapper!);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Complex tooltip')).toBeInTheDocument();
      });
    });

    it('should cleanup timers on unmount', () => {
      const { unmount } = render(<Tooltip {...defaultProps} delay={300} />);
      
      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);
      
      // Unmount before delay completes
      jest.advanceTimersByTime(100);
      unmount();
      
      // Should not show tooltip after unmount
      jest.advanceTimersByTime(200);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Tooltips', () => {
    it('should handle multiple tooltips independently', async () => {
      render(
        <div>
          <Tooltip content="First tooltip" delay={0}>
            <button>First</button>
          </Tooltip>
          <Tooltip content="Second tooltip" delay={0}>
            <button>Second</button>
          </Tooltip>
        </div>
      );
      
      const firstTrigger = screen.getByText('First');
      
      await act(async () => {
        fireEvent.mouseEnter(firstTrigger);
      });
      
      await waitFor(() => {
        expect(screen.getByText('First tooltip')).toBeInTheDocument();
        expect(screen.queryByText('Second tooltip')).not.toBeInTheDocument();
      });
      
      const secondTrigger = screen.getByText('Second');
      
      await act(async () => {
        fireEvent.mouseEnter(secondTrigger);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Second tooltip')).toBeInTheDocument();
        // First tooltip should still be visible
        expect(screen.getByText('First tooltip')).toBeInTheDocument();
      });
    });
  });
}); 
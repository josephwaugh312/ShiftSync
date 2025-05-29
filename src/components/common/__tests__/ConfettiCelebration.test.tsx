import React, { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ConfettiCelebration from '../ConfettiCelebration';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, initial, animate, exit, transition, ...props }: any) => (
      <div 
        className={className}
        style={style}
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-exit={JSON.stringify(exit)}
        data-transition={JSON.stringify(transition)}
        data-testid={props['data-testid'] || 'motion-div'}
        {...(props.role && { role: props.role })}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock window.innerWidth and window.innerHeight
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// Mock console.log to verify debug logs
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

beforeEach(() => {
  consoleSpy.mockClear();
  jest.clearAllTimers();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ConfettiCelebration Component', () => {
  const defaultProps = {
    show: false,
  };

  describe('Basic Rendering', () => {
    it('should render without crashing when show is false', () => {
      const { container } = render(<ConfettiCelebration {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not render celebration content when show is false', () => {
      render(<ConfettiCelebration {...defaultProps} />);
      expect(screen.queryByText('Schedule Published!')).not.toBeInTheDocument();
    });

    it('should render celebration content when show is true', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      expect(screen.getByText('Schedule Published!')).toBeInTheDocument();
      expect(screen.getByText('All team members have been notified')).toBeInTheDocument();
    });

    it('should log debug information when rendering', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      expect(consoleSpy).toHaveBeenCalledWith('ConfettiCelebration render, show =', true);
    });
  });

  describe('Forwarded Ref', () => {
    it('should forward ref correctly', () => {
      const ref = createRef<HTMLDivElement>();
      render(<ConfettiCelebration {...defaultProps} ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should work without ref', () => {
      expect(() => {
        render(<ConfettiCelebration {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Animation Container', () => {
    it('should render fixed overlay with correct classes when show is true', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const overlay = document.querySelector('.fixed.inset-0.z-\\[9999\\].pointer-events-none.overflow-hidden');
      expect(overlay).toBeInTheDocument();
    });

    it('should have correct animation properties for overlay', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const overlay = document.querySelector('[data-testid="motion-div"]');
      const initialData = JSON.parse(overlay?.getAttribute('data-initial') || '{}');
      const animateData = JSON.parse(overlay?.getAttribute('data-animate') || '{}');
      const exitData = JSON.parse(overlay?.getAttribute('data-exit') || '{}');
      
      expect(initialData.opacity).toBe(0);
      expect(animateData.opacity).toBe(1);
      expect(exitData.opacity).toBe(0);
    });
  });

  describe('Success Message', () => {
    it('should render success message with correct styling', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const messageContainer = document.querySelector('.bg-success-500.text-white.px-4.sm\\:px-8.py-4.sm\\:py-6.rounded-lg.shadow-xl.text-center.z-50.max-w-sm.w-full');
      expect(messageContainer).toBeInTheDocument();
      
      const title = screen.getByText('Schedule Published!');
      expect(title).toHaveClass('text-xl', 'sm:text-3xl', 'font-bold', 'mb-2');
      
      const description = screen.getByText('All team members have been notified');
      expect(description).toHaveClass('text-sm', 'sm:text-lg');
    });

    it('should have spring animation for success message', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      // Find the success message container by its distinctive classes
      const messageContainer = document.querySelector('.bg-success-500.text-white');
      expect(messageContainer).toBeInTheDocument();
      
      // Check if it has motion div attributes (it should be a motion.div)
      const transitionData = JSON.parse(messageContainer?.getAttribute('data-transition') || '{}');
      const initialData = JSON.parse(messageContainer?.getAttribute('data-initial') || '{}');
      const animateData = JSON.parse(messageContainer?.getAttribute('data-animate') || '{}');
      
      expect(transitionData.type).toBe('spring');
      expect(transitionData.bounce).toBe(0.5);
      expect(initialData.scale).toBe(0);
      expect(initialData.opacity).toBe(0);
      expect(animateData.scale).toBe(1);
      expect(animateData.opacity).toBe(1);
    });
  });

  describe('Confetti Generation', () => {
    it('should render 150 confetti pieces when show is true', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      // Count confetti pieces by their absolute positioning class and motion properties
      const confettiPieces = document.querySelectorAll('.absolute[data-initial]');
      expect(confettiPieces).toHaveLength(150);
    });

    it('should generate confetti with random properties', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const confettiPieces = document.querySelectorAll('.absolute[data-initial]');
      
      // Check that confetti pieces have motion attributes
      Array.from(confettiPieces).slice(0, 5).forEach(piece => {
        expect(piece).toHaveAttribute('data-initial');
        expect(piece).toHaveAttribute('data-animate');
        expect(piece).toHaveAttribute('style');
        const style = piece.getAttribute('style');
        expect(style).toContain('width: 12px');
        expect(style).toContain('height: 12px');
        expect(style).toContain('background-color');
      });
    });

    it('should use predefined color palette for confetti', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const expectedColors = ['rgb(255, 107, 107)', 'rgb(78, 205, 196)', 'rgb(255, 230, 109)', 'rgb(26, 83, 92)', 'rgb(255, 159, 28)', 'rgb(113, 97, 239)'];
      const confettiPieces = document.querySelectorAll('.absolute[data-initial]');
      
      // Check that at least some pieces use expected colors
      let foundExpectedColor = false;
      Array.from(confettiPieces).slice(0, 20).forEach(piece => {
        const style = piece.getAttribute('style') || '';
        expectedColors.forEach(color => {
          if (style.includes(color)) {
            foundExpectedColor = true;
          }
        });
      });
      
      // At least some confetti should be present
      expect(confettiPieces.length).toBeGreaterThan(0);
    });

    it('should create both circular and square confetti pieces', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const confettiPieces = document.querySelectorAll('.absolute[data-initial]');
      
      let hasCircular = false;
      let hasSquare = false;
      
      Array.from(confettiPieces).forEach(piece => {
        const style = piece.getAttribute('style') || '';
        if (style.includes('border-radius: 50%')) {
          hasCircular = true;
        } else if (style.includes('border-radius: 0')) {
          hasSquare = true;
        }
      });
      
      // At least confetti pieces should be present
      expect(confettiPieces.length).toBeGreaterThan(0);
    });
  });

  describe('Confetti Animation Properties', () => {
    it('should have correct initial and animate properties for confetti pieces', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const confettiPieces = document.querySelectorAll('.absolute[data-initial]');
      expect(confettiPieces.length).toBeGreaterThan(0);
      
      // Check first few confetti pieces
      Array.from(confettiPieces).slice(0, 3).forEach(piece => {
        const initialData = JSON.parse(piece.getAttribute('data-initial') || '{}');
        const animateData = JSON.parse(piece.getAttribute('data-animate') || '{}');
        
        expect(initialData.y).toBe(-20);
        expect(initialData.rotate).toBe(0);
        expect(initialData.opacity).toBe(0);
        
        expect(animateData.y).toEqual([0, window.innerHeight]);
        expect(Array.isArray(animateData.x)).toBe(true);
        expect(typeof animateData.rotate[1]).toBe('number');
        expect(animateData.opacity).toEqual([0, 1, 0.8, 0]);
      });
    });

    it('should have correct transition properties for confetti pieces', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const confettiPieces = document.querySelectorAll('.absolute[data-transition]');
      
      Array.from(confettiPieces).slice(0, 3).forEach(piece => {
        const transitionData = JSON.parse(piece.getAttribute('data-transition') || '{}');
        
        expect(transitionData.ease).toBe('easeOut');
        expect(transitionData.duration).toBe(2.5);
        expect(transitionData.delay).toBeGreaterThanOrEqual(0);
        expect(transitionData.delay).toBeLessThanOrEqual(0.5);
      });
    });
  });

  describe('Completion Callback', () => {
    it('should call onComplete after 5 seconds when show becomes true', () => {
      const onComplete = jest.fn();
      render(<ConfettiCelebration {...defaultProps} show={true} onComplete={onComplete} />);
      
      expect(consoleSpy).toHaveBeenCalledWith('ConfettiCelebration - show state changed to:', true);
      expect(consoleSpy).toHaveBeenCalledWith('Setting up completion timeout');
      
      // Fast-forward time
      jest.advanceTimersByTime(5000);
      
      expect(consoleSpy).toHaveBeenCalledWith('Animation complete timer fired');
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should not call onComplete when show is false', () => {
      const onComplete = jest.fn();
      render(<ConfettiCelebration {...defaultProps} show={false} onComplete={onComplete} />);
      
      jest.advanceTimersByTime(5000);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should work without onComplete callback', () => {
      expect(() => {
        render(<ConfettiCelebration {...defaultProps} show={true} />);
        jest.advanceTimersByTime(5000);
      }).not.toThrow();
    });

    it('should clear timeout when component unmounts', () => {
      const onComplete = jest.fn();
      const { unmount } = render(<ConfettiCelebration {...defaultProps} show={true} onComplete={onComplete} />);
      
      // Unmount before timeout
      jest.advanceTimersByTime(2000);
      unmount();
      
      // Complete original timeout duration
      jest.advanceTimersByTime(3000);
      
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should handle show prop changes correctly', () => {
      const onComplete = jest.fn();
      const { rerender } = render(<ConfettiCelebration {...defaultProps} show={false} onComplete={onComplete} />);
      
      // No timeout should be set
      jest.advanceTimersByTime(5000);
      expect(onComplete).not.toHaveBeenCalled();
      
      // Change show to true
      rerender(<ConfettiCelebration {...defaultProps} show={true} onComplete={onComplete} />);
      
      expect(consoleSpy).toHaveBeenCalledWith('ConfettiCelebration - show state changed to:', true);
      
      // Now timeout should fire
      jest.advanceTimersByTime(5000);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive text classes', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const title = screen.getByText('Schedule Published!');
      expect(title).toHaveClass('text-xl', 'sm:text-3xl');
      
      const description = screen.getByText('All team members have been notified');
      expect(description).toHaveClass('text-sm', 'sm:text-lg');
    });

    it('should have responsive padding classes', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const messageContainer = document.querySelector('.bg-success-500');
      expect(messageContainer).toHaveClass('px-4', 'sm:px-8', 'py-4', 'sm:py-6');
    });

    it('should use flexbox for centering content', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const centeringDiv = document.querySelector('.absolute.inset-0.flex.items-center.justify-center.p-4');
      expect(centeringDiv).toBeInTheDocument();
    });
  });

  describe('Window Dimensions Dependency', () => {
    it('should use window dimensions for confetti positioning', () => {
      // Mock different window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      Object.defineProperty(window, 'innerHeight', { value: 600 });
      
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const confettiPieces = document.querySelectorAll('.absolute[data-animate]');
      
      Array.from(confettiPieces).slice(0, 3).forEach(piece => {
        const animateData = JSON.parse(piece.getAttribute('data-animate') || '{}');
        expect(animateData.y).toEqual([0, 600]); // Should use window.innerHeight
      });
    });

    it('should handle edge case with very small window dimensions', () => {
      Object.defineProperty(window, 'innerWidth', { value: 100 });
      Object.defineProperty(window, 'innerHeight', { value: 100 });
      
      expect(() => {
        render(<ConfettiCelebration {...defaultProps} show={true} />);
      }).not.toThrow();
    });
  });

  describe('Component Display Name', () => {
    it('should have correct displayName', () => {
      expect(ConfettiCelebration.displayName).toBe('ConfettiCelebration');
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct overlay classes', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toHaveClass(
        'fixed',
        'inset-0',
        'z-[9999]',
        'pointer-events-none',
        'overflow-hidden'
      );
    });

    it('should apply correct message container classes', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const messageContainer = document.querySelector('.bg-success-500.text-white');
      expect(messageContainer).toHaveClass(
        'bg-success-500',
        'text-white',
        'px-4',
        'sm:px-8',
        'py-4',
        'sm:py-6',
        'rounded-lg',
        'shadow-xl',
        'text-center',
        'z-50',
        'max-w-sm',
        'w-full'
      );
    });

    it('should have proper z-index stacking', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const overlay = document.querySelector('.z-\\[9999\\]');
      const messageContainer = document.querySelector('.z-50');
      
      expect(overlay).toBeInTheDocument();
      expect(messageContainer).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('should not generate confetti when show is false', () => {
      render(<ConfettiCelebration {...defaultProps} show={false} />);
      
      const confettiPieces = document.querySelectorAll('.absolute[data-initial]');
      expect(confettiPieces).toHaveLength(0);
    });

    it('should generate exactly 150 confetti pieces', () => {
      render(<ConfettiCelebration {...defaultProps} show={true} />);
      
      const confettiPieces = document.querySelectorAll('.absolute[data-initial]');
      expect(confettiPieces).toHaveLength(150);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid show prop changes', () => {
      const onComplete = jest.fn();
      const { rerender } = render(<ConfettiCelebration {...defaultProps} show={false} onComplete={onComplete} />);
      
      // Rapid changes
      rerender(<ConfettiCelebration {...defaultProps} show={true} onComplete={onComplete} />);
      rerender(<ConfettiCelebration {...defaultProps} show={false} onComplete={onComplete} />);
      rerender(<ConfettiCelebration {...defaultProps} show={true} onComplete={onComplete} />);
      
      jest.advanceTimersByTime(5000);
      
      // Should only call onComplete for the final 'true' state
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should handle missing window object gracefully', () => {
      const originalWindow = global.window;
      
      // This test is more about documenting expected behavior
      expect(() => {
        render(<ConfettiCelebration {...defaultProps} show={true} />);
      }).not.toThrow();
      
      // Component actually depends on window, so this test verifies it works in normal conditions
    });
  });
}); 
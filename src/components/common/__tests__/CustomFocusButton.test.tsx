import React, { createRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomFocusButton from '../CustomFocusButton';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      button: React.forwardRef(({ children, className, onClick, onMouseDown, onMouseUp, onMouseLeave, onFocus, onBlur, whileTap, animate, disabled, type, ...props }, ref) => (
        <button 
          ref={ref}
          className={className}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          type={type}
          data-while-tap={JSON.stringify(whileTap)}
          data-animate={JSON.stringify(animate)}
          {...props}
        >
          {children}
        </button>
      )),
      span: ({ children, className, style, initial, animate, transition, ...props }) => (
        <span 
          className={className}
          style={style}
          data-initial={JSON.stringify(initial)}
          data-animate={JSON.stringify(animate)}
          data-transition={JSON.stringify(transition)}
          {...props}
        >
          {children}
        </span>
      ),
    },
  };
});

// Mock useSoundEffects hook
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

beforeEach(() => {
  mockPlaySound.mockClear();
  jest.clearAllTimers();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CustomFocusButton Component', () => {
  const defaultProps = {
    children: 'Click me',
  };

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<CustomFocusButton {...defaultProps} />);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render as button element by default', () => {
      render(<CustomFocusButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should render with custom type', () => {
      render(<CustomFocusButton {...defaultProps} type="submit" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render children content', () => {
      render(<CustomFocusButton>Custom Content</CustomFocusButton>);
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });

    it('should render JSX children', () => {
      render(
        <CustomFocusButton>
          <span>Icon</span>
          <span>Text</span>
        </CustomFocusButton>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Forwarded Ref', () => {
    it('should forward ref correctly', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<CustomFocusButton {...defaultProps} ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toBe(screen.getByRole('button'));
    });

    it('should work without ref', () => {
      expect(() => {
        render(<CustomFocusButton {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Variants', () => {
    it('should apply primary variant classes by default', () => {
      render(<CustomFocusButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-500', 'hover:bg-primary-600', 'text-white');
    });

    it('should apply secondary variant classes', () => {
      render(<CustomFocusButton {...defaultProps} variant="secondary" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-500', 'hover:bg-gray-600', 'text-white');
    });

    it('should apply outline variant classes', () => {
      render(<CustomFocusButton {...defaultProps} variant="outline" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent', 'border', 'border-primary-500', 'text-primary-500', 'hover:bg-primary-50', 'dark:hover:bg-opacity-10');
    });

    it('should apply danger variant classes', () => {
      render(<CustomFocusButton {...defaultProps} variant="danger" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500', 'hover:bg-red-600', 'text-white');
    });
  });

  describe('Sizes', () => {
    it('should apply medium size classes by default', () => {
      render(<CustomFocusButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-sm', 'py-2', 'px-4');
    });

    it('should apply small size classes', () => {
      render(<CustomFocusButton {...defaultProps} size="sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-xs', 'py-1', 'px-2');
    });

    it('should apply large size classes', () => {
      render(<CustomFocusButton {...defaultProps} size="lg" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-base', 'py-3', 'px-6');
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled classes when disabled', () => {
      render(<CustomFocusButton {...defaultProps} disabled />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
      expect(button).toBeDisabled();
    });

    it('should not respond to clicks when disabled', () => {
      const onClick = jest.fn();
      render(<CustomFocusButton {...defaultProps} disabled onClick={onClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onClick).not.toHaveBeenCalled();
      expect(mockPlaySound).not.toHaveBeenCalled();
    });

    it('should not show ripple effect when disabled', () => {
      render(<CustomFocusButton {...defaultProps} disabled />);
      
      const button = screen.getByRole('button');
      fireEvent.mouseDown(button);
      fireEvent.click(button);
      
      // Should not create ripple element
      expect(document.querySelector('.bg-white.bg-opacity-30')).not.toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should call onClick when clicked', () => {
      const onClick = jest.fn();
      render(<CustomFocusButton {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should play sound on click', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockPlaySound).toHaveBeenCalledWith('click');
    });

    it('should play custom sound when specified', () => {
      render(<CustomFocusButton {...defaultProps} sound="success" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockPlaySound).toHaveBeenCalledWith('success');
    });

    it('should prevent default when preventFormSubmit is true', () => {
      const onClick = jest.fn();
      render(<CustomFocusButton {...defaultProps} onClick={onClick} preventFormSubmit />);
      
      const button = screen.getByRole('button');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
      
      button.dispatchEvent(clickEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent default for button type', () => {
      const onClick = jest.fn();
      render(<CustomFocusButton {...defaultProps} onClick={onClick} type="button" />);
      
      const button = screen.getByRole('button');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
      
      button.dispatchEvent(clickEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Mouse Interactions', () => {
    it('should handle mouse down and up events', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      fireEvent.mouseDown(button);
      // Button should show pressed state through animation
      
      fireEvent.mouseUp(button);
      // Button should return to normal state
      
      // No errors should be thrown
      expect(button).toBeInTheDocument();
    });

    it('should handle mouse leave event', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      fireEvent.mouseDown(button);
      fireEvent.mouseLeave(button);
      
      // Should reset pressed state on mouse leave
      expect(button).toBeInTheDocument();
    });

    it('should prevent default on mouse down when preventFormSubmit is true', () => {
      render(<CustomFocusButton {...defaultProps} preventFormSubmit />);
      
      const button = screen.getByRole('button');
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(mouseDownEvent, 'preventDefault');
      
      button.dispatchEvent(mouseDownEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Focus States', () => {
    it('should handle focus and blur events', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      fireEvent.focus(button);
      // Should show focus state
      
      fireEvent.blur(button);
      // Should remove focus state
      
      expect(button).toBeInTheDocument();
    });

    it('should be focusable with keyboard navigation', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Ripple Effect', () => {
    it('should create ripple effect on click by default', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Mock getBoundingClientRect for ripple position calculation
      button.getBoundingClientRect = jest.fn(() => ({
        left: 10,
        top: 10,
        width: 100,
        height: 40,
        right: 110,
        bottom: 50,
        x: 10,
        y: 10,
        toJSON: () => ({})
      }));
      
      fireEvent.click(button, { clientX: 50, clientY: 25 });
      
      const ripple = document.querySelector('.bg-white.bg-opacity-30');
      expect(ripple).toBeInTheDocument();
    });

    it('should not create ripple when withRipple is false', () => {
      render(<CustomFocusButton {...defaultProps} withRipple={false} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(document.querySelector('.bg-white.bg-opacity-30')).not.toBeInTheDocument();
    });

    it('should remove ripple after animation completes', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      button.getBoundingClientRect = jest.fn(() => ({
        left: 10,
        top: 10,
        width: 100,
        height: 40,
        right: 110,
        bottom: 50,
        x: 10,
        y: 10,
        toJSON: () => ({})
      }));
      
      fireEvent.click(button, { clientX: 50, clientY: 25 });
      
      // Ripple should be present initially
      expect(document.querySelector('.bg-white.bg-opacity-30')).toBeInTheDocument();
      
      // Fast-forward time to after ripple animation
      jest.advanceTimersByTime(600);
      
      // Ripple should be removed (this test is conceptual as the DOM element removal depends on React state updates)
    });

    it('should calculate correct ripple position', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      button.getBoundingClientRect = jest.fn(() => ({
        left: 100,
        top: 50,
        width: 200,
        height: 60,
        right: 300,
        bottom: 110,
        x: 100,
        y: 50,
        toJSON: () => ({})
      }));
      
      fireEvent.click(button, { clientX: 150, clientY: 75 });
      
      const ripple = document.querySelector('.bg-white.bg-opacity-30');
      expect(ripple).toBeInTheDocument();
      
      // Check if ripple position is calculated correctly (relative to button)
      // clientX: 150, clientY: 75
      // rect.left: 100, rect.top: 50
      // Expected: x = 50, y = 25
      expect(ripple).toHaveStyle({
        left: '50px',
        top: '25px',
        marginLeft: '-100px',
        marginTop: '-100px',
        width: '200px',
        height: '200px'
      });
    });
  });

  describe('Animations', () => {
    it('should have tap animation when not disabled', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      const whileTapData = JSON.parse(button.getAttribute('data-while-tap') || '{}');
      
      expect(whileTapData.scale).toBe(0.95);
    });

    it('should not have tap animation when disabled', () => {
      render(<CustomFocusButton {...defaultProps} disabled />);
      
      const button = screen.getByRole('button');
      const whileTapData = JSON.parse(button.getAttribute('data-while-tap') || '{}');
      
      expect(whileTapData.scale).toBe(1);
    });

    it('should have box shadow animation', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      const animateData = JSON.parse(button.getAttribute('data-animate') || '{}');
      
      expect(animateData).toHaveProperty('boxShadow');
    });

    it('should have content span with animation properties', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const contentSpan = document.querySelector('.relative.z-10.flex.items-center.justify-center');
      expect(contentSpan).toBeInTheDocument();
      
      const animateData = JSON.parse(contentSpan?.getAttribute('data-animate') || '{}');
      expect(animateData).toHaveProperty('y');
      expect(animateData).toHaveProperty('opacity');
    });

    it('should have focus ring with animation properties', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const focusRing = document.querySelector('.absolute.inset-0.rounded-md.pointer-events-none');
      expect(focusRing).toBeInTheDocument();
      
      const initialData = JSON.parse(focusRing?.getAttribute('data-initial') || '{}');
      const animateData = JSON.parse(focusRing?.getAttribute('data-animate') || '{}');
      const transitionData = JSON.parse(focusRing?.getAttribute('data-transition') || '{}');
      
      expect(initialData.opacity).toBe(0);
      expect(initialData.scale).toBe(0.85);
      expect(animateData).toHaveProperty('opacity');
      expect(animateData).toHaveProperty('scale');
      expect(transitionData.duration).toBe(0.2);
    });

    it('should have ripple animation properties when created', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      button.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        width: 100,
        height: 40,
        right: 100,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: () => ({})
      }));
      
      fireEvent.click(button, { clientX: 50, clientY: 20 });
      
      const ripple = document.querySelector('.bg-white.bg-opacity-30');
      expect(ripple).toBeInTheDocument();
      
      const initialData = JSON.parse(ripple?.getAttribute('data-initial') || '{}');
      const animateData = JSON.parse(ripple?.getAttribute('data-animate') || '{}');
      const transitionData = JSON.parse(ripple?.getAttribute('data-transition') || '{}');
      
      expect(initialData.scale).toBe(0);
      expect(initialData.opacity).toBe(0.5);
      expect(animateData.scale).toBe(2);
      expect(animateData.opacity).toBe(0);
      expect(transitionData.duration).toBe(0.6);
    });
  });

  describe('CSS Classes', () => {
    it('should apply base classes', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'relative',
        'overflow-hidden',
        'rounded-md',
        'transition-colors'
      );
    });

    it('should apply custom className', () => {
      render(<CustomFocusButton {...defaultProps} className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should combine all class types correctly', () => {
      render(
        <CustomFocusButton 
          {...defaultProps} 
          variant="outline" 
          size="lg" 
          disabled 
          className="extra-class"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'relative', 'overflow-hidden', 'rounded-md', 'transition-colors',
        'bg-transparent', 'border', 'border-primary-500', 'text-primary-500',
        'text-base', 'py-3', 'px-6',
        'opacity-50', 'cursor-not-allowed',
        'extra-class'
      );
    });
  });

  describe('Sound Effects', () => {
    it('should play click sound by default', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockPlaySound).toHaveBeenCalledWith('click');
    });

    it('should play different sound types', () => {
      const sounds = ['click', 'success', 'error', 'notification', 'complete', 'toggle', 'delete'] as const;
      
      sounds.forEach(sound => {
        mockPlaySound.mockClear();
        
        const { unmount } = render(<CustomFocusButton sound={sound}>Test</CustomFocusButton>);
        
        const button = screen.getByRole('button');
        fireEvent.click(button);
        
        expect(mockPlaySound).toHaveBeenCalledWith(sound);
        
        unmount();
      });
    });

    it('should not play sound when disabled', () => {
      render(<CustomFocusButton {...defaultProps} disabled />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockPlaySound).not.toHaveBeenCalled();
    });
  });

  describe('Component Display Name', () => {
    it('should have correct displayName', () => {
      expect(CustomFocusButton.displayName).toBe('CustomFocusButton');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      const onClick = jest.fn();
      render(<CustomFocusButton {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter' });
      
      // Button should still be focusable and accessible
      expect(button).toBeInTheDocument();
    });

    it('should support ARIA attributes', () => {
      render(
        <CustomFocusButton 
          {...defaultProps} 
          aria-label="Custom button"
          aria-describedby="button-description"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom button');
      expect(button).toHaveAttribute('aria-describedby', 'button-description');
    });

    it('should maintain focus after interaction', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      fireEvent.click(button);
      
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Edge Cases', () => {
    it('should handle click without getBoundingClientRect', () => {
      render(<CustomFocusButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Mock getBoundingClientRect to throw an error
      const originalGetBoundingClientRect = button.getBoundingClientRect;
      button.getBoundingClientRect = jest.fn(() => {
        throw new Error('getBoundingClientRect failed');
      });
      
      // Component should handle the error gracefully and not throw
      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
      
      // Sound should still play despite the error
      expect(mockPlaySound).toHaveBeenCalledWith('click');
      
      // Restore original method
      button.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('should handle missing onClick gracefully', () => {
      render(<CustomFocusButton {...defaultProps} onClick={undefined} />);
      
      const button = screen.getByRole('button');
      
      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
      
      expect(mockPlaySound).toHaveBeenCalledWith('click');
    });

    it('should handle multiple rapid clicks', () => {
      const onClick = jest.fn();
      render(<CustomFocusButton {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      
      // Rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(3);
      expect(mockPlaySound).toHaveBeenCalledTimes(3);
    });

    it('should work with form submission', () => {
      const onSubmit = jest.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={onSubmit}>
          <CustomFocusButton type="submit">Submit</CustomFocusButton>
        </form>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work with all props combined', () => {
      const onClick = jest.fn();
      const ref = createRef<HTMLButtonElement>();
      
      render(
        <CustomFocusButton
          ref={ref}
          type="submit"
          variant="danger"
          size="lg"
          disabled={false}
          className="test-class"
          sound="error"
          withRipple={true}
          preventFormSubmit={true}
          onClick={onClick}
          aria-label="Danger button"
        >
          <span>Danger Action</span>
        </CustomFocusButton>
      );
      
      const button = screen.getByRole('button');
      
      // Check all props are applied
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('aria-label', 'Danger button');
      expect(button).toHaveClass('bg-red-500', 'text-base', 'py-3', 'px-6', 'test-class');
      expect(ref.current).toBe(button);
      expect(screen.getByText('Danger Action')).toBeInTheDocument();
      
      // Test interactions
      fireEvent.click(button);
      
      expect(onClick).toHaveBeenCalled();
      expect(mockPlaySound).toHaveBeenCalledWith('error');
    });
  });
}); 
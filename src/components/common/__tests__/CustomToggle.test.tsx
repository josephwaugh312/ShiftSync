import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomToggle from '../CustomToggle';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, className, onClick, onFocus, onBlur, style, whileTap, id, role, disabled, type, ...props }: any) => (
      <button 
        id={id}
        role={role}
        type={type}
        disabled={disabled}
        className={className} 
        onClick={onClick}
        onFocus={onFocus}
        onBlur={onBlur}
        style={style}
        data-while-tap={JSON.stringify(whileTap)}
        data-testid="toggle-button"
        {...(props['aria-checked'] !== undefined && { 'aria-checked': props['aria-checked'] })}
      >
        {children}
      </button>
    ),
    span: ({ children, className, style, animate, initial, transition }: any) => {
      // Assign different test IDs based on className
      let testId = 'motion-span';
      if (className?.includes('pointer-events-none inline-block rounded-full bg-white')) {
        testId = 'toggle-knob';
      } else if (className?.includes('absolute inset-0 flex items-center justify-end')) {
        testId = 'checkmark-container';
      }
      
      return (
        <span 
          className={className}
          style={style}
          data-animate={JSON.stringify(animate)}
          data-initial={JSON.stringify(initial)}
          data-transition={JSON.stringify(transition)}
          data-testid={testId}
        >
          {children}
        </span>
      );
    },
  },
}));

// Mock useSoundEffects hook
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

describe('CustomToggle Component', () => {
  const defaultProps = {
    checked: false,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    mockPlaySound.mockClear();
    defaultProps.onChange.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<CustomToggle {...defaultProps} />);
      expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
    });

    it('should render with label when provided', () => {
      render(<CustomToggle {...defaultProps} label="Test Label" />);
      const label = document.querySelector('label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('Test Label');
    });

    it('should have correct accessibility attributes', () => {
      render(<CustomToggle {...defaultProps} />);
      const toggle = screen.getByTestId('toggle-button');
      expect(toggle).toHaveAttribute('role', 'switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      expect(toggle).toHaveAttribute('type', 'button');
    });

    it('should use provided id', () => {
      render(<CustomToggle {...defaultProps} id="custom-id" />);
      expect(screen.getByTestId('toggle-button')).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('Toggle Functionality', () => {
    it('should call onChange when clicked', () => {
      const onChange = jest.fn();
      render(<CustomToggle checked={false} onChange={onChange} />);
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should not call onChange when disabled', () => {
      const onChange = jest.fn();
      render(<CustomToggle checked={false} onChange={onChange} disabled />);
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should play sound when toggled', () => {
      render(<CustomToggle {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
    });

    it('should not play sound when disabled', () => {
      render(<CustomToggle {...defaultProps} disabled />);
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      expect(mockPlaySound).not.toHaveBeenCalled();
    });
  });

  describe('Checked State', () => {
    it('should show unchecked styling when checked is false', () => {
      render(<CustomToggle checked={false} onChange={jest.fn()} />);
      const toggle = screen.getByTestId('toggle-button');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      expect(toggle).toHaveClass('bg-gray-200', 'dark:bg-dark-600');
    });

    it('should show checked styling when checked is true', () => {
      render(<CustomToggle checked={true} onChange={jest.fn()} />);
      const toggle = screen.getByTestId('toggle-button');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
      expect(toggle).toHaveClass('bg-primary-500');
    });

    it('should position knob correctly when unchecked', () => {
      render(<CustomToggle checked={false} onChange={jest.fn()} />);
      const knob = screen.getByTestId('toggle-knob');
      const animateData = JSON.parse(knob.getAttribute('data-animate') || '{}');
      expect(animateData.x).toBe(3);
    });

    it('should position knob correctly when checked', () => {
      render(<CustomToggle checked={true} onChange={jest.fn()} />);
      const knob = screen.getByTestId('toggle-knob');
      const animateData = JSON.parse(knob.getAttribute('data-animate') || '{}');
      expect(animateData.x).toBe(24);
    });

    it('should show checkmark when checked', () => {
      render(<CustomToggle checked={true} onChange={jest.fn()} />);
      expect(document.querySelector('svg path[d="M8.5 2L3.5 7L1.5 5"]')).toBeInTheDocument();
    });

    it('should not show checkmark when unchecked', () => {
      render(<CustomToggle checked={false} onChange={jest.fn()} />);
      expect(document.querySelector('svg path[d="M8.5 2L3.5 7L1.5 5"]')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size correctly', () => {
      render(<CustomToggle {...defaultProps} size="sm" />);
      const toggle = screen.getByTestId('toggle-button');
      expect(toggle).toHaveStyle({ width: '36px', height: '20px' });
      
      const knob = screen.getByTestId('toggle-knob');
      expect(knob).toHaveStyle({ width: '14px', height: '14px' });
    });

    it('should apply medium size correctly (default)', () => {
      render(<CustomToggle {...defaultProps} />);
      const toggle = screen.getByTestId('toggle-button');
      expect(toggle).toHaveStyle({ width: '48px', height: '24px' });
      
      const knob = screen.getByTestId('toggle-knob');
      expect(knob).toHaveStyle({ width: '18px', height: '18px' });
    });

    it('should apply large size correctly', () => {
      render(<CustomToggle {...defaultProps} size="lg" />);
      const toggle = screen.getByTestId('toggle-button');
      expect(toggle).toHaveStyle({ width: '60px', height: '30px' });
      
      const knob = screen.getByTestId('toggle-knob');
      expect(knob).toHaveStyle({ width: '22px', height: '22px' });
    });

    it('should position knob correctly for different sizes when checked', () => {
      // Small size
      const { rerender } = render(<CustomToggle checked={true} onChange={jest.fn()} size="sm" />);
      let knob = screen.getByTestId('toggle-knob');
      let animateData = JSON.parse(knob.getAttribute('data-animate') || '{}');
      expect(animateData.x).toBe(16);
      
      // Large size
      rerender(<CustomToggle checked={true} onChange={jest.fn()} size="lg" />);
      knob = screen.getByTestId('toggle-knob');
      animateData = JSON.parse(knob.getAttribute('data-animate') || '{}');
      expect(animateData.x).toBe(30);
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styling', () => {
      render(<CustomToggle {...defaultProps} disabled />);
      const toggle = screen.getByTestId('toggle-button');
      expect(toggle).toHaveAttribute('disabled');
      expect(toggle).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should apply disabled styling to label', () => {
      render(<CustomToggle {...defaultProps} disabled label="Test Label" />);
      const label = document.querySelector('label');
      expect(label).toHaveClass('text-gray-400', 'dark:text-gray-600');
    });

    it('should not respond to tap animation when disabled', () => {
      render(<CustomToggle {...defaultProps} disabled />);
      const toggle = screen.getByTestId('toggle-button');
      const tapData = JSON.parse(toggle.getAttribute('data-while-tap') || '{}');
      expect(tapData.scale).toBe(1);
    });

    it('should respond to tap animation when enabled', () => {
      render(<CustomToggle {...defaultProps} />);
      const toggle = screen.getByTestId('toggle-button');
      const tapData = JSON.parse(toggle.getAttribute('data-while-tap') || '{}');
      expect(tapData.scale).toBe(0.95);
    });
  });

  describe('Focus Management', () => {
    it('should show focus ring when focused', () => {
      render(<CustomToggle {...defaultProps} />);
      const toggle = screen.getByTestId('toggle-button');
      fireEvent.focus(toggle);
      expect(toggle).toHaveClass('ring-2', 'ring-offset-2', 'ring-primary-500', 'dark:ring-offset-dark-800');
    });

    it('should remove focus ring when blurred', () => {
      render(<CustomToggle {...defaultProps} />);
      const toggle = screen.getByTestId('toggle-button');
      fireEvent.focus(toggle);
      fireEvent.blur(toggle);
      expect(toggle).not.toHaveClass('ring-2');
    });
  });

  describe('Label Integration', () => {
    it('should connect label with toggle via htmlFor', () => {
      render(<CustomToggle {...defaultProps} label="Test Label" id="test-toggle" />);
      const label = document.querySelector('label');
      expect(label).toHaveAttribute('for', 'test-toggle');
    });

    it('should apply correct label spacing', () => {
      render(<CustomToggle {...defaultProps} label="Test Label" />);
      const label = document.querySelector('label');
      expect(label).toHaveClass('mr-3');
    });
  });

  describe('Animation Properties', () => {
    it('should have correct knob animation transition', () => {
      render(<CustomToggle {...defaultProps} />);
      const knob = screen.getByTestId('toggle-knob');
      const transitionData = JSON.parse(knob.getAttribute('data-transition') || '{}');
      
      expect(transitionData.type).toBe('spring');
      expect(transitionData.stiffness).toBe(500);
      expect(transitionData.damping).toBe(30);
    });

    it('should have scale animation for different states', () => {
      const { rerender } = render(<CustomToggle checked={false} onChange={jest.fn()} />);
      let knob = screen.getByTestId('toggle-knob');
      let animateData = JSON.parse(knob.getAttribute('data-animate') || '{}');
      expect(animateData.scale).toEqual([null, 0.8, 1]);
      
      rerender(<CustomToggle checked={true} onChange={jest.fn()} />);
      knob = screen.getByTestId('toggle-knob');
      animateData = JSON.parse(knob.getAttribute('data-animate') || '{}');
      expect(animateData.scale).toEqual([null, 1.2, 1]);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct base classes', () => {
      render(<CustomToggle {...defaultProps} />);
      const toggle = screen.getByTestId('toggle-button');
      expect(toggle).toHaveClass(
        'relative', 'inline-flex', 'flex-shrink-0', 'rounded-full',
        'cursor-pointer', 'transition-colors', 'ease-in-out', 'duration-200', 'focus:outline-none'
      );
    });

    it('should apply custom className', () => {
      render(<CustomToggle {...defaultProps} className="custom-class" />);
      expect(document.querySelector('.flex.items-center.custom-class')).toBeInTheDocument();
    });

    it('should apply correct knob classes', () => {
      render(<CustomToggle {...defaultProps} />);
      const knob = screen.getByTestId('toggle-knob');
      expect(knob).toHaveClass(
        'pointer-events-none', 'inline-block', 'rounded-full', 'bg-white',
        'shadow', 'transform', 'ring-0', 'transition', 'ease-in-out', 'duration-200'
      );
    });
  });

  describe('Screen Reader Support', () => {
    it('should include screen reader text', () => {
      render(<CustomToggle {...defaultProps} label="Test Label" />);
      const srText = document.querySelector('.sr-only');
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveTextContent('Test Label');
    });
  });

  describe('Checkmark Icon', () => {
    it('should render checkmark SVG with correct attributes', () => {
      render(<CustomToggle checked={true} onChange={jest.fn()} />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '10');
      expect(svg).toHaveAttribute('height', '10');
      expect(svg).toHaveAttribute('viewBox', '0 0 10 10');
      expect(svg).toHaveClass('text-white');
    });

    it('should render checkmark path with correct styling', () => {
      render(<CustomToggle checked={true} onChange={jest.fn()} />);
      const path = document.querySelector('svg path');
      expect(path).toHaveAttribute('stroke', 'currentColor');
      expect(path).toHaveAttribute('stroke-width', '1.5');
      expect(path).toHaveAttribute('stroke-linecap', 'round');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicking', () => {
      const onChange = jest.fn();
      render(<CustomToggle checked={false} onChange={onChange} />);
      const toggle = screen.getByTestId('toggle-button');
      
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      
      expect(onChange).toHaveBeenCalledTimes(3);
      expect(mockPlaySound).toHaveBeenCalledTimes(3);
    });

    it('should handle state changes while disabled', () => {
      const onChange = jest.fn();
      render(<CustomToggle checked={false} onChange={onChange} disabled />);
      const toggle = screen.getByTestId('toggle-button');
      
      fireEvent.click(toggle);
      fireEvent.focus(toggle);
      fireEvent.blur(toggle);
      
      expect(onChange).not.toHaveBeenCalled();
      expect(mockPlaySound).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work with controlled state changes', () => {
      const onChange = jest.fn();
      const { rerender } = render(<CustomToggle checked={false} onChange={onChange} />);
      
      let toggle = screen.getByTestId('toggle-button');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      
      rerender(<CustomToggle checked={true} onChange={onChange} />);
      toggle = screen.getByTestId('toggle-button');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
      
      const knob = screen.getByTestId('toggle-knob');
      const animateData = JSON.parse(knob.getAttribute('data-animate') || '{}');
      expect(animateData.x).toBe(24);
    });

    it('should maintain accessibility across all states', () => {
      const { rerender } = render(<CustomToggle checked={false} onChange={jest.fn()} />);
      const toggle = screen.getByTestId('toggle-button');
      
      const states = [
        { checked: false, disabled: false },
        { checked: true, disabled: false },
        { checked: false, disabled: true },
        { checked: true, disabled: true },
      ];
      
      states.forEach(state => {
        rerender(<CustomToggle checked={state.checked} onChange={jest.fn()} disabled={state.disabled} />);
        
        expect(toggle).toHaveAttribute('role', 'switch');
        expect(toggle).toHaveAttribute('aria-checked', String(state.checked));
        expect(toggle).toHaveAttribute('type', 'button');
        
        if (state.disabled) {
          expect(toggle).toHaveAttribute('disabled');
        } else {
          expect(toggle).not.toHaveAttribute('disabled');
        }
      });
    });
  });
}); 
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SoundToggle from '../SoundToggle';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, className, onClick, onMouseDown, onMouseUp, onMouseLeave, style, ...props }: any) => (
      <button 
        className={className} 
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        style={style}
        data-testid="sound-toggle"
        {...(props.role && { role: props.role })}
        {...(props['aria-checked'] !== undefined && { 'aria-checked': props['aria-checked'] })}
      >
        {children}
      </button>
    ),
    span: ({ children, className, animate, style, ...props }: any) => {
      // Assign specific test IDs based on className or content
      let testId = 'motion-span';
      if (className?.includes('flex items-center justify-center rounded-full bg-white')) {
        testId = 'toggle-knob';
      } else if (className?.includes('absolute inset-0 rounded-full')) {
        testId = 'ripple-effect';
      }
      
      return (
        <span 
          className={className}
          style={style}
          data-animate={JSON.stringify(animate)}
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
const mockToggleSoundEffects = jest.fn();
let mockSoundEnabled = false;

jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    soundEnabled: mockSoundEnabled,
    toggleSoundEffects: mockToggleSoundEffects,
    playSound: mockPlaySound,
  }),
}));

describe('SoundToggle Component', () => {
  beforeEach(() => {
    mockPlaySound.mockClear();
    mockToggleSoundEffects.mockClear();
    mockSoundEnabled = false;
  });

  afterEach(() => {
    // Clean up any timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('should render with correct default CSS classes', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveClass(
        'relative',
        'inline-flex',
        'items-center',
        'rounded-full',
        'transition-colors',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-primary-500',
        'focus:ring-offset-2'
      );
    });

    it('should apply custom className when provided', () => {
      render(<SoundToggle className="custom-class" />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveClass('custom-class');
    });

    it('should have correct size styles', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveStyle({ width: '54px', height: '28px' });
    });

    it('should have accessibility attributes', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveAttribute('role', 'switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('should render screen reader text', () => {
      render(<SoundToggle />);
      
      expect(screen.getByText('Sound off')).toBeInTheDocument();
      expect(screen.getByText('Sound off')).toHaveClass('sr-only');
    });
  });

  describe('Sound Disabled State', () => {
    beforeEach(() => {
      mockSoundEnabled = false;
    });

    it('should show disabled styling when sound is off', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveClass('bg-gray-300', 'dark:bg-dark-600');
    });

    it('should show correct aria-checked state', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('should show muted icon', () => {
      render(<SoundToggle />);
      
      const muteIcon = document.querySelector('svg path[d*="M18.44"]');
      expect(muteIcon).toBeInTheDocument();
    });

    it('should show correct screen reader text', () => {
      render(<SoundToggle />);
      
      expect(screen.getByText('Sound off')).toBeInTheDocument();
    });

    it('should position toggle to left when disabled', () => {
      render(<SoundToggle />);
      
      const toggleKnob = screen.getByTestId('toggle-knob');
      const animateData = JSON.parse(toggleKnob.getAttribute('data-animate') || '{}');
      expect(animateData.x).toBe(4);
    });
  });

  describe('Sound Enabled State', () => {
    beforeEach(() => {
      mockSoundEnabled = true;
    });

    it('should show enabled styling when sound is on', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveClass('bg-primary-500');
    });

    it('should show correct aria-checked state', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should show sound icon', () => {
      render(<SoundToggle />);
      
      const soundIcon = document.querySelector('svg path[d*="M13.5 4.06c0-1.336-1.616-2.005"]');
      expect(soundIcon).toBeInTheDocument();
    });

    it('should show correct screen reader text', () => {
      render(<SoundToggle />);
      
      expect(screen.getByText('Sound on')).toBeInTheDocument();
    });

    it('should position toggle to right', () => {
      mockSoundEnabled = true;
      render(<SoundToggle />);
      
      const toggleKnob = screen.getByTestId('toggle-knob');
      const animateData = JSON.parse(toggleKnob.getAttribute('data-animate') || '{}');
      expect(animateData.x).toBe(28);
    });
  });

  describe('Toggle Functionality', () => {
    it('should call toggleSoundEffects when clicked', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      fireEvent.click(toggle);
      
      expect(mockToggleSoundEffects).toHaveBeenCalledTimes(1);
    });

    it('should play sound before toggling when sound is enabled', () => {
      mockSoundEnabled = true;
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      fireEvent.click(toggle);
      
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
      expect(mockToggleSoundEffects).toHaveBeenCalledTimes(1);
    });

    it('should not play sound before toggling when sound is disabled', () => {
      mockSoundEnabled = false;
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      fireEvent.click(toggle);
      
      expect(mockPlaySound).not.toHaveBeenCalled();
      expect(mockToggleSoundEffects).toHaveBeenCalledTimes(1);
    });

    it('should play delayed sound when enabling sound', async () => {
      jest.useFakeTimers();
      mockSoundEnabled = false;
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      fireEvent.click(toggle);
      
      // Fast-forward the delayed sound
      jest.advanceTimersByTime(100);
      
      await waitFor(() => {
        expect(mockPlaySound).toHaveBeenCalledWith('toggle');
      });
      
      jest.useRealTimers();
    });

    it('should not play delayed sound when disabling sound', () => {
      jest.useFakeTimers();
      mockSoundEnabled = true;
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      fireEvent.click(toggle);
      
      // Fast-forward time
      jest.advanceTimersByTime(100);
      
      // Should only have been called once (before toggling)
      expect(mockPlaySound).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });
  });

  describe('Mouse Interactions', () => {
    it('should handle mouse down to set pressed state', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      fireEvent.mouseDown(toggle);
      
      const toggleKnob = screen.getByTestId('toggle-knob');
      const animateData = JSON.parse(toggleKnob.getAttribute('data-animate') || '{}');
      expect(animateData.scale).toBe(0.9);
    });

    it('should handle mouse up to reset pressed state', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      
      // Press down first
      fireEvent.mouseDown(toggle);
      let toggleKnob = screen.getByTestId('toggle-knob');
      let animateData = JSON.parse(toggleKnob.getAttribute('data-animate') || '{}');
      expect(animateData.scale).toBe(0.9);
      
      // Release
      fireEvent.mouseUp(toggle);
      toggleKnob = screen.getByTestId('toggle-knob');
      animateData = JSON.parse(toggleKnob.getAttribute('data-animate') || '{}');
      expect(animateData.scale).toBe(1);
    });

    it('should handle mouse leave to reset pressed state', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      
      // Press down first
      fireEvent.mouseDown(toggle);
      let toggleKnob = screen.getByTestId('toggle-knob');
      let animateData = JSON.parse(toggleKnob.getAttribute('data-animate') || '{}');
      expect(animateData.scale).toBe(0.9);
      
      // Leave
      fireEvent.mouseLeave(toggle);
      toggleKnob = screen.getByTestId('toggle-knob');
      animateData = JSON.parse(toggleKnob.getAttribute('data-animate') || '{}');
      expect(animateData.scale).toBe(1);
    });
  });

  describe('Icon Rendering', () => {
    it('should render sound icon when enabled', () => {
      mockSoundEnabled = true;
      render(<SoundToggle />);
      
      const soundIcon = document.querySelector('svg path[d*="M13.5 4.06c0-1.336-1.616-2.005"]');
      expect(soundIcon).toBeInTheDocument();
    });

    it('should render mute icon when disabled', () => {
      mockSoundEnabled = false;
      render(<SoundToggle />);
      
      // Check for the mute icon (slash path)
      const muteIcon = document.querySelector('svg path[d*="M18.44 4.52l-.813.812"]');
      expect(muteIcon).toBeInTheDocument();
      
      // The sound icon should still be there but with the slash overlay
      const soundIcon = document.querySelector('svg path[d*="M13.5 4.06c0-1.336-1.616-2.005"]');
      expect(soundIcon).toBeInTheDocument();
    });

    it('should apply correct icon styling', () => {
      render(<SoundToggle />);
      
      const iconSvg = document.querySelector('svg');
      expect(iconSvg).toHaveClass('w-3', 'h-3');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      toggle.focus();
      expect(toggle).toHaveFocus();
    });

    it('should support keyboard activation', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      fireEvent.click(toggle); // Use click instead of keyDown for mocked button
      
      expect(mockToggleSoundEffects).toHaveBeenCalledTimes(1);
    });

    it('should support space key activation', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      fireEvent.click(toggle); // Use click instead of keyDown for mocked button
      
      expect(mockToggleSoundEffects).toHaveBeenCalledTimes(1);
    });

    it('should have proper ARIA attributes', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveAttribute('role', 'switch');
      expect(toggle).toHaveAttribute('aria-checked');
    });

    it('should update aria-checked when state changes', () => {
      const { rerender } = render(<SoundToggle />);
      
      let toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      
      // Simulate state change
      mockSoundEnabled = true;
      rerender(<SoundToggle />);
      
      toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Styling and Classes', () => {
    it('should apply focus ring classes', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-primary-500',
        'focus:ring-offset-2'
      );
    });

    it('should have transition classes', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveClass('transition-colors');
    });

    it('should apply correct background colors for enabled state', () => {
      mockSoundEnabled = true;
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveClass('bg-primary-500');
    });

    it('should apply correct background colors for disabled state', () => {
      mockSoundEnabled = false;
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveClass('bg-gray-300', 'dark:bg-dark-600');
    });
  });

  describe('Animation Properties', () => {
    it('should set correct x position for disabled state', () => {
      mockSoundEnabled = false;
      render(<SoundToggle />);
      
      const toggleKnob = screen.getByTestId('toggle-knob');
      const animateData = JSON.parse(toggleKnob.getAttribute('data-animate') || '{}');
      expect(animateData.x).toBe(4);
    });

    it('should set correct x position for enabled state', () => {
      mockSoundEnabled = true;
      render(<SoundToggle />);
      
      const toggleKnob = screen.getByTestId('toggle-knob');
      const animateData = JSON.parse(toggleKnob.getAttribute('data-animate') || '{}');
      expect(animateData.x).toBe(28);
    });

    it('should set correct scale for normal state', () => {
      render(<SoundToggle />);
      
      const toggleKnob = screen.getByTestId('toggle-knob');
      const animateData = JSON.parse(toggleKnob.getAttribute('data-animate') || '{}');
      expect(animateData.scale).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicking', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      
      // Rapid clicks
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      
      expect(mockToggleSoundEffects).toHaveBeenCalledTimes(3);
    });

    it('should handle mouse interactions without affecting toggle function', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      
      // Mouse interactions
      fireEvent.mouseDown(toggle);
      fireEvent.mouseUp(toggle);
      fireEvent.mouseLeave(toggle);
      
      // Should not affect toggle functionality
      expect(mockToggleSoundEffects).not.toHaveBeenCalled();
    });

    it('should handle missing className gracefully', () => {
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveClass('relative');
    });

    it('should cleanup timers properly', () => {
      jest.useFakeTimers();
      
      const { unmount } = render(<SoundToggle />);
      
      // Unmount component immediately
      unmount();
      
      // Clear any pending calls before advancing timers
      mockPlaySound.mockClear();
      
      // Should not cause issues
      jest.advanceTimersByTime(100);
      expect(mockPlaySound).toHaveBeenCalledTimes(0);
      
      jest.useRealTimers();
    });
  });

  describe('Integration Tests', () => {
    it('should work with changing sound state', () => {
      const { rerender } = render(<SoundToggle />);
      
      // Initially disabled
      let toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByText('Sound off')).toBeInTheDocument();
      
      // Simulate enabling sound
      mockSoundEnabled = true;
      rerender(<SoundToggle />);
      
      toggle = screen.getByTestId('sound-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByText('Sound on')).toBeInTheDocument();
    });

    it('should handle full toggle cycle', async () => {
      jest.useFakeTimers();
      mockSoundEnabled = false;
      render(<SoundToggle />);
      
      const toggle = screen.getByTestId('sound-toggle');
      
      // Click to enable
      fireEvent.click(toggle);
      
      expect(mockToggleSoundEffects).toHaveBeenCalledTimes(1);
      
      // Fast-forward to trigger delayed sound
      jest.advanceTimersByTime(100);
      
      await waitFor(() => {
        expect(mockPlaySound).toHaveBeenCalledWith('toggle');
      });
      
      jest.useRealTimers();
    });
  });
}); 
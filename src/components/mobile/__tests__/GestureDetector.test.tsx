import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GestureDetector from '../GestureDetector';

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

describe('GestureDetector', () => {
  const mockOnSwipeLeft = jest.fn();
  const mockOnSwipeRight = jest.fn();
  const mockOnSwipeUp = jest.fn();
  const mockOnSwipeDown = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockVibrate.mockClear();
  });

  const renderGestureDetector = (props = {}) => {
    return render(
      <GestureDetector
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
        onSwipeUp={mockOnSwipeUp}
        onSwipeDown={mockOnSwipeDown}
        {...props}
      >
        <div data-testid="gesture-content">Test Content</div>
      </GestureDetector>
    );
  };

  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      renderGestureDetector();
      
      expect(screen.getByTestId('gesture-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render without gesture handlers', () => {
      render(
        <GestureDetector>
          <div data-testid="gesture-content">Test Content</div>
        </GestureDetector>
      );
      
      expect(screen.getByTestId('gesture-content')).toBeInTheDocument();
    });
  });

  describe('Touch Event Handling', () => {
    it('should handle touchStart event', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      // No assertions here as the internal state is not exposed
      // But we can test that no errors are thrown
      expect(element).toBeInTheDocument();
    });

    it('should handle touchMove event', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 150, clientY: 100 }],
      });

      expect(element).toBeInTheDocument();
    });

    it('should handle touchEnd event without starting touch', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      fireEvent.touchEnd(element);

      // Should not trigger any callbacks when no touch start
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
      expect(mockOnSwipeUp).not.toHaveBeenCalled();
      expect(mockOnSwipeDown).not.toHaveBeenCalled();
    });
  });

  describe('Horizontal Swipe Detection', () => {
    it('should detect swipe left gesture', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Start touch at x=200, y=100
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 200, clientY: 100 }],
      });

      // Move touch to x=100, y=100 (swipe left 100 pixels)
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
      expect(mockOnSwipeUp).not.toHaveBeenCalled();
      expect(mockOnSwipeDown).not.toHaveBeenCalled();
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('should detect swipe right gesture', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Start touch at x=100, y=100
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Move touch to x=200, y=100 (swipe right 100 pixels)
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeUp).not.toHaveBeenCalled();
      expect(mockOnSwipeDown).not.toHaveBeenCalled();
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('should not trigger swipe if distance is below minimum threshold', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Start touch at x=100, y=100
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Move touch to x=140, y=100 (swipe right 40 pixels - below default 50px threshold)
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 140, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      expect(mockOnSwipeRight).not.toHaveBeenCalled();
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('Vertical Swipe Detection', () => {
    it('should detect swipe up gesture', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Start touch at x=100, y=200
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 200 }],
      });

      // Move touch to x=100, y=100 (swipe up 100 pixels)
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      expect(mockOnSwipeUp).toHaveBeenCalledTimes(1);
      expect(mockOnSwipeDown).not.toHaveBeenCalled();
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('should detect swipe down gesture', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Start touch at x=100, y=100
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Move touch to x=100, y=200 (swipe down 100 pixels)
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 100, clientY: 200 }],
      });

      fireEvent.touchEnd(element);

      expect(mockOnSwipeDown).toHaveBeenCalledTimes(1);
      expect(mockOnSwipeUp).not.toHaveBeenCalled();
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('should prioritize horizontal swipe over vertical when horizontal distance is greater', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Start touch at x=100, y=100
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Move touch to x=250, y=200 (horizontal: 150px, vertical: 100px)
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 250, clientY: 200 }],
      });

      fireEvent.touchEnd(element);

      // Should trigger horizontal swipe (right) since horizontal distance is greater
      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      expect(mockOnSwipeDown).not.toHaveBeenCalled();
    });

    it('should prioritize vertical swipe when vertical distance is greater', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Start touch at x=100, y=100
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Move touch to x=150, y=250 (horizontal: 50px, vertical: 150px)
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 150, clientY: 250 }],
      });

      fireEvent.touchEnd(element);

      // Should trigger vertical swipe (down) since vertical distance is greater
      expect(mockOnSwipeDown).toHaveBeenCalledTimes(1);
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('Custom Configuration', () => {
    it('should use custom minimum swipe distance', () => {
      renderGestureDetector({ minSwipeDistance: 100 });
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Start touch at x=100, y=100
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Move touch to x=180, y=100 (swipe right 80 pixels - below 100px threshold)
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 180, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      // Should not trigger because distance is below custom threshold
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('should trigger with custom minimum swipe distance when threshold is met', () => {
      renderGestureDetector({ minSwipeDistance: 75 });
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Start touch at x=100, y=100
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Move touch to x=180, y=100 (swipe right 80 pixels - above 75px threshold)
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 180, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('should not trigger haptic feedback when disabled', () => {
      renderGestureDetector({ enableHaptic: false });
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Perform a valid swipe
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('Gesture Handler Availability', () => {
    it('should not trigger swipe left if handler is not provided', () => {
      render(
        <GestureDetector onSwipeRight={mockOnSwipeRight}>
          <div data-testid="gesture-content">Test Content</div>
        </GestureDetector>
      );

      const element = screen.getByTestId('gesture-content').parentElement!;

      // Perform swipe left gesture
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      // Should not trigger anything since onSwipeLeft is not provided
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('should only trigger available gesture handlers', () => {
      render(
        <GestureDetector 
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeUp={mockOnSwipeUp}
        >
          <div data-testid="gesture-content">Test Content</div>
        </GestureDetector>
      );

      const element = screen.getByTestId('gesture-content').parentElement!;

      // Perform swipe up gesture
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 200 }],
      });

      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      expect(mockOnSwipeUp).toHaveBeenCalledTimes(1);
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing navigator.vibrate gracefully', () => {
      // Temporarily remove vibrate support by overriding it with undefined
      const originalVibrate = navigator.vibrate;
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
      });

      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Perform a valid swipe
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      // Should not throw error and should not call vibrate

      // Restore vibrate
      Object.defineProperty(navigator, 'vibrate', {
        value: originalVibrate,
        writable: true,
      });
    });

    it('should handle touchEnd without touchMove', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Skip touchMove and go directly to touchEnd
      fireEvent.touchEnd(element);

      // Should not trigger any callbacks
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
      expect(mockOnSwipeUp).not.toHaveBeenCalled();
      expect(mockOnSwipeDown).not.toHaveBeenCalled();
    });

    it('should handle multiple touchStart events', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      // First touch
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Second touch (should reset touchEnd)
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 150, clientY: 100 }],
      });

      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 250, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      // Should use the latest touchStart position (150) for calculation
      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('should handle very small movements', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Very small movement (1 pixel)
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 101, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      // Should not trigger any swipe
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('Complex Gesture Sequences', () => {
    it('should handle rapid gesture sequences', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      // First gesture - swipe right
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      // Second gesture - swipe left
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
      expect(mockVibrate).toHaveBeenCalledTimes(2);
    });

    it('should reset state properly between gestures', () => {
      renderGestureDetector();
      const element = screen.getByTestId('gesture-content').parentElement!;

      // Start a gesture but don't complete it
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 150, clientY: 100 }],
      });

      // Start a new gesture without ending the previous one
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(element);

      // Should trigger swipe left based on the latest gesture
      expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    });
  });
}); 
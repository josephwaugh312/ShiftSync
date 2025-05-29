import React from 'react';
import { render } from '@testing-library/react';

// Mock external dependencies at the top level
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>
  }
}));

jest.mock('../ButtonLoader', () => {
  return function MockButtonLoader({ color, size, className }: any) {
    return (
      <div 
        data-testid="button-loader" 
        data-color={color}
        data-size={size}
        className={className}
      >
        Loading...
      </div>
    );
  };
});

jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    soundEnabled: true,
    toggleSoundEffects: jest.fn(),
    playSound: jest.fn()
  })
}));

// Mock setTimeout for testing
jest.useFakeTimers();

describe('LoadingButton', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('basic import and structure', () => {
    it('should import LoadingButton component without errors', async () => {
      const module = await import('../LoadingButton');
      expect(module).toBeDefined();
      expect(module.default).toBeDefined();
    });

    it('should be a React functional component', async () => {
      const { default: LoadingButton } = await import('../LoadingButton');
      expect(typeof LoadingButton).toBe('function');
      expect(LoadingButton.length).toBe(1); // Expects one props argument
    });
  });

  describe('mock dependencies', () => {
    it('should have motion mock available', () => {
      const { motion } = require('framer-motion');
      expect(motion.div).toBeDefined();
      expect(motion.span).toBeDefined();
    });
  });

  describe('component functionality', () => {
    it('should have proper default export', async () => {
      const module = await import('../LoadingButton');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });

    it('should accept LoadingButtonProps interface', async () => {
      const { default: LoadingButton } = await import('../LoadingButton');
      
      // Should accept props with children
      expect(() => {
        React.createElement(LoadingButton, { children: 'Test Button' });
      }).not.toThrow();
    });

    it('should render without crashing', async () => {
      const { default: LoadingButton } = await import('../LoadingButton');
      
      const { container } = render(
        React.createElement(LoadingButton, { children: 'Test Button' })
      );
      
      expect(container).toBeDefined();
      expect(container.textContent).toContain('Test Button');
    });

    it('should render in loading state', async () => {
      const { default: LoadingButton } = await import('../LoadingButton');
      
      const { container } = render(
        React.createElement(LoadingButton, { 
          children: 'Save', 
          isLoading: true,
          loadingText: 'Saving...'
        })
      );
      
      expect(container.textContent).toContain('Saving...');
      expect(container.querySelector('[data-testid="button-loader"]')).toBeTruthy();
    });

    it('should render with icon', async () => {
      const { default: LoadingButton } = await import('../LoadingButton');
      
      const icon = React.createElement('span', { 'data-testid': 'icon' }, '🚀');
      
      const { container } = render(
        React.createElement(LoadingButton, { 
          children: 'Launch',
          icon: icon
        })
      );
      
      expect(container.textContent).toContain('🚀');
      expect(container.textContent).toContain('Launch');
    });
  });

  describe('utility functions - Round 1: Core button logic', () => {
    it('should test getButtonClasses function', async () => {
      const { getButtonClasses } = await import('../LoadingButton');
      
      const classes = getButtonClasses();
      
      expect(classes).toEqual({
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        danger: 'btn-danger',
        warning: 'bg-warning-500 hover:bg-warning-600 text-dark-900 focus:ring-warning-500 btn',
      });
      
      // Test that it returns the same object each time
      const classes2 = getButtonClasses();
      expect(classes2).toEqual(classes);
    });

    it('should test getButtonClass function', async () => {
      const { getButtonClass } = await import('../LoadingButton');
      
      // Test default behavior (primary)
      expect(getButtonClass()).toBe('btn-primary');
      
      // Test specific button types
      expect(getButtonClass('primary')).toBe('btn-primary');
      expect(getButtonClass('secondary')).toBe('btn-secondary');
      expect(getButtonClass('success')).toBe('btn-success');
      expect(getButtonClass('danger')).toBe('btn-danger');
      expect(getButtonClass('warning')).toBe('bg-warning-500 hover:bg-warning-600 text-dark-900 focus:ring-warning-500 btn');
      
      // Test variant override
      expect(getButtonClass('primary', 'blue')).toBe('btn bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500');
      expect(getButtonClass('secondary', 'red')).toBe('btn bg-red-600 hover:bg-red-700 text-white focus:ring-red-500');
      
      // Test with undefined values
      expect(getButtonClass(undefined)).toBe('btn-primary');
      expect(getButtonClass('primary', undefined)).toBe('btn-primary');
    });

    it('should test getLoaderColor function', async () => {
      const { getLoaderColor } = await import('../LoadingButton');
      
      // Test default behavior
      expect(getLoaderColor()).toBe('white');
      
      // Test button types that should return white
      expect(getLoaderColor('primary')).toBe('white');
      expect(getLoaderColor('success')).toBe('white');
      expect(getLoaderColor('danger')).toBe('white');
      
      // Test button types that should return currentColor
      expect(getLoaderColor('secondary')).toBe('currentColor');
      expect(getLoaderColor('warning')).toBe('currentColor');
      
      // Test variant override
      expect(getLoaderColor('secondary', 'primary')).toBe('white');
      expect(getLoaderColor('warning', 'blue')).toBe('currentColor');
      
      // Test with undefined values
      expect(getLoaderColor(undefined)).toBe('white');
      expect(getLoaderColor('primary', undefined)).toBe('white');
    });

    it('should test calculateRipplePosition function', async () => {
      const { calculateRipplePosition } = await import('../LoadingButton');
      
      // Mock mouse event
      const mockEvent = {
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 100,
            top: 50
          })
        },
        clientX: 150,
        clientY: 75
      } as any;
      
      const position = calculateRipplePosition(mockEvent);
      
      expect(position).toEqual({
        x: 50, // 150 - 100
        y: 25  // 75 - 50
      });
      
      // Test with different coordinates
      const mockEvent2 = {
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 200,
            top: 100
          })
        },
        clientX: 300,
        clientY: 200
      } as any;
      
      const position2 = calculateRipplePosition(mockEvent2);
      expect(position2).toEqual({
        x: 100, // 300 - 200
        y: 100  // 200 - 100
      });
    });

    it('should test getSoundToPlay function', async () => {
      const { getSoundToPlay } = await import('../LoadingButton');
      
      // Test default behavior
      expect(getSoundToPlay()).toBe('click');
      expect(getSoundToPlay(undefined)).toBe('click');
      
      // Test with sound prop provided
      expect(getSoundToPlay('custom-sound')).toBe('custom-sound');
      expect(getSoundToPlay('beep')).toBe('beep');
      
      // Test with soundEffect parameter
      expect(getSoundToPlay(undefined, 'success')).toBe('success');
      expect(getSoundToPlay(undefined, 'error')).toBe('error');
      
      // Test sound prop takes precedence
      expect(getSoundToPlay('custom', 'error')).toBe('custom');
      
      // Test with empty string
      expect(getSoundToPlay('', 'click')).toBe('click'); // Empty string is falsy
    });

    it('should test shouldBlockInteraction function', async () => {
      const { shouldBlockInteraction } = await import('../LoadingButton');
      
      // Test default behavior
      expect(shouldBlockInteraction()).toBe(false);
      expect(shouldBlockInteraction(undefined, undefined)).toBe(false);
      
      // Test disabled state
      expect(shouldBlockInteraction(true)).toBe(true);
      expect(shouldBlockInteraction(true, false)).toBe(true);
      
      // Test loading state
      expect(shouldBlockInteraction(false, true)).toBe(true);
      expect(shouldBlockInteraction(undefined, true)).toBe(true);
      
      // Test both states
      expect(shouldBlockInteraction(true, true)).toBe(true);
      
      // Test false values
      expect(shouldBlockInteraction(false, false)).toBe(false);
    });

    it('should test getRippleConfig function', async () => {
      const { getRippleConfig } = await import('../LoadingButton');
      
      const config = getRippleConfig();
      
      expect(config).toEqual({
        marginOffset: -100,
        size: 200,
        duration: 0.6
      });
      
      // Test that it returns the same config each time
      const config2 = getRippleConfig();
      expect(config2).toEqual(config);
      
      // Test that it returns a new object (not the same reference)
      expect(config).not.toBe(config2);
    });

    it('should test getButtonScale function', async () => {
      const { getButtonScale } = await import('../LoadingButton');
      
      // Test normal state (should scale)
      expect(getButtonScale()).toBe(0.95);
      expect(getButtonScale(false, false)).toBe(0.95);
      
      // Test disabled state (should not scale)
      expect(getButtonScale(true)).toBe(1);
      expect(getButtonScale(true, false)).toBe(1);
      
      // Test loading state (should not scale)
      expect(getButtonScale(false, true)).toBe(1);
      expect(getButtonScale(undefined, true)).toBe(1);
      
      // Test both disabled and loading (should not scale)
      expect(getButtonScale(true, true)).toBe(1);
      
      // Test undefined values
      expect(getButtonScale(undefined, undefined)).toBe(0.95);
    });
  });

  describe('utility functions - Round 2: Animation and rendering logic', () => {
    it('should test getBoxShadowAnimation function', async () => {
      const { getBoxShadowAnimation } = await import('../LoadingButton');
      
      // Test focused state
      expect(getBoxShadowAnimation(true, false)).toBe('0 0 0 3px rgba(99, 102, 241, 0.4)');
      expect(getBoxShadowAnimation(true, true)).toBe('0 0 0 3px rgba(99, 102, 241, 0.4)'); // Focus takes precedence
      
      // Test pressed state (when not focused)
      expect(getBoxShadowAnimation(false, true)).toBe('inset 0 3px 5px rgba(0, 0, 0, 0.2)');
      
      // Test default state
      expect(getBoxShadowAnimation(false, false)).toBe('0 1px 2px rgba(0, 0, 0, 0.1)');
    });

    it('should test getFocusRingAnimation function', async () => {
      const { getFocusRingAnimation } = await import('../LoadingButton');
      
      // Test focused state
      const focusedAnimation = getFocusRingAnimation(true);
      expect(focusedAnimation).toEqual({
        opacity: 1,
        scale: 1
      });
      
      // Test unfocused state
      const unfocusedAnimation = getFocusRingAnimation(false);
      expect(unfocusedAnimation).toEqual({
        opacity: 0,
        scale: 0.85
      });
    });

    it('should test getFocusRingTransition function', async () => {
      const { getFocusRingTransition } = await import('../LoadingButton');
      
      const transition = getFocusRingTransition();
      expect(transition).toEqual({ duration: 0.2 });
      
      // Test that it returns the same config each time
      const transition2 = getFocusRingTransition();
      expect(transition2).toEqual(transition);
    });

    it('should test getMotionSpanProps function', async () => {
      const { getMotionSpanProps } = await import('../LoadingButton');
      
      // Test pressed state
      const pressedProps = getMotionSpanProps(true);
      expect(pressedProps).toEqual({
        y: 2,
        opacity: 0.9
      });
      
      // Test unpressed state
      const unpressedProps = getMotionSpanProps(false);
      expect(unpressedProps).toEqual({
        y: 0,
        opacity: 1
      });
    });

    it('should test getLoadingTextContent function', async () => {
      const { getLoadingTextContent } = await import('../LoadingButton');
      
      // Test with custom loading text
      expect(getLoadingTextContent('Saving...')).toBe('Saving...');
      expect(getLoadingTextContent('Processing')).toBe('Processing');
      
      // Test with undefined (should return default)
      expect(getLoadingTextContent(undefined)).toBe('Loading...');
      expect(getLoadingTextContent()).toBe('Loading...');
      
      // Test with empty string (should return default)
      expect(getLoadingTextContent('')).toBe('Loading...');
    });

    it('should test shouldShowRipple function', async () => {
      const { shouldShowRipple } = await import('../LoadingButton');
      
      // Test when both conditions are true
      expect(shouldShowRipple(true, true)).toBe(true);
      
      // Test when showRipple is false
      expect(shouldShowRipple(false, true)).toBe(false);
      
      // Test when withRipple is false
      expect(shouldShowRipple(true, false)).toBe(false);
      
      // Test when both are false
      expect(shouldShowRipple(false, false)).toBe(false);
    });

    it('should test getRippleStyles function', async () => {
      const { getRippleStyles } = await import('../LoadingButton');
      
      const ripplePosition = { x: 50, y: 75 };
      const rippleConfig = { marginOffset: -100, size: 200, duration: 0.6 };
      
      const styles = getRippleStyles(ripplePosition, rippleConfig);
      
      expect(styles).toEqual({
        left: 50,
        top: 75,
        marginLeft: -100,
        marginTop: -100,
        width: 200,
        height: 200
      });
      
      // Test with different values
      const ripplePosition2 = { x: 25, y: 30 };
      const rippleConfig2 = { marginOffset: -50, size: 100, duration: 0.4 };
      
      const styles2 = getRippleStyles(ripplePosition2, rippleConfig2);
      expect(styles2).toEqual({
        left: 25,
        top: 30,
        marginLeft: -50,
        marginTop: -50,
        width: 100,
        height: 100
      });
    });

    it('should test getRippleAnimationProps function', async () => {
      const { getRippleAnimationProps } = await import('../LoadingButton');
      
      const animationProps = getRippleAnimationProps();
      
      expect(animationProps).toEqual({
        initial: { scale: 0, opacity: 0.5 },
        animate: { scale: 2, opacity: 0 }
      });
      
      // Test that it returns the same props each time
      const animationProps2 = getRippleAnimationProps();
      expect(animationProps2).toEqual(animationProps);
    });

    it('should test getMainClassName function', async () => {
      const { getMainClassName } = await import('../LoadingButton');
      
      // Test with basic inputs
      const className1 = getMainClassName('btn-primary', 'custom-class');
      expect(className1).toBe('relative overflow-hidden flex items-center justify-center shadow-md font-medium btn-primary custom-class');
      
      // Test with empty custom class
      const className2 = getMainClassName('btn-secondary', '');
      expect(className2).toBe('relative overflow-hidden flex items-center justify-center shadow-md font-medium btn-secondary ');
      
      // Test with complex button class
      const className3 = getMainClassName('bg-warning-500 hover:bg-warning-600 text-dark-900 focus:ring-warning-500 btn', 'mx-2 my-1');
      expect(className3).toBe('relative overflow-hidden flex items-center justify-center shadow-md font-medium bg-warning-500 hover:bg-warning-600 text-dark-900 focus:ring-warning-500 btn mx-2 my-1');
    });

    it('should test getButtonAttributes function', async () => {
      const { getButtonAttributes } = await import('../LoadingButton');
      
      // Test basic attributes
      const attrs1 = getButtonAttributes('button', false, false, 'Test button');
      expect(attrs1).toEqual({
        type: 'button',
        disabled: false,
        className: 'relative z-10 w-full h-full',
        'aria-label': 'Test button'
      });
      
      // Test with loading state
      const attrs2 = getButtonAttributes('submit', true, false, undefined);
      expect(attrs2).toEqual({
        type: 'submit',
        disabled: true, // isLoading makes it disabled
        className: 'relative z-10 w-full h-full',
        'aria-label': undefined
      });
      
      // Test with disabled state
      const attrs3 = getButtonAttributes('reset', false, true, 'Reset form');
      expect(attrs3).toEqual({
        type: 'reset',
        disabled: true,
        className: 'relative z-10 w-full h-full',
        'aria-label': 'Reset form'
      });
      
      // Test with both loading and disabled
      const attrs4 = getButtonAttributes('button', true, true, '');
      expect(attrs4).toEqual({
        type: 'button',
        disabled: true,
        className: 'relative z-10 w-full h-full',
        'aria-label': ''
      });
    });

    it('should test calculateRippleTimeout function', async () => {
      const { calculateRippleTimeout } = await import('../LoadingButton');
      
      // Test standard duration
      expect(calculateRippleTimeout(0.6)).toBe(600);
      expect(calculateRippleTimeout(0.3)).toBe(300);
      expect(calculateRippleTimeout(1)).toBe(1000);
      expect(calculateRippleTimeout(1.5)).toBe(1500);
      
      // Test edge cases
      expect(calculateRippleTimeout(0)).toBe(0);
      expect(calculateRippleTimeout(0.1)).toBe(100);
    });

    it('should test createStateSetter function', async () => {
      const { createStateSetter } = await import('../LoadingButton');
      
      // Mock setState function
      const mockSetState = jest.fn();
      
      // Create the state setter
      const stateSetter = createStateSetter(mockSetState);
      
      // Test that it's a function
      expect(typeof stateSetter).toBe('function');
      
      // Test that it calls setState with the value
      stateSetter('test-value');
      expect(mockSetState).toHaveBeenCalledWith('test-value');
      
      // Test with different types
      stateSetter(42);
      expect(mockSetState).toHaveBeenCalledWith(42);
      
      stateSetter(true);
      expect(mockSetState).toHaveBeenCalledWith(true);
      
      // Verify call count
      expect(mockSetState).toHaveBeenCalledTimes(3);
    });
  });

  describe('utility functions - Round 3: Event handlers and state management', () => {
    it('should test getInitialButtonState function', async () => {
      const { getInitialButtonState } = await import('../LoadingButton');
      
      const initialState = getInitialButtonState();
      
      expect(initialState).toEqual({
        isFocused: false,
        isPressed: false,
        ripplePosition: { x: 0, y: 0 },
        showRipple: false
      });
      
      // Test that it returns a new object each time
      const initialState2 = getInitialButtonState();
      expect(initialState2).toEqual(initialState);
      expect(initialState2).not.toBe(initialState);
    });

    it('should test extractSoundEffectsHook function', async () => {
      const { extractSoundEffectsHook } = await import('../LoadingButton');
      
      // Mock the hook
      const mockUseSoundEffects = jest.fn(() => ({
        playSound: jest.fn(),
        soundEnabled: true,
        toggleSoundEffects: jest.fn()
      }));
      
      const result = extractSoundEffectsHook(mockUseSoundEffects);
      
      expect(result).toHaveProperty('playSound');
      expect(typeof result.playSound).toBe('function');
      expect(mockUseSoundEffects).toHaveBeenCalled();
    });

    it('should test executeRippleHandler function', async () => {
      const { executeRippleHandler } = await import('../LoadingButton');
      
      const mockSetRipplePosition = jest.fn();
      const mockSetShowRipple = jest.fn();
      const mockEvent = {
        currentTarget: {
          getBoundingClientRect: () => ({ left: 100, top: 50 })
        },
        clientX: 150,
        clientY: 75
      } as any;
      const rippleConfig = { duration: 0.6 };
      
      // Test normal execution
      const timeoutId = executeRippleHandler(
        mockEvent,
        true, // withRipple
        false, // disabled
        false, // isLoading
        mockSetRipplePosition,
        mockSetShowRipple,
        rippleConfig
      );
      
      expect(mockSetRipplePosition).toHaveBeenCalledWith({ x: 50, y: 25 });
      expect(mockSetShowRipple).toHaveBeenCalledWith(true);
      expect(timeoutId).toBeDefined();
      
      // Test when blocked (should not execute)
      mockSetRipplePosition.mockClear();
      mockSetShowRipple.mockClear();
      
      const result = executeRippleHandler(
        mockEvent,
        true, // withRipple
        true, // disabled (blocked)
        false, // isLoading
        mockSetRipplePosition,
        mockSetShowRipple,
        rippleConfig
      );
      
      expect(mockSetRipplePosition).not.toHaveBeenCalled();
      expect(mockSetShowRipple).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
      
      // Test when withRipple is false
      const result2 = executeRippleHandler(
        mockEvent,
        false, // withRipple
        false, // disabled
        false, // isLoading
        mockSetRipplePosition,
        mockSetShowRipple,
        rippleConfig
      );
      
      expect(result2).toBeUndefined();
    });

    it('should test executeRippleHandler timeout callback', async () => {
      const { executeRippleHandler } = await import('../LoadingButton');
      
      const mockSetRipplePosition = jest.fn();
      const mockSetShowRipple = jest.fn();
      const mockEvent = {
        currentTarget: {
          getBoundingClientRect: () => ({ left: 100, top: 50 })
        },
        clientX: 150,
        clientY: 75
      } as any;
      const rippleConfig = { duration: 0.6 };
      
      // Execute the handler
      executeRippleHandler(
        mockEvent,
        true, // withRipple
        false, // disabled
        false, // isLoading
        mockSetRipplePosition,
        mockSetShowRipple,
        rippleConfig
      );
      
      // Verify the initial call
      expect(mockSetShowRipple).toHaveBeenCalledWith(true);
      
      // Clear the mock and advance timers to test the setTimeout callback
      mockSetShowRipple.mockClear();
      jest.advanceTimersByTime(600); // duration * 1000
      
      // Verify the setTimeout callback was executed
      expect(mockSetShowRipple).toHaveBeenCalledWith(false);
    });

    it('should test executeClickHandler function', async () => {
      const { executeClickHandler } = await import('../LoadingButton');
      
      const mockPlaySound = jest.fn();
      const mockOnClick = jest.fn();
      const mockHandleRipple = jest.fn();
      const mockEvent = {} as any;
      
      // Test normal execution
      executeClickHandler(
        mockEvent,
        'custom-sound',
        'click',
        false, // disabled
        false, // isLoading
        mockPlaySound,
        mockOnClick,
        mockHandleRipple
      );
      
      expect(mockHandleRipple).toHaveBeenCalledWith(mockEvent);
      expect(mockPlaySound).toHaveBeenCalledWith('custom-sound');
      expect(mockOnClick).toHaveBeenCalledWith(mockEvent);
      
      // Test when blocked
      mockPlaySound.mockClear();
      mockOnClick.mockClear();
      mockHandleRipple.mockClear();
      
      executeClickHandler(
        mockEvent,
        'custom-sound',
        'click',
        true, // disabled (blocked)
        false, // isLoading
        mockPlaySound,
        mockOnClick,
        mockHandleRipple
      );
      
      expect(mockHandleRipple).not.toHaveBeenCalled();
      expect(mockPlaySound).not.toHaveBeenCalled();
      expect(mockOnClick).not.toHaveBeenCalled();
      
      // Test with undefined callbacks
      executeClickHandler(
        mockEvent,
        undefined,
        'success',
        false,
        false,
        undefined,
        undefined,
        undefined
      );
      
      // Should not throw error when callbacks are undefined
      expect(true).toBe(true);
    });

    it('should test executeMouseDownHandler function', async () => {
      const { executeMouseDownHandler } = await import('../LoadingButton');
      
      const mockSetIsPressed = jest.fn();
      
      // Test normal execution
      executeMouseDownHandler(false, false, mockSetIsPressed);
      expect(mockSetIsPressed).toHaveBeenCalledWith(true);
      
      // Test when blocked
      mockSetIsPressed.mockClear();
      executeMouseDownHandler(true, false, mockSetIsPressed);
      expect(mockSetIsPressed).not.toHaveBeenCalled();
      
      // Test with undefined callback
      executeMouseDownHandler(false, false, undefined);
      expect(true).toBe(true); // Should not throw
    });

    it('should test executeMouseUpHandler function', async () => {
      const { executeMouseUpHandler } = await import('../LoadingButton');
      
      const mockSetIsPressed = jest.fn();
      
      // Test normal execution
      executeMouseUpHandler(false, false, mockSetIsPressed);
      expect(mockSetIsPressed).toHaveBeenCalledWith(false);
      
      // Test when blocked
      mockSetIsPressed.mockClear();
      executeMouseUpHandler(false, true, mockSetIsPressed); // isLoading blocks
      expect(mockSetIsPressed).not.toHaveBeenCalled();
      
      // Test with undefined callback
      executeMouseUpHandler(false, false, undefined);
      expect(true).toBe(true); // Should not throw
    });

    it('should test executeFocusHandler function', async () => {
      const { executeFocusHandler } = await import('../LoadingButton');
      
      const mockSetIsFocused = jest.fn();
      
      // Test normal execution
      executeFocusHandler(mockSetIsFocused);
      expect(mockSetIsFocused).toHaveBeenCalledWith(true);
      
      // Test with undefined callback
      executeFocusHandler(undefined);
      expect(true).toBe(true); // Should not throw
    });

    it('should test executeBlurHandler function', async () => {
      const { executeBlurHandler } = await import('../LoadingButton');
      
      const mockSetIsFocused = jest.fn();
      
      // Test normal execution
      executeBlurHandler(mockSetIsFocused);
      expect(mockSetIsFocused).toHaveBeenCalledWith(false);
      
      // Test with undefined callback
      executeBlurHandler(undefined);
      expect(true).toBe(true); // Should not throw
    });

    it('should test executeMouseLeaveHandler function', async () => {
      const { executeMouseLeaveHandler } = await import('../LoadingButton');
      
      const mockSetIsPressed = jest.fn();
      
      // Test normal execution
      executeMouseLeaveHandler(mockSetIsPressed);
      expect(mockSetIsPressed).toHaveBeenCalledWith(false);
      
      // Test with undefined callback
      executeMouseLeaveHandler(undefined);
      expect(true).toBe(true); // Should not throw
    });

    it('should test renderLoadingContent function', async () => {
      const { renderLoadingContent } = await import('../LoadingButton');
      
      // Test with custom loading text
      const content1 = renderLoadingContent('white', 'Saving...');
      expect(content1).toEqual({
        loader: { color: 'white', size: 18, className: 'mr-2' },
        text: 'Saving...'
      });
      
      // Test with default loading text
      const content2 = renderLoadingContent('currentColor');
      expect(content2).toEqual({
        loader: { color: 'currentColor', size: 18, className: 'mr-2' },
        text: 'Loading...'
      });
    });

    it('should test renderNormalContent function', async () => {
      const { renderNormalContent } = await import('../LoadingButton');
      
      const mockIcon = React.createElement('span', {}, '🚀');
      const mockChildren = 'Click me';
      
      // Test with icon and children
      const content1 = renderNormalContent(mockIcon, mockChildren);
      expect(content1).toEqual({
        hasIcon: true,
        icon: mockIcon,
        children: mockChildren
      });
      
      // Test without icon
      const content2 = renderNormalContent(undefined, mockChildren);
      expect(content2).toEqual({
        hasIcon: false,
        icon: undefined,
        children: mockChildren
      });
    });

    it('should test shouldRenderIcon function', async () => {
      const { shouldRenderIcon } = await import('../LoadingButton');
      
      const mockIcon = React.createElement('span', {}, '🚀');
      
      // Test with icon
      expect(shouldRenderIcon(mockIcon)).toBe(true);
      
      // Test without icon
      expect(shouldRenderIcon(undefined)).toBe(false);
      expect(shouldRenderIcon(null)).toBe(false);
      expect(shouldRenderIcon('')).toBe(false);
      expect(shouldRenderIcon(0)).toBe(false);
    });

    it('should test isInLoadingState function', async () => {
      const { isInLoadingState } = await import('../LoadingButton');
      
      // Test loading state
      expect(isInLoadingState(true)).toBe(true);
      
      // Test not loading
      expect(isInLoadingState(false)).toBe(false);
      expect(isInLoadingState(undefined)).toBe(false);
    });

    it('should test extractComputedValues function', async () => {
      const { extractComputedValues } = await import('../LoadingButton');
      
      // Test with all parameters
      const computed1 = extractComputedValues(
        'primary',
        'blue',
        'custom-class',
        'submit',
        true,
        false,
        'Submit button'
      );
      
      expect(computed1).toHaveProperty('buttonClass');
      expect(computed1).toHaveProperty('loaderColor');
      expect(computed1).toHaveProperty('rippleConfig');
      expect(computed1).toHaveProperty('mainClassName');
      expect(computed1).toHaveProperty('buttonAttributes');
      
      expect(computed1.buttonClass).toContain('blue');
      expect(computed1.mainClassName).toContain('custom-class');
      expect(computed1.buttonAttributes.type).toBe('submit');
      expect(computed1.buttonAttributes.disabled).toBe(true); // isLoading = true
      
      // Test with defaults
      const computed2 = extractComputedValues();
      expect(computed2.buttonClass).toBe('btn-primary');
      expect(computed2.buttonAttributes.type).toBe('button');
      expect(computed2.buttonAttributes.disabled).toBe(false); // undefined isLoading and disabled should result in false
      
      // Test explicit false values
      const computed3 = extractComputedValues('primary', undefined, '', 'button', false, false);
      expect(computed3.buttonAttributes.disabled).toBe(false);
    });
  });

  describe('integration tests - Round 1', () => {
    it('should test button class and loader color integration', async () => {
      const { getButtonClass, getLoaderColor } = await import('../LoadingButton');
      
      // Test that primary button gets white loader
      const primaryClass = getButtonClass('primary');
      const primaryLoader = getLoaderColor('primary');
      expect(primaryClass).toBe('btn-primary');
      expect(primaryLoader).toBe('white');
      
      // Test that secondary button gets currentColor loader
      const secondaryClass = getButtonClass('secondary');
      const secondaryLoader = getLoaderColor('secondary');
      expect(secondaryClass).toBe('btn-secondary');
      expect(secondaryLoader).toBe('currentColor');
      
      // Test variant consistency
      const variantClass = getButtonClass('secondary', 'primary');
      const variantLoader = getLoaderColor('secondary', 'primary');
      expect(variantClass).toContain('primary');
      expect(variantLoader).toBe('white');
    });

    it('should test interaction blocking and scaling integration', async () => {
      const { shouldBlockInteraction, getButtonScale } = await import('../LoadingButton');
      
      // Test that blocked interactions prevent scaling
      const blockedStates = [
        [true, false],
        [false, true],
        [true, true]
      ];
      
      blockedStates.forEach(([disabled, isLoading]) => {
        expect(shouldBlockInteraction(disabled, isLoading)).toBe(true);
        expect(getButtonScale(disabled, isLoading)).toBe(1);
      });
      
      // Test that allowed interactions enable scaling
      expect(shouldBlockInteraction(false, false)).toBe(false);
      expect(getButtonScale(false, false)).toBe(0.95);
    });

    it('should test sound and ripple configuration integration', async () => {
      const { getSoundToPlay, getRippleConfig } = await import('../LoadingButton');
      
      // Test configuration consistency
      const sound = getSoundToPlay('custom-sound', 'click');
      const rippleConfig = getRippleConfig();
      
      expect(sound).toBe('custom-sound');
      expect(typeof rippleConfig.duration).toBe('number');
      expect(rippleConfig.duration).toBe(0.6);
      
      // Test ripple timeout calculation
      const timeoutMs = rippleConfig.duration * 1000;
      expect(timeoutMs).toBe(600);
    });
  });

  describe('integration tests - Round 2', () => {
    it('should test animation state integration', async () => {
      const { getBoxShadowAnimation, getFocusRingAnimation, getMotionSpanProps } = await import('../LoadingButton');
      
      // Test coordinated animation states
      const isFocused = true;
      const isPressed = false;
      
      const boxShadow = getBoxShadowAnimation(isFocused, isPressed);
      const focusRing = getFocusRingAnimation(isFocused);
      const motionSpan = getMotionSpanProps(isPressed);
      
      expect(boxShadow).toBe('0 0 0 3px rgba(99, 102, 241, 0.4)');
      expect(focusRing.opacity).toBe(1);
      expect(motionSpan.y).toBe(0);
      expect(motionSpan.opacity).toBe(1);
    });

    it('should test ripple system integration', async () => {
      const { getRippleConfig, getRippleStyles, shouldShowRipple, calculateRippleTimeout } = await import('../LoadingButton');
      
      const rippleConfig = getRippleConfig();
      const ripplePosition = { x: 100, y: 50 };
      
      // Test complete ripple system
      const styles = getRippleStyles(ripplePosition, rippleConfig);
      const shouldShow = shouldShowRipple(true, true);
      const timeout = calculateRippleTimeout(rippleConfig.duration);
      
      expect(styles.left).toBe(100);
      expect(styles.top).toBe(50);
      expect(styles.width).toBe(rippleConfig.size);
      expect(shouldShow).toBe(true);
      expect(timeout).toBe(600);
    });

    it('should test button construction integration', async () => {
      const { getButtonClass, getMainClassName, getButtonAttributes } = await import('../LoadingButton');
      
      // Test complete button construction pipeline
      const buttonClass = getButtonClass('primary');
      const mainClassName = getMainClassName(buttonClass, 'custom-btn');
      const buttonAttributes = getButtonAttributes('submit', false, false, 'Submit form');
      
      expect(buttonClass).toBe('btn-primary');
      expect(mainClassName).toContain('btn-primary');
      expect(mainClassName).toContain('custom-btn');
      expect(buttonAttributes.type).toBe('submit');
      expect(buttonAttributes.disabled).toBe(false);
    });

    it('should test loading state integration', async () => {
      const { getLoadingTextContent, getLoaderColor, shouldBlockInteraction } = await import('../LoadingButton');
      
      // Test loading state coordination
      const isLoading = true;
      const loadingText = getLoadingTextContent('Processing...');
      const loaderColor = getLoaderColor('primary');
      const blocked = shouldBlockInteraction(false, isLoading);
      
      expect(loadingText).toBe('Processing...');
      expect(loaderColor).toBe('white');
      expect(blocked).toBe(true);
    });
  });

  describe('integration tests - Round 3', () => {
    it('should test complete event handler integration', async () => {
      const { 
        executeClickHandler, 
        executeRippleHandler, 
        executeMouseDownHandler,
        shouldBlockInteraction 
      } = await import('../LoadingButton');
      
      const mockSetters = {
        setRipplePosition: jest.fn(),
        setShowRipple: jest.fn(),
        setIsPressed: jest.fn()
      };
      
      const mockCallbacks = {
        playSound: jest.fn(),
        onClick: jest.fn(),
        handleRipple: jest.fn()
      };
      
      const mockEvent = {} as any;
      const disabled = false;
      const isLoading = false;
      
      // Test event flow when not blocked
      expect(shouldBlockInteraction(disabled, isLoading)).toBe(false);
      
      executeMouseDownHandler(disabled, isLoading, mockSetters.setIsPressed);
      expect(mockSetters.setIsPressed).toHaveBeenCalledWith(true);
      
      executeClickHandler(
        mockEvent,
        'click-sound',
        'click',
        disabled,
        isLoading,
        mockCallbacks.playSound,
        mockCallbacks.onClick,
        mockCallbacks.handleRipple
      );
      
      expect(mockCallbacks.handleRipple).toHaveBeenCalled();
      expect(mockCallbacks.playSound).toHaveBeenCalledWith('click-sound');
      expect(mockCallbacks.onClick).toHaveBeenCalled();
    });

    it('should test state initialization integration', async () => {
      const { getInitialButtonState, extractComputedValues } = await import('../LoadingButton');
      
      // Test state and computed values coordination
      const initialState = getInitialButtonState();
      const computedValues = extractComputedValues('primary', undefined, '', 'button', false, false);
      
      expect(initialState.isFocused).toBe(false);
      expect(initialState.isPressed).toBe(false);
      expect(computedValues.buttonAttributes.disabled).toBe(false);
      expect(computedValues.buttonClass).toBe('btn-primary');
    });

    it('should test rendering decision integration', async () => {
      const { 
        isInLoadingState, 
        shouldRenderIcon, 
        renderLoadingContent, 
        renderNormalContent 
      } = await import('../LoadingButton');
      
      const mockIcon = React.createElement('span', {}, '🚀');
      const mockChildren = 'Click me';
      
      // Test loading state rendering
      expect(isInLoadingState(true)).toBe(true);
      const loadingContent = renderLoadingContent('white', 'Saving...');
      expect(loadingContent.text).toBe('Saving...');
      
      // Test normal state rendering
      expect(isInLoadingState(false)).toBe(false);
      expect(shouldRenderIcon(mockIcon)).toBe(true);
      const normalContent = renderNormalContent(mockIcon, mockChildren);
      expect(normalContent.hasIcon).toBe(true);
      expect(normalContent.children).toBe(mockChildren);
    });

    it('should test complete component lifecycle integration', async () => {
      const { 
        extractComputedValues,
        getInitialButtonState,
        executeClickHandler,
        isInLoadingState,
        shouldBlockInteraction
      } = await import('../LoadingButton');
      
      // Simulate complete component lifecycle
      const props = {
        buttonType: 'primary' as const,
        isLoading: false,
        disabled: false,
        sound: 'custom-click'
      };
      
      // 1. Initialize state
      const initialState = getInitialButtonState();
      expect(initialState.showRipple).toBe(false);
      
      // 2. Compute values
      const computedValues = extractComputedValues(
        props.buttonType,
        undefined,
        '',
        'button',
        props.isLoading,
        props.disabled
      );
      expect(computedValues.buttonClass).toBe('btn-primary');
      
      // 3. Check interaction state
      expect(shouldBlockInteraction(props.disabled, props.isLoading)).toBe(false);
      expect(isInLoadingState(props.isLoading)).toBe(false);
      
      // 4. Execute event handler
      const mockCallbacks = {
        playSound: jest.fn(),
        onClick: jest.fn(),
        handleRipple: jest.fn()
      };
      
      executeClickHandler(
        {} as any,
        props.sound,
        'click',
        props.disabled,
        props.isLoading,
        mockCallbacks.playSound,
        mockCallbacks.onClick,
        mockCallbacks.handleRipple
      );
      
      expect(mockCallbacks.playSound).toHaveBeenCalledWith('custom-click');
      expect(mockCallbacks.onClick).toHaveBeenCalled();
      expect(mockCallbacks.handleRipple).toHaveBeenCalled();
    });
  });
}); 
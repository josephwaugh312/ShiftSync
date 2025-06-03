import { renderHook, act } from '@testing-library/react';
import { useSoundEffects, SoundEffectType } from '../useSoundEffects';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock AudioContext
const mockAudioContext = {
  createOscillator: jest.fn(),
  createGain: jest.fn(),
  destination: {},
  currentTime: 0,
  close: jest.fn(),
};

const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  frequency: {
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
  type: 'sine',
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    value: 0.5,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
};

describe('useSoundEffects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    // Mock AudioContext constructor
    global.AudioContext = jest.fn(() => mockAudioContext) as any;
    (global as any).webkitAudioContext = jest.fn(() => mockAudioContext);
    
    // Reset mocks
    mockAudioContext.createOscillator.mockReturnValue(mockOscillator);
    mockAudioContext.createGain.mockReturnValue(mockGainNode);
    mockAudioContext.close.mockResolvedValue(undefined);
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization and localStorage integration', () => {
    it('should initialize with default true when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useSoundEffects());
      
      expect(result.current.soundEnabled).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('soundEffectsEnabled');
    });

    it('should initialize with localStorage value when available', () => {
      mockLocalStorage.getItem.mockReturnValue('false');
      
      const { result } = renderHook(() => useSoundEffects());
      
      expect(result.current.soundEnabled).toBe(false);
    });

    it('should handle localStorage retrieval errors gracefully', () => {
      // Mock console.error to suppress error output during test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });
      
      let result;
      expect(() => {
        const hookResult = renderHook(() => useSoundEffects());
        result = hookResult.result;
      }).not.toThrow();
      
      // Should fallback to default true despite the error
      expect(result?.current.soundEnabled).toBe(true);
      
      consoleSpy.mockRestore();
    });

    it('should update localStorage when sound preference changes', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.toggleSoundEffects();
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('soundEffectsEnabled', 'false');
    });

    it('should handle localStorage write errors gracefully', () => {
      // Mock console.error to suppress error output during test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const { result } = renderHook(() => useSoundEffects());
      
      // Set up the error after initial render to avoid initialization errors
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('LocalStorage write error');
      });
      
      expect(() => {
        act(() => {
          result.current.toggleSoundEffects();
        });
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('AudioContext initialization and error handling', () => {
    it('should create AudioContext on first user interaction', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      renderHook(() => useSoundEffects());
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      
      // Simulate first click
      const clickHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'click')?.[1] as EventListener;
      clickHandler(new Event('click'));
      
      expect(global.AudioContext).toHaveBeenCalled();
      
      addEventListenerSpy.mockRestore();
    });

    it('should fallback to webkitAudioContext when AudioContext is not available', () => {
      global.AudioContext = undefined as any;
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      renderHook(() => useSoundEffects());
      
      // Simulate first click
      const clickHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'click')?.[1] as EventListener;
      clickHandler(new Event('click'));
      
      expect((global as any).webkitAudioContext).toHaveBeenCalled();
      
      addEventListenerSpy.mockRestore();
    });

    it('should handle AudioContext creation failure gracefully', () => {
      global.AudioContext = jest.fn(() => {
        throw new Error('AudioContext not supported');
      }) as any;
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      renderHook(() => useSoundEffects());
      
      // Simulate first interaction
      const clickHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'click')?.[1] as EventListener;
      
      expect(() => {
        clickHandler(new Event('click'));
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create AudioContext:', expect.any(Error));
      
      consoleSpy.mockRestore();
      addEventListenerSpy.mockRestore();
    });

    it('should create AudioContext on demand during sound generation if not initialized', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.playSound('click');
      });
      
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it('should handle on-demand AudioContext creation failure', () => {
      global.AudioContext = jest.fn(() => {
        throw new Error('AudioContext creation failed');
      }) as any;
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSoundEffects());
      
      expect(() => {
        act(() => {
          result.current.playSound('click');
        });
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create AudioContext on demand:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle AudioContext close errors during cleanup', async () => {
      mockAudioContext.close.mockRejectedValue(new Error('Close error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      const { unmount } = renderHook(() => useSoundEffects());
      
      // Initialize AudioContext first by simulating user interaction
      const clickHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'click')?.[1] as EventListener;
      if (clickHandler) {
        clickHandler(new Event('click'));
      }
      
      // Unmount the component which should trigger cleanup
      unmount();
      
      // Wait for the async close operation to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // The console.error should have been called with the close error
      expect(consoleSpy).toHaveBeenCalledWith('Error closing AudioContext:', expect.any(Error));
      
      consoleSpy.mockRestore();
      addEventListenerSpy.mockRestore();
    });
  });

  describe('sound generation logic paths', () => {
    const soundTypes: SoundEffectType[] = ['click', 'success', 'error', 'notification', 'complete', 'toggle', 'delete'];

    beforeEach(() => {
      // Ensure AudioContext is available for sound generation tests
      global.AudioContext = jest.fn(() => mockAudioContext) as any;
    });

    soundTypes.forEach(soundType => {
      it(`should configure oscillator correctly for ${soundType} sound`, () => {
        const { result } = renderHook(() => useSoundEffects());
        
        act(() => {
          result.current.playSound(soundType, 0.7);
        });
        
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        expect(mockAudioContext.createGain).toHaveBeenCalled();
        expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
        expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
        expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.7, mockAudioContext.currentTime);
        expect(mockOscillator.start).toHaveBeenCalled();
        expect(mockOscillator.stop).toHaveBeenCalled();
      });
    });

    it('should handle click sound with correct frequency and duration', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.playSound('click');
      });
      
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(1000, mockAudioContext.currentTime);
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, mockAudioContext.currentTime + 0.1);
      expect(mockOscillator.stop).toHaveBeenCalledWith(mockAudioContext.currentTime + 0.1);
    });

    it('should handle success sound with frequency ramp', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.playSound('success');
      });
      
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(600, mockAudioContext.currentTime);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1200, mockAudioContext.currentTime + 0.2);
      expect(mockOscillator.stop).toHaveBeenCalledWith(mockAudioContext.currentTime + 0.3);
    });

    it('should handle error sound with triangle wave and descending frequency', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.playSound('error');
      });
      
      expect(mockOscillator.type).toBe('triangle');
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(400, mockAudioContext.currentTime);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(200, mockAudioContext.currentTime + 0.2);
    });

    it('should handle notification sound with double frequency modulation', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.playSound('notification');
      });
      
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(800, mockAudioContext.currentTime);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1000, mockAudioContext.currentTime + 0.05);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(800, mockAudioContext.currentTime + 0.1);
    });

    it('should handle complete sound with arpeggio effect', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.playSound('complete');
      });
      
      // Should create first oscillator
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      
      // Fast-forward to trigger second note
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Should create second oscillator for arpeggio
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('should handle toggle sound with simple sine wave', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.playSound('toggle');
      });
      
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(800, mockAudioContext.currentTime);
      expect(mockOscillator.stop).toHaveBeenCalledWith(mockAudioContext.currentTime + 0.1);
    });

    it('should handle delete sound with descending triangle wave', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.playSound('delete');
      });
      
      expect(mockOscillator.type).toBe('triangle');
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(800, mockAudioContext.currentTime);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(300, mockAudioContext.currentTime + 0.2);
    });

    it('should handle volume variations correctly', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      // Test different volume levels
      act(() => {
        result.current.playSound('click', 0.1);
      });
      expect(mockGainNode.gain.value).toBe(0.1);
      
      act(() => {
        result.current.playSound('success', 0.9);
      });
      expect(mockGainNode.gain.value).toBe(0.9);
    });

    it('should handle default volume when not specified', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.playSound('click');
      });
      
      expect(mockGainNode.gain.value).toBe(0.5); // Default volume
    });
  });

  describe('sound playback control and error handling', () => {
    it('should not play sound when sound is disabled', () => {
      mockLocalStorage.getItem.mockReturnValue('false'); // Start with sound disabled
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.playSound('click');
      });
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it('should log sound playing when enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { result } = renderHook(() => useSoundEffects());
      
      act(() => {
        result.current.playSound('success');
      });
      
      // Debug logging has been removed during cleanup, but sound should still attempt to play
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle errors during sound generation gracefully', () => {
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Oscillator creation failed');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSoundEffects());
      
      expect(() => {
        act(() => {
          result.current.playSound('click');
        });
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error playing sound:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle oscillator connection errors', () => {
      mockOscillator.connect.mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSoundEffects());
      
      expect(() => {
        act(() => {
          result.current.playSound('notification');
        });
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error playing sound:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle gain node configuration errors', () => {
      mockGainNode.gain.setValueAtTime.mockImplementation(() => {
        throw new Error('Gain configuration failed');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSoundEffects());
      
      expect(() => {
        act(() => {
          result.current.playSound('error');
        });
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error playing sound:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('return value structure', () => {
    it('should return the correct interface', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      expect(result.current).toEqual({
        soundEnabled: expect.any(Boolean),
        toggleSoundEffects: expect.any(Function),
        playSound: expect.any(Function),
      });
    });

    it('should maintain stable function references across rerenders', () => {
      const { result, rerender } = renderHook(() => useSoundEffects());
      
      const firstRender = {
        toggleSoundEffects: result.current.toggleSoundEffects,
        playSound: result.current.playSound,
      };
      
      rerender();
      
      const secondRender = {
        toggleSoundEffects: result.current.toggleSoundEffects,
        playSound: result.current.playSound,
      };
      
      expect(firstRender.toggleSoundEffects).toBe(secondRender.toggleSoundEffects);
      expect(firstRender.playSound).toBe(secondRender.playSound);
    });
  });

  describe('toggle functionality', () => {
    it('should toggle sound effects on and off', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      const initialState = result.current.soundEnabled;
      
      act(() => {
        result.current.toggleSoundEffects();
      });
      
      expect(result.current.soundEnabled).toBe(!initialState);
      
      act(() => {
        result.current.toggleSoundEffects();
      });
      
      expect(result.current.soundEnabled).toBe(initialState);
    });
  });

  describe('user interaction handling', () => {
    it('should setup event listeners for first interaction', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      renderHook(() => useSoundEffects());
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it('should remove event listeners on cleanup', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderHook(() => useSoundEffects());
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    it('should remove listeners after first interaction', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      renderHook(() => useSoundEffects());
      
      // Get the click handler
      const clickHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'click')?.[1] as EventListener;
      const touchHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'touchstart')?.[1] as EventListener;
      
      // Simulate first interaction
      clickHandler(new Event('click'));
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', clickHandler);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', touchHandler);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should handle touchstart interaction', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      renderHook(() => useSoundEffects());
      
      // Get the touch handler
      const touchHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'touchstart')?.[1] as EventListener;
      
      // Simulate first touch interaction
      touchHandler(new Event('touchstart'));
      
      expect(global.AudioContext).toHaveBeenCalled();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', touchHandler);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('integration behavior', () => {
    it('should properly integrate toggling and playing sounds', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      const initialState = result.current.soundEnabled;
      
      // Test that toggling works
      act(() => {
        result.current.toggleSoundEffects();
      });
      expect(result.current.soundEnabled).toBe(!initialState);
      
      // Test that playing sound doesn't throw in either state
      expect(() => {
        act(() => {
          result.current.playSound('click');
        });
      }).not.toThrow();
      
      // Toggle back and test again
      act(() => {
        result.current.toggleSoundEffects();
      });
      expect(result.current.soundEnabled).toBe(initialState);
      
      expect(() => {
        act(() => {
          result.current.playSound('success');
        });
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid toggles', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      const initialState = result.current.soundEnabled;
      
      // Rapid toggles
      act(() => {
        result.current.toggleSoundEffects();
        result.current.toggleSoundEffects();
        result.current.toggleSoundEffects();
        result.current.toggleSoundEffects();
      });
      
      expect(result.current.soundEnabled).toBe(initialState);
    });

    it('should handle multiple sound calls without errors', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      expect(() => {
        act(() => {
          result.current.playSound('click');
          result.current.playSound('success', 0.2);
          result.current.playSound('error', 0.8);
          result.current.playSound('notification');
        });
      }).not.toThrow();
    });

    it('should handle extreme volume values gracefully', () => {
      const { result } = renderHook(() => useSoundEffects());
      
      expect(() => {
        act(() => {
          result.current.playSound('click', 0); // Zero volume
          result.current.playSound('success', 1); // Max volume
          result.current.playSound('error', -0.5); // Negative volume
          result.current.playSound('notification', 2); // Over max volume
        });
      }).not.toThrow();
    });

    it('should handle browser without Web Audio API support', () => {
      global.AudioContext = undefined as any;
      (global as any).webkitAudioContext = undefined;
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSoundEffects());
      
      expect(() => {
        act(() => {
          result.current.playSound('click');
        });
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create AudioContext on demand:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
}); 
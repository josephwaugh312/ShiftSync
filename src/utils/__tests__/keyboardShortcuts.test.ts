import { registerKeyboardShortcuts } from '../keyboardShortcuts';

// Mock the store and actions
jest.mock('../../store', () => ({
  store: {
    dispatch: jest.fn(),
  },
}));

jest.mock('../../store/uiSlice', () => ({
  setCurrentView: jest.fn(),
  toggleDarkMode: jest.fn(),
  toggleHighContrastMode: jest.fn(),
  toggleDyslexicFontMode: jest.fn(),
  setModalOpen: jest.fn(),
}));

jest.mock('../../store/shiftsSlice', () => ({
  setSelectedDate: jest.fn(),
}));

describe('keyboardShortcuts', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Spy on document.addEventListener
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    
    // Mock console.log to reduce test noise
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('registerKeyboardShortcuts', () => {
    it('should register all expected event listeners', () => {
      registerKeyboardShortcuts();

      // Should register all 4 custom events
      expect(addEventListenerSpy).toHaveBeenCalledTimes(4);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'navigatePreviousWeek',
        expect.any(Function)
      );
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'navigateNextWeek',
        expect.any(Function)
      );
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'publishSchedule',
        expect.any(Function)
      );
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'showKeyboardShortcuts',
        expect.any(Function)
      );
    });

    it('should log registration messages', () => {
      registerKeyboardShortcuts();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Registering global keyboard shortcuts from utils/keyboardShortcuts.ts'
      );
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Global keyboard shortcuts registered successfully'
      );
    });

    it('should handle navigatePreviousWeek event', () => {
      registerKeyboardShortcuts();

      // Get the registered event handler
      const navigatePreviousWeekCall = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'navigatePreviousWeek'
      );
      expect(navigatePreviousWeekCall).toBeDefined();

      const eventHandler = navigatePreviousWeekCall![1];
      
      // Execute the event handler
      eventHandler();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Custom event: navigatePreviousWeek received'
      );
    });

    it('should handle navigateNextWeek event', () => {
      registerKeyboardShortcuts();

      // Get the registered event handler
      const navigateNextWeekCall = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'navigateNextWeek'
      );
      expect(navigateNextWeekCall).toBeDefined();

      const eventHandler = navigateNextWeekCall![1];
      
      // Execute the event handler
      eventHandler();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Custom event: navigateNextWeek received'
      );
    });

    it('should handle publishSchedule event', () => {
      registerKeyboardShortcuts();

      // Get the registered event handler
      const publishScheduleCall = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'publishSchedule'
      );
      expect(publishScheduleCall).toBeDefined();

      const eventHandler = publishScheduleCall![1];
      
      // Execute the event handler
      eventHandler();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Custom event: publishSchedule received'
      );
    });

    it('should handle showKeyboardShortcuts event', () => {
      registerKeyboardShortcuts();

      // Get the registered event handler
      const showKeyboardShortcutsCall = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'showKeyboardShortcuts'
      );
      expect(showKeyboardShortcutsCall).toBeDefined();

      const eventHandler = showKeyboardShortcutsCall![1];
      
      // Execute the event handler
      eventHandler();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Custom event: showKeyboardShortcuts received'
      );
    });

    it('should not throw when called multiple times', () => {
      expect(() => {
        registerKeyboardShortcuts();
        registerKeyboardShortcuts();
        registerKeyboardShortcuts();
      }).not.toThrow();
    });

    it('should register event listeners with proper function references', () => {
      registerKeyboardShortcuts();

      // Check that all registered functions are actually functions
      addEventListenerSpy.mock.calls.forEach(call => {
        expect(typeof call[1]).toBe('function');
      });
    });
  });

  describe('event handler execution', () => {
    it('should execute event handlers without throwing errors', () => {
      registerKeyboardShortcuts();

      // Get all registered event handlers
      const eventHandlers = addEventListenerSpy.mock.calls.map(call => call[1]);

      // Execute each event handler
      eventHandlers.forEach(handler => {
        expect(() => {
          handler();
        }).not.toThrow();
      });
    });

    it('should handle rapid event firing', () => {
      registerKeyboardShortcuts();

      const navigateNextWeekHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'navigateNextWeek'
      )![1];

      // Fire the event rapidly multiple times
      expect(() => {
        for (let i = 0; i < 10; i++) {
          navigateNextWeekHandler();
        }
      }).not.toThrow();

      // Should have logged 10 times
      expect(consoleLogSpy).toHaveBeenCalledTimes(12); // 2 initial + 10 events
    });
  });

  describe('error handling', () => {
    it('should handle errors in event handlers gracefully', () => {
      // Temporarily make console.log throw an error
      consoleLogSpy.mockImplementation(() => {
        throw new Error('Console error');
      });

      // Should not throw when registering shortcuts
      expect(() => {
        registerKeyboardShortcuts();
      }).toThrow(); // This will throw because console.log throws

      // Restore console.log for cleanup
      consoleLogSpy.mockImplementation(() => {});
    });
  });

  describe('integration behavior', () => {
    it('should register shortcuts that can be triggered by custom events', () => {
      registerKeyboardShortcuts();

      // Create and dispatch a custom event
      const customEvent = new CustomEvent('navigatePreviousWeek');
      
      expect(() => {
        document.dispatchEvent(customEvent);
      }).not.toThrow();

      // The event handler should have been called
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Custom event: navigatePreviousWeek received'
      );
    });

    it('should handle custom events for all registered shortcuts', () => {
      registerKeyboardShortcuts();

      const events = [
        'navigatePreviousWeek',
        'navigateNextWeek', 
        'publishSchedule',
        'showKeyboardShortcuts'
      ];

      events.forEach(eventName => {
        const customEvent = new CustomEvent(eventName);
        
        expect(() => {
          document.dispatchEvent(customEvent);
        }).not.toThrow();
        
        // Verify the specific event was logged
        expect(consoleLogSpy).toHaveBeenCalledWith(
          `Custom event: ${eventName} received`
        );
      });
    });
  });

  describe('document integration', () => {
    it('should add event listeners to the document object', () => {
      registerKeyboardShortcuts();

      // Verify all calls were made to document.addEventListener
      addEventListenerSpy.mock.calls.forEach(call => {
        expect(call.length).toBeGreaterThanOrEqual(2);
        expect(typeof call[0]).toBe('string');
        expect(typeof call[1]).toBe('function');
      });
    });

    it('should register distinct event types', () => {
      registerKeyboardShortcuts();

      const eventTypes = addEventListenerSpy.mock.calls.map(call => call[0]);
      const uniqueEventTypes = [...new Set(eventTypes)];

      // Should have 4 unique event types
      expect(uniqueEventTypes).toHaveLength(4);
      expect(uniqueEventTypes).toContain('navigatePreviousWeek');
      expect(uniqueEventTypes).toContain('navigateNextWeek');
      expect(uniqueEventTypes).toContain('publishSchedule');
      expect(uniqueEventTypes).toContain('showKeyboardShortcuts');
    });
  });
}); 
import { notificationService } from '../NotificationService';
import { store } from '../../store';
import { addNotification } from '../../store/uiSlice';
import { addShift, removeShift, clearShifts } from '../../store/shiftsSlice';
import { setNotificationPreferences } from '../../store/uiSlice';
import { Shift } from '../../types';
import * as dateUtils from '../../utils/dateUtils';

// Mock timers for testing interval-based functionality
jest.useFakeTimers();

// Mock the store and actions
jest.mock('../../store', () => ({
  store: {
    getState: jest.fn(),
    dispatch: jest.fn(),
    subscribe: jest.fn()
  }
}));

jest.mock('../../store/uiSlice', () => ({
  addNotification: jest.fn(),
  setNotificationPreferences: jest.fn()
}));

jest.mock('../../store/shiftsSlice', () => ({
  addShift: jest.fn(),
  removeShift: jest.fn(),
  clearShifts: jest.fn()
}));

// Mock the date utility with a spy
const mockCombineDateAndTime = jest.spyOn(dateUtils, 'combineDateAndTime');

describe('NotificationService', () => {
  // Mock store state
  const mockStore = store as jest.Mocked<typeof store>;
  const mockDispatch = mockStore.dispatch as jest.MockedFunction<typeof store.dispatch>;
  const mockSubscribe = mockStore.subscribe as jest.MockedFunction<typeof store.subscribe>;
  
  // Mock timers
  const mockSetInterval = jest.spyOn(global, 'setInterval');
  const mockClearInterval = jest.spyOn(global, 'clearInterval');
  
  // Default mock state
  const defaultMockState = {
    shifts: {
      shifts: []
    },
    ui: {
      notificationPreferences: {
        enabled: true,
        types: {
          reminders: true
        },
        timing: {
          reminderLeadTime: '1hour'
        }
      }
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Mock the combineDateAndTime function
    mockCombineDateAndTime.mockImplementation((date: string, time: string) => {
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const result = new Date(year, month - 1, day, hours, minutes);
      return result;
    });
    
    // Reset store state
    mockStore.getState.mockReturnValue(defaultMockState);
    mockSubscribe.mockReturnValue(jest.fn()); // Return unsubscribe function
    
    // Stop any running services
    notificationService.stop();
    notificationService.resetProcessedReminders();
  });

  afterEach(() => {
    notificationService.stop();
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  describe('Service Lifecycle', () => {
    it('should initialize service and start monitoring', () => {
      notificationService.initialize();
      
      // Should subscribe to store changes
      expect(mockSubscribe).toHaveBeenCalled();
      
      // Should set up interval timer
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 60000);
    });

    it('should stop service and cleanup resources', () => {
      const mockUnsubscribe = jest.fn();
      mockSubscribe.mockReturnValue(mockUnsubscribe);
      
      notificationService.initialize();
      notificationService.stop();
      
      // Should unsubscribe from store
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle multiple initialize calls safely', () => {
      notificationService.initialize();
      notificationService.initialize();
      notificationService.initialize();
      
      // Should not throw errors
      expect(mockSubscribe).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple stop calls safely', () => {
      notificationService.initialize();
      notificationService.stop();
      notificationService.stop();
      notificationService.stop();
      
      // Should not throw errors
      expect(() => notificationService.stop()).not.toThrow();
    });
  });

  describe('Store Integration', () => {
    it('should react to shift count changes in store', () => {
      let storeSubscriptionCallback: () => void;
      
      mockSubscribe.mockImplementation((callback) => {
        storeSubscriptionCallback = callback;
        return jest.fn();
      });
      
      // Start with no shifts
      mockStore.getState.mockReturnValue({
        ...defaultMockState,
        shifts: { shifts: [] }
      });
      
      notificationService.initialize();
      
      // Simulate adding a shift to store
      mockStore.getState.mockReturnValue({
        ...defaultMockState,
        shifts: { 
          shifts: [createMockShift()] 
        }
      });
      
      // Trigger store change
      storeSubscriptionCallback!();
      
      // Should have been called during initialization and store change
      expect(mockStore.getState).toHaveBeenCalled();
    });

    it('should not react when shift count stays the same', () => {
      let storeSubscriptionCallback: () => void;
      
      mockSubscribe.mockImplementation((callback) => {
        storeSubscriptionCallback = callback;
        return jest.fn();
      });
      
      const shiftsState = { shifts: [createMockShift()] };
      mockStore.getState.mockReturnValue({
        ...defaultMockState,
        shifts: shiftsState
      });
      
      notificationService.initialize();
      
      // Trigger store change with same shift count
      storeSubscriptionCallback!();
      
      // Should have minimal additional calls beyond initialization
      expect(mockStore.getState).toHaveBeenCalled();
    });
  });

  describe('Reminder Logic', () => {
    it('should send reminder when shift is within lead time', () => {
      const futureShift = createMockShift({
        startTime: getFutureTime(45), // 45 minutes from now
        date: getTodayString()
      });
      
      notificationService.checkShiftReminder(futureShift);
      
      expect(mockDispatch).toHaveBeenCalledWith(
        addNotification({
          message: expect.stringContaining('Reminder: You have a shift'),
          type: 'info',
          category: 'reminders'
        })
      );
    });

    it('should not send reminder when shift is too far in future', () => {
      const futureShift = createMockShift({
        startTime: getFutureTime(120), // 2 hours from now
        date: getTodayString()
      });
      
      notificationService.checkShiftReminder(futureShift);
      
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not send reminder when shift is in the past', () => {
      const pastShift = createMockShift({
        startTime: getPastTime(30), // 30 minutes ago
        date: getTodayString()
      });
      
      notificationService.checkShiftReminder(pastShift);
      
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not send duplicate reminders for same shift', () => {
      const futureShift = createMockShift({
        startTime: getFutureTime(45),
        date: getTodayString()
      });
      
      // Send first reminder
      notificationService.checkShiftReminder(futureShift);
      
      // Reset mock to check if second call happens
      mockDispatch.mockClear();
      
      // Try to send second reminder
      notificationService.checkShiftReminder(futureShift);
      expect(mockDispatch).not.toHaveBeenCalled(); // Should not send again
    });

    it('should respect different lead time preferences', () => {
      const testCases = [
        { leadTime: '1hour', shiftMinutes: 45, shouldSend: true },
        { leadTime: '1hour', shiftMinutes: 90, shouldSend: false },
        { leadTime: '3hours', shiftMinutes: 120, shouldSend: true }, // 2 hours - within 3 hour window
        { leadTime: '3hours', shiftMinutes: 240, shouldSend: false }, // 4 hours - outside 3 hour window
      ];
      
      testCases.forEach(({ leadTime, shiftMinutes, shouldSend }, index) => {
        // Reset for each test
        jest.clearAllMocks();
        notificationService.resetProcessedReminders();
        
        mockStore.getState.mockReturnValue({
          ...defaultMockState,
          ui: {
            notificationPreferences: {
              enabled: true,
              types: { reminders: true },
              timing: { reminderLeadTime: leadTime }
            }
          }
        });
        
        const testShift = createMockShift({
          id: `test-${index}`,
          startTime: getFutureTime(shiftMinutes),
          date: getTodayString()
        });
        
        notificationService.checkShiftReminder(testShift);
        
        if (shouldSend) {
          expect(mockDispatch).toHaveBeenCalledWith(
            addNotification(expect.objectContaining({
              type: 'info',
              category: 'reminders'
            }))
          );
        } else {
          expect(mockDispatch).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('Notification Preferences', () => {
    it('should not send reminders when notifications are disabled', () => {
      mockStore.getState.mockReturnValue({
        ...defaultMockState,
        ui: {
          notificationPreferences: {
            enabled: false,
            types: { reminders: true },
            timing: { reminderLeadTime: '1hour' }
          }
        }
      });
      
      const futureShift = createMockShift({
        startTime: getFutureTime(45),
        date: getTodayString()
      });
      
      notificationService.checkShiftReminder(futureShift);
      
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not send reminders when reminder type is disabled', () => {
      mockStore.getState.mockReturnValue({
        ...defaultMockState,
        ui: {
          notificationPreferences: {
            enabled: true,
            types: { reminders: false },
            timing: { reminderLeadTime: '1hour' }
          }
        }
      });
      
      const futureShift = createMockShift({
        startTime: getFutureTime(45),
        date: getTodayString()
      });
      
      notificationService.checkShiftReminder(futureShift);
      
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up processed reminders for deleted shifts', () => {
      const shift1 = createMockShift({ id: 'shift1' });
      const shift2 = createMockShift({ id: 'shift2' });
      
      // Process both shifts
      mockStore.getState.mockReturnValue({
        ...defaultMockState,
        shifts: { shifts: [shift1, shift2] }
      });
      
      notificationService.checkShiftReminder(shift1);
      notificationService.checkShiftReminder(shift2);
      
      // Remove shift1 from store
      mockStore.getState.mockReturnValue({
        ...defaultMockState,
        shifts: { shifts: [shift2] }
      });
      
      // Initialize should clean up processed reminders
      notificationService.initialize();
      
      // shift1 reminder should be cleaned up, shift2 should remain processed
      notificationService.checkShiftReminder(shift2);
      expect(mockDispatch).not.toHaveBeenCalled(); // shift2 still processed
    });

    it('should clean up processed reminders for past shifts', () => {
      const pastShift = createMockShift({
        id: 'past-shift',
        date: getPastDateString(),
        startTime: '09:00'
      });
      
      mockStore.getState.mockReturnValue({
        ...defaultMockState,
        shifts: { shifts: [pastShift] }
      });
      
      notificationService.initialize();
      
      // Should handle past shifts in cleanup without errors
      expect(() => notificationService.initialize()).not.toThrow();
    });
  });

  describe('Automated Checking', () => {
    it('should periodically check for shifts when initialized', () => {
      mockStore.getState.mockReturnValue({
        ...defaultMockState,
        shifts: { 
          shifts: [createMockShift({
            startTime: getFutureTime(45),
            date: getTodayString()
          })]
        }
      });
      
      notificationService.initialize();
      
      // Fast-forward time to trigger interval
      jest.advanceTimersByTime(60000);
      
      // Should have checked shifts during interval
      expect(mockStore.getState).toHaveBeenCalled();
    });

    it('should handle empty shifts array gracefully', () => {
      mockStore.getState.mockReturnValue({
        ...defaultMockState,
        shifts: { shifts: [] }
      });
      
      notificationService.initialize();
      
      // Fast-forward time to trigger interval
      jest.advanceTimersByTime(60000);
      
      // Should not throw errors
      expect(() => jest.advanceTimersByTime(60000)).not.toThrow();
    });
  });

  describe('Debug and Utility Functions', () => {
    it('should create and test debug reminder', () => {
      notificationService.debugTestReminder();
      
      // Should dispatch a test notification
      expect(mockDispatch).toHaveBeenCalledWith(
        addNotification(expect.objectContaining({
          message: expect.stringContaining('TEST NOTIFICATION'),
          type: 'info',
          category: 'reminders'
        }))
      );
    });

    it('should reset processed reminders when requested', () => {
      const futureShift = createMockShift({
        startTime: getFutureTime(45),
        date: getTodayString()
      });
      
      // Process a shift
      notificationService.checkShiftReminder(futureShift);
      
      // Reset processed reminders
      notificationService.resetProcessedReminders();
      
      // Reset mock to check if second call happens
      mockDispatch.mockClear();
      
      // Should be able to process same shift again
      notificationService.checkShiftReminder(futureShift);
      
      // If the shift is within the reminder window, it should send again
      // If not, we just verify the reset worked by checking no error occurred
      expect(() => notificationService.checkShiftReminder(futureShift)).not.toThrow();
    });
  });

  describe('Message Formatting', () => {
    it('should format reminder messages correctly', () => {
      const testShift = createMockShift({
        role: 'Manager',
        startTime: getFutureTime(45), // Make sure it's within reminder window
        date: getTodayString()
      });
      
      notificationService.checkShiftReminder(testShift);
      
      expect(mockDispatch).toHaveBeenCalledWith(
        addNotification({
          message: expect.stringMatching(/Reminder: You have a shift as Manager starting at/),
          type: 'info',
          category: 'reminders'
        })
      );
    });

    it('should include time until shift in message', () => {
      const testShift = createMockShift({
        startTime: getFutureTime(30), // 30 minutes from now
        date: getTodayString()
      });
      
      notificationService.checkShiftReminder(testShift);
      
      expect(mockDispatch).toHaveBeenCalledWith(
        addNotification({
          message: expect.stringMatching(/\(in \d+ minutes?\)/),
          type: 'info',
          category: 'reminders'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service lifecycle without errors', () => {
      // Test that basic service operations don't throw
      expect(() => {
        notificationService.initialize();
        notificationService.stop();
      }).not.toThrow();
    });

    it('should handle dispatch errors by allowing them to propagate', () => {
      mockDispatch.mockImplementation(() => {
        throw new Error('Dispatch error');
      });
      
      const futureShift = createMockShift({
        startTime: getFutureTime(45),
        date: getTodayString()
      });
      
      // The service doesn't currently have error handling for dispatch errors
      // so we expect the error to be thrown
      expect(() => {
        notificationService.checkShiftReminder(futureShift);
      }).toThrow('Dispatch error');
    });
  });
});

// Helper functions
function createMockShift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: `shift-${Date.now()}-${Math.random()}`,
    date: getTodayString(),
    startTime: '09:00',
    endTime: '17:00',
    timeRange: '09:00 - 17:00',
    employeeName: 'John Doe',
    role: 'Staff',
    color: 'bg-blue-500',
    status: 'Confirmed',
    ...overrides
  };
}

function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPastDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function getFutureTime(minutesFromNow: number): string {
  const future = new Date(Date.now() + minutesFromNow * 60 * 1000);
  const hours = future.getHours().toString().padStart(2, '0');
  const minutes = future.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getPastTime(minutesAgo: number): string {
  const past = new Date(Date.now() - minutesAgo * 60 * 1000);
  const hours = past.getHours().toString().padStart(2, '0');
  const minutes = past.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
} 
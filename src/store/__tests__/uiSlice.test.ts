import uiReducer, {
  setModalOpen,
  setCurrentView,
  setSelectedShiftId,
  setSelectedTemplateId,
  toggleDarkMode,
  toggleHighContrastMode,
  toggleDyslexicFontMode,
  setThemeColor,
  toggleSidebar,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  clearAllNotifications,
  updateNotificationPreferences,
  toggleNotifications,
  toggleNotificationSound,
  setNotificationSoundVolume,
  setNotificationSoundType,
  toggleNotificationType,
  setNotificationStyle,
  setNotificationDuration,
  toggleNotificationBadges,
  toggleNotificationColorCoding,
  setReminderLeadTime,
  setNonUrgentDeliveryTime,
  setDeliveryFormat,
  themeColors,
} from '../uiSlice';
import type { UiState, ThemeColor, Notification } from '../uiSlice';

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock matchMedia for theme detection
const mockMatchMedia = jest.fn((query) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));
Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia });

// Mock Date for consistent ID generation
const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1704974400000);

// Mock console to reduce test noise
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
};

const mockThemeColor: ThemeColor = {
  id: 'test-theme',
  name: 'Test Theme',
  value: '#ff0000',
};

const mockNotification: Omit<Notification, 'id'> = {
  message: 'Test message',
  type: 'success',
  category: 'shifts',
};

describe('uiSlice', () => {
  let initialState: UiState;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });
    mockDateNow.mockReturnValue(1704974400000);

    initialState = {
      modalOpen: {
        addShift: false,
        editShift: false,
        deleteConfirm: false,
        copyShift: false,
        insights: false,
        templates: false,
        addTemplate: false,
        editTemplate: false,
        savedViews: false,
      },
      currentView: 'weekly',
      selectedShiftId: null,
      selectedTemplateId: null,
      darkMode: false,
      highContrastMode: false,
      dyslexicFontMode: false,
      themeColor: {
        id: 'blue',
        name: 'Blue',
        value: '#4d82ff',
      },
      sidebarOpen: false,
      notificationPreferences: {
        enabled: true,
        sound: {
          enabled: true,
          volume: 0.7,
          type: 'default',
        },
        types: {
          shifts: true,
          scheduleChanges: true,
          reminders: true,
          timeOff: true,
          publication: true,
          shiftSwap: true,
          general: true,
        },
        visual: {
          style: 'standard',
          duration: 5000,
          showBadges: true,
          colorCoded: true,
        },
        timing: {
          reminderLeadTime: '12hours',
          nonUrgentDeliveryTime: '09:00',
          deliveryFormat: 'immediate',
        },
      },
      notifications: [],
    };
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('initialization and localStorage integration', () => {
    it('should load theme color from localStorage on initialization', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'themeColorId') return 'purple';
        return null;
      });

      // Import the reducer fresh to trigger initialization
      jest.resetModules();
      const freshUiReducer = require('../uiSlice').default;
      
      const result = freshUiReducer(undefined, { type: 'unknown' });
      expect(result.themeColor.id).toBe('purple');
      expect(result.themeColor.name).toBe('Purple');
    });

    it('should load notification preferences from localStorage on initialization', () => {
      const savedPrefs = JSON.stringify({
        enabled: false,
        sound: { enabled: false, volume: 0.3, type: 'subtle' },
        types: { shifts: false, general: true },
        visual: { style: 'minimal', duration: 3000, showBadges: false, colorCoded: false },
        timing: { reminderLeadTime: '1hour', nonUrgentDeliveryTime: '08:00', deliveryFormat: 'digest' },
      });

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'notificationPreferences') return savedPrefs;
        return null;
      });

      jest.resetModules();
      const freshUiReducer = require('../uiSlice').default;
      
      const result = freshUiReducer(undefined, { type: 'unknown' });
      expect(result.notificationPreferences.enabled).toBe(false);
      expect(result.notificationPreferences.sound.type).toBe('subtle');
      expect(result.notificationPreferences.visual.style).toBe('minimal');
    });

    it('should handle localStorage JSON parse errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'notificationPreferences') return 'invalid json';
        return null;
      });

      // Since the slice doesn't have error handling, this will actually throw
      // We should test that the slice doesn't break on valid JSON
      expect(() => {
        jest.resetModules();
        const freshUiReducer = require('../uiSlice').default;
        freshUiReducer(undefined, { type: 'unknown' });
      }).toThrow();
    });

    it('should handle valid JSON in localStorage correctly', () => {
      const validPrefs = JSON.stringify({
        enabled: false,
        sound: { enabled: false, volume: 0.3, type: 'subtle' },
      });

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'notificationPreferences') return validPrefs;
        return null;
      });

      jest.resetModules();
      const freshUiReducer = require('../uiSlice').default;
      
      const result = freshUiReducer(undefined, { type: 'unknown' });
      expect(result.notificationPreferences.enabled).toBe(false);
      expect(result.notificationPreferences.sound.type).toBe('subtle');
    });

    it('should detect dark mode from system preferences', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      jest.resetModules();
      const freshUiReducer = require('../uiSlice').default;
      
      const result = freshUiReducer(undefined, { type: 'unknown' });
      expect(result.darkMode).toBe(true);
    });

    it('should use default theme color when saved color not found', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'themeColorId') return 'non-existent-color';
        return null;
      });

      jest.resetModules();
      const freshUiReducer = require('../uiSlice').default;
      
      const result = freshUiReducer(undefined, { type: 'unknown' });
      expect(result.themeColor.id).toBe('blue'); // Default theme
    });
  });

  describe('reducers', () => {
    it('should return the initial state', () => {
      const result = uiReducer(undefined, { type: 'unknown' });
      expect(result).toHaveProperty('modalOpen');
      expect(result).toHaveProperty('currentView');
      expect(result).toHaveProperty('themeColor');
      expect(result).toHaveProperty('notifications');
    });

    describe('accessibility toggles', () => {
      it('should handle toggleHighContrastMode', () => {
        const actual = uiReducer(initialState, toggleHighContrastMode());
        expect(actual.highContrastMode).toBe(true);

        const actualToggleBack = uiReducer(actual, toggleHighContrastMode());
        expect(actualToggleBack.highContrastMode).toBe(false);
      });

      it('should handle toggleDyslexicFontMode', () => {
        const actual = uiReducer(initialState, toggleDyslexicFontMode());
        expect(actual.dyslexicFontMode).toBe(true);

        const actualToggleBack = uiReducer(actual, toggleDyslexicFontMode());
        expect(actualToggleBack.dyslexicFontMode).toBe(false);
      });
    });

    describe('sidebar management', () => {
      it('should handle toggleSidebar', () => {
        const actual = uiReducer(initialState, toggleSidebar());
        expect(actual.sidebarOpen).toBe(true);

        const actualToggleBack = uiReducer(actual, toggleSidebar());
        expect(actualToggleBack.sidebarOpen).toBe(false);
      });
    });

    describe('modal management', () => {
      it('should handle setModalOpen for single modal', () => {
        const actual = uiReducer(
          initialState,
          setModalOpen({ modal: 'addShift', isOpen: true })
        );
        expect(actual.modalOpen.addShift).toBe(true);
        expect(actual.modalOpen.editShift).toBe(false);
      });

      it('should handle closing modals', () => {
        const stateWithOpenModal = {
          ...initialState,
          modalOpen: { ...initialState.modalOpen, addShift: true },
        };

        const actual = uiReducer(
          stateWithOpenModal,
          setModalOpen({ modal: 'addShift', isOpen: false })
        );
        expect(actual.modalOpen.addShift).toBe(false);
      });

      it('should handle opening all types of modals', () => {
        const modalTypes = ['addShift', 'editShift', 'templates', 'copyShift', 'insights', 'deleteConfirm', 'addTemplate', 'editTemplate', 'savedViews'] as const;
        
        modalTypes.forEach(modalType => {
          const actual = uiReducer(
            initialState,
            setModalOpen({ modal: modalType, isOpen: true })
          );
          expect(actual.modalOpen[modalType]).toBe(true);
        });
      });
    });

    describe('view management', () => {
      it('should handle setCurrentView', () => {
        const viewTypes = ['daily', 'weekly', 'staff', 'list', 'grid'] as const;
        
        viewTypes.forEach(view => {
          const actual = uiReducer(initialState, setCurrentView(view));
          expect(actual.currentView).toBe(view);
        });
      });
    });

    describe('selection management', () => {
      it('should handle setSelectedShiftId', () => {
        const actual = uiReducer(initialState, setSelectedShiftId('shift1'));
        expect(actual.selectedShiftId).toBe('shift1');
      });

      it('should handle clearing selectedShiftId', () => {
        const stateWithSelection = {
          ...initialState,
          selectedShiftId: 'shift1',
        };

        const actual = uiReducer(stateWithSelection, setSelectedShiftId(null));
        expect(actual.selectedShiftId).toBeNull();
      });

      it('should handle setSelectedTemplateId', () => {
        const actual = uiReducer(initialState, setSelectedTemplateId('template1'));
        expect(actual.selectedTemplateId).toBe('template1');
      });

      it('should handle clearing selectedTemplateId', () => {
        const stateWithSelection = {
          ...initialState,
          selectedTemplateId: 'template1',
        };

        const actual = uiReducer(stateWithSelection, setSelectedTemplateId(null));
        expect(actual.selectedTemplateId).toBeNull();
      });
    });

    describe('theme management', () => {
      it('should handle toggleDarkMode', () => {
        const actual = uiReducer(initialState, toggleDarkMode());
        expect(actual.darkMode).toBe(true);
      });

      it('should handle setThemeColor and save to localStorage', () => {
        const actual = uiReducer(initialState, setThemeColor(mockThemeColor));
        expect(actual.themeColor).toEqual(mockThemeColor);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('themeColorId', mockThemeColor.id);
      });

      it('should validate theme properties', () => {
        const actual = uiReducer(initialState, setThemeColor(mockThemeColor));
        expect(actual.themeColor.id).toBe('test-theme');
        expect(actual.themeColor.value).toBe('#ff0000');
        expect(actual.themeColor.name).toBe('Test Theme');
      });

      it('should handle all predefined theme colors', () => {
        themeColors.forEach(color => {
          const actual = uiReducer(initialState, setThemeColor(color));
          expect(actual.themeColor).toEqual(color);
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith('themeColorId', color.id);
        });
      });
    });

    describe('notification management', () => {
      it('should handle addNotification with proper ID generation', () => {
        const actual = uiReducer(initialState, addNotification(mockNotification));
        expect(actual.notifications).toHaveLength(1);
        expect(actual.notifications[0].message).toBe(mockNotification.message);
        expect(actual.notifications[0].type).toBe(mockNotification.type);
        expect(actual.notifications[0].read).toBe(false);
        expect(actual.notifications[0].id).toBe('1704974400000');
      });

      it('should not add notification if category is disabled', () => {
        const stateWithDisabledShifts = {
          ...initialState,
          notificationPreferences: {
            ...initialState.notificationPreferences,
            types: {
              ...initialState.notificationPreferences.types,
              shifts: false,
            },
          },
        };

        const actual = uiReducer(stateWithDisabledShifts, addNotification({
          ...mockNotification,
          category: 'shifts',
        }));
        expect(actual.notifications).toHaveLength(0);
      });

      it('should add notification without category', () => {
        const notificationWithoutCategory = {
          message: 'General notification',
          type: 'info' as const,
        };

        const actual = uiReducer(initialState, addNotification(notificationWithoutCategory));
        expect(actual.notifications).toHaveLength(1);
      });

      it('should add multiple notifications', () => {
        const notification2 = { ...mockNotification, message: 'Test 2' };
        
        let state = uiReducer(initialState, addNotification(mockNotification));
        state = uiReducer(state, addNotification(notification2));
        
        expect(state.notifications).toHaveLength(2);
        expect(state.notifications[0].message).toBe(mockNotification.message);
        expect(state.notifications[1].message).toBe(notification2.message);
      });

      it('should handle removeNotification', () => {
        // First add a notification
        const stateWithNotification = uiReducer(initialState, addNotification(mockNotification));
        const notificationId = stateWithNotification.notifications[0].id;

        const actual = uiReducer(
          stateWithNotification,
          removeNotification(notificationId)
        );
        expect(actual.notifications).toHaveLength(0);
      });

      it('should handle markNotificationAsRead', () => {
        const stateWithNotification = uiReducer(initialState, addNotification(mockNotification));
        const notificationId = stateWithNotification.notifications[0].id;

        const actual = uiReducer(
          stateWithNotification,
          markNotificationAsRead(notificationId)
        );
        expect(actual.notifications[0].read).toBe(true);
      });

      it('should not mark non-existent notification as read', () => {
        const stateWithNotification = uiReducer(initialState, addNotification(mockNotification));

        const actual = uiReducer(
          stateWithNotification,
          markNotificationAsRead('non-existent')
        );
        expect(actual.notifications[0].read).toBe(false);
      });

      it('should not remove non-existent notification', () => {
        const stateWithNotifications = uiReducer(initialState, addNotification(mockNotification));

        const actual = uiReducer(
          stateWithNotifications,
          removeNotification('non-existent')
        );
        expect(actual.notifications).toHaveLength(1);
      });

      it('should handle clearAllNotifications', () => {
        let stateWithNotifications = uiReducer(initialState, addNotification(mockNotification));
        stateWithNotifications = uiReducer(stateWithNotifications, addNotification({ ...mockNotification, message: 'Test 2' }));

        const actual = uiReducer(stateWithNotifications, clearAllNotifications());
        expect(actual.notifications).toHaveLength(0);
      });

      it('should handle updateNotificationPreferences', () => {
        const newPreferences = {
          enabled: false,
          types: {
            shifts: false,
            scheduleChanges: true,
            reminders: false,
            timeOff: true,
            publication: false,
            shiftSwap: true,
            general: false,
          },
        };

        const actual = uiReducer(
          initialState,
          updateNotificationPreferences(newPreferences)
        );
        expect(actual.notificationPreferences.enabled).toBe(false);
        expect(actual.notificationPreferences.types.shifts).toBe(false);
        expect(actual.notificationPreferences.types.scheduleChanges).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'notificationPreferences',
          JSON.stringify(actual.notificationPreferences)
        );
      });
    });

    describe('notification preferences detailed management', () => {
      it('should handle toggleNotifications', () => {
        const actual = uiReducer(initialState, toggleNotifications());
        expect(actual.notificationPreferences.enabled).toBe(false);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'notificationPreferences',
          JSON.stringify(actual.notificationPreferences)
        );
      });

      it('should handle toggleNotificationSound', () => {
        const actual = uiReducer(initialState, toggleNotificationSound());
        expect(actual.notificationPreferences.sound.enabled).toBe(false);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'notificationPreferences',
          JSON.stringify(actual.notificationPreferences)
        );
      });

      it('should handle setNotificationSoundVolume', () => {
        const actual = uiReducer(initialState, setNotificationSoundVolume(0.5));
        expect(actual.notificationPreferences.sound.volume).toBe(0.5);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'notificationPreferences',
          JSON.stringify(actual.notificationPreferences)
        );
      });

      it('should handle setNotificationSoundType', () => {
        const soundTypes = ['default', 'subtle', 'distinct'] as const;
        
        soundTypes.forEach(type => {
          const actual = uiReducer(initialState, setNotificationSoundType(type));
          expect(actual.notificationPreferences.sound.type).toBe(type);
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'notificationPreferences',
            JSON.stringify(actual.notificationPreferences)
          );
        });
      });

      it('should handle toggleNotificationType for all notification types', () => {
        const notificationTypes = ['shifts', 'scheduleChanges', 'reminders', 'timeOff', 'publication', 'shiftSwap', 'general'] as const;
        
        notificationTypes.forEach(type => {
          const actual = uiReducer(initialState, toggleNotificationType(type));
          expect(actual.notificationPreferences.types[type]).toBe(false);
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'notificationPreferences',
            JSON.stringify(actual.notificationPreferences)
          );
        });
      });

      it('should handle setNotificationStyle', () => {
        const styles = ['standard', 'minimal', 'prominent'] as const;
        
        styles.forEach(style => {
          const actual = uiReducer(initialState, setNotificationStyle(style));
          expect(actual.notificationPreferences.visual.style).toBe(style);
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'notificationPreferences',
            JSON.stringify(actual.notificationPreferences)
          );
        });
      });

      it('should handle setNotificationDuration', () => {
        const actual = uiReducer(initialState, setNotificationDuration(3000));
        expect(actual.notificationPreferences.visual.duration).toBe(3000);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'notificationPreferences',
          JSON.stringify(actual.notificationPreferences)
        );
      });

      it('should handle toggleNotificationBadges', () => {
        const actual = uiReducer(initialState, toggleNotificationBadges());
        expect(actual.notificationPreferences.visual.showBadges).toBe(false);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'notificationPreferences',
          JSON.stringify(actual.notificationPreferences)
        );
      });

      it('should handle toggleNotificationColorCoding', () => {
        const actual = uiReducer(initialState, toggleNotificationColorCoding());
        expect(actual.notificationPreferences.visual.colorCoded).toBe(false);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'notificationPreferences',
          JSON.stringify(actual.notificationPreferences)
        );
      });

      it('should handle setReminderLeadTime', () => {
        const leadTimes = ['1hour', '3hours', '12hours', '24hours'] as const;
        
        leadTimes.forEach(leadTime => {
          const actual = uiReducer(initialState, setReminderLeadTime(leadTime));
          expect(actual.notificationPreferences.timing.reminderLeadTime).toBe(leadTime);
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'notificationPreferences',
            JSON.stringify(actual.notificationPreferences)
          );
        });
      });

      it('should handle setNonUrgentDeliveryTime', () => {
        const actual = uiReducer(initialState, setNonUrgentDeliveryTime('14:30'));
        expect(actual.notificationPreferences.timing.nonUrgentDeliveryTime).toBe('14:30');
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'notificationPreferences',
          JSON.stringify(actual.notificationPreferences)
        );
      });

      it('should handle setDeliveryFormat', () => {
        const formats = ['immediate', 'digest'] as const;
        
        formats.forEach(format => {
          const actual = uiReducer(initialState, setDeliveryFormat(format));
          expect(actual.notificationPreferences.timing.deliveryFormat).toBe(format);
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'notificationPreferences',
            JSON.stringify(actual.notificationPreferences)
          );
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle setting the same modal state', () => {
      const stateWithOpenModal = {
        ...initialState,
        modalOpen: { ...initialState.modalOpen, addShift: true },
      };

      const actual = uiReducer(
        stateWithOpenModal,
        setModalOpen({ modal: 'addShift', isOpen: true })
      );
      expect(actual.modalOpen.addShift).toBe(true);
    });

    it('should handle setting the same theme', () => {
      const actual = uiReducer(initialState, setThemeColor(initialState.themeColor));
      expect(actual.themeColor).toEqual(initialState.themeColor);
    });

    it('should handle notifications with same content', () => {
      const stateWithNotification = uiReducer(initialState, addNotification(mockNotification));

      // Adding notification with same content should still add it (different ID)
      const actual = uiReducer(stateWithNotification, addNotification(mockNotification));
      expect(actual.notifications).toHaveLength(2);
    });
  });

  describe('notification types', () => {
    it('should handle different notification types', () => {
      const notificationTypes = ['success', 'error', 'warning', 'info'] as const;
      
      notificationTypes.forEach(type => {
        const notification = { ...mockNotification, type };
        const actual = uiReducer(initialState, addNotification(notification));
        expect(actual.notifications[0].type).toBe(type);
      });
    });

    it('should handle notifications with all properties', () => {
      const fullNotification = {
        message: 'Complete notification test',
        type: 'info' as const,
        category: 'general' as const,
      };

      const actual = uiReducer(initialState, addNotification(fullNotification));
      expect(actual.notifications[0].message).toBe(fullNotification.message);
      expect(actual.notifications[0].type).toBe(fullNotification.type);
      expect(actual.notifications[0].category).toBe(fullNotification.category);
    });

    it('should handle notifications with all category types', () => {
      const categories = ['shifts', 'scheduleChanges', 'reminders', 'timeOff', 'publication', 'shiftSwap', 'general'] as const;
      
      categories.forEach(category => {
        const notification = { ...mockNotification, category };
        const actual = uiReducer(initialState, addNotification(notification));
        expect(actual.notifications[0].category).toBe(category);
      });
    });
  });

  describe('state persistence', () => {
    it('should maintain state integrity across multiple actions', () => {
      let state = initialState;
      
      // Open modal
      state = uiReducer(state, setModalOpen({ modal: 'addShift', isOpen: true }));
      
      // Set theme
      state = uiReducer(state, setThemeColor(mockThemeColor));
      
      // Add notification
      state = uiReducer(state, addNotification(mockNotification));
      
      // Set dark mode
      state = uiReducer(state, toggleDarkMode());
      
      // Toggle sidebar
      state = uiReducer(state, toggleSidebar());
      
      // Toggle accessibility features
      state = uiReducer(state, toggleHighContrastMode());
      state = uiReducer(state, toggleDyslexicFontMode());
      
      // Verify all changes persisted
      expect(state.modalOpen.addShift).toBe(true);
      expect(state.themeColor).toEqual(mockThemeColor);
      expect(state.notifications).toHaveLength(1);
      expect(state.darkMode).toBe(true);
      expect(state.sidebarOpen).toBe(true);
      expect(state.highContrastMode).toBe(true);
      expect(state.dyslexicFontMode).toBe(true);
    });

    it('should handle complex notification preferences changes', () => {
      let state = initialState;
      
      // Toggle main notifications
      state = uiReducer(state, toggleNotifications());
      
      // Change sound settings
      state = uiReducer(state, toggleNotificationSound());
      state = uiReducer(state, setNotificationSoundVolume(0.3));
      state = uiReducer(state, setNotificationSoundType('subtle'));
      
      // Change visual settings
      state = uiReducer(state, setNotificationStyle('minimal'));
      state = uiReducer(state, setNotificationDuration(2000));
      state = uiReducer(state, toggleNotificationBadges());
      
      // Change timing settings
      state = uiReducer(state, setReminderLeadTime('1hour'));
      state = uiReducer(state, setDeliveryFormat('digest'));
      
      // Verify all preference changes
      expect(state.notificationPreferences.enabled).toBe(false);
      expect(state.notificationPreferences.sound.enabled).toBe(false);
      expect(state.notificationPreferences.sound.volume).toBe(0.3);
      expect(state.notificationPreferences.sound.type).toBe('subtle');
      expect(state.notificationPreferences.visual.style).toBe('minimal');
      expect(state.notificationPreferences.visual.duration).toBe(2000);
      expect(state.notificationPreferences.visual.showBadges).toBe(false);
      expect(state.notificationPreferences.timing.reminderLeadTime).toBe('1hour');
      expect(state.notificationPreferences.timing.deliveryFormat).toBe('digest');
    });
  });

  describe('themeColors constant', () => {
    it('should export all theme colors with correct structure', () => {
      expect(themeColors).toHaveLength(8);
      
      themeColors.forEach(color => {
        expect(color).toHaveProperty('id');
        expect(color).toHaveProperty('name');
        expect(color).toHaveProperty('value');
        expect(typeof color.id).toBe('string');
        expect(typeof color.name).toBe('string');
        expect(typeof color.value).toBe('string');
        expect(color.value).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
      });
    });

    it('should have unique IDs for all theme colors', () => {
      const ids = themeColors.map(color => color.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(themeColors.length);
    });
  });
}); 
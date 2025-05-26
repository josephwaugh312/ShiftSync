import uiReducer, {
  setModalOpen,
  setCurrentView,
  setSelectedShiftId,
  setSelectedTemplateId,
  toggleDarkMode,
  setThemeColor,
  addNotification,
  removeNotification,
  clearAllNotifications,
  updateNotificationPreferences,
} from '../uiSlice';
import type { UiState, ThemeColor, Notification } from '../uiSlice';

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

const mockShift = {
  id: 'shift1',
  employeeName: 'John Doe',
  date: '2024-01-15',
  startTime: '09:00',
  endTime: '17:00',
  role: 'Manager',
  timeRange: '9:00 AM - 5:00 PM',
  status: 'scheduled' as const,
  color: '#2563eb',
};

const mockEmployee = {
  id: 'emp1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0101',
  role: 'Manager',
  avatar: '',
  isActive: true,
};

describe('uiSlice', () => {
  let initialState: UiState;

  beforeEach(() => {
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

  describe('reducers', () => {
    it('should return the initial state', () => {
      const result = uiReducer(undefined, { type: 'unknown' });
      expect(result).toHaveProperty('modalOpen');
      expect(result).toHaveProperty('currentView');
      expect(result).toHaveProperty('themeColor');
      expect(result).toHaveProperty('notifications');
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
        const modalTypes = ['addShift', 'editShift', 'templates', 'copyShift', 'insights'] as const;
        
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
        const viewTypes = ['daily', 'weekly', 'staff'] as const;
        
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

      it('should handle setThemeColor', () => {
        const actual = uiReducer(initialState, setThemeColor(mockThemeColor));
        expect(actual.themeColor).toEqual(mockThemeColor);
      });

      it('should validate theme properties', () => {
        const actual = uiReducer(initialState, setThemeColor(mockThemeColor));
        expect(actual.themeColor.id).toBe('test-theme');
        expect(actual.themeColor.value).toBe('#ff0000');
        expect(actual.themeColor.name).toBe('Test Theme');
      });
    });

    describe('notification management', () => {
      it('should handle addNotification', () => {
        const actual = uiReducer(initialState, addNotification(mockNotification));
        expect(actual.notifications).toHaveLength(1);
        expect(actual.notifications[0].message).toBe(mockNotification.message);
        expect(actual.notifications[0].type).toBe(mockNotification.type);
        expect(actual.notifications[0].read).toBe(false);
        expect(actual.notifications[0].id).toBeDefined();
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
      
      // Verify all changes persisted
      expect(state.modalOpen.addShift).toBe(true);
      expect(state.themeColor).toEqual(mockThemeColor);
      expect(state.notifications).toHaveLength(1);
      expect(state.darkMode).toBe(true);
    });
  });
}); 
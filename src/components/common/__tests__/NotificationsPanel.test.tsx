import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NotificationsPanel from '../NotificationsPanel';
import uiSlice from '../../../store/uiSlice';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layout, initial, animate, exit, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock sound effects
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

// Mock timers
jest.useFakeTimers();

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      ui: uiSlice,
    },
    preloadedState: {
      ui: {
        darkMode: false,
        highContrastMode: false,
        dyslexicFontMode: false,
        themeColor: { name: 'Blue', value: '#4d82ff', id: 'blue' },
        sidebarOpen: false,
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
        currentView: 'weekly' as const,
        notifications: [],
        selectedShiftId: null,
        selectedTemplateId: null,
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
        ...initialState,
      },
    },
  });
};

const renderWithProviders = (overrides = {}) => {
  const store = createMockStore(overrides);
  return {
    ...render(
      <Provider store={store}>
        <NotificationsPanel />
      </Provider>
    ),
    store,
  };
};

const sampleNotifications = [
  {
    id: '1',
    message: 'New shift assigned for tomorrow',
    type: 'info' as const,
    category: 'shifts' as const,
    read: false,
  },
  {
    id: '2',
    message: 'Schedule has been updated',
    type: 'success' as const,
    category: 'scheduleChanges' as const,
    read: false,
  },
  {
    id: '3',
    message: 'Reminder: Your shift starts in 1 hour',
    type: 'warning' as const,
    category: 'reminders' as const,
    read: true,
  },
  {
    id: '4',
    message: 'Error processing request',
    type: 'error' as const,
    category: 'general' as const,
    read: false,
  },
];

describe('NotificationsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlaySound.mockClear();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });

  describe('Basic Rendering', () => {
    it('should not render when notifications are disabled', () => {
      renderWithProviders({
        notificationPreferences: {
          enabled: false,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });

    it('should not render when no notifications exist', () => {
      renderWithProviders();
      
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });

    it('should render notifications when they exist', () => {
      renderWithProviders({
        notifications: [sampleNotifications[0]],
      });
      
      expect(screen.getByText('New shift assigned for tomorrow')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should render multiple notifications', () => {
      renderWithProviders({
        notifications: sampleNotifications.slice(0, 2),
      });
      
      expect(screen.getByText('New shift assigned for tomorrow')).toBeInTheDocument();
      expect(screen.getByText('Schedule has been updated')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /close/i })).toHaveLength(2);
    });
  });

  describe('Notification Types and Icons', () => {
    it('should display correct icons for different notification types', () => {
      renderWithProviders({
        notifications: [
          { ...sampleNotifications[0], type: 'success' },
          { ...sampleNotifications[1], type: 'error' },
          { ...sampleNotifications[2], type: 'warning' },
          { ...sampleNotifications[3], type: 'info' },
        ],
      });
      
      // Check for presence of SVG elements (notification type icons)
      const svgIcons = document.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThanOrEqual(4);
    });

    it('should display category icons when color coding is enabled', () => {
      renderWithProviders({
        notifications: [
          { ...sampleNotifications[0], category: 'shifts' },
          { ...sampleNotifications[1], category: 'scheduleChanges' },
        ],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.getByText('New shift assigned for tomorrow')).toBeInTheDocument();
      expect(screen.getByText('Schedule has been updated')).toBeInTheDocument();
    });

    it('should not display category icons when color coding is disabled', () => {
      renderWithProviders({
        notifications: [sampleNotifications[0]],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: false },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.getByText('New shift assigned for tomorrow')).toBeInTheDocument();
    });
  });

  describe('Notification Badges', () => {
    it('should show "New" badge for unread notifications when badges are enabled', () => {
      renderWithProviders({
        notifications: [{ ...sampleNotifications[0], read: false }],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should not show badge for read notifications', () => {
      renderWithProviders({
        notifications: [{ ...sampleNotifications[0], read: true }],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    it('should not show badges when badges are disabled', () => {
      renderWithProviders({
        notifications: [{ ...sampleNotifications[0], read: false }],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: false, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should dismiss notification when close button is clicked', async () => {
      const { store } = renderWithProviders({
        notifications: [sampleNotifications[0]],
      });
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notifications).toHaveLength(0);
      });
    });

    it('should mark notification as read when clicked', async () => {
      const { store } = renderWithProviders({
        notifications: [{ ...sampleNotifications[0], read: false }],
      });
      
      const notification = screen.getByText('New shift assigned for tomorrow');
      fireEvent.click(notification);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notifications[0].read).toBe(true);
      });
    });

    it('should prevent close button click from bubbling', async () => {
      const { store } = renderWithProviders({
        notifications: [{ ...sampleNotifications[0], read: false }],
      });
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        const state = store.getState();
        // Should be dismissed, not marked as read
        expect(state.ui.notifications).toHaveLength(0);
      });
    });
  });

  describe('Auto-dismiss Functionality', () => {
    it('should auto-dismiss notifications after specified duration', async () => {
      const { store } = renderWithProviders({
        notifications: [sampleNotifications[0]],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 3000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.getByText('New shift assigned for tomorrow')).toBeInTheDocument();
      
      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notifications).toHaveLength(0);
      });
    });

    it('should not auto-dismiss when duration is 0 (manual dismiss only)', async () => {
      renderWithProviders({
        notifications: [sampleNotifications[0]],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 0, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.getByText('New shift assigned for tomorrow')).toBeInTheDocument();
      
      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Should still be there
      expect(screen.getByText('New shift assigned for tomorrow')).toBeInTheDocument();
    });

    it('should not auto-dismiss when notifications are disabled', async () => {
      renderWithProviders({
        notifications: [sampleNotifications[0]],
        notificationPreferences: {
          enabled: false,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 3000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      // Component should not render at all when notifications disabled
      expect(screen.queryByText('New shift assigned for tomorrow')).not.toBeInTheDocument();
    });
  });

  describe('Sound Effects', () => {
    it('should play sound when new notification arrives and sound is enabled', () => {
      const { rerender } = renderWithProviders({
        notifications: [],
      });
      
      // Add a notification
      rerender(
        <Provider store={createMockStore({
          notifications: [sampleNotifications[0]],
        })}>
          <NotificationsPanel />
        </Provider>
      );
      
      expect(mockPlaySound).toHaveBeenCalledWith('notification', 0.7);
    });

    it('should not play sound when sound is disabled', () => {
      const { rerender } = renderWithProviders({
        notifications: [],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: false, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      // Add a notification
      rerender(
        <Provider store={createMockStore({
          notifications: [sampleNotifications[0]],
          notificationPreferences: {
            enabled: true,
            sound: { enabled: false, volume: 0.7, type: 'default' },
            types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
            visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
            timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
          },
        })}>
          <NotificationsPanel />
        </Provider>
      );
      
      expect(mockPlaySound).not.toHaveBeenCalled();
    });

    it('should not play sound when notifications are disabled', () => {
      const { rerender } = renderWithProviders({
        notifications: [],
        notificationPreferences: {
          enabled: false,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      // Add a notification
      rerender(
        <Provider store={createMockStore({
          notifications: [sampleNotifications[0]],
          notificationPreferences: {
            enabled: false,
            sound: { enabled: true, volume: 0.7, type: 'default' },
            types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
            visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
            timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
          },
        })}>
          <NotificationsPanel />
        </Provider>
      );
      
      expect(mockPlaySound).not.toHaveBeenCalled();
    });

    it('should play sound with correct volume', () => {
      const { rerender } = renderWithProviders({
        notifications: [],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.3, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      // Add a notification
      rerender(
        <Provider store={createMockStore({
          notifications: [sampleNotifications[0]],
          notificationPreferences: {
            enabled: true,
            sound: { enabled: true, volume: 0.3, type: 'default' },
            types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
            visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
            timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
          },
        })}>
          <NotificationsPanel />
        </Provider>
      );
      
      expect(mockPlaySound).toHaveBeenCalledWith('notification', 0.3);
    });
  });

  describe('Notification Filtering', () => {
    it('should filter out notifications of disabled categories', () => {
      renderWithProviders({
        notifications: [
          { ...sampleNotifications[0], category: 'shifts' },
          { ...sampleNotifications[1], category: 'scheduleChanges' },
        ],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: false, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.queryByText('New shift assigned for tomorrow')).not.toBeInTheDocument();
      expect(screen.getByText('Schedule has been updated')).toBeInTheDocument();
    });

    it('should show notifications without categories when general notifications are enabled', () => {
      renderWithProviders({
        notifications: [
          { id: '1', message: 'General notification', type: 'info' as const, read: false },
        ],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: false, scheduleChanges: false, reminders: false, timeOff: false, publication: false, shiftSwap: false, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.getByText('General notification')).toBeInTheDocument();
    });
  });

  describe('Visual Styles', () => {
    it('should apply minimal style when selected', () => {
      renderWithProviders({
        notifications: [sampleNotifications[0]],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'minimal', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.getByText('New shift assigned for tomorrow')).toBeInTheDocument();
    });

    it('should apply prominent style when selected', () => {
      renderWithProviders({
        notifications: [sampleNotifications[0]],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'prominent', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.getByText('New shift assigned for tomorrow')).toBeInTheDocument();
    });

    it('should apply standard style by default', () => {
      renderWithProviders({
        notifications: [sampleNotifications[0]],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.getByText('New shift assigned for tomorrow')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle notification without category', () => {
      renderWithProviders({
        notifications: [
          { id: '1', message: 'No category notification', type: 'info' as const, read: false },
        ],
      });
      
      expect(screen.getByText('No category notification')).toBeInTheDocument();
    });

    it('should handle unknown notification category', () => {
      renderWithProviders({
        notifications: [
          { id: '1', message: 'Unknown category', type: 'info' as const, read: false },
        ],
        notificationPreferences: {
          enabled: true,
          sound: { enabled: true, volume: 0.7, type: 'default' },
          types: { shifts: true, scheduleChanges: true, reminders: true, timeOff: true, publication: true, shiftSwap: true, general: true },
          visual: { style: 'standard', duration: 5000, showBadges: true, colorCoded: true },
          timing: { reminderLeadTime: '12hours', nonUrgentDeliveryTime: '09:00', deliveryFormat: 'immediate' },
        },
      });
      
      expect(screen.getByText('Unknown category')).toBeInTheDocument();
    });

    it('should handle unknown notification type', () => {
      renderWithProviders({
        notifications: [
          { id: '1', message: 'Unknown type', type: 'unknown' as any, read: false },
        ],
      });
      
      expect(screen.getByText('Unknown type')).toBeInTheDocument();
    });

    it('should handle empty notification message', () => {
      renderWithProviders({
        notifications: [
          { id: '1', message: '', type: 'info' as const, read: false },
        ],
      });
      
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should provide screen reader text for close buttons', () => {
      renderWithProviders({
        notifications: [sampleNotifications[0]],
      });
      
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should be clickable for keyboard users', () => {
      const { store } = renderWithProviders({
        notifications: [{ ...sampleNotifications[0], read: false }],
      });
      
      const notification = screen.getByText('New shift assigned for tomorrow');
      
      // Simulate Enter key press
      fireEvent.keyDown(notification, { key: 'Enter' });
      fireEvent.click(notification);
      
      waitFor(() => {
        const state = store.getState();
        expect(state.ui.notifications[0].read).toBe(true);
      });
    });
  });
}); 
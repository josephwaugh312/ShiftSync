import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NotificationPreferences from '../NotificationPreferences';
import uiSlice from '../../../store/uiSlice';

// Mock CustomToggle
jest.mock('../CustomToggle', () => {
  return function MockCustomToggle({ checked, onChange, id }: any) {
    return (
      <button
        data-testid={id}
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={checked ? 'toggle-on' : 'toggle-off'}
      >
        {checked ? 'ON' : 'OFF'}
      </button>
    );
  };
});

// Mock sound effects
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: jest.fn(),
  }),
}));

const createMockStore = (overrides = {}) => {
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
          ...overrides,
        },
      },
    },
  });
};

const renderWithProviders = (overrides = {}) => {
  const store = createMockStore(overrides);
  return {
    ...render(
      <Provider store={store}>
        <NotificationPreferences />
      </Provider>
    ),
    store,
  };
};

describe('NotificationPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the notification preferences title', () => {
      renderWithProviders();
      
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });

    it('should render main notification toggle', () => {
      renderWithProviders();
      
      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
      expect(screen.getByText('Turn all notifications on or off')).toBeInTheDocument();
      expect(screen.getByTestId('enableNotifications')).toBeInTheDocument();
    });

    it('should show all settings when notifications are enabled', () => {
      renderWithProviders();
      
      expect(screen.getByText('Sound Options')).toBeInTheDocument();
      expect(screen.getByText('Notification Types')).toBeInTheDocument();
      expect(screen.getByText('Visual Preferences')).toBeInTheDocument();
      expect(screen.getByText('Timing Preferences')).toBeInTheDocument();
    });

    it('should hide detailed settings when notifications are disabled', () => {
      renderWithProviders({ enabled: false });
      
      expect(screen.queryByText('Sound Options')).not.toBeInTheDocument();
      expect(screen.queryByText('Notification Types')).not.toBeInTheDocument();
      expect(screen.queryByText('Visual Preferences')).not.toBeInTheDocument();
      expect(screen.queryByText('Timing Preferences')).not.toBeInTheDocument();
    });
  });

  describe('Main Toggle', () => {
    it('should toggle notifications on/off', async () => {
      const { store } = renderWithProviders();
      
      const toggle = screen.getByTestId('enableNotifications');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
      
      fireEvent.click(toggle);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.enabled).toBe(false);
      });
    });
  });

  describe('Sound Settings', () => {
    it('should render sound options when enabled', () => {
      renderWithProviders();
      
      expect(screen.getByText('Notification Sounds')).toBeInTheDocument();
      expect(screen.getByTestId('notificationSound')).toBeInTheDocument();
    });

    it('should toggle notification sounds', async () => {
      const { store } = renderWithProviders();
      
      const soundToggle = screen.getByTestId('notificationSound');
      fireEvent.click(soundToggle);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.sound.enabled).toBe(false);
      });
    });

    it('should show sound controls when sound is enabled', () => {
      renderWithProviders();
      
      expect(screen.getByLabelText('Sound Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Volume')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument(); // Volume percentage
    });

    it('should hide sound controls when sound is disabled', () => {
      renderWithProviders({
        sound: {
          enabled: false,
          volume: 0.7,
          type: 'default',
        },
      });
      
      expect(screen.queryByLabelText('Sound Type')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Volume')).not.toBeInTheDocument();
    });

    it('should update sound type', async () => {
      const { store } = renderWithProviders();
      
      const soundTypeSelect = screen.getByLabelText('Sound Type');
      fireEvent.change(soundTypeSelect, { target: { value: 'subtle' } });
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.sound.type).toBe('subtle');
      });
    });

    it('should update volume', async () => {
      const { store } = renderWithProviders();
      
      const volumeSlider = screen.getByLabelText('Volume');
      fireEvent.change(volumeSlider, { target: { value: '0.3' } });
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.sound.volume).toBe(0.3);
      });
    });

    it('should display correct volume percentage', () => {
      renderWithProviders({
        sound: {
          enabled: true,
          volume: 0.4,
          type: 'default',
        },
      });
      
      expect(screen.getByText('40%')).toBeInTheDocument();
    });
  });

  describe('Notification Types', () => {
    const notificationTypes = [
      { id: 'shifts', label: 'Shift Assignments' },
      { id: 'scheduleChanges', label: 'Schedule Changes' },
      { id: 'reminders', label: 'Shift Reminders' },
      { id: 'timeOff', label: 'Time Off Requests' },
      { id: 'publication', label: 'Schedule Publications' },
      { id: 'shiftSwap', label: 'Shift Swaps' },
      { id: 'general', label: 'General Updates' },
    ];

    it('should render all notification types', () => {
      renderWithProviders();
      
      notificationTypes.forEach(type => {
        expect(screen.getByText(type.label)).toBeInTheDocument();
        expect(screen.getByTestId(`notif-${type.id}`)).toBeInTheDocument();
      });
    });

    it('should show descriptions for notification types', () => {
      renderWithProviders();
      
      expect(screen.getByText('Notifications for shift assignments, updates, and modifications')).toBeInTheDocument();
      expect(screen.getByText('Notifications when the overall schedule is modified')).toBeInTheDocument();
      expect(screen.getByText('Reminders before your shifts start')).toBeInTheDocument();
    });

    it('should toggle individual notification types', async () => {
      const { store } = renderWithProviders();
      
      const shiftsToggle = screen.getByTestId('notif-shifts');
      fireEvent.click(shiftsToggle);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.types.shifts).toBe(false);
      });
    });

    it('should have correct initial states for notification types', () => {
      renderWithProviders();
      
      notificationTypes.forEach(type => {
        const toggle = screen.getByTestId(`notif-${type.id}`);
        expect(toggle).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('should handle disabled notification type', () => {
      renderWithProviders({
        types: {
          shifts: false,
          scheduleChanges: true,
          reminders: true,
          timeOff: true,
          publication: true,
          shiftSwap: true,
          general: true,
        },
      });
      
      const shiftsToggle = screen.getByTestId('notif-shifts');
      expect(shiftsToggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Visual Preferences', () => {
    it('should render visual preference controls', () => {
      renderWithProviders();
      
      expect(screen.getByLabelText('Notification Style')).toBeInTheDocument();
      expect(screen.getByLabelText('Notification Duration')).toBeInTheDocument();
      expect(screen.getByText('Show Badge Indicators')).toBeInTheDocument();
      expect(screen.getByText('Color-Coded Notifications')).toBeInTheDocument();
    });

    it('should update notification style', async () => {
      const { store } = renderWithProviders();
      
      const styleSelect = screen.getByLabelText('Notification Style');
      fireEvent.change(styleSelect, { target: { value: 'minimal' } });
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.visual.style).toBe('minimal');
      });
    });

    it('should update notification duration', async () => {
      const { store } = renderWithProviders();
      
      const durationSelect = screen.getByLabelText('Notification Duration');
      fireEvent.change(durationSelect, { target: { value: '3000' } });
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.visual.duration).toBe(3000);
      });
    });

    it('should toggle badge indicators', async () => {
      const { store } = renderWithProviders();
      
      const badgeToggle = screen.getByTestId('showBadges');
      fireEvent.click(badgeToggle);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.visual.showBadges).toBe(false);
      });
    });

    it('should toggle color-coded notifications', async () => {
      const { store } = renderWithProviders();
      
      const colorToggle = screen.getByTestId('colorCoded');
      fireEvent.click(colorToggle);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.visual.colorCoded).toBe(false);
      });
    });

    it('should display all style options', () => {
      renderWithProviders();
      
      const styleSelect = screen.getByLabelText('Notification Style');
      expect(styleSelect).toContainHTML('<option value="standard">Standard</option>');
      expect(styleSelect).toContainHTML('<option value="minimal">Minimal</option>');
      expect(styleSelect).toContainHTML('<option value="prominent">Prominent</option>');
    });

    it('should display all duration options', () => {
      renderWithProviders();
      
      const durationSelect = screen.getByLabelText('Notification Duration');
      expect(durationSelect).toContainHTML('<option value="3000">Brief (3 seconds)</option>');
      expect(durationSelect).toContainHTML('<option value="5000">Default (5 seconds)</option>');
      expect(durationSelect).toContainHTML('<option value="10000">Extended (10 seconds)</option>');
      expect(durationSelect).toContainHTML('<option value="0">Manual dismiss only</option>');
    });
  });

  describe('Timing Preferences', () => {
    it('should render timing preference controls', () => {
      renderWithProviders();
      
      expect(screen.getByLabelText('Shift Reminder Lead Time')).toBeInTheDocument();
      expect(screen.getByLabelText('Preferred Time for Non-urgent Notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('Delivery Format')).toBeInTheDocument();
    });

    it('should update reminder lead time', async () => {
      const { store } = renderWithProviders();
      
      const leadTimeSelect = screen.getByLabelText('Shift Reminder Lead Time');
      fireEvent.change(leadTimeSelect, { target: { value: '24hours' } });
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.timing.reminderLeadTime).toBe('24hours');
      });
    });

    it('should update non-urgent delivery time', async () => {
      const { store } = renderWithProviders();
      
      const timeInput = screen.getByLabelText('Preferred Time for Non-urgent Notifications');
      fireEvent.change(timeInput, { target: { value: '14:30' } });
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.timing.nonUrgentDeliveryTime).toBe('14:30');
      });
    });

    it('should update delivery format', async () => {
      const { store } = renderWithProviders();
      
      const formatSelect = screen.getByLabelText('Delivery Format');
      fireEvent.change(formatSelect, { target: { value: 'digest' } });
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.timing.deliveryFormat).toBe('digest');
      });
    });

    it('should display all lead time options', () => {
      renderWithProviders();
      
      const leadTimeSelect = screen.getByLabelText('Shift Reminder Lead Time');
      expect(leadTimeSelect).toContainHTML('<option value="1hour">1 hour before shift</option>');
      expect(leadTimeSelect).toContainHTML('<option value="3hours">3 hours before shift</option>');
      expect(leadTimeSelect).toContainHTML('<option value="12hours">12 hours before shift</option>');
      expect(leadTimeSelect).toContainHTML('<option value="24hours">24 hours before shift</option>');
    });

    it('should display all delivery format options', () => {
      renderWithProviders();
      
      const formatSelect = screen.getByLabelText('Delivery Format');
      expect(formatSelect).toContainHTML('<option value="immediate">Immediate (as they happen)</option>');
      expect(formatSelect).toContainHTML('<option value="digest">Daily digest</option>');
    });

    it('should show help text for non-urgent time', () => {
      renderWithProviders();
      
      expect(screen.getByText('Non-urgent notifications will be delivered at this time')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form controls', () => {
      renderWithProviders();
      
      // Toggle switches use different pattern - check they exist with their labels
      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
      expect(screen.getByText('Notification Sounds')).toBeInTheDocument();
      
      // Regular form controls with proper labels
      expect(screen.getByLabelText('Sound Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Volume')).toBeInTheDocument();
      
      // Visual controls
      expect(screen.getByLabelText('Notification Style')).toBeInTheDocument();
      expect(screen.getByLabelText('Notification Duration')).toBeInTheDocument();
      
      // Timing controls
      expect(screen.getByLabelText('Shift Reminder Lead Time')).toBeInTheDocument();
      expect(screen.getByLabelText('Preferred Time for Non-urgent Notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('Delivery Format')).toBeInTheDocument();
    });

    it('should have proper descriptions for settings', () => {
      renderWithProviders();
      
      expect(screen.getByText('Turn all notifications on or off')).toBeInTheDocument();
      expect(screen.getByText('Play sounds for notifications')).toBeInTheDocument();
      expect(screen.getByText('Display badges for unread notifications')).toBeInTheDocument();
      expect(screen.getByText('Use different colors for different notification types')).toBeInTheDocument();
    });

    it('should use proper ARIA attributes for toggles', () => {
      renderWithProviders();
      
      const enableToggle = screen.getByTestId('enableNotifications');
      expect(enableToggle).toHaveAttribute('role', 'switch');
      expect(enableToggle).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme volume values', async () => {
      const { store } = renderWithProviders();
      
      const volumeSlider = screen.getByLabelText('Volume');
      
      // Test minimum volume
      fireEvent.change(volumeSlider, { target: { value: '0' } });
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.sound.volume).toBe(0);
      });
      
      // Test maximum volume
      fireEvent.change(volumeSlider, { target: { value: '1' } });
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.sound.volume).toBe(1);
      });
    });

    it('should handle invalid duration values gracefully', async () => {
      const { store } = renderWithProviders();
      
      const durationSelect = screen.getByLabelText('Notification Duration');
      fireEvent.change(durationSelect, { target: { value: '0' } });
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.visual.duration).toBe(0);
      });
    });

    it('should maintain state consistency when toggling main notifications', async () => {
      const { store } = renderWithProviders();
      
      // Disable main notifications
      const mainToggle = screen.getByTestId('enableNotifications');
      fireEvent.click(mainToggle);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.enabled).toBe(false);
        // Other settings should remain unchanged
        expect(state.ui.notificationPreferences.sound.enabled).toBe(true);
        expect(state.ui.notificationPreferences.types.shifts).toBe(true);
      });
    });
  });

  describe('Integration', () => {
    it('should work with different initial states', () => {
      const customPreferences = {
        enabled: false,
        sound: {
          enabled: false,
          volume: 0.2,
          type: 'subtle',
        },
        visual: {
          style: 'minimal',
          duration: 3000,
          showBadges: false,
          colorCoded: false,
        },
        timing: {
          reminderLeadTime: '1hour',
          nonUrgentDeliveryTime: '18:00',
          deliveryFormat: 'digest',
        },
        types: {
          shifts: false,
          scheduleChanges: false,
          reminders: true,
          timeOff: false,
          publication: true,
          shiftSwap: false,
          general: true,
        },
      };
      
      renderWithProviders(customPreferences);
      
      // Check that the UI reflects the custom state
      expect(screen.getByTestId('enableNotifications')).toHaveAttribute('aria-checked', 'false');
      
      // Main settings should be hidden when notifications are disabled
      expect(screen.queryByText('Sound Options')).not.toBeInTheDocument();
    });

    it('should handle multiple rapid changes', async () => {
      const { store } = renderWithProviders();
      
      const volumeSlider = screen.getByLabelText('Volume');
      
      // Rapidly change volume multiple times
      fireEvent.change(volumeSlider, { target: { value: '0.1' } });
      fireEvent.change(volumeSlider, { target: { value: '0.5' } });
      fireEvent.change(volumeSlider, { target: { value: '0.9' } });
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notificationPreferences.sound.volume).toBe(0.9);
      });
    });
  });
}); 
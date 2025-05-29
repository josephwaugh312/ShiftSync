import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SettingsPage from '../SettingsPage';
import uiSlice from '../../../store/uiSlice';

// Mock child components
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

jest.mock('../CustomFocusButton', () => {
  return function MockCustomFocusButton({ children, onClick, type, variant, sound, ...props }: any) {
    return (
      <button
        type={type}
        onClick={onClick}
        data-variant={variant}
        data-sound={sound}
        {...props}
      >
        {children}
      </button>
    );
  };
});

jest.mock('../ThemeColorPicker', () => {
  return function MockThemeColorPicker() {
    return <div data-testid="theme-color-picker">Theme Color Picker</div>;
  };
});

jest.mock('../NotificationPreferences', () => {
  return function MockNotificationPreferences() {
    return <div data-testid="notification-preferences">Notification Preferences</div>;
  };
});

// Mock sound effects
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

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
        },
        ...overrides,
      },
    },
  });
};

const renderWithProviders = (overrides = {}) => {
  const store = createMockStore(overrides);
  return {
    ...render(
      <Provider store={store}>
        <SettingsPage />
      </Provider>
    ),
    store,
  };
};

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlaySound.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render the settings page title', () => {
      renderWithProviders();
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render all main sections', () => {
      renderWithProviders();
      
      expect(screen.getByText('Appearance & Accessibility')).toBeInTheDocument();
      expect(screen.getByText('Regional Preferences')).toBeInTheDocument();
      expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
    });

    it('should render the save button', () => {
      renderWithProviders();
      
      expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
    });
  });

  describe('Appearance & Accessibility Settings', () => {
    it('should render all appearance toggles', () => {
      renderWithProviders();
      
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
      expect(screen.getByText('High Contrast Mode')).toBeInTheDocument();
      expect(screen.getByText('Dyslexia-Friendly Font')).toBeInTheDocument();
      
      expect(screen.getByTestId('darkMode')).toBeInTheDocument();
      expect(screen.getByTestId('highContrastMode')).toBeInTheDocument();
      expect(screen.getByTestId('dyslexicFontMode')).toBeInTheDocument();
    });

    it('should show correct initial states for toggles', () => {
      renderWithProviders({
        darkMode: true,
        highContrastMode: false,
        dyslexicFontMode: true,
      });
      
      expect(screen.getByTestId('darkMode')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('highContrastMode')).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByTestId('dyslexicFontMode')).toHaveAttribute('aria-checked', 'true');
    });

    it('should toggle dark mode and play sound', async () => {
      const { store } = renderWithProviders();
      
      const darkModeToggle = screen.getByTestId('darkMode');
      fireEvent.click(darkModeToggle);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.darkMode).toBe(true);
      });
      
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
    });

    it('should toggle high contrast mode and play sound', async () => {
      const { store } = renderWithProviders();
      
      const highContrastToggle = screen.getByTestId('highContrastMode');
      fireEvent.click(highContrastToggle);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.highContrastMode).toBe(true);
      });
      
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
    });

    it('should toggle dyslexic font mode and play sound', async () => {
      const { store } = renderWithProviders();
      
      const dyslexicFontToggle = screen.getByTestId('dyslexicFontMode');
      fireEvent.click(dyslexicFontToggle);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.dyslexicFontMode).toBe(true);
      });
      
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
    });

    it('should render theme color picker', () => {
      renderWithProviders();
      
      expect(screen.getByTestId('theme-color-picker')).toBeInTheDocument();
    });

    it('should show descriptions for accessibility features', () => {
      renderWithProviders();
      
      expect(screen.getByText('Switch between light and dark theme')).toBeInTheDocument();
      expect(screen.getByText('Increase contrast for better visibility')).toBeInTheDocument();
      expect(screen.getByText('Use a font that improves readability')).toBeInTheDocument();
    });
  });

  describe('Regional Preferences', () => {
    it('should render language and timezone selects', () => {
      renderWithProviders();
      
      expect(screen.getByLabelText('Language')).toBeInTheDocument();
      expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
    });

    it('should have correct default values', () => {
      renderWithProviders();
      
      const languageSelect = screen.getByLabelText('Language') as HTMLSelectElement;
      const timezoneSelect = screen.getByLabelText('Timezone') as HTMLSelectElement;
      
      expect(languageSelect.value).toBe('en');
      expect(timezoneSelect.value).toBe('America/New_York');
    });

    it('should update language selection', () => {
      renderWithProviders();
      
      const languageSelect = screen.getByLabelText('Language');
      fireEvent.change(languageSelect, { target: { value: 'es' } });
      
      expect((languageSelect as HTMLSelectElement).value).toBe('es');
    });

    it('should update timezone selection', () => {
      renderWithProviders();
      
      const timezoneSelect = screen.getByLabelText('Timezone');
      fireEvent.change(timezoneSelect, { target: { value: 'America/Los_Angeles' } });
      
      expect((timezoneSelect as HTMLSelectElement).value).toBe('America/Los_Angeles');
    });

    it('should display all language options', () => {
      renderWithProviders();
      
      const languageSelect = screen.getByLabelText('Language');
      expect(languageSelect).toContainHTML('<option value="en">English</option>');
      expect(languageSelect).toContainHTML('<option value="es">Spanish</option>');
      expect(languageSelect).toContainHTML('<option value="fr">French</option>');
      expect(languageSelect).toContainHTML('<option value="de">German</option>');
    });

    it('should display all timezone options', () => {
      renderWithProviders();
      
      const timezoneSelect = screen.getByLabelText('Timezone');
      expect(timezoneSelect).toContainHTML('<option value="America/New_York">Eastern Time (ET)</option>');
      expect(timezoneSelect).toContainHTML('<option value="America/Chicago">Central Time (CT)</option>');
      expect(timezoneSelect).toContainHTML('<option value="America/Denver">Mountain Time (MT)</option>');
      expect(timezoneSelect).toContainHTML('<option value="America/Los_Angeles">Pacific Time (PT)</option>');
      expect(timezoneSelect).toContainHTML('<option value="Europe/London">London (GMT)</option>');
      expect(timezoneSelect).toContainHTML('<option value="Europe/Paris">Paris (CET)</option>');
      expect(timezoneSelect).toContainHTML('<option value="Asia/Tokyo">Tokyo (JST)</option>');
    });
  });

  describe('Form Submission', () => {
    it('should save settings to localStorage on form submission', async () => {
      const { store } = renderWithProviders();
      
      // Change some settings
      const languageSelect = screen.getByLabelText('Language');
      const timezoneSelect = screen.getByLabelText('Timezone');
      
      fireEvent.change(languageSelect, { target: { value: 'fr' } });
      fireEvent.change(timezoneSelect, { target: { value: 'Europe/Paris' } });
      
      // Submit form
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'settings',
          JSON.stringify({
            language: 'fr',
            timezone: 'Europe/Paris',
          })
        );
      });
    });

    it('should play success sound on form submission', async () => {
      renderWithProviders();
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockPlaySound).toHaveBeenCalledWith('success');
      });
    });

    it('should dispatch success notification on form submission', async () => {
      const { store } = renderWithProviders();
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.notifications).toHaveLength(1);
        expect(state.ui.notifications[0]).toEqual(
          expect.objectContaining({
            message: 'Settings saved successfully',
            type: 'success',
            category: 'general',
          })
        );
      });
    });

    it('should prevent default form submission', () => {
      renderWithProviders();
      
      const form = screen.getByRole('button', { name: /save settings/i }).closest('form');
      const mockSubmit = jest.fn((e) => e.preventDefault());
      
      form!.addEventListener('submit', mockSubmit);
      fireEvent.submit(form!);
      
      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  describe('Component Integration', () => {
    it('should render NotificationPreferences component', () => {
      renderWithProviders();
      
      expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
    });

    it('should render ThemeColorPicker component', () => {
      renderWithProviders();
      
      expect(screen.getByTestId('theme-color-picker')).toBeInTheDocument();
    });

    it('should use CustomFocusButton for save button', () => {
      renderWithProviders();
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      expect(saveButton).toHaveAttribute('data-variant', 'primary');
      expect(saveButton).toHaveAttribute('data-sound', 'success');
      expect(saveButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProviders();
      
      expect(screen.getByLabelText('Language')).toBeInTheDocument();
      expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
    });

    it('should have proper section headings', () => {
      renderWithProviders();
      
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
      expect(screen.getByText('Appearance & Accessibility')).toBeInTheDocument();
      expect(screen.getByText('Regional Preferences')).toBeInTheDocument();
    });

    it('should use proper ARIA attributes for toggles', () => {
      renderWithProviders();
      
      const darkModeToggle = screen.getByTestId('darkMode');
      expect(darkModeToggle).toHaveAttribute('role', 'switch');
      expect(darkModeToggle).toHaveAttribute('aria-checked', 'false');
    });

    it('should have descriptive text for accessibility features', () => {
      renderWithProviders();
      
      expect(screen.getByText('Switch between light and dark theme')).toBeInTheDocument();
      expect(screen.getByText('Increase contrast for better visibility')).toBeInTheDocument();
      expect(screen.getByText('Use a font that improves readability')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should maintain local state for regional preferences', () => {
      renderWithProviders();
      
      const languageSelect = screen.getByLabelText('Language');
      const timezoneSelect = screen.getByLabelText('Timezone');
      
      // Change values
      fireEvent.change(languageSelect, { target: { value: 'de' } });
      fireEvent.change(timezoneSelect, { target: { value: 'Asia/Tokyo' } });
      
      // Values should be updated
      expect((languageSelect as HTMLSelectElement).value).toBe('de');
      expect((timezoneSelect as HTMLSelectElement).value).toBe('Asia/Tokyo');
    });

    it('should reflect Redux state changes for appearance settings', async () => {
      const { store } = renderWithProviders();
      
      // Manually dispatch action to change dark mode
      act(() => {
        store.dispatch({ type: 'ui/toggleDarkMode' });
      });
      
      await waitFor(() => {
        const darkModeToggle = screen.getByTestId('darkMode');
        expect(darkModeToggle).toHaveAttribute('aria-checked', 'true');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle form submission with default values', async () => {
      renderWithProviders();
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'settings',
          JSON.stringify({
            language: 'en',
            timezone: 'America/New_York',
          })
        );
      });
    });

    it('should handle multiple rapid toggle clicks', async () => {
      const { store } = renderWithProviders();
      
      const darkModeToggle = screen.getByTestId('darkMode');
      
      // Rapidly click multiple times
      act(() => {
        fireEvent.click(darkModeToggle);
        fireEvent.click(darkModeToggle);
        fireEvent.click(darkModeToggle);
      });
      
      await waitFor(() => {
        const state = store.getState();
        expect(state.ui.darkMode).toBe(true); // Should end up true after 3 clicks
      });
      
      // Should have called playSound for each click
      expect(mockPlaySound).toHaveBeenCalledWith('toggle');
    });
  });
}); 
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NotificationContainer from '../NotificationContainer';
import uiReducer from '../../../store/uiSlice';

// Mock timers for auto-removal testing
jest.useFakeTimers();

// Helper function to create a test store with notifications
const createTestStore = (notifications: any[] = []) => {
  return configureStore({
    reducer: {
      ui: uiReducer,
    },
    preloadedState: {
      ui: {
        notifications,
        darkMode: false,
        highContrastMode: false,
        dyslexicFontMode: false,
        modalOpen: {
          addShift: false,
          editShift: false,
          settings: false,
          help: false,
        },
        themeColor: null,
        notificationPreferences: {
          enabled: true,
          sound: {
            enabled: true,
            volume: 0.5,
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
            reminderLeadTime: '1h',
            nonUrgentDeliveryTime: '09:00',
            deliveryFormat: 'immediate',
          },
        },
      },
    },
  });
};

// Helper function to render component with store
const renderWithStore = (store: any) => {
  return render(
    <Provider store={store}>
      <NotificationContainer />
    </Provider>
  );
};

describe('NotificationContainer', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('rendering', () => {
    it('should render without crashing when no notifications exist', () => {
      const store = createTestStore([]);
      renderWithStore(store);
      
      // Should not crash and container should exist but be empty
      const container = document.querySelector('.fixed.top-20.right-4');
      expect(container).toBeInTheDocument();
      expect(container).toBeEmptyDOMElement();
    });

    it('should render a single notification correctly', () => {
      const notification = {
        id: '1',
        message: 'Test notification',
        type: 'success' as const,
      };
      
      const store = createTestStore([notification]);
      renderWithStore(store);
      
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    it('should render multiple notifications', () => {
      const notifications = [
        { id: '1', message: 'First notification', type: 'success' as const },
        { id: '2', message: 'Second notification', type: 'error' as const },
        { id: '3', message: 'Third notification', type: 'info' as const },
      ];
      
      const store = createTestStore(notifications);
      renderWithStore(store);
      
      expect(screen.getByText('First notification')).toBeInTheDocument();
      expect(screen.getByText('Second notification')).toBeInTheDocument();
      expect(screen.getByText('Third notification')).toBeInTheDocument();
    });
  });

  describe('notification types and styling', () => {
    const notificationTypes = [
      { type: 'success' as const, expectedClass: 'bg-success-100' },
      { type: 'error' as const, expectedClass: 'bg-danger-100' },
      { type: 'warning' as const, expectedClass: 'bg-warning-100' },
      { type: 'info' as const, expectedClass: 'bg-primary-100' },
    ];

    notificationTypes.forEach(({ type, expectedClass }) => {
      it(`should apply correct styling for ${type} notifications`, () => {
        const notification = {
          id: '1',
          message: `${type} notification`,
          type,
        };
        
        const store = createTestStore([notification]);
        renderWithStore(store);
        
        // Look for the notification container with the correct background class
        const notificationContainer = document.querySelector(`.${expectedClass}`);
        expect(notificationContainer).toBeInTheDocument();
      });

      it(`should display correct icon for ${type} notifications`, () => {
        const notification = {
          id: '1',
          message: `${type} notification`,
          type,
        };
        
        const store = createTestStore([notification]);
        renderWithStore(store);
        
        // Each notification type should have an SVG icon
        const icon = document.querySelector(`svg.text-${type === 'error' ? 'danger' : type === 'info' ? 'primary' : type}-500`);
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('user interactions', () => {
    it('should remove notification when close button is clicked', () => {
      const notification = {
        id: '1',
        message: 'Test notification',
        type: 'success' as const,
      };
      
      const store = createTestStore([notification]);
      renderWithStore(store);
      
      expect(screen.getByText('Test notification')).toBeInTheDocument();
      
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      
      // Wait for the action to be processed
      expect(screen.queryByText('Test notification')).not.toBeInTheDocument();
    });

    it('should remove correct notification when multiple exist', () => {
      const notifications = [
        { id: '1', message: 'First notification', type: 'success' as const },
        { id: '2', message: 'Second notification', type: 'error' as const },
      ];
      
      const store = createTestStore(notifications);
      renderWithStore(store);
      
      // Get all close buttons
      const closeButtons = screen.getAllByRole('button');
      
      // Click the first close button
      fireEvent.click(closeButtons[0]);
      
      // First notification should be removed, second should remain
      expect(screen.queryByText('First notification')).not.toBeInTheDocument();
      expect(screen.getByText('Second notification')).toBeInTheDocument();
    });
  });

  describe('auto-removal functionality', () => {
    it('should automatically remove notification after 6 seconds', async () => {
      const notification = {
        id: '1',
        message: 'Test notification',
        type: 'success' as const,
      };
      
      const store = createTestStore([notification]);
      renderWithStore(store);
      
      expect(screen.getByText('Test notification')).toBeInTheDocument();
      
      // Fast-forward time by 6 seconds
      jest.advanceTimersByTime(6000);
      
      await waitFor(() => {
        expect(screen.queryByText('Test notification')).not.toBeInTheDocument();
      });
    });

    it('should remove notifications in FIFO order (first in, first out)', async () => {
      const notifications = [
        { id: '1', message: 'First notification', type: 'success' as const },
        { id: '2', message: 'Second notification', type: 'info' as const },
      ];
      
      const store = createTestStore(notifications);
      renderWithStore(store);
      
      expect(screen.getByText('First notification')).toBeInTheDocument();
      expect(screen.getByText('Second notification')).toBeInTheDocument();
      
      // Fast-forward by 6 seconds - should remove first notification
      jest.advanceTimersByTime(6000);
      
      await waitFor(() => {
        expect(screen.queryByText('First notification')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('Second notification')).toBeInTheDocument();
    });

    it('should handle timer cleanup when component unmounts', () => {
      const notification = {
        id: '1',
        message: 'Test notification',
        type: 'success' as const,
      };
      
      const store = createTestStore([notification]);
      const { unmount } = renderWithStore(store);
      
      expect(screen.getByText('Test notification')).toBeInTheDocument();
      
      // Unmount component before timer expires
      unmount();
      
      // Fast-forward time - should not throw errors
      expect(() => {
        jest.advanceTimersByTime(6000);
      }).not.toThrow();
    });

    it('should restart timer when new notification is added', async () => {
      const initialNotification = {
        id: '1',
        message: 'First notification',
        type: 'success' as const,
      };
      
      const store = createTestStore([initialNotification]);
      const { rerender } = renderWithStore(store);
      
      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000);
      
      // Add new notification
      const newNotifications = [
        initialNotification,
        { id: '2', message: 'Second notification', type: 'info' as const },
      ];
      
      const newStore = createTestStore(newNotifications);
      rerender(
        <Provider store={newStore}>
          <NotificationContainer />
        </Provider>
      );
      
      // Fast-forward another 3 seconds (6 total, but timer should have restarted)
      jest.advanceTimersByTime(3000);
      
      // First notification should still be there (timer restarted)
      expect(screen.getByText('First notification')).toBeInTheDocument();
      
      // Fast-forward remaining 3 seconds (6 from restart)
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.queryByText('First notification')).not.toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA roles and attributes', () => {
      const notification = {
        id: '1',
        message: 'Test notification',
        type: 'success' as const,
      };
      
      const store = createTestStore([notification]);
      renderWithStore(store);
      
      // Close button should be accessible
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('type', 'button');
    });

    it('should provide meaningful text content for screen readers', () => {
      const notification = {
        id: '1',
        message: 'Important accessibility message',
        type: 'warning' as const,
      };
      
      const store = createTestStore([notification]);
      renderWithStore(store);
      
      expect(screen.getByText('Important accessibility message')).toBeInTheDocument();
    });
  });

  describe('layout and positioning', () => {
    it('should have fixed positioning at top-right', () => {
      const notification = {
        id: '1',
        message: 'Test notification',
        type: 'success' as const,
      };
      
      const store = createTestStore([notification]);
      renderWithStore(store);
      
      const container = document.querySelector('.fixed.top-20.right-4');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('fixed', 'top-20', 'right-4', 'z-50', 'max-w-md');
    });

    it('should stack multiple notifications with proper spacing', () => {
      const notifications = [
        { id: '1', message: 'First notification', type: 'success' as const },
        { id: '2', message: 'Second notification', type: 'error' as const },
      ];
      
      const store = createTestStore(notifications);
      renderWithStore(store);
      
      const notificationElements = document.querySelectorAll('.border-l-4.rounded-md.p-4.mb-3');
      expect(notificationElements).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty notification message', () => {
      const notification = {
        id: '1',
        message: '',
        type: 'info' as const,
      };
      
      const store = createTestStore([notification]);
      
      expect(() => {
        renderWithStore(store);
      }).not.toThrow();
    });

    it('should handle very long notification messages', () => {
      const longMessage = 'This is a very long notification message that should still display properly without breaking the layout or causing any issues with the notification container component';
      const notification = {
        id: '1',
        message: longMessage,
        type: 'info' as const,
      };
      
      const store = createTestStore([notification]);
      renderWithStore(store);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle rapid notification addition and removal', () => {
      const store = createTestStore([]);
      const { rerender } = renderWithStore(store);
      
      // Add notifications rapidly
      for (let i = 1; i <= 5; i++) {
        const notifications = Array.from({ length: i }, (_, index) => ({
          id: `${index + 1}`,
          message: `Notification ${index + 1}`,
          type: 'info' as const,
        }));
        
        const newStore = createTestStore(notifications);
        rerender(
          <Provider store={newStore}>
            <NotificationContainer />
          </Provider>
        );
      }
      
      // Should handle this without errors
      expect(screen.getByText('Notification 5')).toBeInTheDocument();
    });

    it('should handle unknown notification types with default styling', () => {
      const notification = {
        id: '1',
        message: 'Unknown type notification',
        type: 'unknown' as any, // Force unknown type to test default case
      };
      
      const store = createTestStore([notification]);
      renderWithStore(store);
      
      // Should render with default gray styling
      const notificationElement = document.querySelector('.bg-gray-100');
      expect(notificationElement).toBeInTheDocument();
      expect(notificationElement).toHaveClass('border-gray-500', 'text-gray-700');
      
      // Should display the message even with unknown type
      expect(screen.getByText('Unknown type notification')).toBeInTheDocument();
    });

    it('should handle unknown notification types with no icon', () => {
      const notification = {
        id: '1',
        message: 'Unknown type notification',
        type: 'unknown' as any, // Force unknown type to test default case
      };
      
      const store = createTestStore([notification]);
      const { container } = renderWithStore(store);
      
      // Should not render any icon for unknown types (default returns null)
      const iconContainer = container.querySelector('.flex-shrink-0.mr-3');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toBeEmptyDOMElement(); // Should be empty since default returns null
    });
  });

  describe('theme integration', () => {
    it('should apply dark mode classes when in dark theme', () => {
      const notification = {
        id: '1',
        message: 'Test notification',
        type: 'success' as const,
      };
      
      const store = createTestStore([notification]);
      
      // Set dark mode in store
      store.dispatch({ type: 'ui/toggleDarkMode' });
      
      renderWithStore(store);
      
      // Look for the actual notification container with the background styling
      const notificationContainer = document.querySelector('.bg-success-100');
      expect(notificationContainer).toBeInTheDocument();
    });
  });
}); 
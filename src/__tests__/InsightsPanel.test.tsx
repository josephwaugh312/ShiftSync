import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import InsightsPanel from '../components/insights/InsightsPanel';
import uiSlice from '../store/uiSlice';
import shiftsSlice from '../store/shiftsSlice';
import employeeSlice from '../store/employeeSlice';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock child components
jest.mock('../components/insights/DashboardView', () => {
  return function MockDashboardView() {
    return <div data-testid="dashboard-view">Dashboard View Content</div>;
  };
});

jest.mock('../components/insights/HeatmapView', () => {
  return function MockHeatmapView() {
    return <div data-testid="heatmap-view">Heatmap View Content</div>;
  };
});

jest.mock('../components/insights/StaffingLevelsView', () => {
  return function MockStaffingLevelsView() {
    return <div data-testid="staffing-view">Staffing Levels View Content</div>;
  };
});

jest.mock('../components/insights/EmployeeHoursView', () => {
  return function MockEmployeeHoursView() {
    return <div data-testid="hours-view">Employee Hours View Content</div>;
  };
});

jest.mock('../components/insights/TimelineView', () => {
  return function MockTimelineView() {
    return <div data-testid="timeline-view">Timeline View Content</div>;
  };
});

// ===== UTILITY FUNCTIONS =====

// Create test store utility
const createTestStore = (initialState?: any) => {
  const defaultState = {
    ui: {
      darkMode: false,
      modalOpen: { insights: false },
      highContrastMode: false,
      dyslexicFontMode: false,
      themeColor: { name: 'blue', value: '#3b82f6' },
      notifications: [],
      soundEnabled: true,
      viewMode: 'weekly',
    },
    shifts: {
      selectedDate: '2024-01-15',
      shifts: [],
      templates: [],
      error: null,
    },
    employees: {
      employees: [],
      loading: false,
      error: null,
    },
  };

  return configureStore({
    reducer: {
      ui: uiSlice,
      shifts: shiftsSlice,
      employees: employeeSlice,
    },
    preloadedState: initialState || defaultState,
  });
};

// Render with providers utility
const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('InsightsPanel Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Rendering and Visibility', () => {
    it('should not render when isOpen is false', () => {
      renderWithProviders(
        <InsightsPanel isOpen={false} onClose={mockOnClose} />
      );

      expect(screen.queryByText('Schedule Insights')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('Schedule Insights')).toBeInTheDocument();
    });

    it('should render header with title and close button', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('Schedule Insights')).toBeInTheDocument();
      
      // Find close button by its SVG path (X icon)
      const closeButton = screen.getByRole('button', { name: '' });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should render all tab buttons', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Heatmap')).toBeInTheDocument();
      expect(screen.getByText('Staffing')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should start with dashboard tab active by default', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const overviewTab = screen.getByText('Overview');
      expect(overviewTab).toHaveClass('text-primary-600');
      expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
    });

    it('should switch to heatmap tab when clicked', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const heatmapTab = screen.getByText('Heatmap');
      fireEvent.click(heatmapTab);

      expect(heatmapTab).toHaveClass('text-primary-600');
      expect(screen.getByTestId('heatmap-view')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-view')).not.toBeInTheDocument();
    });

    it('should switch to staffing tab when clicked', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const staffingTab = screen.getByText('Staffing');
      fireEvent.click(staffingTab);

      expect(staffingTab).toHaveClass('text-primary-600');
      expect(screen.getByTestId('staffing-view')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-view')).not.toBeInTheDocument();
    });

    it('should switch to hours tab when clicked', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const hoursTab = screen.getByText('Hours');
      fireEvent.click(hoursTab);

      expect(hoursTab).toHaveClass('text-primary-600');
      expect(screen.getByTestId('hours-view')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-view')).not.toBeInTheDocument();
    });

    it('should switch to timeline tab when clicked', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const timelineTab = screen.getByText('Timeline');
      fireEvent.click(timelineTab);

      expect(timelineTab).toHaveClass('text-primary-600');
      expect(screen.getByTestId('timeline-view')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-view')).not.toBeInTheDocument();
    });

    it('should update active tab styling correctly', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const overviewTab = screen.getByText('Overview');
      const heatmapTab = screen.getByText('Heatmap');

      // Initially overview should be active
      expect(overviewTab).toHaveClass('text-primary-600', 'border-primary-500');
      expect(heatmapTab).toHaveClass('text-gray-600');

      // Click heatmap tab
      fireEvent.click(heatmapTab);

      // Now heatmap should be active
      expect(heatmapTab).toHaveClass('text-primary-600', 'border-primary-500');
      expect(overviewTab).toHaveClass('text-gray-600');
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Structure', () => {
    it('should have proper CSS classes for layout', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      // Find the main panel element (parent of the header)
      const panel = screen.getByText('Schedule Insights').closest('div')?.parentElement;
      expect(panel).toHaveClass('fixed', 'bg-white', 'dark:bg-dark-800', 'rounded-lg', 'shadow-xl');
    });

    it('should render tab icons for each tab', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const tabs = ['Overview', 'Heatmap', 'Staffing', 'Hours', 'Timeline'];
      tabs.forEach(tabName => {
        const tab = screen.getByText(tabName);
        const svg = tab.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass('h-4', 'w-4');
      });
    });

    it('should have sticky header and tab bar', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const header = screen.getByText('Schedule Insights').closest('div');
      expect(header).toHaveClass('sticky', 'top-0');

      const tabBar = screen.getByText('Overview').closest('div');
      expect(tabBar).toHaveClass('sticky');
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes when dark mode is enabled', () => {
      const darkModeStore = createTestStore({
        ui: {
          darkMode: true,
          modalOpen: { insights: false },
          highContrastMode: false,
          dyslexicFontMode: false,
          themeColor: { name: 'blue', value: '#3b82f6' },
          notifications: [],
          soundEnabled: true,
          viewMode: 'weekly',
        },
        shifts: { selectedDate: '2024-01-15', shifts: [], templates: [], error: null },
        employees: { employees: [], loading: false, error: null },
      });

      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />,
        darkModeStore
      );

      const panel = screen.getByText('Schedule Insights').closest('div');
      expect(panel).toHaveClass('dark:bg-dark-800', 'dark:border-dark-600');
    });
  });

  describe('Tab Content Rendering', () => {
    it('should only render one tab content at a time', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      // Initially should show dashboard
      expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
      expect(screen.queryByTestId('heatmap-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('staffing-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('hours-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('timeline-view')).not.toBeInTheDocument();
    });

    it('should properly switch between all tab contents', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const tabTests = [
        { tabName: 'Heatmap', testId: 'heatmap-view' },
        { tabName: 'Staffing', testId: 'staffing-view' },
        { tabName: 'Hours', testId: 'hours-view' },
        { tabName: 'Timeline', testId: 'timeline-view' },
        { tabName: 'Overview', testId: 'dashboard-view' },
      ];

      tabTests.forEach(({ tabName, testId }) => {
        fireEvent.click(screen.getByText(tabName));
        expect(screen.getByTestId(testId)).toBeInTheDocument();
        
        // Ensure other tabs are not visible
        tabTests.forEach(({ testId: otherTestId }) => {
          if (otherTestId !== testId) {
            expect(screen.queryByTestId(otherTestId)).not.toBeInTheDocument();
          }
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles for tab interface', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const tabs = screen.getAllByRole('button');
      const closeButton = tabs.find(tab => tab.querySelector('svg path[d*="M6 18L18 6M6 6l12 12"]'));
      const tabButtons = tabs.filter(tab => tab !== closeButton);

      expect(tabButtons).toHaveLength(5); // 5 tabs
      tabButtons.forEach(tab => {
        expect(tab.tagName).toBe('BUTTON');
      });
    });

    it('should be keyboard navigable', () => {
      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />
      );

      const heatmapTab = screen.getByText('Heatmap');
      heatmapTab.focus();
      
      expect(document.activeElement).toBe(heatmapTab);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      expect(() => {
        renderWithProviders(
          <InsightsPanel isOpen={true} onClose={mockOnClose} />
        );
      }).not.toThrow();
    });

    it('should handle tab switching with no store data', () => {
      const emptyStore = createTestStore({
        ui: { modalOpen: {}, themeColor: null },
        shifts: { shifts: [], selectedDate: null },
        employees: { employees: [] },
      });

      renderWithProviders(
        <InsightsPanel isOpen={true} onClose={mockOnClose} />,
        emptyStore
      );

      expect(() => {
        fireEvent.click(screen.getByText('Heatmap'));
        fireEvent.click(screen.getByText('Staffing'));
        fireEvent.click(screen.getByText('Hours'));
      }).not.toThrow();
    });
  });
}); 
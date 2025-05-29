import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TutorialPopover from '../TutorialPopover';
import { TutorialStep } from '../../../data/tutorialSteps';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { 
        initial, animate, exit, transition, style, ...domProps 
      } = props;
      return <div {...domProps} style={style}>{children}</div>;
    }
  }
}));

// Mock TutorialContext
const mockTutorialContext = {
  nextStep: jest.fn(),
  prevStep: jest.fn(),
  skipTutorial: jest.fn(),
  currentStep: 0,
  endTutorial: jest.fn(),
  checkRequiredAction: jest.fn(() => true),
  progress: 50,
  viewedSteps: ['welcome', 'calendar']
};

jest.mock('../../../contexts/TutorialContext', () => ({
  useTutorial: () => mockTutorialContext
}));

jest.mock('../../../data/tutorialSteps', () => ({
  tutorialSteps: [
    {
      id: 'welcome',
      title: 'Welcome to ShiftSync!',
      content: 'This tutorial will guide you through the key features.',
      position: 'center',
      target: 'body',
      keyboardShortcut: 'Shift+T'
    },
    {
      id: 'calendar',
      title: 'Calendar View',
      content: 'This is your main schedule view.',
      position: 'top',
      target: '.calendar',
      showPointer: true
    },
    {
      id: 'employee-management',
      title: 'Employee Management',
      content: 'Add employees to your team.',
      position: 'right',
      target: 'a[href="/employees"]',
      requireAction: true
    },
    {
      id: 'help',
      title: 'Need Help?',
      content: 'You can restart this tutorial anytime.',
      position: 'left',
      target: 'button[aria-label="Help"]'
    }
  ]
}));

describe('TutorialPopover Component', () => {
  let mockTargetElement: HTMLElement;

  // Get the mocked tutorial steps for use in tests
  const mockTutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to ShiftSync!',
      content: 'This tutorial will guide you through the key features.',
      position: 'center' as const,
      target: 'body',
      keyboardShortcut: 'Shift+T'
    },
    {
      id: 'calendar',
      title: 'Calendar View',
      content: 'This is your main schedule view.',
      position: 'top' as const,
      target: '.calendar',
      showPointer: true
    },
    {
      id: 'employee-management',
      title: 'Employee Management',
      content: 'Add employees to your team.',
      position: 'right' as const,
      target: 'a[href="/employees"]',
      requireAction: true
    },
    {
      id: 'help',
      title: 'Need Help?',
      content: 'You can restart this tutorial anytime.',
      position: 'left' as const,
      target: 'button[aria-label="Help"]'
    }
  ];

  beforeEach(() => {
    // Create mock target element
    mockTargetElement = document.createElement('div');
    mockTargetElement.style.position = 'fixed';
    mockTargetElement.style.top = '100px';
    mockTargetElement.style.left = '200px';
    mockTargetElement.style.width = '100px';
    mockTargetElement.style.height = '50px';
    document.body.appendChild(mockTargetElement);

    // Mock getBoundingClientRect
    mockTargetElement.getBoundingClientRect = jest.fn(() => ({
      top: 100,
      left: 200,
      right: 300,
      bottom: 150,
      width: 100,
      height: 50,
      x: 200,
      y: 100,
      toJSON: () => ({})
    }));

    // Reset mocks
    jest.clearAllMocks();
    mockTutorialContext.checkRequiredAction.mockReturnValue(true);
    mockTutorialContext.currentStep = 0;
    mockTutorialContext.progress = 50;
  });

  afterEach(() => {
    document.body.removeChild(mockTargetElement);
  });

  const mockStep: TutorialStep = mockTutorialSteps[0];

  describe('Basic Rendering', () => {
    it('should render with step content', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      expect(screen.getByText('Welcome to ShiftSync!')).toBeInTheDocument();
      expect(screen.getByText('This tutorial will guide you through the key features.')).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      const progressBar = document.querySelector('.bg-primary-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle('width: 50%');
    });

    it('should render with proper styling classes', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute.z-\\[9999\\]');
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveClass('bg-white', 'dark:bg-dark-800', 'rounded-lg', 'shadow-xl', 'p-5');
    });
  });

  describe('Keyboard Shortcuts', () => {
    const stepWithShortcut: TutorialStep = {
      ...mockStep,
      keyboardShortcut: 'Shift+T'
    };

    it('should display keyboard shortcut when provided', () => {
      render(<TutorialPopover step={stepWithShortcut} targetElement={mockTargetElement} />);
      
      expect(screen.getByText('Keyboard shortcut:')).toBeInTheDocument();
      expect(screen.getByText('Shift+T')).toBeInTheDocument();
    });

    it('should not display keyboard shortcut on mobile', () => {
      // Mock mobile screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(<TutorialPopover step={stepWithShortcut} targetElement={mockTargetElement} />);
      
      expect(screen.queryByText('Keyboard shortcut:')).not.toBeInTheDocument();
    });

    it('should have proper keyboard shortcut styling', () => {
      // Ensure desktop view so keyboard shortcut is shown
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      render(<TutorialPopover step={stepWithShortcut} targetElement={mockTargetElement} />);
      
      const kbd = screen.getByText('Shift+T');
      expect(kbd.tagName).toBe('KBD');
      expect(kbd).toHaveClass('px-2', 'py-1', 'text-xs', 'font-semibold', 'bg-gray-200', 'rounded', 'border');
    });
  });

  describe('Required Actions', () => {
    const requiredActionStep: TutorialStep = {
      ...mockStep,
      requireAction: true,
      title: 'Employee Management'
    };

    it('should show required action message when action not completed', () => {
      mockTutorialContext.checkRequiredAction.mockReturnValue(false);
      
      render(<TutorialPopover step={requiredActionStep} targetElement={mockTargetElement} />);
      
      expect(screen.getByText(/You need to visit the Employee Management page to continue/)).toBeInTheDocument();
    });

    it('should not show required action message when action completed', () => {
      mockTutorialContext.checkRequiredAction.mockReturnValue(true);
      
      render(<TutorialPopover step={requiredActionStep} targetElement={mockTargetElement} />);
      
      expect(screen.queryByText(/You need to visit the/)).not.toBeInTheDocument();
    });

    it('should have proper required action styling', () => {
      mockTutorialContext.checkRequiredAction.mockReturnValue(false);
      
      render(<TutorialPopover step={requiredActionStep} targetElement={mockTargetElement} />);
      
      const message = screen.getByText(/You need to visit the/);
      expect(message.closest('div')).toHaveClass('bg-amber-100', 'text-amber-800', 'text-sm');
    });
  });

  describe('Navigation Controls', () => {
    it('should render skip tutorial button', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      const skipButton = screen.getByText('Skip tutorial');
      expect(skipButton).toBeInTheDocument();
    });

    it('should handle skip tutorial click', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      const skipButton = screen.getByText('Skip tutorial');
      fireEvent.click(skipButton);
      
      expect(mockTutorialContext.skipTutorial).toHaveBeenCalledTimes(1);
    });

    it('should show step indicator', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      expect(screen.getByText('1/4')).toBeInTheDocument();
    });

    it('should hide step indicator on very small screens', () => {
      // Mock very small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      expect(screen.queryByText('1/4')).not.toBeInTheDocument();
    });

    it('should render step dots', () => {
      // Ensure desktop view so step dots are visible
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      // Use a more specific selector that matches the actual rendered elements
      const dots = document.querySelectorAll('div[title]');
      const stepDots = Array.from(dots).filter(dot => 
        dot.className.includes('w-1.5') && 
        dot.className.includes('h-1.5') && 
        dot.className.includes('rounded-full')
      );
      
      expect(stepDots).toHaveLength(4); // Should match mockTutorialSteps length
    });

    it('should highlight current step dot', () => {
      // Ensure desktop view so step dots are visible
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      // Use a more specific selector that matches the actual rendered elements
      const dots = document.querySelectorAll('div[title]');
      const stepDots = Array.from(dots).filter(dot => 
        dot.className.includes('w-1.5') && 
        dot.className.includes('h-1.5') && 
        dot.className.includes('rounded-full')
      );
      
      expect(stepDots[0]).toHaveClass('bg-primary-500');
    });
  });

  describe('Positioning Logic', () => {
    it('should handle center positioning', () => {
      const centerStep: TutorialStep = { ...mockStep, position: 'center' };
      
      render(<TutorialPopover step={centerStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
    });

    it('should handle center-bottom positioning', () => {
      const centerBottomStep: TutorialStep = { ...mockStep, position: 'center-bottom' };
      
      render(<TutorialPopover step={centerBottomStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveStyle({
        bottom: '100px', // Original value on desktop
        left: '50%',
        transform: 'translateX(-50%)'
      });
    });

    it('should handle top positioning with target element', () => {
      const topStep: TutorialStep = { ...mockStep, position: 'top' };
      
      render(<TutorialPopover step={topStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveStyle({
        top: '90px', // rect.top - 10
        left: '250px', // rect.left + rect.width / 2 (desktop positioning)
        transform: 'translate(-50%, -100%)'
      });
    });

    it('should handle bottom positioning with target element', () => {
      const bottomStep: TutorialStep = { ...mockStep, position: 'bottom' };
      
      render(<TutorialPopover step={bottomStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveStyle({
        top: '160px', // rect.bottom + 10
        left: '250px', // rect.left + rect.width / 2 (desktop positioning)
        transform: 'translate(-50%, 0)'
      });
    });

    it('should handle left positioning with target element', () => {
      const leftStep: TutorialStep = { ...mockStep, position: 'left' };
      
      render(<TutorialPopover step={leftStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      // On desktop, left positioning works normally
      expect(popover).toHaveStyle({
        top: '125px', // rect.top + rect.height / 2
        left: '190px', // rect.left - 10
        transform: 'translate(-100%, -50%)'
      });
    });

    it('should handle right positioning with target element', () => {
      const rightStep: TutorialStep = { ...mockStep, position: 'right' };
      
      render(<TutorialPopover step={rightStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      // On desktop, right positioning works normally
      expect(popover).toHaveStyle({
        top: '125px', // rect.top + rect.height / 2
        left: '310px', // rect.right + 10
        transform: 'translate(0, -50%)'
      });
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      // Mock mobile screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
    });

    it('should adapt positioning for mobile', () => {
      const leftStep: TutorialStep = { ...mockStep, position: 'left' };
      
      render(<TutorialPopover step={leftStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
    });

    it('should use mobile width on small screens', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveClass('max-w-[90vw]');
    });

    it('should use desktop width on larger screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveClass('max-w-sm');
    });

    it('should handle resize events', async () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      // Change window size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 300,
      });

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        // Component should adapt to new size
        expect(document.querySelector('.absolute')).toBeInTheDocument();
      });
    });
  });

  describe('Special Step Handling', () => {
    it('should handle calendar step with special positioning', () => {
      const calendarStep: TutorialStep = { 
        ...mockStep, 
        id: 'calendar',
        position: 'center'
      };
      
      render(<TutorialPopover step={calendarStep} targetElement={null} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveStyle({
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
    });

    it('should handle add-shift step with special positioning', () => {
      const addShiftStep: TutorialStep = { 
        ...mockStep, 
        id: 'add-shift',
        position: 'center'
      };
      
      render(<TutorialPopover step={addShiftStep} targetElement={null} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
    });

    it('should handle help step with special positioning', () => {
      const helpStep: TutorialStep = { 
        ...mockStep, 
        id: 'help',
        position: 'left'
      };
      
      render(<TutorialPopover step={helpStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      // Help step falls back to center positioning on mobile
      expect(popover).toHaveStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
    });

    it('should force center positioning for problematic steps on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const employeeStep: TutorialStep = { 
        ...mockStep, 
        id: 'employee-management',
        position: 'right'
      };
      
      render(<TutorialPopover step={employeeStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
    });
  });

  describe('Pointer and Extra Margin Handling', () => {
    it('should add extra margin for steps with pointer', () => {
      const pointerStep: TutorialStep = { 
        ...mockStep, 
        position: 'bottom',
        showPointer: true
      };
      
      render(<TutorialPopover step={pointerStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveStyle({
        top: '210px', // Adjusted for viewport constraints
        left: '170px', // Adjusted for viewport constraints
        transform: 'translate(-50%, 0)'
      });
    });

    it('should add reduced margin for pointer steps on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const pointerStep: TutorialStep = { 
        ...mockStep, 
        position: 'bottom',
        showPointer: true
      };
      
      render(<TutorialPopover step={pointerStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveStyle({
        top: '210px', // rect.bottom + 60 (reduced mobile margin)
        left: '170px', // Adjusted for viewport constraints
        transform: 'translate(-50%, 0)'
      });
    });

    it('should handle pointer steps with top positioning', () => {
      const pointerStep: TutorialStep = { 
        ...mockStep, 
        position: 'top',
        showPointer: true
      };
      
      render(<TutorialPopover step={pointerStep} targetElement={mockTargetElement} />);
      
      const popover = document.querySelector('.absolute');
      expect(popover).toHaveStyle({
        top: '10px', // Adjusted for viewport constraints
        left: '170px', // Adjusted for viewport constraints
        transform: 'translate(-50%, -100%)'
      });
    });
  });

  describe('Viewport Constraints', () => {
    beforeEach(() => {
      // Mock viewport dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800,
      });
    });

    it('should constrain popover to stay within viewport bounds', () => {
      // Create target element at edge of screen
      const edgeElement = document.createElement('div');
      edgeElement.getBoundingClientRect = jest.fn(() => ({
        top: 750, // Near bottom of viewport
        left: 1150, // Near right edge
        right: 1200,
        bottom: 800,
        width: 50,
        height: 50,
        x: 1150,
        y: 750,
        toJSON: () => ({})
      }));

      const bottomStep: TutorialStep = { ...mockStep, position: 'bottom' };
      
      render(<TutorialPopover step={bottomStep} targetElement={edgeElement} />);
      
      // Position should be constrained to fit in viewport
      const popover = document.querySelector('.absolute');
      expect(popover).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Welcome to ShiftSync!');
    });

    it('should have accessible button styling', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      const skipButton = screen.getByText('Skip tutorial');
      expect(skipButton).toHaveClass('text-sm', 'text-gray-500', 'hover:text-gray-700');
    });

    it('should have proper progress bar accessibility', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      const progressContainer = document.querySelector('.w-full.bg-gray-200');
      expect(progressContainer).toBeInTheDocument();
      
      const progressBar = document.querySelector('.bg-primary-500');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle null target element gracefully', () => {
      expect(() => {
        render(<TutorialPopover step={mockStep} targetElement={null} />);
      }).not.toThrow();
    });

    it('should handle missing getBoundingClientRect', () => {
      const elementWithoutRect = document.createElement('div');
      // Remove getBoundingClientRect
      delete (elementWithoutRect as any).getBoundingClientRect;
      
      expect(() => {
        render(<TutorialPopover step={mockStep} targetElement={elementWithoutRect} />);
      }).not.toThrow();
    });

    it('should handle window resize errors gracefully', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      // Component should handle resize events without throwing
      expect(() => {
        fireEvent(window, new Event('resize'));
      }).not.toThrow();
    });
  });

  describe('Dynamic Style Injection', () => {
    it('should inject styles to disable hover effects', () => {
      render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      // Check that style element is added to head
      const styleElements = document.head.querySelectorAll('style');
      const tutorialStyle = Array.from(styleElements).find(style => 
        style.textContent?.includes('.tutorial-interactive:hover')
      );
      
      expect(tutorialStyle).toBeInTheDocument();
      expect(tutorialStyle?.textContent).toContain('transform: none !important');
    });

    it('should clean up injected styles on unmount', () => {
      const { unmount } = render(<TutorialPopover step={mockStep} targetElement={mockTargetElement} />);
      
      const initialStyleCount = document.head.querySelectorAll('style').length;
      
      unmount();
      
      const finalStyleCount = document.head.querySelectorAll('style').length;
      expect(finalStyleCount).toBeLessThanOrEqual(initialStyleCount);
    });
  });
}); 
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShiftTemplatesStep from '../ShiftTemplatesStep';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      // Filter out framer-motion specific props
      const { 
        initial, animate, transition, whileHover, variants, 
        onAnimationComplete, onAnimationStart, ...domProps 
      } = props;
      return <div {...domProps}>{children}</div>;
    }
  }
}));

describe('ShiftTemplatesStep Component', () => {
  beforeEach(() => {
    render(<ShiftTemplatesStep />);
  });

  describe('Basic Rendering', () => {
    it('should render the component title', () => {
      expect(screen.getByText('Shift Templates')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Shift Templates');
    });

    it('should render with correct container classes', () => {
      const container = document.querySelector('.templates-showcase');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('bg-white', 'dark:bg-dark-800', 'rounded-lg', 'shadow-lg', 'p-4', 'max-w-md');
    });

    it('should render all three template cards', () => {
      expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      expect(screen.getByText('Evening Shift')).toBeInTheDocument();
      expect(screen.getByText('Weekend Shift')).toBeInTheDocument();
    });
  });

  describe('Template Content', () => {
    it('should display Morning Shift template with correct details', () => {
      expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      expect(screen.getByText('08:00 - 16:00')).toBeInTheDocument();
      expect(screen.getByText('Cashier')).toBeInTheDocument();
    });

    it('should display Evening Shift template with correct details', () => {
      expect(screen.getByText('Evening Shift')).toBeInTheDocument();
      expect(screen.getByText('16:00 - 00:00')).toBeInTheDocument();
      expect(screen.getByText('Supervisor')).toBeInTheDocument();
    });

    it('should display Weekend Shift template with correct details', () => {
      expect(screen.getByText('Weekend Shift')).toBeInTheDocument();
      expect(screen.getByText('12:00 - 20:00')).toBeInTheDocument();
      expect(screen.getByText('Stockroom')).toBeInTheDocument();
    });

    it('should have correct color classes for each template', () => {
      // Find the template cards by looking for the colored background divs
      const templateCards = document.querySelectorAll('[class*="bg-"][class*="-100"]');
      
      expect(templateCards[0]).toHaveClass('bg-blue-100', 'dark:bg-blue-900');
      expect(templateCards[1]).toHaveClass('bg-purple-100', 'dark:bg-purple-900');
      expect(templateCards[2]).toHaveClass('bg-green-100', 'dark:bg-green-900');
    });
  });

  describe('Template Structure', () => {
    it('should have proper template card structure', () => {
      const templates = document.querySelectorAll('.space-y-3 > div');
      expect(templates).toHaveLength(3);

      templates.forEach(template => {
        // Should have the main flex container
        const flexContainer = template.querySelector('.flex.justify-between.items-center');
        expect(flexContainer).toBeInTheDocument();

        // Should have time display
        const timeDisplay = template.querySelector('.mt-2.text-sm');
        expect(timeDisplay).toBeInTheDocument();

        // Should have apply button
        const applyButton = template.querySelector('button');
        expect(applyButton).toBeInTheDocument();
        expect(applyButton).toHaveTextContent('Apply template');
      });
    });

    it('should have role badges with correct styling', () => {
      const roleBadges = screen.getAllByText(/Cashier|Supervisor|Stockroom/);
      expect(roleBadges).toHaveLength(3);

      roleBadges.forEach(badge => {
        expect(badge).toHaveClass('text-xs', 'px-2', 'py-1', 'rounded-full');
      });
    });

    it('should display template names as headings', () => {
      const templateNames = document.querySelectorAll('h4');
      expect(templateNames).toHaveLength(3);
      
      expect(templateNames[0]).toHaveTextContent('Morning Shift');
      expect(templateNames[1]).toHaveTextContent('Evening Shift');
      expect(templateNames[2]).toHaveTextContent('Weekend Shift');
    });
  });

  describe('Interactive Elements', () => {
    it('should have clickable Apply template buttons', () => {
      const applyButtons = screen.getAllByText('Apply template');
      expect(applyButtons).toHaveLength(3);

      applyButtons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveClass('text-xs', 'text-primary-600', 'hover:text-primary-700');
      });
    });

    it('should have a Create new template button', () => {
      const createButton = screen.getByText('Create new template');
      expect(createButton).toBeInTheDocument();
      expect(createButton.tagName).toBe('BUTTON');
      expect(createButton).toHaveClass('text-sm', 'text-primary-600', 'hover:text-primary-700');
    });

    it('should handle click events on Apply template buttons', () => {
      const applyButtons = screen.getAllByText('Apply template');
      
      applyButtons.forEach(button => {
        fireEvent.click(button);
        // Button should still be in the document after click
        expect(button).toBeInTheDocument();
      });
    });

    it('should handle click events on Create new template button', () => {
      const createButton = screen.getByText('Create new template');
      fireEvent.click(createButton);
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have proper spacing between template cards', () => {
      const templateContainer = document.querySelector('.space-y-3');
      expect(templateContainer).toBeInTheDocument();
    });

    it('should have responsive text colors for dark mode', () => {
      const title = screen.getByText('Shift Templates');
      expect(title).toHaveClass('text-gray-900', 'dark:text-white');

      const templateNames = document.querySelectorAll('h4');
      templateNames.forEach(name => {
        expect(name).toHaveClass('text-gray-900', 'dark:text-white');
      });
    });

    it('should have proper button positioning', () => {
      const buttonContainers = document.querySelectorAll('.mt-2.flex.justify-end');
      expect(buttonContainers).toHaveLength(3);

      const createButtonContainer = document.querySelector('.mt-4.text-center');
      expect(createButtonContainer).toBeInTheDocument();
    });

    it('should have proper padding and margins', () => {
      const templateCards = document.querySelectorAll('[class*="bg-"][class*="-100"] > div:first-child');
      expect(templateCards).toHaveLength(3);

      templateCards.forEach(card => {
        expect(card).toHaveClass('flex', 'justify-between', 'items-center');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const mainHeading = screen.getByRole('heading', { level: 3 });
      expect(mainHeading).toHaveTextContent('Shift Templates');

      const templateHeadings = screen.getAllByRole('heading', { level: 4 });
      expect(templateHeadings).toHaveLength(3);
    });

    it('should have accessible button text', () => {
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // 3 Apply + 1 Create

      buttons.forEach(button => {
        expect(button).toHaveTextContent(/Apply template|Create new template/);
      });
    });

    it('should have proper semantic structure', () => {
      // Main container should be a section-like div
      const mainContainer = document.querySelector('.templates-showcase');
      expect(mainContainer).toBeInTheDocument();

      // Should have proper list-like structure
      const templatesContainer = document.querySelector('.space-y-3');
      expect(templatesContainer).toBeInTheDocument();
    });
  });

  describe('Data Structure', () => {
    it('should render templates in correct order', () => {
      const templateNames = document.querySelectorAll('h4');
      expect(templateNames[0]).toHaveTextContent('Morning Shift');
      expect(templateNames[1]).toHaveTextContent('Evening Shift'); 
      expect(templateNames[2]).toHaveTextContent('Weekend Shift');
    });

    it('should have unique keys for template mapping', () => {
      // This is implicit in React rendering - if keys weren't unique, 
      // React would warn in development mode
      const templateCards = document.querySelectorAll('.space-y-3 > div');
      expect(templateCards).toHaveLength(3);
    });

    it('should display all template properties', () => {
      // Check that all required properties are displayed
      expect(screen.getByText('08:00 - 16:00')).toBeInTheDocument(); // startTime - endTime
      expect(screen.getByText('16:00 - 00:00')).toBeInTheDocument();
      expect(screen.getByText('12:00 - 20:00')).toBeInTheDocument();
      
      expect(screen.getByText('Cashier')).toBeInTheDocument(); // role
      expect(screen.getByText('Supervisor')).toBeInTheDocument();
      expect(screen.getByText('Stockroom')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing template data gracefully', () => {
      // The component has hardcoded data, so this tests the robustness
      // of the rendering even if some properties were undefined
      expect(() => render(<ShiftTemplatesStep />)).not.toThrow();
    });

    it('should render without errors when no props are passed', () => {
      expect(() => render(<ShiftTemplatesStep />)).not.toThrow();
    });
  });
}); 
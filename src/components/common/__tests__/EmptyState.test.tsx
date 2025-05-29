import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  const defaultProps = {
    message: 'No data found',
  };

  describe('basic rendering', () => {
    it('should render with required props only', () => {
      render(<EmptyState {...defaultProps} />);
      
      expect(screen.getByText('No data found')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('No data found');
    });

    it('should render default icon when no custom icon provided', () => {
      render(<EmptyState {...defaultProps} />);
      
      // Default icon should be an SVG
      const svgIcon = document.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      expect(svgIcon).toHaveClass('text-gray-400');
    });

    it('should render with description when provided', () => {
      const description = 'This is a helpful description';
      render(<EmptyState {...defaultProps} description={description} />);
      
      expect(screen.getByText(description)).toBeInTheDocument();
      expect(screen.getByText(description)).toHaveClass('text-gray-500');
    });
  });

  describe('action button', () => {
    it('should render action button when both actionLabel and onAction are provided', () => {
      const onAction = jest.fn();
      render(
        <EmptyState 
          {...defaultProps} 
          actionLabel="Add Item" 
          onAction={onAction} 
        />
      );
      
      const button = screen.getByRole('button', { name: /add item/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary-600');
    });

    it('should call onAction when action button is clicked', () => {
      const onAction = jest.fn();
      render(
        <EmptyState 
          {...defaultProps} 
          actionLabel="Add Item" 
          onAction={onAction} 
        />
      );
      
      const button = screen.getByRole('button', { name: /add item/i });
      fireEvent.click(button);
      
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('should not render action button when only actionLabel is provided', () => {
      render(<EmptyState {...defaultProps} actionLabel="Add Item" />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render action button when only onAction is provided', () => {
      const onAction = jest.fn();
      render(<EmptyState {...defaultProps} onAction={onAction} />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render plus icon in action button when not compact', () => {
      const onAction = jest.fn();
      render(
        <EmptyState 
          {...defaultProps} 
          actionLabel="Add Item" 
          onAction={onAction} 
        />
      );
      
      // Should have plus icon in button
      const button = screen.getByRole('button');
      const plusIcon = button.querySelector('svg');
      expect(plusIcon).toBeInTheDocument();
    });
  });

  describe('custom icon', () => {
    it('should render custom icon when provided', () => {
      const customIcon = (
        <div data-testid="custom-icon" className="custom-icon">
          Custom Icon
        </div>
      );
      
      render(<EmptyState {...defaultProps} icon={customIcon} />);
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.getByText('Custom Icon')).toBeInTheDocument();
    });

    it('should not render default icon when custom icon is provided', () => {
      const customIcon = <div data-testid="custom-icon">Custom</div>;
      render(<EmptyState {...defaultProps} icon={customIcon} />);
      
      // Should not have default SVG icon
      const defaultSvg = document.querySelector('svg.text-gray-400');
      expect(defaultSvg).not.toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('should apply compact styling when isCompact is true', () => {
      render(<EmptyState {...defaultProps} isCompact={true} />);
      
      const container = document.querySelector('.py-3');
      expect(container).toBeInTheDocument();
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-base');
      
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('w-12', 'h-12');
    });

    it('should apply normal styling when isCompact is false', () => {
      render(<EmptyState {...defaultProps} isCompact={false} />);
      
      const container = document.querySelector('.py-8');
      expect(container).toBeInTheDocument();
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-lg');
      
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('w-16', 'h-16');
    });

    it('should render compact action button in compact mode', () => {
      const onAction = jest.fn();
      render(
        <EmptyState 
          {...defaultProps} 
          actionLabel="Add" 
          onAction={onAction}
          isCompact={true}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-xs', 'px-3', 'py-1.5');
      expect(button).toHaveTextContent('Add');
      
      // Should not have plus icon in compact mode
      const plusIcon = button.querySelector('svg');
      expect(plusIcon).not.toBeInTheDocument();
    });

    it('should render compact description styling', () => {
      render(
        <EmptyState 
          {...defaultProps} 
          description="Test description"
          isCompact={true}
        />
      );
      
      const description = screen.getByText('Test description');
      expect(description).toHaveClass('text-xs');
    });
  });

  describe('tips functionality', () => {
    const tips = [
      'First helpful tip',
      'Second useful tip',
      'Third important tip'
    ];

    it('should render tips when provided and not compact', () => {
      render(<EmptyState {...defaultProps} tips={tips} />);
      
      expect(screen.getByText('Quick Tips:')).toBeInTheDocument();
      
      tips.forEach(tip => {
        expect(screen.getByText(tip)).toBeInTheDocument();
      });
    });

    it('should not render tips in compact mode', () => {
      render(<EmptyState {...defaultProps} tips={tips} isCompact={true} />);
      
      expect(screen.queryByText('Quick Tips:')).not.toBeInTheDocument();
      
      tips.forEach(tip => {
        expect(screen.queryByText(tip)).not.toBeInTheDocument();
      });
    });

    it('should not render tips when array is empty', () => {
      render(<EmptyState {...defaultProps} tips={[]} />);
      
      expect(screen.queryByText('Quick Tips:')).not.toBeInTheDocument();
    });

    it('should render each tip with bullet point', () => {
      render(<EmptyState {...defaultProps} tips={tips} />);
      
      const tipElements = screen.getAllByText('•');
      expect(tipElements).toHaveLength(tips.length);
    });

    it('should apply correct styling to tips section', () => {
      render(<EmptyState {...defaultProps} tips={tips} />);
      
      const tipsTitle = screen.getByText('Quick Tips:');
      expect(tipsTitle).toHaveClass('text-sm', 'font-medium', 'text-gray-700');
      
      const tipsList = tipsTitle.nextElementSibling;
      expect(tipsList).toHaveClass('text-xs', 'text-gray-500', 'space-y-1');
    });
  });

  describe('dark mode styling', () => {
    it('should include dark mode classes for text elements', () => {
      render(<EmptyState {...defaultProps} description="Test description" />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('dark:text-white');
      
      const description = screen.getByText('Test description');
      expect(description).toHaveClass('dark:text-gray-400');
      
      const icon = document.querySelector('svg');
      expect(icon).toHaveClass('dark:text-gray-600');
    });

    it('should include dark mode classes for tips', () => {
      const tips = ['Test tip'];
      render(<EmptyState {...defaultProps} tips={tips} />);
      
      const tipsTitle = screen.getByText('Quick Tips:');
      expect(tipsTitle).toHaveClass('dark:text-gray-300');
      
      const tipText = screen.getByText('Test tip');
      expect(tipText.parentElement?.parentElement).toHaveClass('dark:text-gray-400');
    });
  });

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      render(<EmptyState {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('No data found');
    });

    it('should have accessible action button', () => {
      const onAction = jest.fn();
      render(
        <EmptyState 
          {...defaultProps} 
          actionLabel="Create New Item" 
          onAction={onAction} 
        />
      );
      
      const button = screen.getByRole('button', { name: /create new item/i });
      expect(button).toBeInTheDocument();
      
      // Test that it's clickable and accessible
      fireEvent.click(button);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('should have proper color contrast classes', () => {
      render(<EmptyState {...defaultProps} description="Test description" />);
      
      // High contrast text colors
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-gray-900');
      
      const description = screen.getByText('Test description');
      expect(description).toHaveClass('text-gray-500');
    });
  });

  describe('edge cases', () => {
    it('should handle empty message gracefully', () => {
      render(<EmptyState message="" />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'This is a very long message that should still render properly without breaking the layout or causing any issues with the component';
      render(<EmptyState message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'No data found! 🔍 Try again...';
      render(<EmptyState message={specialMessage} />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle multiple action button clicks', () => {
      const onAction = jest.fn();
      render(
        <EmptyState 
          {...defaultProps} 
          actionLabel="Click Me" 
          onAction={onAction} 
        />
      );
      
      const button = screen.getByRole('button');
      
      // Click multiple times
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(onAction).toHaveBeenCalledTimes(3);
    });
  });

  describe('component composition', () => {
    it('should render all props together correctly', () => {
      const onAction = jest.fn();
      const customIcon = <div data-testid="custom-icon">🎯</div>;
      const tips = ['Tip 1', 'Tip 2'];
      
      render(
        <EmptyState 
          message="Complete Example"
          description="This shows all features working together"
          actionLabel="Take Action"
          onAction={onAction}
          icon={customIcon}
          tips={tips}
          isCompact={false}
        />
      );
      
      // Verify all elements are present
      expect(screen.getByText('Complete Example')).toBeInTheDocument();
      expect(screen.getByText('This shows all features working together')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /take action/i })).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.getByText('Quick Tips:')).toBeInTheDocument();
      expect(screen.getByText('Tip 1')).toBeInTheDocument();
      expect(screen.getByText('Tip 2')).toBeInTheDocument();
    });
  });
}); 
import React from 'react';
import { render, screen } from '@testing-library/react';
import BrandedSpinner from '../BrandedSpinner';

// Mock framer-motion to avoid complex animation testing
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div className={className} style={style} data-testid={props['data-testid']}>
        {children}
      </div>
    ),
  },
}));

describe('BrandedSpinner Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<BrandedSpinner />);
      
      const spinner = document.querySelector('.flex.flex-col.items-center.justify-center');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with default props', () => {
      render(<BrandedSpinner />);
      
      // Should have medium size classes by default
      expect(document.querySelector('.h-10.w-10')).toBeInTheDocument();
      
      // Should have primary color classes by default
      expect(document.querySelector('.border-primary-200.border-t-primary-600')).toBeInTheDocument();
    });

    it('should render both outer and inner circles', () => {
      render(<BrandedSpinner />);
      
      // Should have outer spinning circle
      const outerCircle = document.querySelector('.rounded-full.border-4');
      expect(outerCircle).toBeInTheDocument();
      
      // Should have inner pulsing circle
      const innerCircle = document.querySelector('.bg-current.rounded-full');
      expect(innerCircle).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size correctly', () => {
      render(<BrandedSpinner size="small" />);
      
      // Outer circle should be small
      expect(document.querySelector('.h-6.w-6')).toBeInTheDocument();
      
      // Inner circle should be small
      expect(document.querySelector('.h-3.w-3')).toBeInTheDocument();
    });

    it('should render medium size correctly', () => {
      render(<BrandedSpinner size="medium" />);
      
      // Outer circle should be medium
      expect(document.querySelector('.h-10.w-10')).toBeInTheDocument();
      
      // Inner circle should be medium
      expect(document.querySelector('.h-5.w-5')).toBeInTheDocument();
    });

    it('should render large size correctly', () => {
      render(<BrandedSpinner size="large" />);
      
      // Outer circle should be large
      expect(document.querySelector('.h-16.w-16')).toBeInTheDocument();
      
      // Inner circle should be large
      expect(document.querySelector('.h-8.w-8')).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('should render primary color correctly', () => {
      render(<BrandedSpinner color="primary" />);
      
      const coloredElement = document.querySelector('.border-primary-200.border-t-primary-600');
      expect(coloredElement).toBeInTheDocument();
    });

    it('should render success color correctly', () => {
      render(<BrandedSpinner color="success" />);
      
      const coloredElement = document.querySelector('.border-success-200.border-t-success-600');
      expect(coloredElement).toBeInTheDocument();
    });

    it('should render warning color correctly', () => {
      render(<BrandedSpinner color="warning" />);
      
      const coloredElement = document.querySelector('.border-warning-200.border-t-warning-600');
      expect(coloredElement).toBeInTheDocument();
    });

    it('should render danger color correctly', () => {
      render(<BrandedSpinner color="danger" />);
      
      const coloredElement = document.querySelector('.border-danger-200.border-t-danger-600');
      expect(coloredElement).toBeInTheDocument();
    });

    it('should handle custom hex color', () => {
      render(<BrandedSpinner color="#ff5733" />);
      
      // Should fallback to gray border with custom color for border-t
      const customColorElement = document.querySelector('.border-gray-200');
      expect(customColorElement).toBeInTheDocument();
      
      // Inner circle should have custom color style
      const innerCircle = document.querySelector('.bg-current.rounded-full');
      expect(innerCircle).toHaveStyle({ color: '#ff5733' });
    });

    it('should handle custom rgb color', () => {
      render(<BrandedSpinner color="rgb(255, 87, 51)" />);
      
      const customColorElement = document.querySelector('.border-gray-200');
      expect(customColorElement).toBeInTheDocument();
      
      const innerCircle = document.querySelector('.bg-current.rounded-full');
      expect(innerCircle).toHaveStyle({ color: 'rgb(255, 87, 51)' });
    });
  });

  describe('Text Display', () => {
    it('should not render text when not provided', () => {
      render(<BrandedSpinner />);
      
      const textElement = document.querySelector('p');
      expect(textElement).not.toBeInTheDocument();
    });

    it('should render text when provided', () => {
      const testText = 'Loading data...';
      render(<BrandedSpinner text={testText} />);
      
      expect(screen.getByText(testText)).toBeInTheDocument();
    });

    it('should apply correct text classes for small size', () => {
      render(<BrandedSpinner size="small" text="Loading..." />);
      
      const textElement = screen.getByText('Loading...');
      expect(textElement).toHaveClass('text-xs');
    });

    it('should apply correct text classes for medium size', () => {
      render(<BrandedSpinner size="medium" text="Loading..." />);
      
      const textElement = screen.getByText('Loading...');
      expect(textElement).toHaveClass('text-sm');
    });

    it('should apply correct text classes for large size', () => {
      render(<BrandedSpinner size="large" text="Loading..." />);
      
      const textElement = screen.getByText('Loading...');
      expect(textElement).toHaveClass('text-base');
    });

    it('should apply dark mode text styles', () => {
      render(<BrandedSpinner text="Loading..." />);
      
      const textElement = screen.getByText('Loading...');
      expect(textElement).toHaveClass('text-gray-600', 'dark:text-gray-300');
    });
  });

  describe('Animation Classes', () => {
    it('should apply spin animation to outer circle', () => {
      render(<BrandedSpinner />);
      
      const outerCircle = document.querySelector('.animate-spin');
      expect(outerCircle).toBeInTheDocument();
    });

    it('should apply positioning classes to inner circle', () => {
      render(<BrandedSpinner />);
      
      const innerCircle = document.querySelector('.absolute.top-1\\/2.left-1\\/2.transform.-translate-x-1\\/2.-translate-y-1\\/2');
      expect(innerCircle).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible for screen readers', () => {
      render(<BrandedSpinner text="Loading content" />);
      
      // Screen readers can access the loading text
      expect(screen.getByText('Loading content')).toBeInTheDocument();
    });

    it('should work without text for minimal usage', () => {
      render(<BrandedSpinner />);
      
      // Should still render the visual spinner
      const spinner = document.querySelector('.flex.flex-col.items-center.justify-center');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text string', () => {
      render(<BrandedSpinner text="" />);
      
      // Should not render paragraph when text is empty
      const textElement = document.querySelector('p');
      expect(textElement).not.toBeInTheDocument();
    });

    it('should handle undefined color gracefully', () => {
      render(<BrandedSpinner color={undefined} />);
      
      // Should fallback to default primary color
      const defaultColorElement = document.querySelector('.border-primary-200.border-t-primary-600');
      expect(defaultColorElement).toBeInTheDocument();
    });

    it('should handle long text content', () => {
      const longText = 'This is a very long loading message that might wrap to multiple lines';
      render(<BrandedSpinner text={longText} />);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should maintain structure with all props combined', () => {
      render(
        <BrandedSpinner 
          size="large" 
          color="success" 
          text="Loading large success spinner..." 
        />
      );
      
      // Should have large size
      expect(document.querySelector('.h-16.w-16')).toBeInTheDocument();
      
      // Should have success color
      expect(document.querySelector('.border-success-200.border-t-success-600')).toBeInTheDocument();
      
      // Should have text with large text size
      const textElement = screen.getByText('Loading large success spinner...');
      expect(textElement).toHaveClass('text-base');
    });
  });
}); 
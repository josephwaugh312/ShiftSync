import React from 'react';
import { render, screen } from '@testing-library/react';
import SkeletonLoader from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  describe('default behavior', () => {
    it('should render line skeleton by default', () => {
      const { container } = render(<SkeletonLoader />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('bg-gray-200', 'dark:bg-gray-700', 'rounded');
      expect(skeleton).toHaveStyle({ width: '100%', height: '16px' });
    });

    it('should render shimmer animation', () => {
      const { container } = render(<SkeletonLoader />);
      
      // Check for shimmer gradient
      const shimmer = container.querySelector('[class*="gradient"]');
      expect(shimmer).toBeInTheDocument();
    });
  });

  describe('skeleton types', () => {
    it('should render circle skeleton', () => {
      const { container } = render(<SkeletonLoader type="circle" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton).toHaveStyle({ width: '40px', height: '40px' });
    });

    it('should render circle with custom dimensions', () => {
      const { container } = render(<SkeletonLoader type="circle" width="60px" height="60px" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton).toHaveStyle({ width: '60px', height: '60px' });
    });

    it('should render rectangle skeleton', () => {
      const { container } = render(<SkeletonLoader type="rectangle" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-md');
      expect(skeleton).toHaveStyle({ width: '100%', height: '100px' });
    });

    it('should render rectangle with custom dimensions', () => {
      const { container } = render(<SkeletonLoader type="rectangle" width="200px" height="150px" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-md');
      expect(skeleton).toHaveStyle({ width: '200px', height: '150px' });
    });

    it('should render card skeleton', () => {
      const { container } = render(<SkeletonLoader type="card" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-lg');
      
      // Check for card structure elements
      expect(container.querySelector('.p-4')).toBeInTheDocument();
      expect(container.querySelector('.w-12.h-12')).toBeInTheDocument(); // Avatar
      expect(container.querySelector('.h-24')).toBeInTheDocument(); // Content area
      expect(container.querySelector('.w-24')).toBeInTheDocument(); // Button area
      expect(container.querySelector('.w-16')).toBeInTheDocument(); // Second button
    });

    it('should render card with custom width', () => {
      const { container } = render(<SkeletonLoader type="card" width="300px" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: '300px' });
    });

    it('should render table skeleton', () => {
      const { container } = render(<SkeletonLoader type="table" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-lg', 'overflow-hidden');
      
      // Check for table header
      expect(container.querySelector('.h-12')).toBeInTheDocument();
      
      // Check for table rows (should have 5 rows)
      const rows = container.querySelectorAll('.border-b');
      expect(rows).toHaveLength(5);
      
      // Check for table cells (4 columns per row)
      const cells = container.querySelectorAll('.w-1\\/4');
      expect(cells.length).toBeGreaterThanOrEqual(20); // 5 rows × 4 columns
    });

    it('should render table with custom width', () => {
      const { container } = render(<SkeletonLoader type="table" width="500px" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: '500px' });
    });

    it('should render line skeleton with custom dimensions', () => {
      const { container } = render(<SkeletonLoader type="line" width="250px" height="20px" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded');
      expect(skeleton).toHaveStyle({ width: '250px', height: '20px' });
    });
  });

  describe('custom properties', () => {
    it('should apply custom className', () => {
      const { container } = render(<SkeletonLoader className="custom-class" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('custom-class');
    });

    it('should apply custom width and height', () => {
      const { container } = render(<SkeletonLoader width="300px" height="50px" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: '300px', height: '50px' });
    });
  });

  describe('repeat functionality', () => {
    it('should render single skeleton when repeat is 1', () => {
      const { container } = render(<SkeletonLoader repeat={1} />);
      
      // Should not have space-y-2 wrapper for single skeleton
      expect(container.firstChild).not.toHaveClass('space-y-2');
    });

    it('should render multiple skeletons when repeat > 1', () => {
      const { container } = render(<SkeletonLoader repeat={3} />);
      
      // Should have space-y-2 wrapper
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-2');
      
      // Should have 3 skeleton elements
      const skeletons = wrapper.children;
      expect(skeletons).toHaveLength(3);
    });

    it('should render multiple circle skeletons', () => {
      const { container } = render(<SkeletonLoader type="circle" repeat={2} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-2');
      
      const skeletons = wrapper.children;
      expect(skeletons).toHaveLength(2);
      
      // Each should be a circle
      Array.from(skeletons).forEach(skeleton => {
        expect(skeleton).toHaveClass('rounded-full');
      });
    });

    it('should render multiple card skeletons', () => {
      const { container } = render(<SkeletonLoader type="card" repeat={2} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-2');
      
      const skeletons = wrapper.children;
      expect(skeletons).toHaveLength(2);
      
      // Each should be a card
      Array.from(skeletons).forEach(skeleton => {
        expect(skeleton).toHaveClass('rounded-lg');
      });
    });
  });

  describe('dark mode support', () => {
    it('should include dark mode classes', () => {
      const { container } = render(<SkeletonLoader />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('dark:bg-gray-700');
      
      // Check shimmer has dark mode
      const shimmer = container.querySelector('[class*="dark:via-gray-600"]');
      expect(shimmer).toBeInTheDocument();
    });

    it('should include dark mode in table borders', () => {
      const { container } = render(<SkeletonLoader type="table" />);
      
      const borders = container.querySelectorAll('.dark\\:border-gray-600');
      expect(borders.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility and structure', () => {
    it('should have proper base classes', () => {
      const { container } = render(<SkeletonLoader />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass(
        'bg-gray-200',
        'dark:bg-gray-700',
        'relative',
        'overflow-hidden'
      );
    });

    it('should handle unknown type as line', () => {
      const { container } = render(<SkeletonLoader type={'unknown' as any} />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded');
      expect(skeleton).toHaveStyle({ width: '100%', height: '16px' });
    });
  });

  describe('shimmer animation', () => {
    it('should render shimmer in all skeleton types', () => {
      const types: Array<'line' | 'circle' | 'rectangle' | 'card' | 'table'> = 
        ['line', 'circle', 'rectangle', 'card', 'table'];
      
      types.forEach(type => {
        const { container } = render(<SkeletonLoader type={type} />);
        const shimmer = container.querySelector('[class*="gradient"]');
        expect(shimmer).toBeInTheDocument();
      });
    });

    it('should have motion properties for shimmer animation', () => {
      const { container } = render(<SkeletonLoader />);
      
      const shimmer = container.querySelector('[class*="gradient"]');
      expect(shimmer).toHaveClass('absolute', 'inset-0');
    });
  });

  describe('edge cases', () => {
    it('should handle repeat value of 0', () => {
      const { container } = render(<SkeletonLoader repeat={0} />);
      
      // With repeat 0, should render the skeleton without wrapper
      expect(container.firstChild).not.toHaveClass('space-y-2');
    });

    it('should handle large repeat values', () => {
      const { container } = render(<SkeletonLoader repeat={10} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-2');
      expect(wrapper.children).toHaveLength(10);
    });

    it('should handle empty className', () => {
      const { container } = render(<SkeletonLoader className="" />);
      
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('bg-gray-200');
    });
  });
}); 
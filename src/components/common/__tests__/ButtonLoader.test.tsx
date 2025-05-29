import React from 'react';
import { render } from '@testing-library/react';
import ButtonLoader from '../ButtonLoader';

describe('ButtonLoader', () => {
  describe('default behavior', () => {
    it('should render with default props', () => {
      const { container } = render(<ButtonLoader />);
      
      const loader = container.firstChild as HTMLElement;
      expect(loader).toHaveClass('flex', 'items-center', 'justify-center');
      
      // Should have SVG with default size
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
    });

    it('should use default color (white)', () => {
      const { container } = render(<ButtonLoader />);
      
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
      
      // All paths should have white stroke
      paths.forEach(path => {
        expect(path).toHaveAttribute('stroke', 'white');
      });
    });

    it('should have proper SVG structure', () => {
      const { container } = render(<ButtonLoader />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveClass('animate-spin');
    });
  });

  describe('custom props', () => {
    it('should render with custom color', () => {
      const { container } = render(<ButtonLoader color="blue" />);
      
      const paths = container.querySelectorAll('path');
      paths.forEach(path => {
        expect(path).toHaveAttribute('stroke', 'blue');
      });
    });

    it('should render with custom size', () => {
      const { container } = render(<ButtonLoader size={30} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '30');
      expect(svg).toHaveAttribute('height', '30');
    });

    it('should render with custom className', () => {
      const { container } = render(<ButtonLoader className="custom-class" />);
      
      const loader = container.firstChild as HTMLElement;
      expect(loader).toHaveClass('custom-class');
    });

    it('should combine custom className with default classes', () => {
      const { container } = render(<ButtonLoader className="my-custom-class" />);
      
      const loader = container.firstChild as HTMLElement;
      expect(loader).toHaveClass('flex', 'items-center', 'justify-center', 'my-custom-class');
    });
  });

  describe('all props together', () => {
    it('should render with all custom props', () => {
      const { container } = render(
        <ButtonLoader 
          color="red" 
          size={25} 
          className="test-class" 
        />
      );
      
      const loader = container.firstChild as HTMLElement;
      expect(loader).toHaveClass('flex', 'items-center', 'justify-center', 'test-class');
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '25');
      expect(svg).toHaveAttribute('height', '25');
      
      const paths = container.querySelectorAll('path');
      paths.forEach(path => {
        expect(path).toHaveAttribute('stroke', 'red');
      });
    });
  });

  describe('spinner structure', () => {
    it('should render all 8 spinner paths', () => {
      const { container } = render(<ButtonLoader />);
      
      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(8);
    });

    it('should have different opacities for visual effect', () => {
      const { container } = render(<ButtonLoader />);
      
      const paths = container.querySelectorAll('path');
      const opacities = Array.from(paths).map(path => path.getAttribute('opacity'));
      
      // Should have different opacity values
      const uniqueOpacities = [...new Set(opacities)];
      expect(uniqueOpacities.length).toBeGreaterThan(1);
      
      // Verify specific opacity values exist
      expect(opacities).toContain('0.5');
      expect(opacities).toContain('0.6');
      expect(opacities).toContain('0.7');
      expect(opacities).toContain('0.8');
    });

    it('should have proper stroke properties', () => {
      const { container } = render(<ButtonLoader />);
      
      const paths = container.querySelectorAll('path');
      paths.forEach(path => {
        expect(path).toHaveAttribute('stroke-width', '2');
        expect(path).toHaveAttribute('stroke-linecap', 'round');
        expect(path).toHaveAttribute('stroke-linejoin', 'round');
      });
    });
  });

  describe('motion component', () => {
    it('should render with motion div wrapper', () => {
      const { container } = render(<ButtonLoader />);
      
      // Should have motion div (renders as regular div)
      const motionDiv = container.querySelector('.flex.items-center');
      expect(motionDiv).toBeInTheDocument();
    });

    it('should have animation classes', () => {
      const { container } = render(<ButtonLoader />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('animate-spin');
    });
  });

  describe('edge cases and variations', () => {
    it('should handle size 0', () => {
      const { container } = render(<ButtonLoader size={0} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '0');
      expect(svg).toHaveAttribute('height', '0');
    });

    it('should handle very large size', () => {
      const { container } = render(<ButtonLoader size={100} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '100');
      expect(svg).toHaveAttribute('height', '100');
    });

    it('should handle empty className', () => {
      const { container } = render(<ButtonLoader className="" />);
      
      const loader = container.firstChild as HTMLElement;
      expect(loader).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should handle hex color values', () => {
      const { container } = render(<ButtonLoader color="#ff0000" />);
      
      const paths = container.querySelectorAll('path');
      paths.forEach(path => {
        expect(path).toHaveAttribute('stroke', '#ff0000');
      });
    });

    it('should handle RGB color values', () => {
      const { container } = render(<ButtonLoader color="rgb(255, 0, 0)" />);
      
      const paths = container.querySelectorAll('path');
      paths.forEach(path => {
        expect(path).toHaveAttribute('stroke', 'rgb(255, 0, 0)');
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper SVG structure for screen readers', () => {
      const { container } = render(<ButtonLoader />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(svg).toHaveAttribute('fill', 'none');
    });

    it('should be contained within a flex container', () => {
      const { container } = render(<ButtonLoader />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('SVG path definitions', () => {
    it('should have correct path data for spinner lines', () => {
      const { container } = render(<ButtonLoader />);
      
      const paths = container.querySelectorAll('path');
      const pathData = Array.from(paths).map(path => path.getAttribute('d'));
      
      // Verify specific path data exists (top, bottom, sides, corners)
      expect(pathData).toContain('M12 2.5V5.5'); // Top
      expect(pathData).toContain('M12 18.5V21.5'); // Bottom
      expect(pathData).toContain('M2.5 12H5.5'); // Left
      expect(pathData).toContain('M18.5 12H21.5'); // Right
      expect(pathData).toContain('M4.93 4.93L7.05 7.05'); // Top-left diagonal
      expect(pathData).toContain('M16.95 16.95L19.07 19.07'); // Bottom-right diagonal
      expect(pathData).toContain('M4.93 19.07L7.05 16.95'); // Bottom-left diagonal
      expect(pathData).toContain('M16.95 7.05L19.07 4.93'); // Top-right diagonal
    });
  });

  describe('default prop handling', () => {
    it('should handle undefined props gracefully', () => {
      expect(() => {
        render(<ButtonLoader color={undefined} size={undefined} className={undefined} />);
      }).not.toThrow();
    });

    it('should use defaults when props are not provided', () => {
      const { container } = render(<ButtonLoader />);
      
      // Should use default values
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
      
      const firstPath = container.querySelector('path');
      expect(firstPath).toHaveAttribute('stroke', 'white');
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toMatch(/^flex items-center justify-center\s*$/);
    });
  });
}); 
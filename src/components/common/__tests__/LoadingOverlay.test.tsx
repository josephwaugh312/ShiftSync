import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingOverlay from '../LoadingOverlay';

// Mock framer-motion to avoid complex animation testing
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div 
        className={className} 
        style={style} 
        data-testid={props['data-testid']}
        {...(props.initial && { 'data-initial': JSON.stringify(props.initial) })}
        {...(props.animate && { 'data-animate': JSON.stringify(props.animate) })}
        {...(props.exit && { 'data-exit': JSON.stringify(props.exit) })}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>,
}));

// Mock BrandedSpinner
jest.mock('../BrandedSpinner', () => {
  return function MockBrandedSpinner({ size, color, text }: any) {
    return (
      <div 
        data-testid="branded-spinner"
        data-size={size}
        data-color={color}
        data-text={text}
      >
        Branded Spinner: {text}
      </div>
    );
  };
});

describe('LoadingOverlay Component', () => {
  describe('Basic Rendering', () => {
    it('should not render when show is false', () => {
      render(<LoadingOverlay show={false} />);
      
      const overlay = screen.queryByTestId('animate-presence');
      expect(overlay).toBeInTheDocument();
      
      // But no overlay content should be present
      const overlayContent = document.querySelector('.fixed.inset-0');
      expect(overlayContent).not.toBeInTheDocument();
    });

    it('should render when show is true', () => {
      render(<LoadingOverlay show={true} />);
      
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('should render with default message', () => {
      render(<LoadingOverlay show={true} />);
      
      const spinner = screen.getByTestId('branded-spinner');
      expect(spinner).toHaveAttribute('data-text', 'Loading...');
    });

    it('should apply correct CSS classes for overlay positioning', () => {
      render(<LoadingOverlay show={true} />);
      
      const overlay = document.querySelector('.fixed.inset-0.z-\\[9000\\].flex.items-center.justify-center');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Message Customization', () => {
    it('should render custom message', () => {
      const customMessage = 'Processing your request...';
      render(<LoadingOverlay show={true} message={customMessage} />);
      
      const spinner = screen.getByTestId('branded-spinner');
      expect(spinner).toHaveAttribute('data-text', customMessage);
    });

    it('should handle empty message', () => {
      render(<LoadingOverlay show={true} message="" />);
      
      const spinner = screen.getByTestId('branded-spinner');
      expect(spinner).toHaveAttribute('data-text', '');
    });

    it('should handle long message', () => {
      const longMessage = 'This is a very long loading message that describes a complex operation in progress';
      render(<LoadingOverlay show={true} message={longMessage} />);
      
      const spinner = screen.getByTestId('branded-spinner');
      expect(spinner).toHaveAttribute('data-text', longMessage);
    });
  });

  describe('Transparency Options', () => {
    it('should use opaque background by default', () => {
      render(<LoadingOverlay show={true} />);
      
      const overlay = document.querySelector('.bg-white.dark\\:bg-dark-800');
      expect(overlay).toBeInTheDocument();
    });

    it('should use transparent background when transparent=true', () => {
      render(<LoadingOverlay show={true} transparent={true} />);
      
      const overlay = document.querySelector('.bg-white\\/70.dark\\:bg-dark-800\\/70');
      expect(overlay).toBeInTheDocument();
    });

    it('should use opaque background when transparent=false explicitly', () => {
      render(<LoadingOverlay show={true} transparent={false} />);
      
      const overlay = document.querySelector('.bg-white.dark\\:bg-dark-800');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('BrandedSpinner Integration', () => {
    it('should render BrandedSpinner with correct props', () => {
      render(<LoadingOverlay show={true} />);
      
      const spinner = screen.getByTestId('branded-spinner');
      expect(spinner).toHaveAttribute('data-size', 'large');
      expect(spinner).toHaveAttribute('data-color', 'primary');
    });

    it('should pass message to BrandedSpinner as text', () => {
      const message = 'Saving changes...';
      render(<LoadingOverlay show={true} message={message} />);
      
      const spinner = screen.getByTestId('branded-spinner');
      expect(spinner).toHaveAttribute('data-text', message);
    });

    it('should center the spinner content', () => {
      render(<LoadingOverlay show={true} />);
      
      const centerDiv = document.querySelector('.text-center');
      expect(centerDiv).toBeInTheDocument();
      expect(centerDiv).toContainElement(screen.getByTestId('branded-spinner'));
    });
  });

  describe('Animation Properties', () => {
    it('should have correct initial animation state', () => {
      render(<LoadingOverlay show={true} />);
      
      const overlay = document.querySelector('[data-initial]');
      expect(overlay).toHaveAttribute('data-initial', '{"opacity":0}');
    });

    it('should have correct animate state', () => {
      render(<LoadingOverlay show={true} />);
      
      const overlay = document.querySelector('[data-animate]');
      expect(overlay).toHaveAttribute('data-animate', '{"opacity":1}');
    });

    it('should have correct exit state', () => {
      render(<LoadingOverlay show={true} />);
      
      const overlay = document.querySelector('[data-exit]');
      expect(overlay).toHaveAttribute('data-exit', '{"opacity":0}');
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for opaque background', () => {
      render(<LoadingOverlay show={true} transparent={false} />);
      
      const overlay = document.querySelector('.dark\\:bg-dark-800');
      expect(overlay).toBeInTheDocument();
    });

    it('should include dark mode classes for transparent background', () => {
      render(<LoadingOverlay show={true} transparent={true} />);
      
      const overlay = document.querySelector('.dark\\:bg-dark-800\\/70');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should provide high z-index for proper layering', () => {
      render(<LoadingOverlay show={true} />);
      
      const overlay = document.querySelector('.z-\\[9000\\]');
      expect(overlay).toBeInTheDocument();
    });

    it('should be properly positioned to cover entire viewport', () => {
      render(<LoadingOverlay show={true} />);
      
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('should provide loading message for screen readers', () => {
      const message = 'Loading user data';
      render(<LoadingOverlay show={true} message={message} />);
      
      expect(screen.getByText(`Branded Spinner: ${message}`)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined message gracefully', () => {
      render(<LoadingOverlay show={true} message={undefined} />);
      
      // Should fallback to default message
      const spinner = screen.getByTestId('branded-spinner');
      expect(spinner).toHaveAttribute('data-text', 'Loading...');
    });

    it('should handle boolean props edge cases', () => {
      render(<LoadingOverlay show={true} transparent={undefined} />);
      
      // Should default to opaque (false)
      const overlay = document.querySelector('.bg-white.dark\\:bg-dark-800');
      expect(overlay).toBeInTheDocument();
    });

    it('should handle show=false with other props', () => {
      render(
        <LoadingOverlay 
          show={false} 
          message="Custom message" 
          transparent={true} 
        />
      );
      
      // Should not render overlay content regardless of other props
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).not.toBeInTheDocument();
    });

    it('should handle rapid show/hide changes', () => {
      const { rerender } = render(<LoadingOverlay show={true} />);
      
      // Initially shown
      expect(document.querySelector('.fixed.inset-0')).toBeInTheDocument();
      
      // Hide it
      rerender(<LoadingOverlay show={false} />);
      expect(document.querySelector('.fixed.inset-0')).not.toBeInTheDocument();
      
      // Show it again
      rerender(<LoadingOverlay show={true} />);
      expect(document.querySelector('.fixed.inset-0')).toBeInTheDocument();
    });
  });

  describe('Props Combinations', () => {
    it('should work with all props set', () => {
      render(
        <LoadingOverlay 
          show={true} 
          message="Processing payment..." 
          transparent={true} 
        />
      );
      
      // Should have transparent background
      const overlay = document.querySelector('.bg-white\\/70.dark\\:bg-dark-800\\/70');
      expect(overlay).toBeInTheDocument();
      
      // Should pass custom message
      const spinner = screen.getByTestId('branded-spinner');
      expect(spinner).toHaveAttribute('data-text', 'Processing payment...');
    });

    it('should work with minimal props', () => {
      render(<LoadingOverlay show={true} />);
      
      // Should use defaults
      const overlay = document.querySelector('.bg-white.dark\\:bg-dark-800');
      expect(overlay).toBeInTheDocument();
      
      const spinner = screen.getByTestId('branded-spinner');
      expect(spinner).toHaveAttribute('data-text', 'Loading...');
    });
  });
}); 
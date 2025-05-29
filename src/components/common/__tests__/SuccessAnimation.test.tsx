import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

// Mock useSoundEffects hook first, before importing the component
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, initial, animate, exit, transition, ...props }: any) => (
      <div 
        className={className}
        style={style}
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-exit={JSON.stringify(exit)}
        data-transition={JSON.stringify(transition)}
        data-testid={props['data-testid'] || 'motion-div'}
        {...(props.role && { role: props.role })}
        {...(props['aria-live'] && { 'aria-live': props['aria-live'] })}
      >
        {children}
      </div>
    ),
    path: ({ d, initial, animate, transition, ...props }: any) => (
      <path 
        d={d}
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        {...props}
      />
    ),
    h2: ({ children, className, initial, animate, transition, ...props }: any) => (
      <h2 
        className={className}
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </h2>
    ),
    p: ({ children, className, initial, animate, transition, ...props }: any) => (
      <p 
        className={className}
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </p>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Import the component after mocks are set up
import SuccessAnimation from '../SuccessAnimation';

beforeEach(() => {
  mockPlaySound.mockClear();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('SuccessAnimation Component', () => {
  const defaultProps = {
    show: false,
  };

  describe('Basic Rendering', () => {
    it('should render without crashing when show is false', () => {
      const { container } = render(<SuccessAnimation {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('should not render animation content when show is false', () => {
      render(<SuccessAnimation {...defaultProps} />);
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });

    it('should render animation content when show is true', () => {
      render(<SuccessAnimation {...defaultProps} show={true} />);
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<SuccessAnimation {...defaultProps} show={true} message="Custom Success!" />);
      expect(screen.getByText('Custom Success!')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<SuccessAnimation {...defaultProps} show={true} className="custom-class" />);
      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Sound Effects', () => {
    it('should play "success" sound for checkmark variant', () => {
      render(<SuccessAnimation {...defaultProps} show={true} variant="checkmark" />);
      expect(mockPlaySound).toHaveBeenCalledWith('success');
    });

    it('should play "complete" sound for confetti variant', () => {
      render(<SuccessAnimation {...defaultProps} show={true} variant="confetti" />);
      expect(mockPlaySound).toHaveBeenCalledWith('complete');
    });

    it('should play "complete" sound for celebration variant', () => {
      render(<SuccessAnimation {...defaultProps} show={true} variant="celebration" />);
      expect(mockPlaySound).toHaveBeenCalledWith('complete');
    });

    it('should not play sound when show is false', () => {
      render(<SuccessAnimation {...defaultProps} show={false} />);
      expect(mockPlaySound).not.toHaveBeenCalled();
    });
  });

  describe('Duration and Auto-completion', () => {
    it('should call onComplete after default duration (2000ms)', async () => {
      const onComplete = jest.fn();
      render(<SuccessAnimation {...defaultProps} show={true} onComplete={onComplete} />);
      
      // Wait for the default duration (2000ms)
      await new Promise(resolve => setTimeout(resolve, 2100));
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onComplete after custom duration', async () => {
      const onComplete = jest.fn();
      render(<SuccessAnimation {...defaultProps} show={true} duration={1000} onComplete={onComplete} />);
      
      // Wait for custom duration (1000ms)
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should work without onComplete callback', () => {
      expect(() => {
        render(<SuccessAnimation {...defaultProps} show={true} />);
      }).not.toThrow();
    });
  });
}); 
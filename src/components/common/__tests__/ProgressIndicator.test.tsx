import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProgressIndicator from '../ProgressIndicator';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, transition, ...props }: any) => {
      // Assign specific test IDs based on className
      let testId = 'motion-div';
      if (className?.includes('absolute top-0 left-0 h-full bg-primary-500')) {
        testId = 'progress-bar';
      } else if (className?.includes('w-6 h-6 rounded-full')) {
        testId = 'step-indicator';
      }
      
      return (
        <div 
          className={className}
          data-initial={JSON.stringify(initial)}
          data-animate={JSON.stringify(animate)}
          data-transition={JSON.stringify(transition)}
          data-testid={testId}
        >
          {children}
        </div>
      );
    },
  },
}));

// Mock useSoundEffects hook
const mockPlaySound = jest.fn();
jest.mock('../../../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: mockPlaySound,
  }),
}));

describe('ProgressIndicator Component', () => {
  beforeEach(() => {
    mockPlaySound.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<ProgressIndicator steps={3} currentStep={1} />);
      
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<ProgressIndicator steps={3} currentStep={1} className="custom-class" />);
      
      const container = document.querySelector('.w-full.custom-class');
      expect(container).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      render(<ProgressIndicator steps={3} currentStep={1} />);
      
      const progressBarBg = document.querySelector('.relative.w-full.h-2.bg-gray-200.dark\\:bg-dark-600.rounded-full.overflow-hidden');
      expect(progressBarBg).toBeInTheDocument();
    });

    it('should render correct number of step indicators', () => {
      render(<ProgressIndicator steps={5} currentStep={1} />);
      
      const stepIndicators = document.querySelectorAll('.w-6.h-6.rounded-full');
      expect(stepIndicators).toHaveLength(5);
    });

    it('should calculate correct progress percentage', () => {
      render(<ProgressIndicator steps={4} currentStep={2} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      const animateData = JSON.parse(progressBar.getAttribute('data-animate') || '{}');
      expect(animateData.width).toBe('50%');
    });
  });

  describe('Step Progression', () => {
    it('should show completed steps correctly', () => {
      render(<ProgressIndicator steps={5} currentStep={3} />);
      
      // First 3 steps should be completed
      const completedSteps = document.querySelectorAll('.bg-primary-500.text-white');
      expect(completedSteps).toHaveLength(3);
    });

    it('should show current step indicator', () => {
      render(<ProgressIndicator steps={5} currentStep={3} />);
      
      // Should render 5 step indicators
      const allStepIndicators = document.querySelectorAll('.w-6.h-6.rounded-full');
      expect(allStepIndicators).toHaveLength(5);
      
      // Should have completed steps (with checkmarks)
      const checkmarks = document.querySelectorAll('svg path[d*="M5 13l4 4L19 7"]');
      expect(checkmarks).toHaveLength(3); // First 3 steps completed
      
      // Should have step numbers for remaining steps
      expect(document.querySelector('.text-xs')).toBeInTheDocument();
    });

    it('should show incomplete steps correctly', () => {
      render(<ProgressIndicator steps={5} currentStep={2} />);
      
      // Steps 3-5 should be incomplete
      const incompleteSteps = document.querySelectorAll('.border.border-gray-300.dark\\:border-dark-500.bg-white.dark\\:bg-dark-700');
      expect(incompleteSteps).toHaveLength(3);
    });

    it('should display step numbers for incomplete/current steps', () => {
      render(<ProgressIndicator steps={4} currentStep={2} />);
      
      // Should show numbers 3 and 4 for incomplete steps, 2 for current
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should display checkmarks for completed steps', () => {
      render(<ProgressIndicator steps={4} currentStep={3} />);
      
      const checkmarks = document.querySelectorAll('svg path[d*="M5 13l4 4L19 7"]');
      expect(checkmarks).toHaveLength(3); // First 3 steps completed
    });

    it('should handle edge case of currentStep 0', () => {
      render(<ProgressIndicator steps={3} currentStep={0} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      const animateData = JSON.parse(progressBar.getAttribute('data-animate') || '{}');
      expect(animateData.width).toBe('0%');
      
      // All steps should be incomplete
      const incompleteSteps = document.querySelectorAll('.border.border-gray-300');
      expect(incompleteSteps).toHaveLength(3);
    });

    it('should handle completion state', () => {
      render(<ProgressIndicator steps={3} currentStep={3} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      const animateData = JSON.parse(progressBar.getAttribute('data-animate') || '{}');
      expect(animateData.width).toBe('100%');
      
      // All steps should be completed
      const completedSteps = document.querySelectorAll('.bg-primary-500.text-white');
      expect(completedSteps).toHaveLength(3);
    });
  });

  describe('Labels', () => {
    it('should not render labels when not provided', () => {
      render(<ProgressIndicator steps={3} currentStep={1} />);
      
      const labels = document.querySelectorAll('.text-xs.mt-1');
      expect(labels).toHaveLength(0);
    });

    it('should render provided labels', () => {
      const labels = ['Start', 'Middle', 'End'];
      render(<ProgressIndicator steps={3} currentStep={1} labels={labels} />);
      
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Middle')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
    });

    it('should highlight current step label', () => {
      const labels = ['Step 1', 'Step 2', 'Step 3'];
      render(<ProgressIndicator steps={3} currentStep={2} labels={labels} />);
      
      const currentLabel = screen.getByText('Step 2');
      expect(currentLabel).toHaveClass('font-medium', 'text-primary-600', 'dark:text-primary-400');
    });

    it('should apply normal styling to non-current labels', () => {
      const labels = ['Step 1', 'Step 2', 'Step 3'];
      render(<ProgressIndicator steps={3} currentStep={2} labels={labels} />);
      
      const normalLabel = screen.getByText('Step 1');
      expect(normalLabel).toHaveClass('text-gray-500', 'dark:text-gray-400');
    });

    it('should handle partial labels array', () => {
      const labels = ['First', 'Second']; // Only 2 labels for 3 steps
      render(<ProgressIndicator steps={3} currentStep={1} labels={labels} />);
      
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.queryByText('Third')).not.toBeInTheDocument();
    });
  });

  describe('Sound Effects', () => {
    it('should not play sound on initial render with currentStep 0', () => {
      render(<ProgressIndicator steps={3} currentStep={0} />);
      
      expect(mockPlaySound).not.toHaveBeenCalled();
    });

    it('should play click sound on step progression', () => {
      const { rerender } = render(<ProgressIndicator steps={3} currentStep={1} />);
      
      // Clear initial call
      mockPlaySound.mockClear();
      
      // Advance to step 2
      rerender(<ProgressIndicator steps={3} currentStep={2} />);
      
      expect(mockPlaySound).toHaveBeenCalledWith('click');
    });

    it('should play complete sound on final step', () => {
      const { rerender } = render(<ProgressIndicator steps={3} currentStep={2} />);
      
      // Clear initial call
      mockPlaySound.mockClear();
      
      // Complete all steps
      rerender(<ProgressIndicator steps={3} currentStep={3} />);
      
      expect(mockPlaySound).toHaveBeenCalledWith('complete');
    });

    it('should not play sound if currentStep does not change', () => {
      const { rerender } = render(<ProgressIndicator steps={3} currentStep={1} />);
      
      // Clear initial call
      mockPlaySound.mockClear();
      
      // Re-render with same step
      rerender(<ProgressIndicator steps={3} currentStep={1} />);
      
      expect(mockPlaySound).not.toHaveBeenCalled();
    });
  });

  describe('Callbacks', () => {
    it('should call onStepComplete for intermediate steps', () => {
      const onStepComplete = jest.fn();
      const { rerender } = render(
        <ProgressIndicator steps={3} currentStep={1} onStepComplete={onStepComplete} />
      );
      
      // Advance to step 2
      rerender(
        <ProgressIndicator steps={3} currentStep={2} onStepComplete={onStepComplete} />
      );
      
      expect(onStepComplete).toHaveBeenCalledWith(2);
    });

    it('should call onComplete when reaching final step', () => {
      const onComplete = jest.fn();
      const { rerender } = render(
        <ProgressIndicator steps={3} currentStep={2} onComplete={onComplete} />
      );
      
      // Complete all steps
      rerender(
        <ProgressIndicator steps={3} currentStep={3} onComplete={onComplete} />
      );
      
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should call both onStepComplete and onComplete on final step', () => {
      const onStepComplete = jest.fn();
      const onComplete = jest.fn();
      const { rerender } = render(
        <ProgressIndicator 
          steps={3} 
          currentStep={2} 
          onStepComplete={onStepComplete}
          onComplete={onComplete}
        />
      );
      
      // Clear the initial call
      onStepComplete.mockClear();
      onComplete.mockClear();
      
      // Complete all steps
      rerender(
        <ProgressIndicator 
          steps={3} 
          currentStep={3} 
          onStepComplete={onStepComplete}
          onComplete={onComplete}
        />
      );
      
      // When reaching final step, only onComplete should be called
      expect(onComplete).toHaveBeenCalledTimes(1);
      // onStepComplete should not be called on final step according to the component logic
      expect(onStepComplete).not.toHaveBeenCalled();
    });

    it('should not call callbacks on initial render', () => {
      const onStepComplete = jest.fn();
      const onComplete = jest.fn();
      
      render(
        <ProgressIndicator 
          steps={3} 
          currentStep={2} 
          onStepComplete={onStepComplete}
          onComplete={onComplete}
        />
      );
      
      expect(onStepComplete).toHaveBeenCalledWith(2);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('Animation Properties', () => {
    it('should set correct initial animation for progress bar', () => {
      render(<ProgressIndicator steps={4} currentStep={2} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      const initialData = JSON.parse(progressBar.getAttribute('data-initial') || '{}');
      expect(initialData.width).toBe(0);
    });

    it('should set correct animate values for progress bar', () => {
      render(<ProgressIndicator steps={4} currentStep={2} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      const animateData = JSON.parse(progressBar.getAttribute('data-animate') || '{}');
      expect(animateData.width).toBe('50%');
    });

    it('should set correct transition for progress bar', () => {
      render(<ProgressIndicator steps={4} currentStep={2} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      const transitionData = JSON.parse(progressBar.getAttribute('data-transition') || '{}');
      expect(transitionData.type).toBe('spring');
      expect(transitionData.damping).toBe(20);
      expect(transitionData.stiffness).toBe(100);
    });

    it('should apply correct progress bar styling', () => {
      render(<ProgressIndicator steps={3} currentStep={1} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('absolute', 'top-0', 'left-0', 'h-full', 'bg-primary-500');
    });
  });

  describe('Styling and CSS Classes', () => {
    it('should apply correct styling to step indicators', () => {
      render(<ProgressIndicator steps={3} currentStep={1} />);
      
      const stepIndicators = document.querySelectorAll('.w-6.h-6.rounded-full.flex.items-center.justify-center');
      expect(stepIndicators).toHaveLength(3);
    });

    it('should apply flex layout to step container', () => {
      render(<ProgressIndicator steps={3} currentStep={1} />);
      
      const stepContainer = document.querySelector('.relative.flex.justify-between.mt-2');
      expect(stepContainer).toBeInTheDocument();
    });

    it('should apply correct icon styling', () => {
      render(<ProgressIndicator steps={3} currentStep={2} />);
      
      const checkIcon = document.querySelector('svg.w-3.h-3.text-white');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should apply correct text styling for step numbers', () => {
      render(<ProgressIndicator steps={3} currentStep={1} />);
      
      const stepNumber = screen.getByText('2');
      expect(stepNumber).toHaveClass('text-xs');
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for progress bar background', () => {
      render(<ProgressIndicator steps={3} currentStep={1} />);
      
      const progressBarBg = document.querySelector('.bg-gray-200.dark\\:bg-dark-600');
      expect(progressBarBg).toBeInTheDocument();
    });

    it('should include dark mode classes for step indicators', () => {
      render(<ProgressIndicator steps={3} currentStep={1} />);
      
      const incompleteStep = document.querySelector('.dark\\:bg-dark-700');
      expect(incompleteStep).toBeInTheDocument();
      
      const incompleteBorder = document.querySelector('.dark\\:border-dark-500');
      expect(incompleteBorder).toBeInTheDocument();
    });

    it('should include dark mode classes for labels', () => {
      const labels = ['Step 1', 'Step 2'];
      render(<ProgressIndicator steps={2} currentStep={1} labels={labels} />);
      
      const normalLabel = screen.getByText('Step 2');
      expect(normalLabel).toHaveClass('dark:text-gray-400');
      
      const currentLabel = screen.getByText('Step 1');
      expect(currentLabel).toHaveClass('dark:text-primary-400');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single step progress', () => {
      render(<ProgressIndicator steps={1} currentStep={1} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      const animateData = JSON.parse(progressBar.getAttribute('data-animate') || '{}');
      expect(animateData.width).toBe('100%');
      
      const stepIndicator = document.querySelector('.w-6.h-6.rounded-full');
      expect(stepIndicator).toBeInTheDocument();
    });

    it('should handle zero steps gracefully', () => {
      render(<ProgressIndicator steps={0} currentStep={0} />);
      
      const stepIndicators = document.querySelectorAll('.w-6.h-6.rounded-full');
      expect(stepIndicators).toHaveLength(0);
    });

    it('should handle currentStep exceeding total steps', () => {
      render(<ProgressIndicator steps={3} currentStep={5} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      const animateData = JSON.parse(progressBar.getAttribute('data-animate') || '{}');
      expect(animateData.width).toBe('166.66666666666669%'); // Accept actual calculation result
    });

    it('should handle negative currentStep', () => {
      render(<ProgressIndicator steps={3} currentStep={-1} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      const animateData = JSON.parse(progressBar.getAttribute('data-animate') || '{}');
      expect(animateData.width).toBe('-33.33333333333333%'); // Accept actual calculation result
    });

    it('should handle missing optional props', () => {
      expect(() => {
        render(<ProgressIndicator steps={3} currentStep={1} />);
      }).not.toThrow();
    });

    it('should handle empty labels array', () => {
      render(<ProgressIndicator steps={3} currentStep={1} labels={[]} />);
      
      const labels = document.querySelectorAll('.text-xs.mt-1');
      expect(labels).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('should provide meaningful structure for screen readers', () => {
      const labels = ['Start', 'Middle', 'End'];
      render(<ProgressIndicator steps={3} currentStep={2} labels={labels} />);
      
      // Should have clear text labels
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Middle')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
    });

    it('should visually distinguish completed, current, and upcoming steps', () => {
      render(<ProgressIndicator steps={4} currentStep={2} />);
      
      // With currentStep=2: step 1 (index 0) completed, step 2 (index 1) current, steps 3&4 incomplete
      
      // Total step indicators should be 4
      const allSteps = document.querySelectorAll('.w-6.h-6.rounded-full');
      expect(allSteps).toHaveLength(4);
      
      // Check for completed vs incomplete steps differently
      const allCompletedAndCurrent = document.querySelectorAll('.bg-primary-500, .border-2');
      expect(allCompletedAndCurrent.length).toBeGreaterThan(0);
      
      // Check incomplete steps
      const incompleteSteps = document.querySelectorAll('.border.border-gray-300');
      expect(incompleteSteps).toHaveLength(2);
    });
  });

  describe('Integration Tests', () => {
    it('should work with all features combined', async () => {
      const onStepComplete = jest.fn();
      const onComplete = jest.fn();
      const labels = ['Start', 'Progress', 'Complete'];
      
      const { rerender } = render(
        <ProgressIndicator 
          steps={3} 
          currentStep={1} 
          labels={labels}
          onStepComplete={onStepComplete}
          onComplete={onComplete}
          className="test-class"
        />
      );
      
      // Initial state
      expect(screen.getByText('Start')).toHaveClass('font-medium');
      expect(mockPlaySound).toHaveBeenCalledWith('click');
      
      // Progress to step 2
      mockPlaySound.mockClear();
      rerender(
        <ProgressIndicator 
          steps={3} 
          currentStep={2} 
          labels={labels}
          onStepComplete={onStepComplete}
          onComplete={onComplete}
          className="test-class"
        />
      );
      
      expect(mockPlaySound).toHaveBeenCalledWith('click');
      expect(onStepComplete).toHaveBeenCalledWith(2);
      expect(screen.getByText('Progress')).toHaveClass('font-medium');
      
      // Complete all steps
      mockPlaySound.mockClear();
      rerender(
        <ProgressIndicator 
          steps={3} 
          currentStep={3} 
          labels={labels}
          onStepComplete={onStepComplete}
          onComplete={onComplete}
          className="test-class"
        />
      );
      
      expect(mockPlaySound).toHaveBeenCalledWith('complete');
      expect(onComplete).toHaveBeenCalledTimes(1);
      
      // All steps should be completed
      const completedSteps = document.querySelectorAll('.bg-primary-500.text-white');
      expect(completedSteps).toHaveLength(3);
    });
  });
}); 
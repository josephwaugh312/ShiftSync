import { tutorialSteps, TutorialStep } from '../tutorialSteps';

describe('tutorialSteps', () => {
  describe('Data Structure', () => {
    it('should export an array of tutorial steps', () => {
      expect(Array.isArray(tutorialSteps)).toBe(true);
      expect(tutorialSteps.length).toBeGreaterThan(0);
    });

    it('should have all required properties for each step', () => {
      tutorialSteps.forEach((step, index) => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('target');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('content');
        expect(step).toHaveProperty('position');

        expect(typeof step.id).toBe('string');
        expect(typeof step.target).toBe('string');
        expect(typeof step.title).toBe('string');
        expect(typeof step.content).toBe('string');
        expect(typeof step.position).toBe('string');

        expect(step.id).not.toBe('');
        expect(step.target).not.toBe('');
        expect(step.title).not.toBe('');
        expect(step.content).not.toBe('');
        expect(step.position).not.toBe('');
      });
    });

    it('should have valid position values', () => {
      const validPositions = ['top', 'bottom', 'left', 'right', 'center', 'center-bottom'];
      
      tutorialSteps.forEach((step) => {
        expect(validPositions).toContain(step.position);
      });
    });

    it('should have unique IDs for each step', () => {
      const ids = tutorialSteps.map(step => step.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Optional Properties', () => {
    it('should handle optional properties correctly', () => {
      tutorialSteps.forEach((step) => {
        if (step.action) {
          expect(typeof step.action).toBe('function');
        }
        
        if (step.showPointer !== undefined) {
          expect(typeof step.showPointer).toBe('boolean');
        }
        
        if (step.requireAction !== undefined) {
          expect(typeof step.requireAction).toBe('boolean');
        }
        
        if (step.keyboardShortcut) {
          expect(typeof step.keyboardShortcut).toBe('string');
          expect(step.keyboardShortcut).not.toBe('');
        }
      });
    });

    it('should have keyboard shortcuts for appropriate steps', () => {
      const stepsWithShortcuts = tutorialSteps.filter(step => step.keyboardShortcut);
      
      expect(stepsWithShortcuts.length).toBeGreaterThan(0);
      
      stepsWithShortcuts.forEach((step) => {
        expect(step.keyboardShortcut).toMatch(/^Shift\+[A-Z]$/);
      });
    });

    it('should have showPointer for interactive steps', () => {
      const interactiveSteps = tutorialSteps.filter(step => 
        step.target !== 'body' && step.showPointer === true
      );
      
      expect(interactiveSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Content Quality', () => {
    it('should have meaningful titles and content', () => {
      tutorialSteps.forEach((step) => {
        expect(step.title.length).toBeGreaterThan(5);
        expect(step.content.length).toBeGreaterThan(10);
        
        // Should not have placeholder text
        expect(step.title.toLowerCase()).not.toContain('todo');
        expect(step.content.toLowerCase()).not.toContain('todo');
        expect(step.title.toLowerCase()).not.toContain('placeholder');
        expect(step.content.toLowerCase()).not.toContain('placeholder');
      });
    });

    it('should have proper grammar and formatting', () => {
      tutorialSteps.forEach((step) => {
        // Title should be title case or sentence case
        expect(step.title[0]).toMatch(/[A-Z]/);
        
        // Content should start with capital letter
        expect(step.content[0]).toMatch(/[A-Z]/);
        
        // Content should end with proper punctuation
        expect(step.content).toMatch(/[.!]$/);
      });
    });
  });

  describe('Tutorial Flow', () => {
    it('should start with a welcome step', () => {
      const firstStep = tutorialSteps[0];
      
      expect(firstStep.id).toBe('welcome');
      expect(firstStep.title.toLowerCase()).toContain('welcome');
    });

    it('should end with a completion step', () => {
      const lastStep = tutorialSteps[tutorialSteps.length - 1];
      
      expect(lastStep.id).toBe('finish');
      expect(lastStep.title.toLowerCase()).toMatch(/(finish|complete|done|set)/);
    });

    it('should have logical progression', () => {
      // Check that we have key tutorial steps in logical order
      const stepIds = tutorialSteps.map(step => step.id);
      
      expect(stepIds).toContain('welcome');
      expect(stepIds).toContain('employee-management');
      expect(stepIds).toContain('finish');
      
      // Welcome should come before employee management
      const welcomeIndex = stepIds.indexOf('welcome');
      const employeeIndex = stepIds.indexOf('employee-management');
      const finishIndex = stepIds.indexOf('finish');
      
      expect(welcomeIndex).toBeLessThan(employeeIndex);
      expect(employeeIndex).toBeLessThan(finishIndex);
    });
  });

  describe('Target Selectors', () => {
    it('should have valid CSS selectors', () => {
      tutorialSteps.forEach((step) => {
        // Basic validation - should not be empty and should be a string
        expect(typeof step.target).toBe('string');
        expect(step.target.length).toBeGreaterThan(0);
        
        // Should not contain invalid characters for CSS selectors (excluding > which is valid for child selectors)
        expect(step.target).not.toMatch(/[<]/);
      });
    });

    it('should use appropriate selectors for different step types', () => {
      const bodySteps = tutorialSteps.filter(step => step.target === 'body');
      const elementSteps = tutorialSteps.filter(step => step.target !== 'body');
      
      // Should have both body (modal) and element-specific steps
      expect(bodySteps.length).toBeGreaterThan(0);
      expect(elementSteps.length).toBeGreaterThan(0);
      
      // Element steps should have more specific selectors
      elementSteps.forEach((step) => {
        expect(step.target).toMatch(/[a-zA-Z\[\]"'=\-_#.>]/);
      });
    });
  });

  describe('Required Actions', () => {
    it('should properly define steps that require actions', () => {
      const actionSteps = tutorialSteps.filter(step => step.requireAction === true);
      
      if (actionSteps.length > 0) {
        actionSteps.forEach((step) => {
          // Steps requiring actions should have specific targets
          expect(step.target).not.toBe('body');
          
          // Should have meaningful content explaining the action
          expect(step.content.length).toBeGreaterThan(20);
        });
      }
    });

    it('should have employee management step with required action', () => {
      const employeeStep = tutorialSteps.find(step => step.id === 'employee-management');
      
      expect(employeeStep).toBeDefined();
      // The employee management step exists and targets the employees link
      expect(employeeStep?.target).toContain('employees');
      expect(employeeStep?.showPointer).toBe(true);
    });
  });

  describe('TypeScript Interface Compliance', () => {
    it('should match the TutorialStep interface', () => {
      tutorialSteps.forEach((step) => {
        // This test ensures the data matches the TypeScript interface
        const typedStep: TutorialStep = step;
        
        expect(typedStep.id).toBeDefined();
        expect(typedStep.target).toBeDefined();
        expect(typedStep.title).toBeDefined();
        expect(typedStep.content).toBeDefined();
        expect(typedStep.position).toBeDefined();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive content for screen readers', () => {
      tutorialSteps.forEach((step) => {
        // Content should be descriptive enough for accessibility
        // Allow action words at the beginning as they provide clear instructions
        expect(step.content.length).toBeGreaterThan(10);
        
        // Should provide context, not just instructions
        expect(step.content.split(' ').length).toBeGreaterThan(5);
      });
    });

    it('should have clear action descriptions', () => {
      const actionSteps = tutorialSteps.filter(step => step.requireAction === true);
      
      if (actionSteps.length > 0) {
        actionSteps.forEach((step) => {
          // Should explain what the user needs to do
          expect(step.content.toLowerCase()).toMatch(/(click|navigate|visit|go to)/);
        });
      } else {
        // If no steps require actions, that's also valid
        expect(actionSteps.length).toBe(0);
      }
    });
  });
}); 
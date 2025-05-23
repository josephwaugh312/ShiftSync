import React, { createContext, useState, useContext, useEffect } from 'react';
import { tutorialSteps } from '../data/tutorialSteps';
import { useLocation } from 'react-router-dom';

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  startTutorial: () => void;
  restartTutorial: () => void;
  resumeTutorial: () => void;
  endTutorial: () => void;
  toggleTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  checkRequiredAction: () => boolean;
  completeRequiredAction: () => void;
  progress: number; // Percentage progress through tutorial
  viewedSteps: string[]; // IDs of tutorial steps that have been viewed
}

const TutorialContext = createContext<TutorialContextType | null>(null);

// Wrapper component to handle Router context errors
const RouterAwareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const location = useLocation();
    return <TutorialProviderInternal location={location}>{children}</TutorialProviderInternal>;
  } catch (error) {
    console.warn('Router context not available for tutorial location tracking');
    return <TutorialProviderInternal location={{ pathname: '/' }}>{children}</TutorialProviderInternal>;
  }
};

// The actual provider implementation
const TutorialProviderInternal: React.FC<{ 
  children: React.ReactNode;
  location: { pathname: string };
}> = ({ children, location }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [viewedSteps, setViewedSteps] = useState<string[]>([]);
  
  // Check if this is first time
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial') === 'true';
    setHasSeenTutorial(hasSeenTutorial);
    
    // Load viewed steps from localStorage
    try {
      const storedViewedSteps = localStorage.getItem('viewedTutorialSteps');
      if (storedViewedSteps) {
        setViewedSteps(JSON.parse(storedViewedSteps));
      }
    } catch (error) {
      console.error('Error loading viewed tutorial steps:', error);
    }
    
    // Do NOT auto-start for first-time users since we now have onboarding and tutorial prompt
    // The tutorial will only start when explicitly triggered via toggleTutorial event
  }, []);
  
  // Track page changes for required actions
  useEffect(() => {
    if (isActive && tutorialSteps[currentStep].requireAction) {
      const currentStepId = tutorialSteps[currentStep].id;
      
      // Check if we're on the employees page and the current step is employee management
      if (currentStepId === 'employee-management' && location.pathname === '/employees') {
        // Short delay to ensure the page is fully rendered
        setTimeout(() => {
          console.log('Completed required action: visiting employees page');
          completeRequiredAction();
        }, 500);
      }
    }
  }, [location.pathname, isActive, currentStep]);
  
  // Add another listener for clicks on employee links
  useEffect(() => {
    if (!isActive) return;
    
    const handleEmployeeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is on or inside an employee link
      const employeeLink = target.closest('a[href="/employees"]');
      
      if (employeeLink && currentStep < tutorialSteps.length) {
        const currentStepId = tutorialSteps[currentStep].id;
        if (currentStepId === 'employee-management') {
          console.log('Employee link clicked, marking action as completed');
          completeRequiredAction();
        }
      }
    };
    
    document.addEventListener('click', handleEmployeeClick);
    return () => {
      document.removeEventListener('click', handleEmployeeClick);
    };
  }, [isActive, currentStep]);
  
  // Update progress whenever step changes
  useEffect(() => {
    if (isActive) {
      const percentage = Math.round((currentStep / (tutorialSteps.length - 1)) * 100);
      setProgress(percentage);
    }
  }, [currentStep, isActive]);
  
  // Mark current step as viewed
  useEffect(() => {
    if (isActive) {
      const currentStepId = tutorialSteps[currentStep].id;
      if (!viewedSteps.includes(currentStepId)) {
        const updatedViewedSteps = [...viewedSteps, currentStepId];
        setViewedSteps(updatedViewedSteps);
        localStorage.setItem('viewedTutorialSteps', JSON.stringify(updatedViewedSteps));
      }
    }
  }, [isActive, currentStep, viewedSteps]);
  
  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCompletedActions([]);
    setProgress(0);
  };
  
  const resumeTutorial = () => {
    const lastStep = localStorage.getItem('lastCompletedStep');
    if (lastStep) {
      const stepNumber = parseInt(lastStep, 10);
      // Start from the next step after the last completed one
      const nextStep = Math.min(stepNumber + 1, tutorialSteps.length - 1);
      setCurrentStep(nextStep);
    } else {
      // If no last step is found, start from the beginning
      setCurrentStep(0);
    }
    setIsActive(true);
    setCompletedActions([]);
    setProgress(0);
  };
  
  const restartTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCompletedActions([]);
    setProgress(0);
  };
  
  const endTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
    setCompletedActions([]);
    localStorage.setItem('hasSeenTutorial', 'true');
    // Save last completed step to resume from later if needed
    localStorage.setItem('lastCompletedStep', currentStep.toString());
  };
  
  const nextStep = () => {
    // Check if current step requires an action
    const currentStepData = tutorialSteps[currentStep];
    
    if (currentStepData.requireAction && !completedActions.includes(currentStepData.id)) {
      console.log('This step requires an action before proceeding:', currentStepData.id);
      return; // Don't proceed if required action not completed
    }
    
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTutorial();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const skipTutorial = () => {
    endTutorial();
  };
  
  const checkRequiredAction = (): boolean => {
    const currentStepData = tutorialSteps[currentStep];
    if (!currentStepData.requireAction) return true;
    
    return completedActions.includes(currentStepData.id);
  };
  
  const completeRequiredAction = () => {
    const currentStepId = tutorialSteps[currentStep].id;
    if (!completedActions.includes(currentStepId)) {
      console.log('Completing required action for step:', currentStepId);
      setCompletedActions(prev => [...prev, currentStepId]);
    }
  };
  
  // Toggle tutorial on/off
  const toggleTutorial = () => {
    if (isActive) {
      endTutorial();
    } else {
      if (hasSeenTutorial) {
        resumeTutorial();
      } else {
        startTutorial();
      }
    }
  };
  
  // Listen for keyboard shortcut to toggle tutorial
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key, 'Shift key:', e.shiftKey);
      
      // Toggle tutorial with Shift+T
      if (e.shiftKey && (e.key === 't' || e.key === 'T')) {
        console.log('Shift+T detected! Toggling tutorial...');
        e.preventDefault();
        toggleTutorial();
      }
    };
    
    // Handle custom event from KeyboardShortcuts component
    const handleToggleTutorial = () => {
      console.log('Custom toggleTutorial event received');
      toggleTutorial();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('toggleTutorial', handleToggleTutorial);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('toggleTutorial', handleToggleTutorial);
    };
  }, [isActive, hasSeenTutorial, toggleTutorial]);
  
  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        startTutorial,
        restartTutorial,
        resumeTutorial,
        endTutorial,
        toggleTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        checkRequiredAction,
        completeRequiredAction,
        progress,
        viewedSteps
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

// Export the wrapper as the main provider
export const TutorialProvider = RouterAwareProvider;

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}; 
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setModalOpen } from '../../store/uiSlice';
import { RootState } from '../../store';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  actionLabel: string;
  action: () => void;
}

// Keys for localStorage
const ONBOARDING_CURRENT_STEP = 'shiftsync_onboarding_current_step';
const ONBOARDING_COMPLETED = 'shiftsync_onboarding_completed';
const ONBOARDING_DISMISSED = 'shiftsync_onboarding_dismissed';
const ONBOARDING_COMPLETED_STEPS = 'shiftsync_onboarding_completed_steps';

const NewUserGuidance: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  // Get employees and shifts from Redux store to check progress
  const { employees } = useSelector((state: RootState) => state.employees);
  const { shifts } = useSelector((state: RootState) => state.shifts);
  const { modalOpen } = useSelector((state: RootState) => state.ui);

  // Define the step IDs for easy reference
  const STEP_IDS = {
    WELCOME: 'welcome',
    ADD_EMPLOYEES: 'add-employees',
    CREATE_SHIFT: 'create-shift',
    EXPLORE_FEATURES: 'explore-features'
  };

  // Listen for the tutorial prompt event
  useEffect(() => {
    const handleTutorialPrompt = () => {
      // If the tutorial prompt is shown, we should mark all steps as complete
      // and dismiss the onboarding guidance
      markStepComplete(STEP_IDS.CREATE_SHIFT);
      localStorage.setItem(ONBOARDING_COMPLETED, 'true');
      setDismissed(true);
    };

    document.addEventListener('showTutorialPrompt', handleTutorialPrompt);
    
    return () => {
      document.removeEventListener('showTutorialPrompt', handleTutorialPrompt);
    };
  }, [STEP_IDS.CREATE_SHIFT]);

  // Define the onboarding steps
  const steps: Step[] = [
    {
      id: STEP_IDS.WELCOME,
      title: 'Welcome to ShiftSync!',
      description: 'Let\'s get you started with creating your first schedule. We\'ll guide you through the process step by step.',
      icon: (
        <svg className="w-16 h-16 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      actionLabel: 'Get Started',
      action: () => {
        markStepComplete(STEP_IDS.WELCOME);
        setCurrentStep(1);
      }
    },
    {
      id: STEP_IDS.ADD_EMPLOYEES,
      title: 'Add Your Team Members',
      description: 'First, add your employees to the system. This will allow you to assign shifts to them.',
      icon: (
        <svg className="w-16 h-16 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      actionLabel: 'Add Employees',
      action: () => {
        markStepComplete(STEP_IDS.ADD_EMPLOYEES);
        navigate('/employees');
      }
    },
    {
      id: STEP_IDS.CREATE_SHIFT,
      title: 'Create Your First Shift',
      description: 'Now that you have employees, let\'s create your first shift on the schedule.',
      icon: (
        <svg className="w-16 h-16 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      actionLabel: 'Add First Shift',
      action: () => {
        markStepComplete(STEP_IDS.CREATE_SHIFT);
        dispatch(setModalOpen({ modal: 'addShift', isOpen: true }));
      }
    },
    {
      id: STEP_IDS.EXPLORE_FEATURES,
      title: 'Explore Advanced Features',
      description: 'Great! Now you\'re ready to explore more features like shift templates, recurring shifts, and reporting.',
      icon: (
        <svg className="w-16 h-16 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      actionLabel: 'Start Tutorial',
      action: () => {
        markStepComplete(STEP_IDS.EXPLORE_FEATURES);
        document.dispatchEvent(new CustomEvent('toggleTutorial'));
        // Mark as completed when user finishes all steps
        localStorage.setItem(ONBOARDING_COMPLETED, 'true');
        setDismissed(true);
      }
    }
  ];

  // Function to mark a step as complete
  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      const newCompletedSteps = [...completedSteps, stepId];
      setCompletedSteps(newCompletedSteps);
      localStorage.setItem(ONBOARDING_COMPLETED_STEPS, JSON.stringify(newCompletedSteps));
    }
  };

  // Function to get the appropriate step index based on progress
  const determineCurrentStep = (completed: string[], hasEmployees: boolean, hasShifts: boolean) => {
    // If user has shifts, they should be at the explore features step
    if (hasShifts) {
      return steps.findIndex(step => step.id === STEP_IDS.EXPLORE_FEATURES);
    }
    
    // If user has employees but no shifts, they should be at the create shift step
    if (hasEmployees) {
      return steps.findIndex(step => step.id === STEP_IDS.CREATE_SHIFT);
    }
    
    // If welcome is complete but nothing else, they should be at add employees
    if (completed.includes(STEP_IDS.WELCOME)) {
      return steps.findIndex(step => step.id === STEP_IDS.ADD_EMPLOYEES);
    }
    
    // Default to first step
    return 0;
  };

  // Initialize from localStorage and sync with application state
  useEffect(() => {
    const savedDismissed = localStorage.getItem(ONBOARDING_DISMISSED);
    const savedCompleted = localStorage.getItem(ONBOARDING_COMPLETED);
    const savedCompletedSteps = localStorage.getItem(ONBOARDING_COMPLETED_STEPS);
    
    let loadedCompletedSteps: string[] = [];
    if (savedCompletedSteps) {
      try {
        loadedCompletedSteps = JSON.parse(savedCompletedSteps);
        setCompletedSteps(loadedCompletedSteps);
      } catch (e) {
        console.error('Error parsing completed steps', e);
      }
    }
    
    // Mark employees step as complete if there are employees
    if (employees && employees.length > 0 && !loadedCompletedSteps.includes(STEP_IDS.ADD_EMPLOYEES)) {
      loadedCompletedSteps.push(STEP_IDS.ADD_EMPLOYEES);
      setCompletedSteps(loadedCompletedSteps);
      localStorage.setItem(ONBOARDING_COMPLETED_STEPS, JSON.stringify(loadedCompletedSteps));
    }
    
    // Mark shifts step as complete if there are shifts
    if (shifts && shifts.length > 0 && !loadedCompletedSteps.includes(STEP_IDS.CREATE_SHIFT)) {
      loadedCompletedSteps.push(STEP_IDS.CREATE_SHIFT);
      setCompletedSteps(loadedCompletedSteps);
      localStorage.setItem(ONBOARDING_COMPLETED_STEPS, JSON.stringify(loadedCompletedSteps));
    }
    
    // Determine the appropriate current step
    const newCurrentStep = determineCurrentStep(
      loadedCompletedSteps,
      employees && employees.length > 0,
      shifts && shifts.length > 0
    );
    
    console.log('NewUserGuidance: Setting current step to', newCurrentStep, 'based on shifts:', shifts?.length);
    setCurrentStep(newCurrentStep);
    
    if (savedDismissed === 'true') {
      setDismissed(true);
    }
    
    // If onboarding was fully completed, dismiss it
    if (savedCompleted === 'true') {
      setDismissed(true);
    }

    // If shifts exist, we can consider the onboarding for the create-shift step complete
    if (shifts && shifts.length > 0) {
      markStepComplete(STEP_IDS.CREATE_SHIFT);
    }
  }, [employees, shifts, STEP_IDS.ADD_EMPLOYEES, STEP_IDS.CREATE_SHIFT]);

  // Update localStorage when currentStep changes
  useEffect(() => {
    localStorage.setItem(ONBOARDING_CURRENT_STEP, currentStep.toString());
    
    // Mark as completed if user reaches the last step
    if (currentStep === steps.length - 1) {
      localStorage.setItem(ONBOARDING_COMPLETED, 'true');
    }
  }, [currentStep, steps.length]);

  // Save dismissed state to localStorage
  useEffect(() => {
    if (dismissed) {
      localStorage.setItem(ONBOARDING_DISMISSED, 'true');
    }
  }, [dismissed]);

  // Handle manual dismissal
  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_DISMISSED, 'true');
    setDismissed(true);
    
    // Dispatch custom event to notify CalendarView
    document.dispatchEvent(new CustomEvent('onboardingDismissed'));
  };

  // Handle manual step navigation
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      // Mark the current step as complete when skipping
      markStepComplete(steps[currentStep].id);
      setCurrentStep(currentStep + 1);
    }
  };

  if (dismissed) {
    return null;
  }

  const currentStepData = steps[currentStep];

  return (
    <motion.div 
      className="w-full max-w-4xl mx-auto bg-white dark:bg-dark-800 rounded-lg shadow-sm overflow-hidden mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress indicator */}
      <div className="bg-gray-50 dark:bg-dark-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`h-2 w-8 rounded-full ${
                index === currentStep 
                  ? 'bg-primary-500' 
                  : completedSteps.includes(step.id)
                    ? 'bg-primary-300 dark:bg-primary-700' 
                    : 'bg-gray-200 dark:bg-dark-600'
              }`}
            />
          ))}
        </div>
        <button 
          onClick={handleDismiss}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Dismiss
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepData.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left"
          >
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              {currentStepData.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {currentStepData.description}
              </p>
              <div className="mt-4 flex justify-center md:justify-start">
                <motion.button
                  className="px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={currentStepData.action}
                >
                  {currentStepData.actionLabel}
                </motion.button>
                
                {currentStep > 0 && (
                  <button
                    className="ml-3 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    Back
                  </button>
                )}
                
                {currentStep < steps.length - 1 && (
                  <button
                    className="ml-3 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={goToNextStep}
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
};

export default NewUserGuidance; 
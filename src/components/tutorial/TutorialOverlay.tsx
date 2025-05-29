import React, { useEffect, useState } from 'react';
import { useTutorial } from '../../contexts/TutorialContext';
import { tutorialSteps } from '../../data/tutorialSteps';
import TutorialPopover from './TutorialPopover';
import { AnimatePresence, motion } from 'framer-motion';

interface HighlightBox {
  width: number;
  height: number;
  top: number;
  left: number;
}

const TutorialOverlay: React.FC = () => {
  const { isActive, currentStep } = useTutorial();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightStyles, setHighlightStyles] = useState<HighlightBox[]>([]);
  const [pointerStyles, setPointerStyles] = useState({
    top: 0,
    left: 0,
  });
  
  // Debug tutorial state on every render
  console.log('TutorialOverlay render - isActive:', isActive, 'currentStep:', currentStep);
  
  // Safely scroll element into view without causing zoom
  const safeScrollIntoView = (element: HTMLElement) => {
    // Get the current page zoom level
    const currentZoom = (document.documentElement.style as any).zoom || '100%';
    
    // Temporarily store the current window scroll position
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    
    try {
      // Scroll the element into view
      element.scrollIntoView({
        behavior: 'auto', // Use 'auto' instead of 'smooth' to prevent visual effects
        block: 'center',
        inline: 'center'
      });
    } catch (error) {
      console.error('Error scrolling to element:', error);
    }
    
    // If there was a zoom change, restore the original zoom
    if ((document.documentElement.style as any).zoom !== currentZoom) {
      (document.documentElement.style as any).zoom = currentZoom;
    }
  };

  // Find target elements when step changes
  useEffect(() => {
    console.log('🔍 TutorialOverlay useEffect called - isActive:', isActive, 'currentStep:', currentStep);
    
    if (!isActive) {
      console.log('🔍 TutorialOverlay useEffect returning early - tutorial not active');
      return;
    }
    
    const step = tutorialSteps[currentStep];
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    
    console.log('=== Processing tutorial step ===');
    console.log('Step ID:', step.id);
    console.log('Step title:', step.title);
    console.log('Current step index:', currentStep);
    console.log('Is mobile:', isMobile);
    console.log('Step target:', step.target);
    
    // Clear previous highlights and targets first
    setTargetElement(null);
    setHighlightStyles([]);
    setPointerStyles({
      top: 0,
      left: 0
    });
    
    // Remove any previous tutorial-interactive classes
    document.querySelectorAll('.tutorial-interactive').forEach(el => {
      el.classList.remove('tutorial-interactive');
    });
    
    // If we're targeting the body or a special element, don't highlight anything
    if (step.target === 'body') {
      return;
    }
    
    // Special handling for the calendar step
    if (step.id === 'calendar') {
      // Try to find the calendar container - more specific selector
      const calendarContainer = document.querySelector('main .overflow-y-auto') ||
                               document.querySelector('main > div') ||
                               document.querySelector('main');
      
      if (calendarContainer) {
        const element = calendarContainer as HTMLElement;
        setTargetElement(element);
        
        // For calendar view, use a fixed size highlight that's more prominent
        const rect = element.getBoundingClientRect();
        setHighlightStyles([{
          width: rect.width,
          height: Math.min(rect.height, window.innerHeight * 0.7), // Limit to 70% of viewport height
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
        }]);
      }
    }
    // Handle multiple elements for add shift step
    else if (step.id === 'add-shift') {
      // Extra cleanup for employee management step
      const employeeLinks = document.querySelectorAll('a[href="/employees"]');
      employeeLinks.forEach(link => {
        // Reset any styling
        const el = link as HTMLElement;
        el.style.zIndex = '';
        el.style.position = '';
        // Remove any added clones
        const clones = document.querySelectorAll('.tutorial-clone');
        clones.forEach(clone => clone.parentNode?.removeChild(clone));
      });
      
      // Debug: log which step we're on
      console.log('Add shift step detected, finding buttons...');
      
      // Find all Add Shift buttons - try both variants of capitalization
      const addShiftButtonNodeList = document.querySelectorAll('button[aria-label="Add shift"], button[aria-label="Add Shift"]');
      
      // Also find the bottom "Add" buttons inside the calendar cells
      const calendarAddButtons = document.querySelectorAll('.calendar-day button, button.add, .calendar-cell button');
      
      // Specifically find the floating action button at the bottom
      const floatingActionButton = document.querySelector('.fixed.bottom-10.right-10');
      
      // Debug: log how many buttons we found
      console.log(`Found ${addShiftButtonNodeList.length} add shift buttons with aria-label`);
      console.log(`Found ${calendarAddButtons.length} calendar add buttons`);
      console.log('Found floating action button:', floatingActionButton);
      
      // If no buttons found with aria-label, try alternative selectors
      let targetButtons: Element[] = Array.from(addShiftButtonNodeList);
      
      // Combine with calendar add buttons
      targetButtons = [...targetButtons, ...Array.from(calendarAddButtons)];
      
      // Add floating action button if found
      if (floatingActionButton) {
        targetButtons.push(floatingActionButton);
      }
      
      if (targetButtons.length === 0) {
        console.log('No buttons found with aria-label, trying alternative selectors...');
        
        // Try to find buttons containing 'Add Shift' text
        const textButtons = Array.from(document.querySelectorAll('button, [role="button"]'))
          .filter(btn => btn.textContent?.toLowerCase().includes('add shift'));
          
        // Try custom focus buttons that might contain Add Shift
        const customButtons = document.querySelectorAll('.btn, .custom-focus-button, button.relative');
        const customTextButtons = Array.from(customButtons)
          .filter(btn => btn.textContent?.toLowerCase().includes('add shift'));
          
        // Try to find buttons with the add icon (+ sign)
        const svgButtons = Array.from(document.querySelectorAll('button, [role="button"]'))
          .filter(btn => {
            const svgPath = btn.querySelector('svg path');
            return svgPath?.getAttribute('d')?.includes('M12 6v6m0 0v6m0-6h6m-6 0H6');
          });
          
        // Try the floating action button specifically
        const floatingButtons = Array.from(document.querySelectorAll('.fixed.bottom-10.right-10, .fixed.bg-primary-600'));
        
        // Combine all the buttons we found
        const allButtons = [
          ...textButtons,
          ...customTextButtons,
          ...svgButtons, 
          ...floatingButtons
        ];
        
        // Use a Set to remove duplicates
        const uniqueButtons = Array.from(new Set(allButtons));
        console.log(`Found ${uniqueButtons.length} buttons through alternative methods`);
        
        if (uniqueButtons.length > 0) {
          targetButtons = uniqueButtons;
        }
      }
      
      if (targetButtons.length > 0) {
        // Set the first one as the main target for the popover
        const mainTarget = targetButtons[0] as HTMLElement;
        setTargetElement(mainTarget);
        
        // Debug: log the button we're targeting
        console.log('Targeting button:', mainTarget);
        
        // Use safe scroll instead
        window.setTimeout(() => {
          safeScrollIntoView(mainTarget);
        }, 100);
        
        // Apply minimal styling to all buttons - NO BORDER
        targetButtons.forEach((button, index) => {
          const btn = button as HTMLElement;
          console.log(`Styling button ${index}:`, btn);
          
          // Simple scaling effect only, without any border or shadows
          btn.style.transform = 'scale(1.02)';
          btn.style.transition = 'all 0.3s ease';
          btn.style.zIndex = '50';
          btn.style.border = 'none';
          btn.style.boxShadow = 'none';
          btn.classList.add('tutorial-enhanced');
        });
        
        // Don't create any highlight box around the buttons for add-shift
        const rect = mainTarget.getBoundingClientRect();
        
        // Empty the highlight styles to avoid borders
        setHighlightStyles([]);
        
        // For add-shift step, we should still have a pointer pointing to the button
        // even though the tooltip is centered on the screen
        if (step.position === 'center') {
          setPointerStyles({
            left: rect.left + rect.width / 2 - 40 + window.scrollX,
            top: rect.top - 70 + window.scrollY, // Point from above
          });
        } else {
          setPointerStyles({
            left: rect.left + rect.width / 2 - 40 + window.scrollX, // Center horizontally
            top: rect.bottom + 5 + window.scrollY, // Position below the button
          });
        }
      }
    }
    // Special handling for employee-management step
    else if (step.id === 'employee-management') {
      console.log('Processing employee-management step...');
      
      if (isMobile) {
        // For mobile, skip all element finding and processing entirely
        // Just rely on the special overlay to handle the visual highlighting
        console.log('Mobile detected - skipping element processing, using overlay only');
        return;
      } else {
        // Desktop logic only
        let employeeElement: HTMLElement | null = null;
        const employeeLinks = document.querySelectorAll('a[href="/employees"]');
        console.log('Found employee links with basic selector:', employeeLinks.length);
        if (employeeLinks.length > 0) {
          employeeElement = employeeLinks[0] as HTMLElement;
        }
        
        if (employeeElement) {
          const rect = employeeElement.getBoundingClientRect();
          console.log('Final employee element rect:', rect);
          console.log('Final employee element:', employeeElement);
          
          if (rect.width > 0 && rect.height > 0) {
            employeeElement.style.cssText += `
              transform: scale(1.02);
              transition: 0.3s;
              z-index: 50;
              border: none !important;
              box-shadow: none;
            `;
            
            setTargetElement(employeeElement);
            safeScrollIntoView(employeeElement);
            
            const highlightBox: HighlightBox = {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            };
            setHighlightStyles([highlightBox]);
            console.log('Successfully highlighted employee element!');
          } else {
            console.log('Employee element has no dimensions, cannot highlight');
          }
        } else {
          console.log('No employee element found for highlighting');
        }
      }
    }
    // Special handling for shift templates button (step 6)
    else if (step.id === 'shift-templates') {
      // Find the shift templates button with multiple selectors to ensure we find it
      const templateButtons = document.querySelectorAll('button[aria-label="Shift templates"]');
      
      // If the button wasn't found with the first selector, try alternative selectors
      let templateButton: HTMLElement | null = null;
      
      if (templateButtons.length > 0) {
        templateButton = templateButtons[0] as HTMLElement;
      } else {
        // Try various selectors to find the templates button
        const alternativeSelectors = [
          'button:has(svg + span:contains("Templates"))', 
          '.calendar-header button:has(svg)',
          '.flex.space-x-3 button:nth-child(2)'
        ];
        
        for (const selector of alternativeSelectors) {
          try {
            const buttons = document.querySelectorAll(selector);
            if (buttons.length > 0) {
              // Convert NodeList to Array before using for...of
              const buttonsArray = Array.from(buttons);
              for (const btn of buttonsArray) {
                if (btn instanceof HTMLElement && 
                    (btn.textContent?.includes('Template') || 
                     btn.innerHTML.includes('template'))) {
                  templateButton = btn;
                  console.log('Found templates button with alternative selector');
                  break;
                }
              }
            }
          } catch (e) {
            console.log('Selector error:', e);
          }
        }
        
        // If still not found, try finding by content
        if (!templateButton) {
          document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent?.toLowerCase().includes('template')) {
              templateButton = btn as HTMLElement;
            }
          });
        }
      }
      
      if (templateButton) {
        console.log('Found templates button:', templateButton);
        setTargetElement(templateButton);
        
        // Add MORE PROMINENT bright blue border styling (WITHOUT animation)
        templateButton.style.transition = 'all 0.3s ease';
        templateButton.style.transform = 'scale(1.1)';
        templateButton.style.boxShadow = '0 0 0 4px #2563EB';
        templateButton.style.zIndex = '9999';
        templateButton.style.position = 'relative';
        templateButton.style.border = '1px solid #2563EB';
        templateButton.classList.add('tutorial-enhanced');
        
        // Use safe scroll instead
        window.setTimeout(() => {
          safeScrollIntoView(templateButton!);
        }, 100);
        
        // Still create a visible highlight but without animation effects
        const rect = templateButton.getBoundingClientRect();
        setHighlightStyles([{
          width: rect.width + 16,
          height: rect.height + 16,
          top: rect.top - 8 + window.scrollY,
          left: rect.left - 8 + window.scrollX,
        }]);
        
        // Set pointer position - on mobile, don't show pointer since tooltip is centered
        if (step.showPointer && !isMobile) {
          setPointerStyles({
            left: rect.left + rect.width / 2 - 40 + window.scrollX,
            top: rect.top - 70 + window.scrollY, // Point from above
          });
        }
      } else {
        console.warn('Could not find templates button!');
      }
    }
    // Special handling for insights button (step 7)
    else if (step.id === 'insights') {
      // Find the insights button with multiple selectors to ensure we find it
      const insightButtons = document.querySelectorAll('button[aria-label="View insights"]');
      
      // If the button wasn't found with the first selector, try alternative selectors
      let insightButton: HTMLElement | null = null;
      
      if (insightButtons.length > 0) {
        insightButton = insightButtons[0] as HTMLElement;
      } else {
        // Try various selectors to find the insights button
        const alternativeSelectors = [
          'button:has(svg + span:contains("Insights"))', 
          '.calendar-header button:has(svg path[d*="M16 8v8m-4-5v5m-4-2v2"])',
          '.flex.space-x-3 button:nth-child(3)',
          'button.relative.z-10'
        ];
        
        for (const selector of alternativeSelectors) {
          try {
            const buttons = document.querySelectorAll(selector);
            if (buttons.length > 0) {
              // Convert NodeList to Array before using for...of
              const buttonsArray = Array.from(buttons);
              for (const btn of buttonsArray) {
                if (btn instanceof HTMLElement && 
                    (btn.textContent?.includes('Insight') || 
                     btn.innerHTML.includes('insight'))) {
                  insightButton = btn;
                  console.log('Found insights button with alternative selector');
                  break;
                }
              }
            }
          } catch (e) {
            console.log('Selector error:', e);
          }
        }
        
        // If still not found, try finding by content or SVG path
        if (!insightButton) {
          document.querySelectorAll('button').forEach(btn => {
            // Check for insights text
            if (btn.textContent?.toLowerCase().includes('insight')) {
              insightButton = btn as HTMLElement;
            }
            
            // Check for chart icon
            const svg = btn.querySelector('svg');
            if (svg && !insightButton) {
              const path = svg.querySelector('path[d*="M16 8v8m-4-5v5m-4-2v2"]');
              if (path) {
                insightButton = btn as HTMLElement;
              }
            }
          });
        }
      }
      
      if (insightButton) {
        console.log('Found insights button:', insightButton);
        setTargetElement(insightButton);
        
        // Add MORE PROMINENT bright blue border styling
        insightButton.style.transition = 'all 0.3s ease';
        insightButton.style.transform = 'scale(1.1)';
        insightButton.style.boxShadow = '0 0 0 4px #2563EB, 0 0 15px 2px rgba(37, 99, 235, 0.7)';
        insightButton.style.zIndex = '9999';
        insightButton.style.position = 'relative';
        insightButton.style.border = '1px solid #2563EB';
        insightButton.classList.add('tutorial-enhanced');
        
        // Use safe scroll instead
        window.setTimeout(() => {
          safeScrollIntoView(insightButton!);
        }, 100);
        
        // Create a larger, more visible highlight
        const rect = insightButton.getBoundingClientRect();
        setHighlightStyles([{
          width: rect.width + 16,
          height: rect.height + 16,
          top: rect.top - 8 + window.scrollY,
          left: rect.left - 8 + window.scrollX,
        }]);
        
        // Set pointer position - on mobile, don't show pointer since tooltip is centered
        if (!isMobile) {
          setPointerStyles({
            left: rect.left + rect.width / 2 - 40 + window.scrollX,
            top: rect.top - 70 + window.scrollY, // Point from above
          });
        }
      } else {
        console.warn('Could not find insights button!');
      }
    }
    else {
      console.log('FALLBACK: Using generic handling for step:', step.id);
      // Find the target element for non-special cases
      const elements = document.querySelectorAll(step.target);
      console.log('Found elements with target selector:', elements.length);
      if (elements.length > 0) {
        const element = elements[0] as HTMLElement; 
        setTargetElement(element);
        
        // Use safe scroll instead
        window.setTimeout(() => {
          safeScrollIntoView(element);
        }, 100);
        
        // Get the element's position and size
        const rect = element.getBoundingClientRect();
        
        setHighlightStyles([{
          width: rect.width + 10,
          height: rect.height + 10,
          top: rect.top - 5 + window.scrollY,
          left: rect.left - 5 + window.scrollX,
        }]);
        
        // Set pointer position - adjust based on position property for best effect
        if (step.showPointer) {
          let pointerX = 0;
          let pointerY = 0;
          
          // Special handling for employee-management step on mobile
          if (step.id === 'employee-management' && isMobile) {
            // On mobile, the employees link is in the bottom navbar
            // Position pointer to point at the bottom navbar
            pointerX = rect.left + rect.width / 2 - 40;
            pointerY = rect.top - 80; // Point from above the navbar
          } else {
            switch (step.position) {
              case 'left':
                pointerX = rect.left - 70;
                pointerY = rect.top + rect.height / 2 - 30;
                break;
              case 'right':
                pointerX = rect.right + 10;
                pointerY = rect.top + rect.height / 2 - 30;
                break;
              case 'top':
                pointerX = rect.left + rect.width / 2 - 30;
                pointerY = rect.top - 70;
                break;
              case 'bottom':
                pointerX = rect.left + rect.width / 2 - 30;
                pointerY = rect.bottom + 10;
                break;
              default:
                pointerX = rect.left + rect.width / 2 - 30;
                pointerY = rect.top + rect.height / 2 - 30;
            }
          }
          
          setPointerStyles({
            left: pointerX + window.scrollX,
            top: pointerY + window.scrollY,
          });
        }
      }
    }
    
    // Execute any action for this step
    if (step.action) {
      step.action();
    }
  }, [isActive, currentStep]);
  
  // Update highlight positions on scroll or resize
  useEffect(() => {
    if (!isActive || !targetElement) return;
    
    const updatePositions = () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      const step = tutorialSteps[currentStep];
      
      // Re-calculate positions after scroll/resize
      const rect = targetElement.getBoundingClientRect();
      
      setHighlightStyles(prev => 
        prev.map(style => ({
          ...style,
          top: rect.top - 5 + window.scrollY,
          left: rect.left - 5 + window.scrollX,
        }))
      );
      
      if (step.showPointer) {
        let pointerX = 0;
        let pointerY = 0;
        
        // Special handling for employee-management step on mobile
        if (step.id === 'employee-management' && isMobile) {
          // On mobile, the employees link is in the bottom navbar
          // Position pointer to point at the bottom navbar
          pointerX = rect.left + rect.width / 2 - 40;
          pointerY = rect.top - 80; // Point from above the navbar
        } else {
          switch (step.position) {
            case 'left':
              pointerX = rect.left - 70;
              pointerY = rect.top + rect.height / 2 - 30;
              break;
            case 'right':
              pointerX = rect.right + 10;
              pointerY = rect.top + rect.height / 2 - 30;
              break;
            case 'top':
              pointerX = rect.left + rect.width / 2 - 30;
              pointerY = rect.top - 70;
              break;
            case 'bottom':
              pointerX = rect.left + rect.width / 2 - 30;
              pointerY = rect.bottom + 10;
              break;
            default:
              pointerX = rect.left + rect.width / 2 - 30;
              pointerY = rect.top + rect.height / 2 - 30;
          }
        }
        
        setPointerStyles({
          left: pointerX + window.scrollX,
          top: pointerY + window.scrollY,
        });
      }
    };
    
    // Update positions initially and on scroll/resize
    updatePositions();
    window.addEventListener('scroll', updatePositions);
    window.addEventListener('resize', updatePositions);
    
    return () => {
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
    };
  }, [isActive, targetElement, currentStep]);
  
  useEffect(() => {
    if (!isActive) return;
    
    const step = tutorialSteps[currentStep];
    
    // Allow interaction with highlighted elements by making them clickable through the overlay
    const allowInteractionWithHighlightedElements = () => {
      // Find highlighted elements to enable interaction
      const highlightedElements = document.querySelectorAll(step.target);
      
      // Add special class for CSS to handle pointer events
      highlightedElements.forEach((el) => {
        el.classList.add('tutorial-interactive');
      });
      
      // Special handling for links we need users to click
      if (step.id === 'employee-management') {
        const employeeLinks = document.querySelectorAll('a[href="/employees"]');
        employeeLinks.forEach(link => {
          // Make the link higher z-index
          (link as HTMLElement).style.zIndex = '100';
          (link as HTMLElement).style.position = 'relative';
          link.classList.add('tutorial-interactive');
          
          // Create a clone of the element with pointer events auto
          const clone = link.cloneNode(true) as HTMLElement;
          clone.style.position = 'absolute';
          clone.style.top = '0';
          clone.style.left = '0';
          clone.style.width = '100%';
          clone.style.height = '100%';
          clone.style.zIndex = '101';
          clone.style.pointerEvents = 'auto';
          clone.style.cursor = 'pointer';
          clone.style.background = 'transparent';
          clone.style.opacity = '0.01'; // Nearly invisible but still clickable
          clone.classList.add('tutorial-clone'); // Mark it for easy cleanup
          link.parentNode?.appendChild(clone);
          
          // Store the clone for cleanup
          return () => {
            if (clone.parentNode) {
              clone.parentNode.removeChild(clone);
            }
          };
        });
      }
      
      // Return cleanup function to remove class
      return () => {
        highlightedElements.forEach((el) => {
          el.classList.remove('tutorial-interactive');
        });
      };
    };
    
    // Set up and return cleanup
    const cleanup = allowInteractionWithHighlightedElements();
    return cleanup;
  }, [isActive, currentStep]);
  
  // Enhanced cleanup for previous steps
  useEffect(() => {
    // Function to clean up all tutorial-related elements
    const cleanupTutorialElements = () => {
      // Remove all tutorial-interactive classes
      document.querySelectorAll('.tutorial-interactive').forEach(el => {
        el.classList.remove('tutorial-interactive');
        
        // Reset any styling
        if (el instanceof HTMLElement) {
          el.style.zIndex = '';
          el.style.position = '';
        }
      });
      
      // Clean up tutorial-enhanced elements
      document.querySelectorAll('.tutorial-enhanced, .floating-action').forEach(el => {
        el.classList.remove('tutorial-enhanced');
        el.classList.remove('floating-action');
        
        // Reset any styling
        if (el instanceof HTMLElement) {
          el.style.cssText = ''; // Reset all inline styles at once
        }
      });
      
      // Remove any tutorial clones
      document.querySelectorAll('.tutorial-clone').forEach(clone => {
        if (clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
      });
      
      // Remove any added styles
      document.querySelectorAll('style').forEach(style => {
        if (style.textContent?.includes('tutorial-enhanced') ||
            style.textContent?.includes('floating-action')) {
          style.parentNode?.removeChild(style);
        }
      });
    };
    
    // Clean up when component unmounts or when steps change
    return () => {
      cleanupTutorialElements();
    };
  }, [currentStep, isActive]);
  
  if (!isActive) return null;
  
  const currentTutorialStep = tutorialSteps[currentStep];
  const shouldShowPointer = currentTutorialStep.showPointer;
  
  return (
    <div className="fixed inset-0 z-[9000] overflow-hidden">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto"></div>
      
      {/* Highlight cutouts - render multiple if needed */}
      <AnimatePresence mode="wait">
        {highlightStyles.map((style, index) => (
          <motion.div
            key={`highlight-${currentStep}-${index}`}
            className={`absolute rounded-lg pointer-events-none`}
            style={{
              ...style,
              border: currentTutorialStep.id === 'add-shift' ? 'none' : // Remove border completely for add-shift
                     currentTutorialStep.id === 'employee-management' ? '4px solid #2563EB' : // Enhanced border for employee-management
                     currentTutorialStep.id === 'shift-templates' ? '3px solid #2563EB' : 
                     currentTutorialStep.id === 'insights' ? '3px solid #2563EB' : 
                     '2px solid rgba(59, 130, 246, 0.8)',
              boxShadow: currentTutorialStep.id === 'shift-templates' ? '0 0 8px 2px rgba(37, 99, 235, 0.5)' :
                         currentTutorialStep.id === 'insights' ? '0 0 15px 3px rgba(37, 99, 235, 0.7)' :
                         currentTutorialStep.id === 'add-shift' ? 'none' : // Remove shadow completely for add-shift
                         currentTutorialStep.id === 'employee-management' ? '0 0 0 4px rgba(37, 99, 235, 0.3), 0 0 20px 2px rgba(37, 99, 235, 0.8)' : // Enhanced shadow for employee-management
                         '0 0 8px 1px rgba(59, 130, 246, 0.3)'
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              // No animated effects for templates step
              scale: currentTutorialStep.id === 'shift-templates' ? 1 : undefined 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </AnimatePresence>
      
      {/* Special mobile employee tab highlight that doesn't affect navbar layout */}
      <AnimatePresence mode="wait">
        {currentTutorialStep.id === 'employee-management' && 
         typeof window !== 'undefined' && 
         window.innerWidth <= 768 && (
          <motion.div
            key="mobile-employee-highlight"
            className="fixed pointer-events-none z-[9100]"
            style={{
              bottom: '22px', // More precise positioning over the mobile navbar
              left: 'calc(25% + 2px)', // Slightly offset to center better
              width: 'calc(25% - 4px)', // Slightly smaller to not overflow
              height: '56px', // More precise height to match navbar content
              border: '3px solid #2563EB',
              borderRadius: '10px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2), 0 0 12px 1px rgba(37, 99, 235, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      
      {/* More visible interactive pointer finger - show it on top of everything */}
      <AnimatePresence mode="wait">
        {targetElement && shouldShowPointer && currentTutorialStep.id !== 'recurring-shifts' && currentTutorialStep.id !== 'add-shift' && (
          (() => {
            const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
            // Hide pointer on mobile for steps that have centered tooltips
            const hidePointerOnMobile = isMobile && (
              currentTutorialStep.id === 'employee-management' || 
              currentTutorialStep.id === 'shift-templates' || 
              currentTutorialStep.id === 'insights' ||
              currentTutorialStep.id === 'help'
            );
            
            if (hidePointerOnMobile) return null;
            
            return (
              <motion.div 
                key={`pointer-${currentStep}`}
                className="absolute z-[9500] pointer-events-none"
                style={{
                  top: pointerStyles.top,
                  left: pointerStyles.left,
                  width: '80px',
                  height: '80px'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 1, 
                    rotate: [0, -10, 0, 10, 0],
                  }}
                  transition={{ 
                    opacity: { duration: 0.3 },
                    rotate: { duration: 1.5, repeat: Infinity }
                  }}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  {/* Large glowing circle behind the pointer */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '-10px',
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'rgba(59, 130, 246, 0.5)',
                      filter: 'blur(10px)',
                      zIndex: -1
                    }}
                  />
                  
                  {/* Actual pointer icon */}
                  <svg 
                    width="80" 
                    height="80" 
                    viewBox="0 0 24 24" 
                    fill="#FFFFFF"
                    stroke="#000000"
                    strokeWidth="1"
                    style={{
                      filter: 'drop-shadow(0px 0px 8px rgba(0,0,0,0.5))'
                    }}
                  >
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                    <line x1="16" y1="8" x2="2" y2="22"></line>
                    <line x1="17.5" y1="15" x2="9" y2="15"></line>
                  </svg>
                  
                  {/* Pulsing point for extra emphasis */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      bottom: '15px',
                      right: '15px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#FF5555',
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>
      
      {/* Tutorial popover */}
      <TutorialPopover step={currentTutorialStep} targetElement={targetElement} />
    </div>
  );
};

export default TutorialOverlay; 
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDate } from '../../store/shiftsSlice';
import { setModalOpen, addNotification } from '../../store/uiSlice';
import { RootState } from '../../store';
import ShiftForm from '../forms/ShiftForm';
import EmptyState from '../common/EmptyState';
import NewUserGuidance from '../common/NewUserGuidance';
import { motion, AnimatePresence } from 'framer-motion';
import ShiftCard from '../shifts/ShiftCard';
import ShiftCardSkeleton from '../shifts/ShiftCardSkeleton';
import ConfettiCelebration from '../common/ConfettiCelebration';
import LoadingButton from '../common/LoadingButton';
import Tooltip from '../common/Tooltip';
import CustomFocusButton from '../common/CustomFocusButton';
import TemplatesPage from '../forms/TemplatesPage';
import CalendarHeader from './CalendarHeader';
import DailyView from './DailyView';
import WeeklyView from './WeeklyView';
import ViewToggle from '../common/ViewToggle';
import StaffView from '../views/StaffView';
import ListView from '../views/ListView';
import { formatDate, formatToISODate, createDateFromISO } from '../../utils/dateUtils';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const CalendarView: React.FC = () => {
  const dispatch = useDispatch();
  const { shifts, selectedDate } = useSelector((state: RootState) => state.shifts);
  const { modalOpen, currentView, notificationPreferences } = useSelector((state: RootState) => state.ui);
  const { employees } = useSelector((state: RootState) => state.employees);
  
  // Use a ref to track if component is mounted
  const isMounted = useRef(true);
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  // Ref for confetti container
  const confettiRef = useRef<HTMLDivElement>(null);
  
  // Add state for insights button hover effect
  const [insightsHovered, setInsightsHovered] = useState(false);
  
  // Add state for onboarding status to trigger re-render
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    localStorage.getItem('shiftsync_onboarding_dismissed') === 'true'
  );
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Monitor celebration state
  useEffect(() => {
    if (showCelebration) {
      console.log('showCelebration state is now true');
    }
  }, [showCelebration]);
  
  // Generate days for the calendar
  const [days, setDays] = useState<Date[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => createDateFromISO(selectedDate));
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    console.log('CalendarView - Selected date changed to:', selectedDate);
    
    // Create a date from the selected date string
    const date = createDateFromISO(selectedDate);
    console.log('CalendarView - Parsed date object:', date);
    
    const dayOfWeek = date.getUTCDay(); // Use UTC day of week
    
    // Calculate the start date of the week (Monday)
    const startOfWeek = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1),
      12, 0, 0
    ));
    
    console.log('CalendarView - Start of week:', startOfWeek);
    
    // Generate an array of 7 days starting from Monday
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const newDay = new Date(Date.UTC(
        startOfWeek.getUTCFullYear(),
        startOfWeek.getUTCMonth(),
        startOfWeek.getUTCDate() + i,
        12, 0, 0
      ));
      return newDay;
    });
    
    console.log('CalendarView - Week days generated:', weekDays.map(d => formatToISODate(d)));
    
    setDays(weekDays);
  }, [selectedDate]);
  
  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Simplified handlers using the consistent selectDate function
  const handlePreviousWeek = useCallback(() => {
    // Create a date from the selected date
    const date = createDateFromISO(selectedDate);
    
    // Go back 7 days
    date.setUTCDate(date.getUTCDate() - 7);
    
    // Format to YYYY-MM-DD using our consistent formatter
    const dateString = formatToISODate(date);
    console.log('Going to previous week, new date:', dateString);
    
    // Set the date directly
    dispatch(setSelectedDate(dateString));
  }, [selectedDate, dispatch]);
  
  const handleNextWeek = useCallback(() => {
    // Create a date from the selected date
    const date = createDateFromISO(selectedDate);
    
    // Go forward 7 days
    date.setUTCDate(date.getUTCDate() + 7);
    
    // Format to YYYY-MM-DD using our consistent formatter
    const dateString = formatToISODate(date);
    console.log('Going to next week, new date:', dateString);
    
    // Set the date directly
    dispatch(setSelectedDate(dateString));
  }, [selectedDate, dispatch]);
  
  const handleAddShift = useCallback(() => {
    dispatch(setModalOpen({ modal: 'addShift', isOpen: true }));
    if (notificationPreferences.enabled && notificationPreferences.types.shifts) {
      dispatch(addNotification({
        message: 'Shift added successfully!',
        type: 'success',
        category: 'shifts'
      }));
    }
  }, [dispatch, notificationPreferences]);
  
  const handleDayClick = useCallback((day: string) => {
    console.log('Day clicked:', day);
    
    // Set the date directly
    dispatch(setSelectedDate(day));
  }, [dispatch]);
  
  const handleDatePickerToggle = useCallback(() => {
    setShowDatePicker(!showDatePicker);
    // Initialize the calendar month to the currently selected date
    setCalendarMonth(createDateFromISO(selectedDate));
  }, [showDatePicker, selectedDate]);
  
  const handleCalendarDateSelect = useCallback((day: Date) => {
    // Format date using our consistent formatter
    const dateString = formatToISODate(day);
    console.log('CalendarView - Calendar date selected:', day, 'Formatted as:', dateString);
    
    // Set the selected date directly in the store
    dispatch(setSelectedDate(dateString));
    
    // Close the date picker
    setShowDatePicker(false);
  }, [dispatch]);
  
  const handlePrevMonth = useCallback(() => {
    setCalendarMonth((prev: Date) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);
  
  const handleNextMonth = useCallback(() => {
    setCalendarMonth((prev: Date) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);
  
  const isToday = useCallback((day: Date) => {
    const today = new Date();
    
    // Use our consistent formatting approach
    const todayFormatted = formatToISODate(today);
    const dayFormatted = formatToISODate(day);
    
    return todayFormatted === dayFormatted;
  }, []);
  
  // Generate calendar grid for the date picker
  const generateCalendarDays = useCallback(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    // Get the first day of the month - use UTC to avoid timezone issues
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1, 12, 0, 0));
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Adjust Sunday to be 7 instead of 0
    
    // Number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Array to hold all the days we need to display
    const calendarDays: Date[] = [];
    
    // Add days from previous month to fill the first row
    for (let i = 1; i < firstDayOfWeek; i++) {
      const prevMonthDay = new Date(Date.UTC(year, month, 1 - (firstDayOfWeek - i), 12, 0, 0));
      calendarDays.push(prevMonthDay);
    }
    
    // Add all days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(new Date(Date.UTC(year, month, i, 12, 0, 0)));
    }
    
    // Add days from next month to complete the last row if needed
    const totalDaysShown = Math.ceil(calendarDays.length / 7) * 7;
    const daysToAdd = totalDaysShown - calendarDays.length;
    
    for (let i = 1; i <= daysToAdd; i++) {
      calendarDays.push(new Date(Date.UTC(year, month + 1, i, 12, 0, 0)));
    }
    
    return calendarDays;
  }, [calendarMonth]);
  
  // Handle publishing the schedule
  const handlePublishSchedule = useCallback(() => {
    console.log('Publishing schedule - setting isPublishing to true');
    // Show loading state
    setIsPublishing(true);
    
    // Simulate API request with a timeout (reduced for testing)
    setTimeout(() => {
      console.log('Publishing complete - checking notification preferences for celebration and notification');
      setIsPublishing(false);
      // Only show celebration if notifications for publication are enabled
      if (notificationPreferences.enabled && notificationPreferences.types.publication) {
        setShowCelebration(true);
        dispatch(addNotification({
          message: 'Schedule published successfully!',
          type: 'success',
          category: 'publication'
        }));
      }
      // Hide celebration after a few seconds
      setTimeout(() => {
        console.log('Hiding celebration');
        setShowCelebration(false);
      }, 6000);
    }, 1000);
  }, [dispatch, notificationPreferences]);
  
  const handleToggleInsights = () => {
    dispatch(setModalOpen({ modal: 'insights', isOpen: true }));
  };
  
  // Handle when confetti animation completes
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);
  
  // Add loading state for shifts
  const [shiftsLoading, setShiftsLoading] = useState(false);
  
  // Update loading when selected date changes
  useEffect(() => {
    setShiftsLoading(true);
    
    // Simulate loading delay
    const timer = setTimeout(() => {
      setShiftsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [selectedDate]);
  
  // Add event listeners for keyboard shortcut events
  useEffect(() => {
    const handlePublishScheduleEvent = () => {
      handlePublishSchedule();
    };
    
    const handlePreviousWeekEvent = () => {
      handlePreviousWeek();
    };
    
    const handleNextWeekEvent = () => {
      handleNextWeek();
    };
    
    // Add event listeners
    document.addEventListener('publishSchedule', handlePublishScheduleEvent);
    document.addEventListener('navigatePreviousWeek', handlePreviousWeekEvent);
    document.addEventListener('navigateNextWeek', handleNextWeekEvent);
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('publishSchedule', handlePublishScheduleEvent);
      document.removeEventListener('navigatePreviousWeek', handlePreviousWeekEvent);
      document.removeEventListener('navigateNextWeek', handleNextWeekEvent);
    };
  }, [handlePublishSchedule, handlePreviousWeek, handleNextWeek]);
  
  // Monitor showCelebration state
  useEffect(() => {
    console.log('showCelebration state changed to:', showCelebration);
  }, [showCelebration]);

  // Listen for storage changes to update onboarding status
  useEffect(() => {
    const handleStorageChange = () => {
      const dismissed = localStorage.getItem('shiftsync_onboarding_dismissed') === 'true';
      setOnboardingDismissed(dismissed);
    };
    
    // Listen for the custom event when onboarding is dismissed
    const handleOnboardingDismissed = () => {
      setOnboardingDismissed(true);
    };
    
    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('onboardingDismissed', handleOnboardingDismissed);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('onboardingDismissed', handleOnboardingDismissed);
    };
  }, []);

  // Function to render the view based on current view type
  const renderView = () => {
    // Check if this is a completely new account with no data
    const shiftsExist = shifts && shifts.length > 0;
    const employeesExist = employees && employees.length > 0;
    const isCompletelyNew = !shiftsExist && !employeesExist;
    
    // Check onboarding state
    const onboardingCompleted = localStorage.getItem('shiftsync_onboarding_completed') === 'true';
    const hasStartedOnboarding = localStorage.getItem('shiftsync_onboarding_current_step') !== null;
    
    // Show onboarding guidance if:
    // 1. User is completely new and hasn't dismissed onboarding, OR
    // 2. User has started onboarding but hasn't completed it and hasn't dismissed it
    const shouldShowOnboarding = !onboardingCompleted && !onboardingDismissed && 
      (isCompletelyNew || hasStartedOnboarding);
    
    if (shouldShowOnboarding) {
      return <NewUserGuidance />;
    }
    
    // Otherwise show the normal calendar views
    switch (currentView) {
      case 'daily':
        return (
          <DailyView 
            selectedDate={selectedDate}
            handleAddShift={handleAddShift} 
          />
        );
      case 'weekly':
        return (
          <WeeklyView 
            days={days}
            selectedDate={selectedDate}
            handleDayClick={handleDayClick}
            handleAddShift={handleAddShift}
          />
        );
      case 'staff':
        return <StaffView />;
      case 'list':
        return <ListView />;
      default:
        return (
          <WeeklyView 
            days={days}
            selectedDate={selectedDate}
            handleDayClick={handleDayClick}
            handleAddShift={handleAddShift}
          />
        );
    }
  };

  return (
    <div className="calendar-view w-full flex flex-col">
      <CalendarHeader />
      <div className="px-4 sm:px-6 lg:px-8 pt-1">
        <ViewToggle />
      </div>
      <div className="flex-1 px-4 sm:px-6 lg:px-8 md:pb-4 pb-2 mobile-calendar-container">
        {renderView()}
      </div>

      {/* Confetti Celebration */}
      <ConfettiCelebration 
        show={showCelebration} 
        onComplete={handleCelebrationComplete} 
        ref={confettiRef}
      />
    </div>
  );
};

export default React.memo(CalendarView); 
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState } from '../../store';
import { setModalOpen, addNotification } from '../../store/uiSlice';
import { setSelectedDate } from '../../store/shiftsSlice';
import Tooltip from '../common/Tooltip';
import CustomFocusButton from '../common/CustomFocusButton';
import LoadingButton from '../common/LoadingButton';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { formatDate, formatToISODate, createDateFromISO } from '../../utils/dateUtils';

type ShiftsState = {
  selectedDate: string;
  shifts: any[];
  templates: any[];
  error: string | null;
};

const CalendarHeader: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedDate } = useSelector((state: RootState) => state.shifts as ShiftsState);
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [insightsHovered, setInsightsHovered] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    // Initialize with a UTC date based on selected date
    // Add defensive programming to handle undefined selectedDate
    try {
      if (!selectedDate || typeof selectedDate !== 'string') {
        console.warn('CalendarHeader: selectedDate is undefined during initialization, using fallback');
        return new Date(Date.UTC(2024, 0, 15, 12, 0, 0)); // January 15, 2024 UTC fallback
      }
      
      const date = createDateFromISO(selectedDate);
      
      // Additional check to ensure date is valid
      if (!date || isNaN(date.getTime())) {
        console.warn('CalendarHeader: createDateFromISO returned invalid date, using fallback');
        return new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
      }
      
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12, 0, 0));
    } catch (error) {
      console.error('CalendarHeader: Error initializing calendarMonth:', error);
      return new Date(Date.UTC(2024, 0, 15, 12, 0, 0)); // Fallback date
    }
  });
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const { playSound } = useSoundEffects();
  
  // Get array of days for current week
  const days = (() => {
    try {
      // Add safety check for selectedDate
      if (!selectedDate || typeof selectedDate !== 'string') {
        console.warn('CalendarHeader: selectedDate is undefined in days calculation, using fallback');
        const fallbackDate = new Date();
        const day = fallbackDate.getDay();
        const diff = fallbackDate.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(fallbackDate.setDate(diff));
        const weekDays = [];
        
        for (let i = 0; i < 7; i++) {
          const next = new Date(weekStart);
          next.setDate(weekStart.getDate() + i);
          weekDays.push(next);
        }
        return weekDays;
      }
      
      const date = new Date(selectedDate);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      
      const weekStart = new Date(date.setDate(diff));
      const weekDays = [];
      
      for (let i = 0; i < 7; i++) {
        const next = new Date(weekStart);
        next.setDate(weekStart.getDate() + i);
        weekDays.push(next);
      }
      
      return weekDays;
    } catch (error) {
      console.error('CalendarHeader: Error calculating days:', error);
      // Return current week as fallback
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(today.setDate(diff));
      const weekDays = [];
      
      for (let i = 0; i < 7; i++) {
        const next = new Date(weekStart);
        next.setDate(weekStart.getDate() + i);
        weekDays.push(next);
      }
      return weekDays;
    }
  })();
  
  // Handle clicks outside date picker
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
  
  // Format date to string - use the shared utility
  const formatDateToString = (date: Date): string => {
    return formatToISODate(date);
  };
  
  // Check if date is today using local date comparison
  const isToday = (date: Date): boolean => {
    const today = new Date();
    
    // Compare the local date components
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  // Generate calendar days for date picker with consistent local date handling
  const generateCalendarDays = () => {
    console.log('Generating calendar days for month:', calendarMonth);
    
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    // First day of month (using local date to preserve the day)
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week of first day (0 = Sunday)
    let firstDayOfWeek = firstDay.getDay();
    // Convert to Monday-based (1 = Monday, 7 = Sunday)
    firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
    
    // Array to hold all calendar days
    const calendarDays: Date[] = [];
    
    // Add days from previous month
    const daysFromPrevMonth = firstDayOfWeek - 1;
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      calendarDays.push(prevDate);
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      calendarDays.push(new Date(year, month, i));
    }
    
    // Add days from next month to complete the calendar (6 rows x 7 days = 42)
    const daysToAdd = 42 - calendarDays.length;
    for (let i = 1; i <= daysToAdd; i++) {
      calendarDays.push(new Date(year, month + 1, i));
    }
    
    // Debug log
    const formattedDays = calendarDays.map(d => ({
      date: d.toISOString(),
      localDay: d.getDate(),
      month: d.getMonth() + 1
    }));
    console.log('Calendar days generated:', formattedDays);
    
    return calendarDays;
  };
  
  const handlePreviousWeek = () => {
    // Create date from selected date using consistent approach
    const date = createDateFromISO(selectedDate);
    
    // Go back 7 days
    date.setUTCDate(date.getUTCDate() - 7);
    
    // Format using our consistent formatter
    const dateString = formatToISODate(date);
    console.log('Going to previous week, new date:', dateString);
    
    dispatch(setSelectedDate(dateString));
    playSound('click');
  };
  
  const handleNextWeek = () => {
    // Create date from selected date using consistent approach
    const date = createDateFromISO(selectedDate);
    
    // Go forward 7 days
    date.setUTCDate(date.getUTCDate() + 7);
    
    // Format using our consistent formatter
    const dateString = formatToISODate(date);
    console.log('Going to next week, new date:', dateString);
    
    dispatch(setSelectedDate(dateString));
    playSound('click');
  };
  
  const handleDayClick = (day: Date) => {
    // Format using our consistent formatter
    const dateString = formatToISODate(day);
    console.log('Day clicked:', day, 'Formatted as:', dateString);
    
    dispatch(setSelectedDate(dateString));
    playSound('click');
  };
  
  const handleDatePickerToggle = () => {
    setShowDatePicker(!showDatePicker);
    
    // Initialize the calendar month to the currently selected date using a proper UTC date
    if (!showDatePicker) {
      const selectedDateObj = createDateFromISO(selectedDate);
      const newCalendarMonth = new Date(
        Date.UTC(
          selectedDateObj.getUTCFullYear(),
          selectedDateObj.getUTCMonth(),
          1,
          12, 0, 0
        )
      );
      console.log('Setting calendar month on toggle:', newCalendarMonth);
      setCalendarMonth(newCalendarMonth);
    }
    
    playSound('click');
  };
  
  const handleCalendarDateSelect = (day: Date) => {
    // Get the actual day number from the Date object
    const selectedDay = day.getDate(); // Using local date getDate to preserve the user's intent
    
    // Create a date string manually to ensure correct day
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dayStr = String(selectedDay).padStart(2, '0');
    
    // This ensures the exact date the user clicked is preserved
    const exactDate = `${year}-${month}-${dayStr}`;
    
    console.log('Calendar day selected:', day);
    console.log('Preserving exact date:', exactDate, 'Day:', selectedDay);
    
    // Update Redux with the exact date
    dispatch(setSelectedDate(exactDate));
    setShowDatePicker(false);
    playSound('click');
  };
  
  const handlePrevMonth = () => {
    setCalendarMonth(prev => {
      const newDate = new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1, 12, 0, 0));
      return newDate;
    });
    playSound('click');
  };
  
  const handleNextMonth = () => {
    setCalendarMonth(prev => {
      const newDate = new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1, 12, 0, 0));
      return newDate;
    });
    playSound('click');
  };
  
  const handleToggleInsights = () => {
    dispatch(setModalOpen({ modal: 'insights', isOpen: true }));
    playSound('notification');
  };
  
  const handlePublishSchedule = () => {
    setIsPublishing(true);
    playSound('complete');
    
    // Simulate publish action
    setTimeout(() => {
      setIsPublishing(false);
      
      // Create a custom event to trigger the confetti celebration
      const publishEvent = new CustomEvent('publishSchedule');
      document.dispatchEvent(publishEvent);
    }, 1500);
  };
  
  const handleAddShift = () => {
    dispatch(setModalOpen({ modal: 'addShift', isOpen: true }));
  };

  const handleOpenTemplates = () => {
    dispatch(setModalOpen({ modal: 'templates', isOpen: true }));
    playSound('click');
  };

  return (
    <div className="calendar-header px-4 sm:px-6 lg:px-8 pt-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white max-[320px]:hidden">
          {(() => {
            try {
              if (!selectedDate || typeof selectedDate !== 'string') {
                return 'January 2024'; // Fallback title
              }
              return createDateFromISO(selectedDate).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              });
            } catch (error) {
              console.error('CalendarHeader: Error formatting title date:', error);
              return 'January 2024'; // Fallback title
            }
          })()}
        </h1>
        
        <div className="flex space-x-3 max-[320px]:w-full max-[320px]:justify-center">
          <Tooltip content="Add Shift" shortcut="shift+n" position="top">
            <CustomFocusButton 
              onClick={handleAddShift}
              aria-label="Add shift"
              variant="primary"
              sound="click"
            >
              <svg className="h-5 w-5 md:mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden md:inline">Add Shift</span>
            </CustomFocusButton>
          </Tooltip>

          <Tooltip content="Shift Templates" shortcut="shift+t" position="top">
            <CustomFocusButton 
              onClick={handleOpenTemplates}
              aria-label="Shift templates"
              variant="outline"
              sound="click"
            >
              <svg className="h-5 w-5 md:mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span className="hidden md:inline">Templates</span>
            </CustomFocusButton>
          </Tooltip>

          <Tooltip content="View Insights" shortcut="Shift+i" position="top">
            <motion.div 
              className="relative" 
              onMouseEnter={() => setInsightsHovered(true)}
              onMouseLeave={() => setInsightsHovered(false)}
              initial={{ y: 0 }}
              animate={{ y: [0, -4, 0] }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 2,
                ease: "easeInOut"
              }}
            >
              {insightsHovered && (
                <div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-ping"
                  style={{ animationDuration: '1s' }}
                />
              )}
              <CustomFocusButton
                onClick={handleToggleInsights}
                aria-label="View insights"
                variant="outline"
                className="relative z-10"
                sound="click"
              >
                <svg className="h-5 w-5 md:mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden md:inline">Insights</span>
              </CustomFocusButton>
            </motion.div>
          </Tooltip>
          
          <Tooltip content="Publish Schedule" shortcut="Shift+p" position="top">
            <div className="relative">
              {/* Checkmark badge */}
              {!isPublishing && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center z-10">
                  <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <LoadingButton
                onClick={handlePublishSchedule}
                isLoading={isPublishing}
                loadingText="Publishing..."
                variant="primary"
                aria-label="Publish schedule"
                sound="click"
              >
                <svg className="h-5 w-5 md:mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden md:inline">Publish</span>
              </LoadingButton>
            </div>
          </Tooltip>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 space-y-2 md:space-y-0">
        <div className="flex items-center justify-center md:justify-start space-x-2">
          <Tooltip content="Previous Week" shortcut="←" position="top">
            <CustomFocusButton 
              onClick={handlePreviousWeek}
              aria-label="Go to previous week"
              variant="outline"
              sound="click"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </CustomFocusButton>
          </Tooltip>
          
          <div ref={datePickerRef} className="relative">
            <Tooltip content="Select Date" shortcut="d" position="top">
              <CustomFocusButton 
                onClick={handleDatePickerToggle}
                aria-label="Open date picker"
                aria-expanded={showDatePicker}
                variant="outline"
                className="min-w-[180px] flex justify-between items-center"
                sound="click"
              >
                <span>
                  {(() => {
                    try {
                      if (!days || days.length < 7) {
                        return 'Jan 15 - Jan 21'; // Fallback range
                      }
                      const startDate = createDateFromISO(formatToISODate(days[0]));
                      const endDate = createDateFromISO(formatToISODate(days[6]));
                      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                    } catch (error) {
                      console.error('CalendarHeader: Error formatting date range:', error);
                      return 'Jan 15 - Jan 21'; // Fallback range
                    }
                  })()}
                </span>
                <svg className="h-5 w-5 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </CustomFocusButton>
            </Tooltip>
            
            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute z-10 mt-2 w-64 bg-white dark:bg-dark-800 rounded-lg shadow-xl border border-gray-200 dark:border-dark-700 p-3">
                <div className="flex justify-between items-center mb-3">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700"
                  >
                    <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  
                  <button 
                    onClick={handleNextMonth}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700"
                  >
                    <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-500 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day, index) => {
                    // Get manual exact date string to avoid timezone issues
                    const year = day.getFullYear();
                    const month = String(day.getMonth() + 1).padStart(2, '0');
                    const dayNum = String(day.getDate()).padStart(2, '0');
                    const exactDate = `${year}-${month}-${dayNum}`;
                    
                    // Debug logging
                    console.log(`Calendar day ${index}:`, day, 'Exact date:', exactDate);
                    
                    const isSelected = exactDate === selectedDate;
                    const isTodayDate = isToday(day);
                    const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          console.log('Calendar day clicked:', day, 'Exact date:', exactDate);
                          // Pass the date string directly to avoid any conversion issues
                          dispatch(setSelectedDate(exactDate));
                          setShowDatePicker(false);
                          playSound('click');
                        }}
                        className={`
                          h-8 w-8 rounded-full flex items-center justify-center text-sm
                          ${isSelected ? 'bg-primary-500 text-white' : ''}
                          ${!isSelected && isTodayDate ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200' : ''}
                          ${!isSelected && !isTodayDate && isCurrentMonth ? 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700' : ''}
                          ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}
                        `}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <Tooltip content="Next Week" shortcut="→" position="top">
            <CustomFocusButton 
              onClick={handleNextWeek}
              aria-label="Go to next week"
              variant="outline"
              sound="click"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </CustomFocusButton>
          </Tooltip>
          
          <Tooltip content="Today" shortcut="t" position="top">
            <CustomFocusButton 
              onClick={() => handleDayClick(new Date())}
              aria-label="Go to today"
              variant="outline"
              sound="click"
              className="hidden md:block"
            >
              Today
            </CustomFocusButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader; 
/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Format a date in a user-friendly way
 * @param dateString - ISO date string or Date object
 * @returns formatted date string (e.g., "Mon, Jan 1, 2023")
 */
export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format a date to ISO YYYY-MM-DD format consistently
 * @param date - Date object or date string to format
 * @returns formatted date string (e.g., "2023-01-01")
 */
export const formatToISODate = (date: Date | string): string => {
  try {
    console.log('DATEUTILS: Formatting date to ISO:', date);
    
    let dateObj: Date;
    let dateComponents: { year: number, month: number, day: number };
    
    if (typeof date === 'string') {
      // If we have a string that's already in YYYY-MM-DD format, just clean and return it
      const cleanedString = date.trim().replace(/\s+/g, '');
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanedString)) {
        console.log('DATEUTILS: Already in YYYY-MM-DD format, returning:', cleanedString);
        return cleanedString;
      }
      
      // For strings, try to parse the date components directly
      const parts = cleanedString.split('-');
      if (parts.length === 3) {
        dateComponents = {
          year: parseInt(parts[0], 10),
          month: parseInt(parts[1], 10),
          day: parseInt(parts[2], 10)
        };
        
        if (!isNaN(dateComponents.year) && !isNaN(dateComponents.month) && !isNaN(dateComponents.day)) {
          const formattedDate = `${dateComponents.year}-${String(dateComponents.month).padStart(2, '0')}-${String(dateComponents.day).padStart(2, '0')}`;
          console.log('DATEUTILS: Parsed string date components directly:', formattedDate);
          return formattedDate;
        }
      }
      
      // Otherwise parse it to a Date
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    // For Date objects, use local date components
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    
    const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    console.log('DATEUTILS: Formatted date:', formatted, 'from date object day:', day);
    
    return formatted;
  } catch (error) {
    console.error('DATEUTILS: Error formatting date to ISO:', date, error);
    // If we can't format, return original string or today's date
    return typeof date === 'string' ? date : new Date().toISOString().split('T')[0];
  }
};

/**
 * Create a date object from YYYY-MM-DD string
 * @param dateString - ISO date string
 * @returns Date object (at noon UTC to avoid timezone issues)
 */
export const createDateFromISO = (dateString: string): Date => {
  try {
    console.log('DATEUTILS: Creating date from string:', dateString);
    
    // Clean the string (remove any spaces)
    const cleanedString = dateString.replace(/\s+/g, '');
    
    // Parse the date components directly to avoid timezone issues
    const [year, month, day] = cleanedString.split('-').map(num => parseInt(num, 10));
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.error('DATEUTILS: Invalid date components:', { year, month, day });
      // Fallback to the JS Date constructor
      return new Date(cleanedString);
    }
    
    // Create a date in the local timezone
    const localDate = new Date(year, month - 1, day, 12, 0, 0);
    console.log('DATEUTILS: Local date created:', localDate.toISOString());
    
    // Verify the date to return has the intended day
    console.log('DATEUTILS: Final date to return:', localDate, 
                'Day of month:', localDate.getDate(), 
                'Was expecting day:', day);
    
    return localDate;
  } catch (error) {
    console.error('DATEUTILS: Error creating date from string:', dateString, error);
    // Fallback
    return new Date();
  }
};

/**
 * Get time in 12-hour format
 * @param time - 24h time string (e.g., "14:30") or undefined
 * @returns formatted 12h time (e.g., "2:30 PM")
 */
export const formatTime = (time: string | undefined): string => {
  if (!time) {
    console.error('Error formatting time: undefined or empty time provided');
    return '';
  }

  // Handle if time is already in 12h format
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  
  try {
    // Convert from 24h format to 12h format
    const [hours, minutes] = time.split(':');
    const hoursNum = parseInt(hours, 10);
    
    if (isNaN(hoursNum) || !minutes) {
      throw new Error('Invalid time format');
    }
    
    const minutesStr = minutes.toString().padStart(2, '0');
    
    if (hoursNum === 0) {
      return `12:${minutesStr} AM`;
    } else if (hoursNum < 12) {
      return `${hoursNum}:${minutesStr} AM`;
    } else if (hoursNum === 12) {
      return `12:${minutesStr} PM`;
    } else {
      return `${hoursNum - 12}:${minutesStr} PM`;
    }
  } catch (error) {
    console.error(`Error formatting time: ${time}`, error);
    return time || '';
  }
};

/**
 * Combine a date string (YYYY-MM-DD) and a time string (HH:mm or HH:mm AM/PM) into a local Date object.
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);

  let hours = 0, minutes = 0;
  let period = '';
  let time = timeStr;

  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    [time, period] = timeStr.split(' ');
    [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  } else {
    [hours, minutes] = timeStr.split(':').map(Number);
  }

  // Construct a local date
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
} 
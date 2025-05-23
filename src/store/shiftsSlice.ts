import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Shift, ShiftTemplate } from '../types';

interface ShiftsState {
  shifts: Shift[];
  templates: ShiftTemplate[];
  selectedDate: string;
  error: string | null;
}

// Helper function to generate a unique ID
const generateUniqueId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

// Helper to get today's date in YYYY-MM-DD format using local time
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to clean date strings of any spaces and ensure YYYY-MM-DD format
const cleanDateString = (dateStr: string): string => {
  console.log(`cleanDateString called with: '${dateStr}'`);
  
  if (!dateStr) return '';
  
  // Remove any spaces
  const cleanedStr = dateStr.trim().replace(/\s+/g, '');
  
  // Handle ISO format with time (YYYY-MM-DDTHH:MM:SS.sssZ) - common when using toISOString()
  if (cleanedStr.includes('T')) {
    const datePart = cleanedStr.split('T')[0];
    console.log(`cleanDateString: extracted date part '${datePart}' from ISO string`);
    return datePart;
  }
  
  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(cleanedStr)) {
    console.log(`cleanDateString: already formatted correctly '${cleanedStr}'`);
    return cleanedStr;
  }
  
  // If format doesn't match, try to parse and reformat
  try {
    const parts = cleanedStr.split('-');
    if (parts.length === 3) {
      // Ensure parts are properly zero-padded
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      console.log(`cleanDateString: reformatted from parts to '${formatted}'`);
      return formatted;
    }
    
    // If we can't parse properly, create a date object and format it
    const date = new Date(cleanedStr);
    if (!isNaN(date.getTime())) {
      const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      console.log(`cleanDateString: created from Date object: '${formatted}'`);
      return formatted;
    }
  } catch (error) {
    console.error('Error cleaning date string:', dateStr, error);
  }
  
  // Return the cleaned string as a fallback
  console.log(`cleanDateString: could not format properly, returning cleaned string: '${cleanedStr}'`);
  return cleanedStr;
};

// Load shifts from localStorage
const loadShiftsFromStorage = (): Shift[] => {
  try {
    const storedShifts = localStorage.getItem('shifts');
    if (storedShifts) {
      return JSON.parse(storedShifts);
    }
  } catch (error) {
    console.error('Error loading shifts from localStorage:', error);
  }
  return [];
};

// Save shifts to localStorage
const saveShiftsToStorage = (shifts: Shift[]) => {
  try {
    localStorage.setItem('shifts', JSON.stringify(shifts));
  } catch (error) {
    console.error('Error saving shifts to localStorage:', error);
  }
};

// Load templates from localStorage
const loadTemplatesFromStorage = (): ShiftTemplate[] => {
  try {
    const storedTemplates = localStorage.getItem('shiftTemplates');
    if (storedTemplates) {
      return JSON.parse(storedTemplates);
    }
  } catch (error) {
    console.error('Error loading templates from localStorage:', error);
  }
  return [];
};

// Save templates to localStorage
const saveTemplatesToStorage = (templates: ShiftTemplate[]) => {
  try {
    localStorage.setItem('shiftTemplates', JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates to localStorage:', error);
  }
};

const initialState: ShiftsState = {
  shifts: loadShiftsFromStorage(),
  templates: loadTemplatesFromStorage(),
  selectedDate: getTodayDateString(),
  error: null
};

const shiftsSlice = createSlice({
  name: 'shifts',
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      // Log the incoming payload for debugging
      console.log('REDUX: setSelectedDate action received with payload:', action.payload);
      
      if (!action.payload) {
        console.error('REDUX: Empty date payload received in setSelectedDate!');
        return; // Don't update if empty payload
      }
      
      // Clean the date string to prevent extra spaces
      const cleanedDate = cleanDateString(action.payload);
      console.log('REDUX: Setting selected date in store to:', cleanedDate);
      
      // Verify the date format is valid
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(cleanedDate)) {
        console.error('REDUX: Invalid date format after cleaning:', cleanedDate);
        // Try to fix the date if possible
        try {
          const date = new Date(cleanedDate);
          if (!isNaN(date.getTime())) {
            // Use local time to avoid timezone issues
            const fixedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            console.log('REDUX: Fixed invalid date format to:', fixedDate);
            state.selectedDate = fixedDate;
            return;
          }
        } catch (error) {
          console.error('REDUX: Failed to fix invalid date format:', error);
        }
      }
      
      state.selectedDate = cleanedDate;
    },
    addShift: (state, action: PayloadAction<Shift>) => {
      // Use the existing ID if available, otherwise generate a new one
      const uniqueId = action.payload.id ? action.payload.id : generateUniqueId();
      
      // Create a completely new shift object to avoid reference issues
      const newShift: Shift = {
        id: uniqueId,
        employeeName: action.payload.employeeName,
        role: action.payload.role,
        date: cleanDateString(action.payload.date || state.selectedDate),
        startTime: action.payload.startTime,
        endTime: action.payload.endTime,
        timeRange: `${formatTime(action.payload.startTime)} - ${formatTime(action.payload.endTime)}`,
        status: action.payload.status || 'Confirmed',
        color: action.payload.color
      };
      
      console.log('Adding shift to store:', newShift);
      
      // Ensure we don't duplicate shifts with the same ID
      if (!state.shifts.some(shift => shift.id === newShift.id)) {
        state.shifts.push(newShift);
        saveShiftsToStorage(state.shifts);
      } else {
        console.warn('Attempted to add a shift with an ID that already exists:', newShift.id);
      }
    },
    updateShift: (state, action: PayloadAction<Shift>) => {
      const index = state.shifts.findIndex(shift => shift.id === action.payload.id);
      if (index !== -1) {
        // Create a completely new shift object
        const updatedShift: Shift = {
          id: action.payload.id,
          employeeName: action.payload.employeeName,
          role: action.payload.role,
          date: cleanDateString(action.payload.date || state.selectedDate),
          startTime: action.payload.startTime,
          endTime: action.payload.endTime,
          timeRange: `${formatTime(action.payload.startTime)} - ${formatTime(action.payload.endTime)}`,
          status: action.payload.status || 'Confirmed',
          color: action.payload.color
        };
        
        console.log('Updating shift with date:', updatedShift.date);
        state.shifts[index] = updatedShift;
        saveShiftsToStorage(state.shifts);
      }
    },
    deleteShift: (state, action: PayloadAction<string>) => {
      state.shifts = state.shifts.filter(shift => shift.id !== action.payload);
      saveShiftsToStorage(state.shifts);
    },
    clearShifts: (state) => {
      state.shifts = [];
      saveShiftsToStorage(state.shifts);
    },
    // Template related actions
    addTemplate: (state, action: PayloadAction<ShiftTemplate>) => {
      const template = {
        ...action.payload,
        id: action.payload.id || generateUniqueId()
      };
      state.templates.push(template);
      saveTemplatesToStorage(state.templates);
    },
    updateTemplate: (state, action: PayloadAction<ShiftTemplate>) => {
      const index = state.templates.findIndex(template => template.id === action.payload.id);
      if (index !== -1) {
        state.templates[index] = action.payload;
        saveTemplatesToStorage(state.templates);
      }
    },
    deleteTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(template => template.id !== action.payload);
      saveTemplatesToStorage(state.templates);
    },
    applyTemplate: (state, action: PayloadAction<{templateId: string, date: string, employeeName?: string}>) => {
      const template = state.templates.find(t => t.id === action.payload.templateId);
      if (template) {
        const shiftDate = cleanDateString(action.payload.date || state.selectedDate);
        const shift: Shift = {
          id: generateUniqueId(),
          employeeName: action.payload.employeeName || template.employeeName || '',
          role: template.role,
          date: shiftDate,
          startTime: template.startTime,
          endTime: template.endTime,
          timeRange: `${formatTime(template.startTime)} - ${formatTime(template.endTime)}`,
          status: template.status || 'Confirmed',
          color: template.color
        };
        state.shifts.push(shift);
        saveShiftsToStorage(state.shifts);
      }
    }
  }
});

// Helper function to format time (24h to 12h format)
const formatTime = (time: string): string => {
  // Handle if time is already in 12h format
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  
  try {
    // Convert from 24h format to 12h format
    const [hours, minutes] = time.split(':');
    const hoursNum = parseInt(hours, 10);
    const period = hoursNum >= 12 ? 'PM' : 'AM';
    const hours12 = hoursNum % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
  } catch (error) {
    console.error('Error formatting time in store:', time, error);
    return time; // Return original if format fails
  }
};

export const { 
  setSelectedDate, 
  addShift, 
  updateShift, 
  deleteShift, 
  clearShifts,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate
} = shiftsSlice.actions;
export default shiftsSlice.reducer; 
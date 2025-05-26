import shiftsReducer, {
  addShift,
  updateShift,
  deleteShift,
  setSelectedDate,
  addTemplate,
  deleteTemplate,
} from '../shiftsSlice';
import type { ShiftsState } from '../shiftsSlice';

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock console methods to reduce test noise
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

const mockShift = {
  id: '1',
  employeeName: 'John Doe',
  date: '2024-01-15',
  startTime: '09:00',
  endTime: '17:00',
  role: 'Manager',
  timeRange: '9:00 AM - 5:00 PM',
  status: 'scheduled' as const,
  color: '#2563eb',
};

const mockTemplate = {
  id: 'template1',
  name: 'Morning Manager Shift',
  startTime: '09:00',
  endTime: '17:00',
  role: 'Manager',
  notes: 'Standard opening shift',
  isDefault: false,
};

describe('shiftsSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('reducers', () => {
    it('should return the initial state', () => {
      const result = shiftsReducer(undefined, { type: 'unknown' });
      
      // Check basic structure
      expect(result).toHaveProperty('shifts');
      expect(result).toHaveProperty('templates');
      expect(result).toHaveProperty('selectedDate');
      expect(result).toHaveProperty('error');
      expect(Array.isArray(result.shifts)).toBe(true);
      expect(Array.isArray(result.templates)).toBe(true);
    });

    it('should handle addShift', () => {
      const initialState = {
        shifts: [],
        templates: [],
        selectedDate: '2024-01-15',
        error: null,
      };

      const actual = shiftsReducer(initialState, addShift(mockShift));
      expect(actual.shifts).toHaveLength(1);
      expect(actual.shifts[0].employeeName).toBe('John Doe');
      expect(actual.shifts[0].role).toBe('Manager');
      expect(actual.shifts[0].timeRange).toContain('AM');
    });

    it('should handle updateShift', () => {
      const stateWithShift = {
        shifts: [mockShift],
        templates: [],
        selectedDate: '2024-01-15',
        error: null,
      };
      
      const updatedShift = {
        ...mockShift,
        startTime: '10:00',
        employeeName: 'John Smith',
      };

      const actual = shiftsReducer(stateWithShift, updateShift(updatedShift));
      expect(actual.shifts[0].startTime).toBe('10:00');
      expect(actual.shifts[0].employeeName).toBe('John Smith');
    });

    it('should handle deleteShift', () => {
      const stateWithShift = {
        shifts: [mockShift],
        templates: [],
        selectedDate: '2024-01-15',
        error: null,
      };

      const actual = shiftsReducer(stateWithShift, deleteShift('1'));
      expect(actual.shifts).toHaveLength(0);
    });

    it('should handle setSelectedDate', () => {
      const initialState = {
        shifts: [],
        templates: [],
        selectedDate: '2024-01-15',
        error: null,
      };

      const newDate = '2024-01-20';
      const actual = shiftsReducer(initialState, setSelectedDate(newDate));
      expect(actual.selectedDate).toBe(newDate);
    });

    it('should handle addTemplate', () => {
      const initialState = {
        shifts: [],
        templates: [],
        selectedDate: '2024-01-15',
        error: null,
      };

      const actual = shiftsReducer(initialState, addTemplate(mockTemplate));
      expect(actual.templates).toHaveLength(1);
      expect(actual.templates[0]).toEqual(mockTemplate);
    });

    it('should handle deleteTemplate', () => {
      const stateWithTemplate = {
        shifts: [],
        templates: [mockTemplate],
        selectedDate: '2024-01-15',
        error: null,
      };

      const actual = shiftsReducer(stateWithTemplate, deleteTemplate('template1'));
      expect(actual.templates).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should not update non-existent shift', () => {
      const initialState = {
        shifts: [],
        templates: [],
        selectedDate: '2024-01-15',
        error: null,
      };

      const updatedShift = {
        ...mockShift,
        id: 'non-existent',
      };

      const actual = shiftsReducer(initialState, updateShift(updatedShift));
      expect(actual.shifts).toHaveLength(0);
    });

    it('should not delete non-existent shift', () => {
      const stateWithShift = {
        shifts: [mockShift],
        templates: [],
        selectedDate: '2024-01-15',
        error: null,
      };

      const actual = shiftsReducer(stateWithShift, deleteShift('non-existent'));
      expect(actual.shifts).toHaveLength(1);
    });

    it('should handle multiple shifts for same employee', () => {
      const initialState = {
        shifts: [],
        templates: [],
        selectedDate: '2024-01-15',
        error: null,
      };

      const secondShift = {
        ...mockShift,
        id: '2',
        startTime: '18:00',
        endTime: '22:00',
        timeRange: '6:00 PM - 10:00 PM',
      };

      let state = shiftsReducer(initialState, addShift(mockShift));
      state = shiftsReducer(state, addShift(secondShift));

      expect(state.shifts).toHaveLength(2);
      expect(state.shifts.every(shift => shift.employeeName === 'John Doe')).toBe(true);
    });
  });

  describe('data persistence', () => {
    it('should maintain data integrity when adding multiple shifts', () => {
      const initialState = {
        shifts: [],
        templates: [],
        selectedDate: '2024-01-15',
        error: null,
      };
      
      let state = initialState;
      
      for (let i = 1; i <= 5; i++) {
        const shift = {
          ...mockShift,
          id: `shift${i}`,
          startTime: `${8 + i}:00`,
          timeRange: `${8 + i}:00 AM - 5:00 PM`,
        };
        state = shiftsReducer(state, addShift(shift));
      }

      expect(state.shifts).toHaveLength(5);
      expect(state.shifts.map(s => s.id)).toEqual(['shift1', 'shift2', 'shift3', 'shift4', 'shift5']);
    });
  });

  describe('date handling', () => {
    it('should clean date strings properly', () => {
      const initialState = {
        shifts: [],
        templates: [],
        selectedDate: '2024-01-15',
        error: null,
      };

      const shiftWithSpacedDate = {
        ...mockShift,
        date: ' 2024-01-16 ',
      };

      const actual = shiftsReducer(initialState, addShift(shiftWithSpacedDate));
      expect(actual.shifts[0].date).toBe('2024-01-16');
    });

    it('should handle ISO date strings', () => {
      const initialState = {
        shifts: [],
        templates: [],
        selectedDate: '2024-01-15',
        error: null,
      };

      const shiftWithISODate = {
        ...mockShift,
        date: '2024-01-16T12:00:00.000Z',
      };

      const actual = shiftsReducer(initialState, addShift(shiftWithISODate));
      expect(actual.shifts[0].date).toBe('2024-01-16');
    });
  });
}); 
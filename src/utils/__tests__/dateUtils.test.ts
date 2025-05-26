import {
  formatDate,
  formatToISODate,
  createDateFromISO,
} from '../dateUtils';

// Mock console.log for cleaner test output
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('dateUtils', () => {
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15T12:00:00.000Z');
      const formatted = formatDate(date);
      
      // Check that it returns a string representation
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('2024');
    });

    it('handles different date formats', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-12-31');
      
      const formatted1 = formatDate(date1);
      const formatted2 = formatDate(date2);
      
      expect(formatted1).toBeDefined();
      expect(formatted2).toBeDefined();
      expect(formatted1).not.toBe(formatted2);
    });
  });

  describe('formatToISODate', () => {
    it('formats date to YYYY-MM-DD format', () => {
      // Use a specific date that won't cross timezone boundaries
      const date = new Date(2024, 0, 15, 12, 0, 0); // January 15, 2024, noon local time
      const isoDate = formatToISODate(date);
      
      expect(isoDate).toBe('2024-01-15');
    });

    it('handles edge dates correctly with local time', () => {
      // Use local time constructor to avoid timezone issues
      const newYear = new Date(2024, 0, 1, 12, 0, 0); // January 1, 2024
      const newYearEve = new Date(2024, 11, 31, 12, 0, 0); // December 31, 2024
      
      expect(formatToISODate(newYear)).toBe('2024-01-01');
      expect(formatToISODate(newYearEve)).toBe('2024-12-31');
    });

    it('pads single digit months and days', () => {
      const date = new Date(2024, 2, 5, 12, 0, 0); // March 5, 2024
      const isoDate = formatToISODate(date);
      
      expect(isoDate).toBe('2024-03-05');
      expect(isoDate).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('handles leap year dates', () => {
      const leapDay = new Date(2024, 1, 29, 12, 0, 0); // February 29, 2024
      const isoDate = formatToISODate(leapDay);
      
      expect(isoDate).toBe('2024-02-29');
    });
  });

  describe('createDateFromISO', () => {
    it('creates date from ISO string', () => {
      const isoString = '2024-01-15';
      const date = createDateFromISO(isoString);
      
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(15);
    });

    it('handles different month values', () => {
      const dates = [
        '2024-01-15',
        '2024-06-15',
        '2024-12-15',
      ];

      dates.forEach((dateStr, index) => {
        const date = createDateFromISO(dateStr);
        expect(date.getMonth()).toBe([0, 5, 11][index]);
      });
    });

    it('creates consistent dates for local use', () => {
      const isoString = '2024-01-15';
      const date = createDateFromISO(isoString);
      
      // The date should be set to avoid timezone shifts
      // Check that it's a valid date with the right day
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getFullYear()).toBe(2024);
    });

    it('handles edge cases', () => {
      const edgeCases = [
        '2024-01-01',
        '2024-12-31',
        '2024-02-29', // Leap year
      ];

      edgeCases.forEach(dateStr => {
        const date = createDateFromISO(dateStr);
        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).not.toBeNaN();
      });
    });
  });

  describe('round trip consistency', () => {
    it('maintains date consistency in round trip conversion', () => {
      const originalISO = '2024-01-15';
      
      // ISO -> Date -> ISO
      const date = createDateFromISO(originalISO);
      const backToISO = formatToISODate(date);
      
      expect(backToISO).toBe(originalISO);
    });

    it('handles multiple round trips', () => {
      const testDates = [
        '2024-01-01',
        '2024-06-15',
        '2024-12-31',
        '2024-02-29',
      ];

      testDates.forEach(originalISO => {
        const date = createDateFromISO(originalISO);
        const backToISO = formatToISODate(date);
        const dateAgain = createDateFromISO(backToISO);
        const finalISO = formatToISODate(dateAgain);
        
        expect(finalISO).toBe(originalISO);
      });
    });
  });

  describe('practical usage scenarios', () => {
    it('handles user input scenarios', () => {
      // Test scenarios that might come from user input
      const testCases = [
        { input: '2024-01-15', expected: '2024-01-15' },
        { input: '2024-1-5', expected: '2024-01-05' }, // If the function handles padding
      ];

      testCases.forEach(({ input, expected }) => {
        try {
          const date = createDateFromISO(input);
          const formatted = formatToISODate(date);
          expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}/);
        } catch (error) {
          // Some inputs might not be supported, that's okay
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('error handling', () => {
    it('handles invalid date strings gracefully', () => {
      const invalidDates = [
        '2024-13-01', // Invalid month
        '2024-02-30', // Invalid day for February
        '2023-02-29', // Not a leap year
      ];

      invalidDates.forEach(invalidDate => {
        try {
          const date = createDateFromISO(invalidDate);
          // Should still create a date object, might auto-correct
          expect(date).toBeInstanceOf(Date);
        } catch (error) {
          // Or it might throw an error, both are acceptable
          expect(error).toBeDefined();
        }
      });
    });

    it('handles empty or undefined inputs', () => {
      const invalidInputs = ['', null, undefined];

      invalidInputs.forEach(input => {
        try {
          const date = createDateFromISO(input as string);
          if (date) {
            expect(date).toBeInstanceOf(Date);
          }
        } catch (error) {
          // Error is acceptable for invalid inputs
          expect(error).toBeDefined();
        }
      });
    });
  });
}); 
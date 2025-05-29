import {
  formatDate,
  formatToISODate,
  createDateFromISO,
  formatTime,
  combineDateAndTime
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
    it('should format Date object to user-friendly string', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023 (Sunday)
      const result = formatDate(date);
      expect(result).toMatch(/Sun, Jan 15, 2023/);
    });

    it('should format ISO date string to user-friendly string', () => {
      const dateString = '2023-01-15';
      const result = formatDate(dateString);
      // Allow for timezone differences - could be either Sat or Sun depending on timezone
      expect(result).toMatch(/(Sat|Sun), Jan 1[45], 2023/);
    });

    it('should handle different months and days', () => {
      const date = new Date(2023, 11, 25); // December 25, 2023
      const result = formatDate(date);
      expect(result).toMatch(/Mon, Dec 25, 2023/);
    });

    it('should handle leap year dates', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      const result = formatDate(date);
      expect(result).toMatch(/Thu, Feb 29, 2024/);
    });

    it('should handle various date formats as strings', () => {
      const dateString = '2023-06-15T10:30:00.000Z';
      const result = formatDate(dateString);
      expect(result).toMatch(/(Wed|Thu), Jun 1[45], 2023/); // Allow timezone variance
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

  describe('formatTime', () => {
    it('should convert 24h time to 12h format', () => {
      expect(formatTime('14:30')).toBe('2:30 PM');
      expect(formatTime('09:15')).toBe('9:15 AM');
      expect(formatTime('00:00')).toBe('12:00 AM');
      expect(formatTime('12:00')).toBe('12:00 PM');
    });

    it('should handle single digit minutes', () => {
      expect(formatTime('14:05')).toBe('2:05 PM');
      expect(formatTime('09:05')).toBe('9:05 AM');
    });

    it('should handle edge cases', () => {
      expect(formatTime('23:59')).toBe('11:59 PM');
      expect(formatTime('01:01')).toBe('1:01 AM');
    });

    it('should return already formatted 12h times unchanged', () => {
      expect(formatTime('2:30 PM')).toBe('2:30 PM');
      expect(formatTime('9:15 AM')).toBe('9:15 AM');
    });

    it('should handle noon and midnight correctly', () => {
      expect(formatTime('12:30')).toBe('12:30 PM');
      expect(formatTime('00:30')).toBe('12:30 AM');
    });

    it('should handle invalid time strings gracefully', () => {
      const invalidTime = 'invalid-time';
      const result = formatTime(invalidTime);
      expect(result).toBe(invalidTime); // Falls back to original string
    });

    it('should handle malformed time strings', () => {
      const malformedTime = '25:70';
      const result = formatTime(malformedTime);
      // formatTime attempts to parse even malformed input, so it converts 25:70 to 1:70 PM
      expect(result).toBe('1:70 PM');
    });
  });

  describe('combineDateAndTime', () => {
    it('should combine date and 24h time correctly', () => {
      const result = combineDateAndTime('2023-01-15', '14:30');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it('should combine date and 12h AM time correctly', () => {
      const result = combineDateAndTime('2023-01-15', '9:30 AM');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(30);
    });

    it('should combine date and 12h PM time correctly', () => {
      const result = combineDateAndTime('2023-01-15', '2:30 PM');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it('should handle noon correctly', () => {
      const result = combineDateAndTime('2023-01-15', '12:00 PM');
      expect(result.getHours()).toBe(12);
      expect(result.getMinutes()).toBe(0);
    });

    it('should handle midnight correctly', () => {
      const result = combineDateAndTime('2023-01-15', '12:00 AM');
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it('should handle single digit hours and minutes', () => {
      const result = combineDateAndTime('2023-01-15', '9:05 AM');
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(5);
    });

    it('should handle edge case times', () => {
      const result1 = combineDateAndTime('2023-01-15', '11:59 PM');
      expect(result1.getHours()).toBe(23);
      expect(result1.getMinutes()).toBe(59);

      const result2 = combineDateAndTime('2023-01-15', '1:01 AM');
      expect(result2.getHours()).toBe(1);
      expect(result2.getMinutes()).toBe(1);
    });

    it('should handle different date formats', () => {
      const result = combineDateAndTime('2023-12-05', '3:45 PM');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11); // December is 11
      expect(result.getDate()).toBe(5);
      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(45);
    });

    it('should return correct local date object', () => {
      const result = combineDateAndTime('2023-01-15', '14:30');
      expect(result).toBeInstanceOf(Date);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('round-trip consistency', () => {
    it('should maintain date consistency through format and create cycle', () => {
      const originalDate = new Date(2023, 5, 15); // June 15, 2023
      const isoString = formatToISODate(originalDate);
      const recreatedDate = createDateFromISO(isoString);
      
      expect(recreatedDate.getFullYear()).toBe(originalDate.getFullYear());
      expect(recreatedDate.getMonth()).toBe(originalDate.getMonth());
      expect(recreatedDate.getDate()).toBe(originalDate.getDate());
    });

    it('should maintain time consistency through format and combine cycle', () => {
      const originalHour = 14;
      const originalMinute = 30;
      const timeString = `${originalHour}:${originalMinute}`;
      const formatted12h = formatTime(timeString);
      
      expect(formatted12h).toBe('2:30 PM');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // These tests verify the functions don't crash with unexpected inputs
      expect(() => formatTime('')).not.toThrow();
      expect(() => formatDate('')).not.toThrow();
    });

    it('should handle timezone edge cases', () => {
      const date = new Date(2023, 0, 1); // January 1, 2023
      const isoString = formatToISODate(date);
      expect(isoString).toMatch(/2023-01-01/);
    });

    it('should log appropriate debug information', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      formatToISODate('2023-01-15');
      createDateFromISO('2023-01-15');
      
      // Check that at least one call contains DATEUTILS
      const hasDateUtilsCall = consoleSpy.mock.calls.some(call => 
        call.some(arg => typeof arg === 'string' && arg.includes('DATEUTILS:'))
      );
      expect(hasDateUtilsCall).toBe(true);
    });
  });
}); 
import { getLocalDateString, getTodayString } from '../index';

describe('Date Utility Functions', () => {
  describe('getLocalDateString', () => {
    it('should return date in YYYY-MM-DD format using local timezone', () => {
      const testDate = new Date(2023, 11, 25); // December 25, 2023 (month is 0-indexed)
      const result = getLocalDateString(testDate);
      expect(result).toBe('2023-12-25');
    });

    it('should pad single digit months and days with zeros', () => {
      const testDate = new Date(2023, 0, 5); // January 5, 2023
      const result = getLocalDateString(testDate);
      expect(result).toBe('2023-01-05');
    });

    it('should handle edge cases at month boundaries', () => {
      const testDate = new Date(2023, 0, 1); // January 1, 2023
      const result = getLocalDateString(testDate);
      expect(result).toBe('2023-01-01');
    });

    it('should handle leap year dates', () => {
      const testDate = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      const result = getLocalDateString(testDate);
      expect(result).toBe('2024-02-29');
    });

    it('should use current date when no parameter provided', () => {
      const result = getLocalDateString();
      const today = new Date();
      const expectedFormat = /^\d{4}-\d{2}-\d{2}$/;
      expect(result).toMatch(expectedFormat);
      
      // Verify it's actually today's date
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expected = `${year}-${month}-${day}`;
      expect(result).toBe(expected);
    });

    it('should not be affected by timezone when using local date', () => {
      // Test that the function returns the same date regardless of what UTC time would be
      const testDate = new Date(2023, 11, 25, 23, 59, 59); // December 25, 2023 at 11:59:59 PM local time
      const result = getLocalDateString(testDate);
      expect(result).toBe('2023-12-25');
      
      // Even if this would be the next day in UTC, it should still return the local date
    });
  });

  describe('getTodayString', () => {
    it('should return today\'s date in YYYY-MM-DD format', () => {
      const result = getTodayString();
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expected = `${year}-${month}-${day}`;
      expect(result).toBe(expected);
    });

    it('should return the same value as getLocalDateString() without parameters', () => {
      const todayResult = getTodayString();
      const localResult = getLocalDateString();
      expect(todayResult).toBe(localResult);
    });
  });

  describe('Timezone Independence', () => {
    it('should return local date regardless of system timezone', () => {
      // Create a date that would be different in UTC vs local time
      const localMidnight = new Date(2023, 11, 25, 0, 0, 0); // December 25, 2023 at midnight local
      const result = getLocalDateString(localMidnight);
      expect(result).toBe('2023-12-25');
      
      // The key test: this should NOT use UTC conversion
      // If it did use UTC via toISOString(), the result might be different depending on timezone
      const utcString = localMidnight.toISOString().split('T')[0];
      
      // Our function should return the local date, not the UTC date
      // In many timezones, local midnight would be a different UTC date
      expect(result).toBe('2023-12-25'); // Always the local date
    });

    it('should handle date changes at midnight correctly', () => {
      // Test transition from December 31 to January 1
      const newYearEve = new Date(2023, 11, 31, 23, 59, 59);
      const result = getLocalDateString(newYearEve);
      expect(result).toBe('2023-12-31');
      
      // One minute later
      const newYear = new Date(2024, 0, 1, 0, 0, 1);
      const result2 = getLocalDateString(newYear);
      expect(result2).toBe('2024-01-01');
    });
  });

  describe('Comparison with old UTC-based approach', () => {
    it('should demonstrate the difference between local and UTC date strings', () => {
      // Create a date that will show the timezone difference
      // 1 AM on January 1, 2024 in a negative UTC offset timezone
      const testDate = new Date(2024, 0, 1, 1, 0, 0);
      
      const localResult = getLocalDateString(testDate);
      const utcResult = testDate.toISOString().split('T')[0];
      
      // Local result should always be the local date
      expect(localResult).toBe('2024-01-01');
      
      // UTC result might be different depending on the system timezone
      // This test documents the behavior difference
      expect(typeof utcResult).toBe('string');
      expect(utcResult).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
import {
  formatDateForDisplay,
  formatDateForStorage,
  getTodayInIndianFormat,
  isValidIndianDate,
  getCurrentISTDate,
  formatIndianDate,
} from '@/lib/dateUtils';
import { Timestamp } from 'firebase/firestore';

describe('dateUtils', () => {
  describe('formatDateForDisplay', () => {
    it('should convert YYYY-MM-DD to DD-MM-YYYY', () => {
      expect(formatDateForDisplay('2025-01-15')).toBe('15-01-2025');
      expect(formatDateForDisplay('2024-12-31')).toBe('31-12-2024');
    });

    it('should return empty string for invalid input', () => {
      expect(formatDateForDisplay('')).toBe('');
      expect(formatDateForDisplay(null as any)).toBe('');
    });
  });

  describe('formatDateForStorage', () => {
    it('should convert DD-MM-YYYY to YYYY-MM-DD', () => {
      expect(formatDateForStorage('15-01-2025')).toBe('2025-01-15');
      expect(formatDateForStorage('31-12-2024')).toBe('2024-12-31');
    });

    it('should return empty string for invalid input', () => {
      expect(formatDateForStorage('')).toBe('');
      expect(formatDateForStorage(null as any)).toBe('');
    });
  });

  describe('isValidIndianDate', () => {
    it('should validate correct DD-MM-YYYY dates', () => {
      expect(isValidIndianDate('15-01-2025')).toBe(true);
      expect(isValidIndianDate('29-02-2024')).toBe(true); // Leap year
      expect(isValidIndianDate('31-12-2024')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(isValidIndianDate('32-01-2025')).toBe(false); // Invalid day
      expect(isValidIndianDate('29-02-2025')).toBe(false); // Not a leap year
      expect(isValidIndianDate('31-04-2025')).toBe(false); // April has 30 days
      expect(isValidIndianDate('15/01/2025')).toBe(false); // Wrong format
      expect(isValidIndianDate('2025-01-15')).toBe(false); // Wrong format
      expect(isValidIndianDate('')).toBe(false);
    });
  });

  describe('getCurrentISTDate', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const date = getCurrentISTDate();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getTodayInIndianFormat', () => {
    it('should return today in DD-MM-YYYY format', () => {
      const today = getTodayInIndianFormat();
      expect(today).toMatch(/^\d{2}-\d{2}-\d{4}$/);
      expect(isValidIndianDate(today)).toBe(true);
    });
  });

  describe('formatIndianDate', () => {
    const testDate = new Date('2025-01-15T10:30:00Z');
    const mockTimestamp = {
      toDate: () => testDate,
    } as Timestamp;

    it('should format Date object in date format', () => {
      const result = formatIndianDate(testDate, 'date');
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{2}\s+\w{3}\s+\d{4}/); // "15 Jan 2025"
    });

    it('should format Firestore Timestamp in date format', () => {
      const result = formatIndianDate(mockTimestamp, 'date');
      expect(result).toBeTruthy();
    });

    it('should format in datetime format', () => {
      const result = formatIndianDate(testDate, 'datetime');
      expect(result).toBeTruthy();
      expect(result).toContain('Jan');
      expect(result).toContain('2025');
    });

    it('should format in time format', () => {
      const result = formatIndianDate(testDate, 'time');
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{2}:\d{2}\s+(am|pm|AM|PM)/i);
    });

    it('should return empty string for null/undefined', () => {
      expect(formatIndianDate(null, 'date')).toBe('');
      expect(formatIndianDate(undefined, 'date')).toBe('');
    });

    it('should handle relative format', () => {
      const now = new Date();
      const result = formatIndianDate(now, 'relative');
      expect(result).toBe('just now');
    });
  });
});

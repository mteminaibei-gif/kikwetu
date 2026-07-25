import { describe, it, expect } from 'vitest';
import { formatNumber, getInitials } from './utils';

describe('utils', () => {
  describe('formatNumber', () => {
    it('formats numbers less than 1000 correctly', () => {
      expect(formatNumber(999)).toBe('999');
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(undefined)).toBe('0');
    });

    it('formats thousands correctly', () => {
      expect(formatNumber(1500)).toBe('1.5k');
      expect(formatNumber(10000)).toBe('10k');
    });
  });

  describe('getInitials', () => {
    it('returns first letters of name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('handles single word names', () => {
      expect(getInitials('Alice')).toBe('A');
    });

    it('handles missing names', () => {
      expect(getInitials(undefined)).toBe('?');
    });
  });
});

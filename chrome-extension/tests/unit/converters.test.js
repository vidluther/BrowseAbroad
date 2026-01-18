import { describe, it, expect, beforeEach } from 'vitest';
import { loadConverters } from '../helpers/load-module.js';

describe('Converters', () => {
  let Converters;

  beforeEach(() => {
    Converters = loadConverters();
  });

  describe('convertCurrency', () => {
    const rates = { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79 };

    it('should return same amount when from === to', () => {
      expect(Converters.convertCurrency(100, 'USD', 'USD', rates)).toBe(100);
      expect(Converters.convertCurrency(1000, 'INR', 'INR', rates)).toBe(1000);
    });

    it('should convert USD to INR correctly', () => {
      const result = Converters.convertCurrency(100, 'USD', 'INR', rates);
      expect(result).toBe(8350);
    });

    it('should convert INR to USD correctly', () => {
      const result = Converters.convertCurrency(8350, 'INR', 'USD', rates);
      expect(result).toBeCloseTo(100, 2);
    });

    it('should handle conversion between non-USD currencies (through USD)', () => {
      // INR -> EUR: 83.5 INR = 1 USD, 1 USD = 0.92 EUR
      const result = Converters.convertCurrency(83.5, 'INR', 'EUR', rates);
      expect(result).toBeCloseTo(0.92, 2);
    });

    it('should handle zero amount', () => {
      expect(Converters.convertCurrency(0, 'USD', 'INR', rates)).toBe(0);
    });

    it('should handle very small amounts', () => {
      const result = Converters.convertCurrency(0.01, 'USD', 'INR', rates);
      expect(result).toBeCloseTo(0.835, 3);
    });

    it('should handle very large amounts', () => {
      const result = Converters.convertCurrency(1000000, 'USD', 'INR', rates);
      expect(result).toBe(83500000);
    });

    it('should handle decimal precision correctly', () => {
      const result = Converters.convertCurrency(99.99, 'INR', 'USD', rates);
      expect(result).toBeCloseTo(1.197, 2);
    });

    it('should convert from non-USD to USD', () => {
      const result = Converters.convertCurrency(167, 'INR', 'USD', rates);
      expect(result).toBeCloseTo(2, 1);
    });

    it('should convert from USD to non-USD', () => {
      const result = Converters.convertCurrency(2, 'USD', 'INR', rates);
      expect(result).toBe(167);
    });
  });

  describe('formatCurrency', () => {
    it('should format USD with $ symbol', () => {
      expect(Converters.formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
    });

    it('should format INR with ₹ symbol and Indian locale', () => {
      // Indian locale uses lakhs grouping: ₹12,34,567.89
      expect(Converters.formatCurrency(1234567.89, 'INR')).toBe('₹12,34,567.89');
    });

    it('should format INR small amounts correctly', () => {
      expect(Converters.formatCurrency(999, 'INR')).toBe('₹999.00');
    });

    it('should format USD small amounts correctly', () => {
      expect(Converters.formatCurrency(50, 'USD')).toBe('$50.00');
    });

    it('should handle unknown currency codes with currency prefix', () => {
      const result = Converters.formatCurrency(100, 'GBP');
      expect(result).toContain('GBP');
      expect(result).toContain('100.00');
    });

    it('should always show 2 decimal places', () => {
      expect(Converters.formatCurrency(100, 'USD')).toBe('$100.00');
      expect(Converters.formatCurrency(100.1, 'USD')).toBe('$100.10');
      expect(Converters.formatCurrency(100.123, 'USD')).toBe('$100.12');
    });

    it('should handle zero', () => {
      expect(Converters.formatCurrency(0, 'USD')).toBe('$0.00');
      expect(Converters.formatCurrency(0, 'INR')).toBe('₹0.00');
    });

    it('should format large INR amounts with proper lakhs separator', () => {
      expect(Converters.formatCurrency(100000, 'INR')).toBe('₹1,00,000.00');
    });
  });

  describe('convertUnits', () => {
    it('should convert cm to inches', () => {
      const result = Converters.convertUnits(100, 'cm', 'inches');
      expect(result).toBeCloseTo(39.37, 1);
    });

    it('should convert inches to cm', () => {
      const result = Converters.convertUnits(10, 'inches', 'cm');
      expect(result).toBeCloseTo(25.4, 1);
    });

    it('should convert m to feet', () => {
      const result = Converters.convertUnits(1, 'm', 'feet');
      expect(result).toBeCloseTo(3.28, 2);
    });

    it('should convert feet to m', () => {
      const result = Converters.convertUnits(10, 'feet', 'm');
      expect(result).toBeCloseTo(3.048, 3);
    });

    it('should convert kg to lbs', () => {
      const result = Converters.convertUnits(1, 'kg', 'lbs');
      expect(result).toBeCloseTo(2.205, 2);
    });

    it('should convert lbs to kg', () => {
      const result = Converters.convertUnits(10, 'lbs', 'kg');
      expect(result).toBeCloseTo(4.536, 2);
    });

    it('should return original value for unknown conversion', () => {
      expect(Converters.convertUnits(100, 'unknown', 'other')).toBe(100);
    });

    it('should handle zero values', () => {
      expect(Converters.convertUnits(0, 'cm', 'inches')).toBe(0);
    });

    it('should handle conversion with same units', () => {
      // No direct same-unit mapping, so returns original value
      expect(Converters.convertUnits(100, 'cm', 'cm')).toBe(100);
    });
  });

  describe('formatUnit', () => {
    it('should format cm with correct label', () => {
      expect(Converters.formatUnit(25.4, 'cm')).toBe('25.40 cm');
    });

    it('should format inches with "in" label', () => {
      expect(Converters.formatUnit(10, 'inches')).toBe('10.00 in');
    });

    it('should format m with correct label', () => {
      expect(Converters.formatUnit(1.5, 'm')).toBe('1.50 m');
    });

    it('should format feet with "ft" label', () => {
      expect(Converters.formatUnit(5.5, 'feet')).toBe('5.50 ft');
    });

    it('should format kg correctly', () => {
      expect(Converters.formatUnit(75.5, 'kg')).toBe('75.50 kg');
    });

    it('should format lbs correctly', () => {
      expect(Converters.formatUnit(165.3, 'lbs')).toBe('165.30 lbs');
    });

    it('should handle unknown unit types with original unit name', () => {
      expect(Converters.formatUnit(100, 'miles')).toBe('100.00 miles');
    });

    it('should always show 2 decimal places', () => {
      expect(Converters.formatUnit(10, 'cm')).toBe('10.00 cm');
      expect(Converters.formatUnit(10.1, 'cm')).toBe('10.10 cm');
    });

    it('should handle zero values', () => {
      expect(Converters.formatUnit(0, 'kg')).toBe('0.00 kg');
    });
  });
});

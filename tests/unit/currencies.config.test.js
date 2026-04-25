import { describe, it, expect, beforeEach } from 'vitest';
import { loadWindowModule } from '../helpers/load-module.js';

describe('CurrenciesConfig', () => {
  let SUPPORTED_CURRENCIES, LOCALE_CURRENCY_MAP, getDefaultHomeCurrency;

  beforeEach(() => {
    const window = loadWindowModule('src/config/currencies.config.js');
    SUPPORTED_CURRENCIES = window.SUPPORTED_CURRENCIES;
    LOCALE_CURRENCY_MAP = window.LOCALE_CURRENCY_MAP;
    getDefaultHomeCurrency = window.getDefaultHomeCurrency;
  });

  describe('SUPPORTED_CURRENCIES', () => {
    it('should define USD, INR, EUR, GBP', () => {
      expect(SUPPORTED_CURRENCIES).toBeDefined();
      expect(Object.keys(SUPPORTED_CURRENCIES)).toEqual(
        expect.arrayContaining(['USD', 'INR', 'EUR', 'GBP'])
      );
      expect(Object.keys(SUPPORTED_CURRENCIES).length).toBe(4);
    });

    it('should have required fields for each currency', () => {
      Object.values(SUPPORTED_CURRENCIES).forEach(currency => {
        expect(currency.symbol).toBeDefined();
        expect(currency.code).toBeDefined();
        expect(currency.name).toBeDefined();
        expect(currency.locale).toBeDefined();
        expect(currency.detectPatterns).toBeDefined();
        expect(Array.isArray(currency.detectPatterns)).toBe(true);
        expect(currency.detectPatterns.length).toBeGreaterThan(0);
      });
    });

    it('should have correct symbols', () => {
      expect(SUPPORTED_CURRENCIES.USD.symbol).toBe('$');
      expect(SUPPORTED_CURRENCIES.INR.symbol).toBe('₹');
      expect(SUPPORTED_CURRENCIES.EUR.symbol).toBe('€');
      expect(SUPPORTED_CURRENCIES.GBP.symbol).toBe('£');
    });
  });

  describe('LOCALE_CURRENCY_MAP', () => {
    it('should map US to USD', () => {
      expect(LOCALE_CURRENCY_MAP['US']).toBe('USD');
    });

    it('should map GB to GBP', () => {
      expect(LOCALE_CURRENCY_MAP['GB']).toBe('GBP');
    });

    it('should map IN to INR', () => {
      expect(LOCALE_CURRENCY_MAP['IN']).toBe('INR');
    });

    it('should map eurozone countries to EUR', () => {
      ['DE', 'FR', 'ES', 'IT', 'NL', 'AT', 'BE', 'PT', 'IE', 'FI'].forEach(code => {
        expect(LOCALE_CURRENCY_MAP[code]).toBe('EUR');
      });
    });
  });

  describe('getDefaultHomeCurrency', () => {
    it('should return USD for en-US locale', () => {
      expect(getDefaultHomeCurrency('en-US')).toBe('USD');
    });

    it('should return GBP for en-GB locale', () => {
      expect(getDefaultHomeCurrency('en-GB')).toBe('GBP');
    });

    it('should return INR for hi-IN locale', () => {
      expect(getDefaultHomeCurrency('hi-IN')).toBe('INR');
    });

    it('should return EUR for de-DE locale', () => {
      expect(getDefaultHomeCurrency('de-DE')).toBe('EUR');
    });

    it('should return USD as fallback for unknown locale', () => {
      expect(getDefaultHomeCurrency('xx-YY')).toBe('USD');
    });

    it('should return USD for locale without country code', () => {
      expect(getDefaultHomeCurrency('en')).toBe('USD');
    });
  });
});

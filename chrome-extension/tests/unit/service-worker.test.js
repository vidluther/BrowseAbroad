import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Service Worker', () => {
  let fetchRatesFromAPI, getCachedRates, getExchangeRates, cacheRates;
  let originalFetch;
  let mockFetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Create mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Load service worker code in a fresh context
    const code = fs.readFileSync(
      path.resolve(__dirname, '../../src/background/service-worker.js'),
      'utf-8'
    );

    // Create function from code to extract the functions
    // We need to modify how we evaluate to capture the functions
    const context = {
      chrome: global.chrome,
      fetch: mockFetch,
      console: {
        error: vi.fn(),
        warn: vi.fn(),
        log: vi.fn()
      },
      Date: global.Date
    };

    // Extract functions by evaluating in a module-like context
    const wrappedCode = `
      ${code}
      return { fetchRatesFromAPI, getCachedRates, getExchangeRates, cacheRates };
    `;

    const fn = new Function('chrome', 'fetch', 'console', 'Date', wrappedCode);
    const exports = fn(context.chrome, mockFetch, context.console, global.Date);

    fetchRatesFromAPI = exports.fetchRatesFromAPI;
    getCachedRates = exports.getCachedRates;
    getExchangeRates = exports.getExchangeRates;
    cacheRates = exports.cacheRates;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('fetchRatesFromAPI', () => {
    it('should fetch rates and return structured response', async () => {
      const mockRates = { USD: 1, INR: 83.5, EUR: 0.92 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ rates: mockRates, base: 'USD' })
      });

      const result = await fetchRatesFromAPI();

      expect(result.rates).toEqual(mockRates);
      expect(result.base).toBe('USD');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });

    it('should throw on non-OK response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(fetchRatesFromAPI()).rejects.toThrow('API responded with status 500');
    });

    it('should throw on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchRatesFromAPI()).rejects.toThrow('Network error');
    });

    it('should call correct API URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ rates: {}, base: 'USD' })
      });

      await fetchRatesFromAPI();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );
    });

    it('should include timestamp in response', async () => {
      const before = Date.now();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ rates: { USD: 1 }, base: 'USD' })
      });

      const result = await fetchRatesFromAPI();
      const after = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('getCachedRates', () => {
    it('should return cached rates if valid (within 24h)', async () => {
      const cachedData = {
        rates: { USD: 1, INR: 83.0 },
        timestamp: Date.now() - (1 * 60 * 60 * 1000) // 1 hour ago
      };

      global.chrome.storage.local.get.mockResolvedValue({ exchangeRates: cachedData });

      const result = await getCachedRates();

      expect(result).toEqual(cachedData);
    });

    it('should return null if cache is expired (over 24h)', async () => {
      const cachedData = {
        rates: { USD: 1, INR: 83.0 },
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      global.chrome.storage.local.get.mockResolvedValue({ exchangeRates: cachedData });

      const result = await getCachedRates();

      expect(result).toBeNull();
    });

    it('should return null if no cache exists', async () => {
      global.chrome.storage.local.get.mockResolvedValue({});

      const result = await getCachedRates();

      expect(result).toBeNull();
    });

    it('should return null if cache has no timestamp', async () => {
      global.chrome.storage.local.get.mockResolvedValue({
        exchangeRates: { rates: { USD: 1 } }
      });

      const result = await getCachedRates();

      expect(result).toBeNull();
    });

    it('should handle storage errors gracefully and return null', async () => {
      global.chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const result = await getCachedRates();

      expect(result).toBeNull();
    });

    it('should return cache if exactly at 24h boundary', async () => {
      const cachedData = {
        rates: { USD: 1, INR: 83.0 },
        timestamp: Date.now() - (24 * 60 * 60 * 1000) + 1000 // Just under 24 hours
      };

      global.chrome.storage.local.get.mockResolvedValue({ exchangeRates: cachedData });

      const result = await getCachedRates();

      expect(result).toEqual(cachedData);
    });
  });

  describe('cacheRates', () => {
    it('should save rates to chrome storage', async () => {
      const ratesData = {
        rates: { USD: 1, INR: 84.0 },
        timestamp: Date.now()
      };

      await cacheRates(ratesData);

      expect(global.chrome.storage.local.set).toHaveBeenCalledWith({
        exchangeRates: ratesData
      });
    });

    it('should handle storage errors gracefully', async () => {
      global.chrome.storage.local.set.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(cacheRates({ rates: {} })).resolves.toBeUndefined();
    });
  });

  describe('getExchangeRates', () => {
    it('should return cached rates when valid and not forcing refresh', async () => {
      const cachedData = {
        rates: { USD: 1, INR: 83.0 },
        timestamp: Date.now() - (1 * 60 * 60 * 1000)
      };
      global.chrome.storage.local.get.mockResolvedValue({ exchangeRates: cachedData });

      const result = await getExchangeRates(false);

      expect(result).toEqual(cachedData);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch fresh rates when forceRefresh is true', async () => {
      const cachedData = {
        rates: { USD: 1, INR: 83.0 },
        timestamp: Date.now()
      };
      global.chrome.storage.local.get.mockResolvedValue({ exchangeRates: cachedData });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ rates: { USD: 1, INR: 84.0 }, base: 'USD' })
      });

      const result = await getExchangeRates(true);

      expect(mockFetch).toHaveBeenCalled();
      expect(result.rates.INR).toBe(84.0);
    });

    it('should fetch and cache rates when cache is expired', async () => {
      const expiredData = {
        rates: { USD: 1, INR: 82.0 },
        timestamp: Date.now() - (25 * 60 * 60 * 1000)
      };
      global.chrome.storage.local.get.mockResolvedValue({ exchangeRates: expiredData });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ rates: { USD: 1, INR: 85.0 }, base: 'USD' })
      });

      await getExchangeRates();

      expect(mockFetch).toHaveBeenCalled();
      expect(global.chrome.storage.local.set).toHaveBeenCalled();
    });

    it('should fetch rates when no cache exists', async () => {
      global.chrome.storage.local.get.mockResolvedValue({});

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ rates: { USD: 1, INR: 83.5 }, base: 'USD' })
      });

      const result = await getExchangeRates();

      expect(mockFetch).toHaveBeenCalled();
      expect(result.rates.INR).toBe(83.5);
    });

    it('should use default forceRefresh=false', async () => {
      const cachedData = {
        rates: { USD: 1, INR: 83.0 },
        timestamp: Date.now()
      };
      global.chrome.storage.local.get.mockResolvedValue({ exchangeRates: cachedData });

      const result = await getExchangeRates();

      expect(result).toEqual(cachedData);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should propagate API errors', async () => {
      global.chrome.storage.local.get.mockResolvedValue({});
      mockFetch.mockRejectedValue(new Error('API unavailable'));

      await expect(getExchangeRates()).rejects.toThrow('API unavailable');
    });
  });
});

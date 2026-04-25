/**
 * Background Service Worker
 * Handles exchange rate fetching and caching
 */

const RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch exchange rates from API
 * @returns {Promise<object>} Exchange rates with USD as base
 */
async function fetchRatesFromAPI() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(RATE_API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    const data = await response.json();
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid API response: missing rates object');
    }
    return {
      rates: data.rates,
      timestamp: Date.now(),
      base: data.base || 'USD'
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Currency Converter: Failed to fetch rates', error);
    throw error;
  }
}

/**
 * Get cached rates if still valid
 * @returns {Promise<object|null>} Cached rates or null
 */
async function getCachedRates() {
  try {
    const result = await chrome.storage.local.get(['exchangeRates']);
    const cached = result.exchangeRates;

    if (cached && cached.timestamp) {
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_DURATION_MS) {
        return cached;
      }
    }
  } catch (error) {
    console.warn('Currency Converter: Error reading cache', error);
  }
  return null;
}

/**
 * Save rates to cache
 * @param {object} ratesData - Rates data to cache
 */
async function cacheRates(ratesData) {
  try {
    await chrome.storage.local.set({ exchangeRates: ratesData });
  } catch (error) {
    console.warn('Currency Converter: Error caching rates', error);
  }
}

/**
 * Get exchange rates (from cache or API)
 * @param {boolean} forceRefresh - Force fetching new rates
 * @returns {Promise<object>} Exchange rates
 */
async function getExchangeRates(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await getCachedRates();
    if (cached) {
      return cached;
    }
  }

  const freshRates = await fetchRatesFromAPI();
  await cacheRates(freshRates);

  return freshRates;
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getExchangeRates') {
    getExchangeRates(message.forceRefresh)
      .then(data => {
        sendResponse({ rates: data.rates, timestamp: data.timestamp });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (message.action === 'refreshRates') {
    getExchangeRates(true)
      .then(data => {
        sendResponse({ success: true, rates: data.rates });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

// Fetch initial rates on install
chrome.runtime.onInstalled.addListener(() => {
  getExchangeRates().catch(console.error);
});

/**
 * Currency configuration
 * Central source of truth for all supported currencies
 */

const SUPPORTED_CURRENCIES = {
  USD: {
    symbol: '$',
    code: 'USD',
    name: 'US Dollar',
    locale: 'en-US',
    detectPatterns: [
      /(?<![A-Z])\$\s*([\d,]+(?:\.\d{1,2})?)/g,
      /USD\s*([\d,]+(?:\.\d{1,2})?)/gi,
      /US\$\s*([\d,]+(?:\.\d{1,2})?)/gi
    ]
  },
  INR: {
    symbol: '₹',
    code: 'INR',
    name: 'Indian Rupee',
    locale: 'en-IN',
    detectPatterns: [
      /₹\s*([\d,]+(?:\.\d{1,2})?)/g,
      /\bRs\.?\s*([\d,]+(?:\.\d{1,2})?)/gi,
      /INR\s*([\d,]+(?:\.\d{1,2})?)/gi
    ]
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    name: 'Euro',
    locale: 'de-DE',
    detectPatterns: [
      /€\s*([\d,]+(?:\.\d{1,2})?)/g,
      /EUR\s*([\d,]+(?:\.\d{1,2})?)/gi
    ]
  },
  GBP: {
    symbol: '£',
    code: 'GBP',
    name: 'British Pound',
    locale: 'en-GB',
    detectPatterns: [
      /£\s*([\d,]+(?:\.\d{1,2})?)/g,
      /GBP\s*([\d,]+(?:\.\d{1,2})?)/gi
    ]
  }
};

const LOCALE_CURRENCY_MAP = {
  'US': 'USD',
  'GB': 'GBP',
  'IN': 'INR',
  'DE': 'EUR',
  'FR': 'EUR',
  'ES': 'EUR',
  'IT': 'EUR',
  'NL': 'EUR',
  'AT': 'EUR',
  'BE': 'EUR',
  'PT': 'EUR',
  'IE': 'EUR',
  'FI': 'EUR'
};

/**
 * Get the default home currency based on browser locale
 * @param {string} locale - Browser locale string (e.g., 'en-US')
 * @returns {string} Currency code (e.g., 'USD')
 */
function getDefaultHomeCurrency(locale) {
  if (!locale || !locale.includes('-')) return 'USD';
  const countryCode = locale.split('-').pop().toUpperCase();
  return LOCALE_CURRENCY_MAP[countryCode] || 'USD';
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SUPPORTED_CURRENCIES = SUPPORTED_CURRENCIES;
  window.LOCALE_CURRENCY_MAP = LOCALE_CURRENCY_MAP;
  window.getDefaultHomeCurrency = getDefaultHomeCurrency;
}

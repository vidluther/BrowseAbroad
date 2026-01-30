# Multi-Currency Support Design

## Summary

Transform BrowseAbroad from a hardcoded USD/INR converter into a multi-currency tool. Users pick a home currency; the extension detects prices in USD, EUR, GBP, and INR on web pages and converts them to the home currency on hover.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Home currency model | Single home currency | Simplest mental model: "show me everything in my currency" |
| Detected currencies | USD, INR, EUR, GBP (4 total) | Prove architecture first, expand later |
| `$` ambiguity | Always USD | Unambiguous within the 4-currency set. GitHub issue #15 tracks future configurability |
| Manual rate feature | Removed | Complexity not worth it across multiple pairs. Revisit if users request it |
| Default home currency | Browser locale detection, fallback to USD | Zero-friction onboarding |
| Tooltip behavior | Show home currency conversion only | Keep tooltip fast and simple |

## Architecture Overview

| Layer | Current | New |
|-------|---------|-----|
| Service worker | Stores only INR rate | Stores full rates object from API |
| Storage | `enabled`, `useManualRate`, `manualRate` | `enabled`, `homeCurrency` |
| Detector | Regex for `$`, `Rs`, `INR`, `USD` | Add `EUR`, `GBP` patterns |
| Converters | Hardcoded USD/INR symbols and locales | Currency config map + `Intl.NumberFormat` |
| Content script | Converts USD<>INR only | Converts any detected currency to home currency |
| Popup | "1 USD = X INR", manual rate toggle | Home currency dropdown, multi-row rate table |
| Tooltip | USD<>INR conversion | Detected currency to home currency |

Unchanged: API endpoint, cache duration (24h), tooltip positioning, price detection DOM wrapping, MutationObserver, manifest permissions.

## Currency Configuration

New file: `src/config/currencies.config.js`

Central config object replaces scattered hardcoded values. Each entry contains the currency code, symbol, display name, locale, and detection regex patterns.

```javascript
const SUPPORTED_CURRENCIES = {
  USD: {
    symbol: '$',
    code: 'USD',
    name: 'US Dollar',
    locale: 'en-US',
    detectPatterns: [
      /(?<![A-Z])\$\s*([\d,]+(?:\.\d{1,2})?)/g,
      /USD\s*([\d,]+(?:\.\d{1,2})?)/gi,
      /US\$\s*([\d,]+(?:\.\d{1,2})?)/gi,
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
      /INR\s*([\d,]+(?:\.\d{1,2})?)/gi,
    ]
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    name: 'Euro',
    locale: 'de-DE',
    detectPatterns: [
      /€\s*([\d,]+(?:\.\d{1,2})?)/g,
      /EUR\s*([\d,]+(?:\.\d{1,2})?)/gi,
    ]
  },
  GBP: {
    symbol: '£',
    code: 'GBP',
    name: 'British Pound',
    locale: 'en-GB',
    detectPatterns: [
      /£\s*([\d,]+(?:\.\d{1,2})?)/g,
      /GBP\s*([\d,]+(?:\.\d{1,2})?)/gi,
    ]
  }
};
```

Adding a new currency later means adding one entry here. No other files need structural changes.

The home currency dropdown in the popup lists all currencies from the API response (150+), not just these 4. This config only governs which currencies are detected on pages.

## Detector Changes

- Imports `SUPPORTED_CURRENCIES` and builds combined regex dynamically from all `detectPatterns`.
- When a match is found, identifies which currency it belongs to and sets `data-currency` accordingly.
- Skips prices matching the user's home currency (read from storage at init).
- Structured price selectors (Amazon `.a-price`, generic `[class*="price"]`) unchanged.
- TreeWalker scanning, span wrapping, MutationObserver all unchanged.

## Converter Changes

`convertCurrency(amount, fromCurrency, toCurrency, rates)` is already correct for multi-currency. It routes through USD as intermediary:

```
amountInUSD = (from === 'USD') ? amount : amount / rates[from]
result = (to === 'USD') ? amountInUSD : amountInUSD * rates[to]
```

Works for any pair as long as `rates` contains both currencies.

`formatCurrency(amount, currencyCode)` changes to use `Intl.NumberFormat`:

```javascript
const config = SUPPORTED_CURRENCIES[currencyCode];
const locale = config?.locale || 'en-US';
new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: currencyCode
}).format(amount);
```

This delegates symbol placement, decimal handling, and grouping to the platform. The `symbol` field in the config is retained for detector regex matching only.

## Content Script Changes

- Target currency is always `settings.homeCurrency` (replaces hardcoded `currency === 'INR' ? 'USD' : 'INR'`).
- Settings shape changes from `{ enabled, useManualRate, manualRate }` to `{ enabled, homeCurrency }`.
- Reads `homeCurrency` from `chrome.storage.sync` at init.
- Listens to `chrome.storage.onChanged` for live updates when user changes home currency.
- Tooltip content adapts: shows `1 [detected] = X [home]` in the rate line.
- Tooltip positioning, show/hide, loading/error/disabled states all unchanged.

## Popup Changes

New layout top to bottom:

1. **Header**: "BrowseAbroad" + enable/disable toggle. Unchanged.
2. **Home currency selector**: `<select>` dropdown populated from API rates. Sorted alphabetically. Format: "USD - US Dollar". Saves to `chrome.storage.sync` on change.
3. **Rate display**: One row per detected currency excluding home. Example (home = EUR):
   ```
   1 USD = 0.92 EUR
   1 GBP = 1.17 EUR
   1 INR = 0.011 EUR
   ```
4. **Refresh button + last updated**: Unchanged behavior.

Removed: "Use manual rate" toggle, manual rate input, "INR per USD" label.

### Default Home Currency

Locale-to-currency mapping using `navigator.language`:

```javascript
const LOCALE_CURRENCY_MAP = {
  'US': 'USD', 'GB': 'GBP', 'IN': 'INR',
  'DE': 'EUR', 'FR': 'EUR', 'ES': 'EUR',
  'IT': 'EUR', 'NL': 'EUR', 'AT': 'EUR',
  // extend as needed
};
```

Extract country code from `navigator.language` (e.g., `en-US` -> `US`), look up map, fall back to USD.

## Service Worker Changes

Store the full `response.rates` object instead of extracting only INR. Cache structure changes from `{ rates: { INR: 83.0 }, timestamp, base }` to `{ rates: { INR: 83.0, EUR: 0.92, GBP: 0.79, ... }, timestamp, base }`.

Message handlers, cache TTL, refresh logic all unchanged.

## Testing Strategy

All tests use existing Jest setup. No new infrastructure.

**Detector tests:**
- EUR detection: `€100`, `€1,234.56`, `EUR 100`, `EUR100`
- GBP detection: `£100`, `£1,234.56`, `GBP 100`, `GBP100`
- Existing USD and INR tests still pass (regression)
- Home currency exclusion: if home = EUR, `€50` is not detected
- Mixed content: page with USD, EUR, GBP, INR prices all detected with correct `data-currency`

**Converter tests:**
- Cross-pair conversions: USD->EUR, USD->GBP, INR->EUR, GBP->INR
- `formatCurrency` produces correct symbols and locale formatting for all 4 currencies
- Same-currency edge case

**Popup tests:**
- Home currency selector populates from rates
- Changing home currency saves to storage
- Rate table shows correct rows (excludes home currency)
- Locale detection maps correctly to default currency

**Content script tests:**
- Tooltip shows correct conversion for each detected currency to home
- Rate line displays correct direction
- Home currency change updates behavior without reload

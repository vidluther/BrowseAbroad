# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

### Content Scripts (injected into web pages)
- `src/content/detector.js` - Price detection using regex patterns and DOM selectors
- `src/content/content.js` - Tooltip display, event handling, MutationObserver
- `src/content/tooltip.css` - Tooltip and price highlight styling

### Background Service Worker
- `src/background/service-worker.js` - Fetches exchange rates, caches in chrome.storage.local

### Popup UI
- `src/popup/popup.html/js/css` - Settings interface for enable/disable, manual rate

### Utilities
- `src/utils/converters.js` - Currency/unit conversion functions (extensible)

## Key Implementation Details

### Price Detection (detector.js)
Two-phase detection:
1. **Structured prices**: Uses CSS selectors for e-commerce sites (Amazon's `.a-price`, `.a-price-whole`)
2. **Text-based**: TreeWalker scans text nodes with regex patterns

Detected prices get:
- `data-price-detected="true"` attribute
- `data-amount` and `data-currency` attributes
- `currency-converter-price` class for styling/hover

### Exchange Rates
- API: `https://api.exchangerate-api.com/v4/latest/USD`
- Cached in `chrome.storage.local` for 24 hours
- Content scripts request rates via `chrome.runtime.sendMessage`

### Settings Storage
Uses `chrome.storage.sync`:
- `enabled` (boolean)
- `useManualRate` (boolean)
- `manualRate` (number)

## Common Issues & Solutions

### Service Worker Errors
- Don't use `chrome.alarms` at top level - wrap in event listeners
- Service workers can be cached aggressively - remove/reload extension to update

### Price Not Detected
- Amazon splits prices across elements - use `scanStructuredPrices()`
- Check if element has `data-price-detected` already
- Verify regex patterns in `combinedPattern`

### Tooltip Not Showing
- Check if `settings.enabled` is true
- Verify exchange rates loaded (`exchangeRates` not null)
- Check console for errors in content script

## Extension Points

### Adding New Currencies
1. Add patterns to `detector.js` patterns object
2. Update `combinedPattern` in `init()`
3. Add parsing logic in `parsePrice()`
4. Add symbol to `converters.js` `formatCurrency()`

### Adding Unit Conversions
1. Add detection patterns to `detector.js`
2. Add conversion factors to `converters.js` `convertUnits()`
3. Update tooltip to show unit conversions

### Supporting New E-commerce Sites
Add site-specific selectors to `scanStructuredPrices()` in detector.js

## File Dependencies

```
manifest.json loads:
  └── content scripts (in order):
      ├── src/utils/converters.js (defines Converters)
      ├── src/content/detector.js (defines PriceDetector)
      └── src/content/content.js (uses both, runs init)
  └── service worker:
      └── src/background/service-worker.js
  └── popup:
      └── src/popup/popup.html → popup.js, popup.css
```

## Commands

**No build step required** - pure vanilla JavaScript. After changes, reload the extension at `chrome://extensions`.

### Testing
```bash
npm test                    # Run all tests once
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
npx vitest tests/unit/converters.test.js  # Run a single test file
```

Tests use vitest with jsdom environment. Test files are in `tests/unit/`.

# AGENTS.md

Guidance for agentic coding agents working in this repository.

## Project Overview

BrowseAbroad is a monorepo for tools that help people navigate life across borders. The primary tool is a Chrome extension (Manifest V3) that detects prices on web pages and shows currency conversions on hover. Firefox and Safari extensions are planned future additions.

**No build step** - the extension is pure vanilla JavaScript loaded directly by Chrome.

## Repository Structure

```
BrowseAbroad/
├── chrome-extension/        # Main Chrome extension
│   ├── manifest.json        # MV3 extension manifest
│   ├── src/
│   │   ├── config/          # currencies.config.js - central currency definitions
│   │   ├── content/         # content.js (tooltip/events), detector.js, tooltip.css
│   │   ├── background/      # service-worker.js (rate fetching, caching)
│   │   ├── popup/           # popup.html/js/css - settings UI
│   │   └── utils/           # converters.js - conversion functions
│   ├── tests/
│   │   ├── setup.js         # Chrome API mocks (chrome.storage, chrome.runtime)
│   │   ├── helpers/
│   │   └── unit/            # *.test.js files (Vitest)
│   ├── icons/               # 16/48/128px PNGs (regenerate with node create-icons.js)
│   ├── package.json
│   └── vitest.config.js
├── docs/
├── CLAUDE.md
├── GEMINI.md
└── README.md
```

## Commands

All commands run from `chrome-extension/` unless noted.

### Testing

```bash
# Run all unit tests once
npm test

# Watch mode (reruns on file change)
npm run test:watch

# Coverage report
npm run test:coverage

# Run a single test file
npx vitest run tests/unit/converters.test.js
npx vitest run tests/unit/detector.test.js
npx vitest run tests/unit/service-worker.test.js
npx vitest run tests/unit/currencies.config.test.js

# Run tests matching a name pattern
npx vitest run --reporter=verbose -t "convertCurrency"
```

### Loading the Extension

No build step needed. Load the extension directly:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the `chrome-extension/` directory
4. After any source change, click the **refresh** icon on the extension card

### Regenerating Icons

Edit `chrome-extension/icons/icon.svg` (the master source), then:

```bash
node chrome-extension/create-icons.js
```

This uses `sharp` to rasterize the SVG to `icon16.png`, `icon48.png`, and `icon128.png`.

## Code Style

### Language & Formatting

- **Pure vanilla JavaScript** - no TypeScript, no transpilation, no bundling
- **ES module syntax** in test/config files (`import`/`export`), but content scripts use globals (no `import` - loaded by manifest in order)
- **2-space indentation**
- **Semicolons required**
- Double quotes for strings in most files; single quotes also acceptable (be consistent within a file)
- Trailing commas on multi-line arrays/objects

### Module Pattern

Content scripts cannot use ES module `import`/`export` — they are injected into pages via `manifest.json` in load order. Share code via global `window` assignments:

```js
// At the bottom of every utility/content script
if (typeof window !== 'undefined') {
  window.MyModule = MyModule;
}
```

Manifest load order: `currencies.config.js` → `converters.js` → `detector.js` → `content.js`

Content scripts that need isolation use an IIFE:

```js
(function () {
  'use strict';
  // ...
})();
```

### Naming Conventions

| Kind | Convention | Example |
|------|-----------|---------|
| Variables / functions | `camelCase` | `fetchExchangeRates` |
| Constants (module-level) | `SCREAMING_SNAKE_CASE` | `CACHE_DURATION_MS` |
| Module objects | `PascalCase` object literal | `const PriceDetector = { ... }` |
| CSS classes injected by JS | `kebab-case` with `currency-converter-` prefix | `currency-converter-price` |
| Data attributes | `data-kebab-case` | `data-price-detected`, `data-amount`, `data-currency` |
| Test files | `*.test.js` in `tests/unit/` | `converters.test.js` |

### Object / Module Pattern

Prefer object literals over ES6 classes for modules:

```js
const PriceDetector = {
  someState: null,

  methodName(param) {
    // ...
  },
};
```

### JSDoc Comments

Every public function must have a JSDoc block:

```js
/**
 * Brief description of what the function does
 * @param {number} amount - Description of param
 * @param {string} from - Source currency code (e.g., 'INR', 'USD')
 * @returns {number} Description of return value
 */
function convertCurrency(amount, from) { ... }
```

Inline comments explain *why*, not *what*.

### Error Handling

- Wrap all Chrome API calls (`chrome.storage.*`, `chrome.runtime.*`) in `try/catch`
- Use `console.warn` for recoverable errors (cache misses, failed loads)
- Use `console.error` for fatal errors (API fetch failures)
- Always log with the `Currency Converter:` prefix for easy filtering:
  ```js
  console.warn('Currency Converter: Could not load settings', e);
  ```
- Never let an unhandled rejection crash the extension; catch at the top-level async boundary

### Async / Await

Prefer `async/await` over raw Promises. Return `true` from `chrome.runtime.onMessage` listeners to keep the message channel open for async responses:

```js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  doAsyncWork().then(sendResponse).catch(err => sendResponse({ error: err.message }));
  return true; // required for async sendResponse
});
```

### DOM Manipulation

- Collect DOM nodes before modifying them (avoid mutating while walking)
- Use `document.createDocumentFragment()` for batch DOM updates
- Guard every DOM operation: check `if (!element)` before use
- Skip elements with `data-price-detected` to prevent double-processing

## Testing Conventions

- Test environment: **Vitest + jsdom**
- Chrome APIs are mocked globally in `tests/setup.js` via `global.chrome`; a fresh mock is created in `beforeEach`
- `vi.clearAllMocks()` and `vi.resetModules()` run in `afterEach`
- Tests live in `tests/unit/` and must match `*.test.js`
- New logic must have corresponding unit tests
- Import the module under test using relative paths from `tests/unit/`

## Architecture Notes

### Adding a New Currency

1. Add currency config to `src/config/currencies.config.js` (`SUPPORTED_CURRENCIES`)
2. Add regex patterns to `detector.js` `patterns` object and `combinedPattern` in `init()`
3. Add parse logic to `parsePrice()` in `detector.js`
4. Add symbol/locale to `converters.js` `formatCurrency()`

### Adding a New E-commerce Site

Add site-specific CSS selectors to `scanStructuredPrices()` in `detector.js`.

### Adding Unit Conversions

1. Add detection patterns to `detector.js`
2. Add conversion factors to `converters.js` `convertUnits()`
3. Update tooltip rendering in `content.js`

### Adding a New Browser Extension

Add as a sibling directory to `chrome-extension/` (e.g., `firefox-extension/`). Do not modify the `chrome-extension/` source.

## Common Pitfalls

- **Service worker scope**: Do not call `chrome.alarms` at the top level; wrap in event listeners
- **Cached service workers**: After significant changes, remove and re-add the extension rather than just reloading
- **Pattern sync**: Both `combinedPattern` (detection) and the strip regex in `parsePrice()` must recognize the same prefixes — keep them in sync when adding currencies
- **Content script globals**: Files loaded via `manifest.json` share the page's global scope; avoid variable name collisions with page code

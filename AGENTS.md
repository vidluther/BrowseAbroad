# AGENTS.md

Guidance for agentic coding agents working in this repository.

## Project Overview

BrowseAbroad is a monorepo for tools that help people navigate life across borders. The primary tool is a Chrome extension (Manifest V3) that detects prices on web pages and shows currency conversions on hover. Firefox and Safari extensions are planned future additions.

**No build step** - the extension is pure vanilla JavaScript loaded directly by Chrome.

## Repository Structure & Commands

See [`chrome-extension/CLAUDE.md`](./chrome-extension/CLAUDE.md) for the full directory tree, test commands, extension loading steps, and icon regeneration instructions.

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

## Architecture Notes & Common Pitfalls

See [`chrome-extension/CLAUDE.md`](./chrome-extension/CLAUDE.md) — "Extension Points" for how to add currencies, e-commerce sites, unit conversions, and new browser extensions; "Common Issues" for pitfalls around service workers, cached scripts, pattern sync, and content script globals.

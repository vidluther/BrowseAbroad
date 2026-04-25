# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrowseAbroad is a collection of tools for people navigating life across borders, starting with currency and unit conversion utilities. Contains Chrome and Firefox extensions.

## Repository Structure

```
BrowseAbroad/
├── src/                    # All extension source code
│   ├── config/             # Currency configuration
│   ├── utils/              # Conversion utilities
│   ├── content/            # Content scripts (detector, tooltip)
│   ├── background/         # Background service worker / event page
│   └── popup/              # Popup UI
├── icons/                  # Extension icons
├── manifest.chrome.json    # Chrome manifest (build → dist/chrome/manifest.json)
├── manifest.firefox.json   # Firefox manifest (build → dist/firefox/manifest.json)
├── scripts/                # Build scripts (build.js, bump-version.js)
├── tests/                  # Vitest tests
└── dist/                   # Build output (gitignored)
    ├── chrome/             # Loadable Chrome extension
    └── firefox/            # Loadable Firefox extension
```

## Architecture

A single `src/` tree with two platform-specific manifests. The build script copies `src/`, `icons/`, and the correct manifest into `dist/<platform>/`.

### Content Scripts (injected into web pages)
- `src/content/detector.js` — Price detection using regex patterns and DOM selectors
- `src/content/content.js` — Tooltip display, event handling, MutationObserver
- `src/content/tooltip.css` — Tooltip and price highlight styling

### Background
- `src/background/service-worker.js` — Fetches exchange rates, caches in storage. Works as both Chrome service worker and Firefox event page (same code, different manifest key).

### Popup UI
- `src/popup/popup.html/js/css` — Settings interface for enable/disable, home currency

### Utilities
- `src/utils/converters.js` — Currency/unit conversion functions (extensible)
- `src/config/currencies.config.js` — Supported currencies and detection patterns

## Commands

### Build

```bash
pnpm build              # Build both Chrome + Firefox
pnpm build:chrome       # Build Chrome only → dist/chrome/
pnpm build:firefox      # Build Firefox only → dist/firefox/
pnpm dev                # Build both + watch for changes
pnpm dev:chrome         # Build Chrome + watch
pnpm dev:firefox        # Build Firefox + watch
```

### Development

- **Chrome**: `pnpm build:chrome`, then load unpacked extension from `dist/chrome/`
- **Firefox**: `pnpm build:firefox`, then `about:debugging` → "Load Temporary Add-on" → select `dist/firefox/manifest.json`
  - Temporary add-ons are lost on restart. For persistent local install, see [Persistent Firefox Install](#persistent-firefox-install) below.

### Testing

```bash
pnpm test               # Run all tests once
pnpm run test:watch     # Watch mode
pnpm run test:coverage  # Coverage report
```

Tests use vitest with jsdom environment. Test files are in `tests/unit/`.

### Version Bump

```bash
pnpm run version:bump   # Bump version in manifests
```

## Key Differences Between Platforms

| Feature | Chrome | Firefox |
|---|---|---|
| Manifest | `manifest.chrome.json` | `manifest.firefox.json` |
| Background | `service_worker` | `scripts` (event page) |
| Firefox ID | N/A | `browser_specific_settings.gecko` |

All source code (`src/`) is identical for both platforms. The code uses `chrome.*` APIs which Firefox supports natively in Manifest V3.

## Extension Points

### Adding New Currencies
1. Add patterns to `src/content/detector.js` patterns object
2. Update `combinedPattern` in `init()`
3. Add parsing logic in `parsePrice()`
4. Add symbol to `src/utils/converters.js` `formatCurrency()`

### Adding Unit Conversions
1. Add detection patterns to `src/content/detector.js`
2. Add conversion factors to `src/utils/converters.js` `convertUnits()`
3. Update tooltip to show unit conversions

### Supporting New E-commerce Sites
Add site-specific selectors to `scanStructuredPrices()` in `src/content/detector.js`

## Adding New Tools

This is a monorepo. Future tools (Safari extension, unit converters) should follow the same pattern of `manifest.<platform>.json` files sharing `src/`.

## Common Issues

### Service Worker Errors (Chrome)
- Don't use `chrome.alarms` at top level — wrap in event listeners
- Service workers can be cached aggressively — remove/reload extension to update

### Price Not Detected
- Amazon splits prices across elements — use `scanStructuredPrices()`
- Check if element has `data-price-detected` already
- Verify regex patterns in `combinedPattern`
- Ensure `parsePrice()` strip regex handles all prefix variants

### Firefox Background Script
- Same file as Chrome service worker — works because code doesn't use service-worker-specific APIs
- Firefox's `background.scripts` with MV3 defaults to non-persistent event page

## Persistent Firefox Install

By default, Firefox only loads signed extensions. For local development that persists across restarts:

1. Install [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/) (or Nightly)
2. Open it, go to `about:config`, search `xpinstall.signatures.required`, set to `false`
3. Run `pnpm package:firefox` to build and create the XPI
4. In Firefox, go to `about:addons` → gear icon → "Install Add-on From File"
5. Select `dist/browseabroad-firefox.xpi`

The extension will now persist across restarts. Re-run `pnpm package:firefox` and re-install after code changes.

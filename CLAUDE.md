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
├── scripts/                # build.js, bump-version.js, create-icons.js
├── tests/                  # Vitest tests
├── .github/workflows/      # ci.yml (lint+test on PR), release.yml (sign+publish on v* tag)
├── LICENSE                 # MIT
└── dist/                   # Build output (gitignored)
    ├── chrome/             # Loadable Chrome extension
    ├── firefox/            # Loadable Firefox extension
    ├── browseabroad-chrome.zip   # Chrome Web Store upload
    └── browseabroad-firefox.xpi  # AMO upload / sideload
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
pnpm package            # Build + zip both → dist/browseabroad-{chrome.zip,firefox.xpi}
pnpm package:firefox    # Build + zip Firefox only (XPI for AMO upload or sideload)
pnpm package:chrome     # Build + zip Chrome only (zip for Chrome Web Store)
```

### Lint (AMO pre-submission check)

```bash
pnpm lint:firefox       # Run Mozilla's addons-linter against dist/firefox
```

Run this before every AMO submission; it surfaces the same errors and warnings AMO will. Don't run web-ext lint against `dist/chrome` — it's a Firefox-targeted validator and produces false positives (missing `gecko.id`, missing `background.scripts` fallback) that don't apply to Chrome MV3.

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
pnpm version:bump patch|minor|major   # Bumps both manifests + package.json in lockstep
```

The bumper aborts loudly if the three files disagree on the current version — reconcile manually, then re-run.

### Release

1. `pnpm version:bump patch` — updates all three version fields
2. Commit, then `git tag v$(node -p "require('./package.json').version") && git push --tags`
3. `.github/workflows/release.yml` runs: tests → build → `web-ext lint` → `web-ext sign --channel=unlisted` → attaches signed `.xpi` and `browseabroad-chrome.zip` to the GitHub Release.
4. For AMO listing: download the signed XPI and submit at addons.mozilla.org → Submit a New Add-on.

The signing step needs `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` repo secrets — generate them at addons.mozilla.org → Developer Hub → Manage API Keys.

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

## Adding New Platforms

Add `manifest.<platform>.json` at the repo root and a case in `scripts/build.js`. The single `src/` tree is shared.

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

### Firefox Manifest: don't unify the version floors
- `manifest.firefox.json` deliberately splits `gecko.strict_min_version` (140.0 desktop) from `gecko_android.strict_min_version` (142.0 Android). Mozilla shipped `data_collection_permissions` support in those two different releases. Unifying to a single value re-introduces a `web-ext lint` warning either way.
- `data_collection_permissions: { required: ["none"] }` is a forward-compat declaration — Mozilla treats its absence as a warning today and "will require it" for new submissions. Don't remove it as "unused config."

### Don't use `innerHTML` in popup.js / content.js
- All DOM construction uses `createElement` + `textContent` + `replaceChildren`. This isn't stylistic — `web-ext lint` flags every `innerHTML =` as `UNSAFE_VAR_ASSIGNMENT` and AMO reviewers flag accumulations of these warnings during manual review. If you need to add UI, follow the existing pattern (see `makePlaceholder` and `makeRateRow` helpers in `src/popup/popup.js`, and `make()` in `updateTooltipContent` in `src/content/content.js`).

## Persistent Firefox Install

The signed XPI from [GitHub Releases](https://github.com/vidluther/BrowseAbroad/releases) installs persistently in any Firefox.

For an unsigned **local** build to persist, you need Firefox Developer Edition or Nightly with `xpinstall.signatures.required = false` in `about:config`, then install `dist/browseabroad-firefox.xpi` via `about:addons` → gear → "Install Add-on From File". Stable Firefox refuses unsigned XPIs entirely.

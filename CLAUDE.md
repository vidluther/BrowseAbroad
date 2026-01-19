# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrowseAbroad is a collection of tools for people navigating life across borders, starting with currency and unit conversion utilities. Currently contains a Chrome extension; Firefox and Safari extensions are planned.

## Repository Structure

```
BrowseAbroad/
├── chrome-extension/    # Currency/unit converter Chrome extension
│   └── CLAUDE.md        # Detailed extension-specific guidance
└── README.md
```

## Chrome Extension

The main project is a Manifest V3 Chrome extension that detects prices on web pages and shows currency conversions on hover.

### Development

**No build step required** - pure vanilla JavaScript. After changes, reload at `chrome://extensions`.

### Testing

```bash
cd chrome-extension
npm test                    # Run all unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

For manual testing, load unpacked extension and test on Amazon or other e-commerce sites.

### Key Files

- `chrome-extension/manifest.json` - Extension configuration
- `chrome-extension/src/content/detector.js` - Price detection (regex + DOM selectors)
- `chrome-extension/src/content/content.js` - Tooltip display and event handling
- `chrome-extension/src/background/service-worker.js` - Exchange rate fetching (cached 24h)
- `chrome-extension/src/utils/converters.js` - Conversion functions

See `chrome-extension/CLAUDE.md` for detailed architecture and extension points.

## Adding New Tools

This is a monorepo. Future tools (Firefox extension, Safari extension, unit converters) should be added as sibling directories to `chrome-extension/`.

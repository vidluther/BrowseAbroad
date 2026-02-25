# BrowseAbroad

A collection of tools for navigating websites across borders, starting with currency and unit conversion utilities.

I built this for myself while living between countries. I needed an easy way to compare prices between INR and USD without constantly using a calculator.

I'm also going to need help with unit conversions. For example, cm to inches, kg to lbs, and Fahrenheit to Celsius.. etc etc.

## What's Included

### Chrome Extension - Currency Converter

A browser extension that automatically detects prices on web pages and shows currency conversions on hover. Useful when shopping online and comparing prices between countries.

**Features:**
- Detects INR, USD, EUR, and GBP prices automatically
- Shows converted prices on hover
- Live exchange rates from [exchangerate-api.com](https://www.exchangerate-api.com), cached for 24 hours
- Works on Amazon, IKEA, and other e-commerce sites
- Optional manual rate override
- Syncs settings across devices via `chrome.storage.sync`

**Tested on:**
- Amazon India (`amazon.in`) — INR to USD
- Amazon US (`amazon.com`) — USD to INR
- Namecheap (`namecheap.com`) — USD to INR
- Dell India (`dell.com/en-in`) — INR to USD
- DailyObjects (`dailyobjects.com`) — INR to USD

## Installing the Chrome Extension

There is **no build step**. The extension is pure vanilla JavaScript and loads directly from source.

### Prerequisites

- Google Chrome (or any Chromium-based browser with extension developer mode)
- Node.js — only needed to run tests; not required to use the extension

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/BrowseAbroad.git
   cd BrowseAbroad
   ```

2. **Open Chrome's extension manager**

   Navigate to `chrome://extensions` in your browser.

3. **Enable Developer mode**

   Toggle **Developer mode** in the top-right corner of the extensions page.

4. **Load the extension**

   Click **Load unpacked** and select the `chrome-extension/` directory inside this repo.

5. **Pin the extension** (optional)

   Click the puzzle-piece icon in the toolbar and pin BrowseAbroad for quick access.

6. **After any code change**

   Click the refresh icon on the BrowseAbroad card at `chrome://extensions`. For service worker changes, remove and re-add the extension to avoid stale caches.

### Regenerating Icons

If you modify the icon source, regenerate the PNG files:

```bash
node chrome-extension/create-icons.js
```

## Running Tests

Tests use [Vitest](https://vitest.dev) with a jsdom environment. Chrome APIs are mocked in `tests/setup.js`.

```bash
cd chrome-extension

# Run all tests once
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Run a single test file
npx vitest run tests/unit/converters.test.js
```

## How It Works

```
manifest.json loads content scripts in order:
  1. src/config/currencies.config.js   — currency definitions & locale map
  2. src/utils/converters.js           — convertCurrency(), formatCurrency()
  3. src/content/detector.js           — TreeWalker + CSS selector price detection
  4. src/content/content.js            — tooltip UI, hover events, MutationObserver

Background:
  src/background/service-worker.js     — fetches & caches exchange rates (24h)

Popup:
  src/popup/popup.html/js/css          — settings UI (toggle, manual rate, refresh)
```

Price detection runs in two phases:
1. **Structured prices** — site-specific CSS selectors (e.g., Amazon's `.a-price`)
2. **Text nodes** — `TreeWalker` scans all visible text with regex patterns for `₹`, `Rs.`, `INR`, `$`, `USD`, `€`, `EUR`, `£`, `GBP`

Detected prices get `data-price-detected="true"`, `data-amount`, and `data-currency` attributes and the `currency-converter-price` CSS class. Hovering triggers a tooltip showing the converted value and live exchange rate.

## Project Structure

```
BrowseAbroad/
├── chrome-extension/
│   ├── manifest.json
│   ├── src/
│   │   ├── config/currencies.config.js    # Supported currencies & locale map
│   │   ├── content/
│   │   │   ├── content.js                 # Tooltip, events, MutationObserver
│   │   │   ├── detector.js                # Price detection (regex + DOM)
│   │   │   └── tooltip.css                # Tooltip & highlight styles
│   │   ├── background/service-worker.js   # Rate fetching & caching
│   │   ├── popup/popup.html/js/css        # Settings popup
│   │   └── utils/converters.js            # Conversion & formatting functions
│   ├── tests/
│   │   ├── setup.js                       # Chrome API mocks
│   │   └── unit/                          # Vitest unit tests
│   ├── icons/                             # 16/48/128px PNGs
│   ├── create-icons.js                    # Icon generator script
│   └── package.json
├── docs/
├── AGENTS.md                              # Guidance for AI coding agents
├── CLAUDE.md
└── GEMINI.md
```

## Planned Tools

- Unit converter (cm/inches, kg/lbs, temperatures)
- Firefox extension
- Safari extension

## Contributing

Contributions welcome. If you have ideas for tools that would help people navigating life across borders, open an issue or PR.

See [AGENTS.md](./AGENTS.md) for code style, architecture notes, and contribution guidelines.

## License

MIT

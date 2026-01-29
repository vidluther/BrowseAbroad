# BrowseAbroad Chrome Extension

A Chrome extension that detects prices and measurement units on web pages and shows conversions on hover.

99% of this code was written by Claude Code, hopefully it doesn't start buying things on your behalf.

For example, go to https://www.amazon.in and look at prices, hover over a price to see the converted value in USD.

## Tested On 

- Amazon India (https://www.amazon.in) (INR to USD)
- Amazon US (https://www.amazon.com) (USD to INR)
- Namecheap (https://www.namecheap.com) (USD to INR)
- Dell India (https://www.dell.com/en-in) (INR to USD)
- DailyObjects (https://www.dailyobjects.com/) (INR to USD)

## Caveats

- Some websites may not work correctly due to their use of non-standard price formats or JavaScript frameworks.
- Prices may not be accurate due to fluctuations in exchange rates.
- Your bank account may not support international transactions.
- Your bank may have a different exchange rate than the one used by the extension.
- The extension may not work correctly on all websites due to their use of non-standard price formats or JavaScript frameworks.

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked** and select this `chrome-extension` folder
5. The extension icon will appear in your toolbar

## Usage

- Browse any website with prices - detected prices will have a subtle dotted underline
- Hover over a price to see the converted value
- Click the extension icon to:
  - Toggle the extension on/off
  - View current exchange rate
  - Set a manual exchange rate
  - Refresh rates

## Supported Price Formats

### INR (Indian Rupees)
- `₹1,234.56`
- `Rs. 1,234`
- `Rs 1234.56`
- `INR 1,234.56`

### USD (US Dollars)
- `$1,234.56`
- `USD 1,234`
- `US$ 1,234.56`

## Testing

1. Load the extension as described above
2. Test on these pages:
   - [Amazon India](https://amazon.in) - structured INR prices
   - [Amazon US](https://amazon.com) - structured USD prices
   - Any page with inline prices
3. Open DevTools (F12) and check the console for errors
4. Inspect elements to verify `data-price-detected` attributes are added

## Project Structure

```
chrome-extension/
├── manifest.json
├── icons/                     # Extension icons (16, 48, 128px)
└── src/
    ├── content/
    │   ├── content.js         # Main content script
    │   ├── detector.js        # Price detection logic
    │   └── tooltip.css        # Tooltip styling
    ├── background/
    │   └── service-worker.js  # Exchange rate fetching & caching
    ├── popup/
    │   ├── popup.html         # Settings popup UI
    │   ├── popup.js           # Popup logic
    │   └── popup.css          # Popup styling
    └── utils/
        └── converters.js      # Conversion functions
```

## Technical Details

- **Manifest Version**: V3 (latest Chrome standard)
- **Exchange Rate API**: exchangerate-api.com (free tier, no API key required)
- **Detection Method**: DOM TreeWalker for text nodes + CSS selectors for structured prices
- **Storage**: `chrome.storage.sync` for settings (syncs across devices)
- **No build step**: Pure vanilla JS - just reload extension after changes

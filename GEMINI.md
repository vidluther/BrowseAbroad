# BrowseAbroad - GEMINI.md

## Project Overview

**BrowseAbroad** is a Chrome extension designed to help users navigate websites across borders by automatically detecting and converting currencies. Currently, it focuses on INR (Indian Rupee) and USD (US Dollar) conversions, with planned support for unit conversions.

The project is built using **vanilla JavaScript, HTML, and CSS**, ensuring a lightweight footprint with **no build step** required for the extension code itself.

## Directory Structure

```text
/Users/vluther/work/personal/BrowseAbroad/
├── chrome-extension/           # Main extension directory
│   ├── manifest.json           # Extension manifest (V3)
│   ├── src/
│   │   ├── background/         # Service worker (rate fetching/caching)
│   │   ├── content/            # Content scripts (detection & UI)
│   │   ├── popup/              # Extension popup UI
│   │   └── utils/              # Shared utilities (converters)
│   ├── tests/                  # Unit tests (Vitest)
│   ├── icons/                  # Generated icons
│   └── package.json            # Dev dependencies (Vitest)
├── CLAUDE.md                   # AI Coding Guidelines
└── README.md                   # General documentation
```

## Architecture & Key Components

### 1. Price Detection (`src/content/detector.js`)
Detection happens in two phases:
*   **Structured Prices:** Scans specific CSS selectors (e.g., Amazon's `.a-price`) to find prices split across elements.
*   **Text Analysis:** Uses a `TreeWalker` to scan text nodes for regex patterns (`₹`, `Rs.`, `$`, `USD`).
*   **Prevention:** Avoids false positives (e.g., "12 hours") using word boundaries and context checks.

### 2. Exchange Rates (`src/background/service-worker.js`)
*   **Source:** Fetches live rates from `https://api.exchangerate-api.com/v4/latest/USD`.
*   **Caching:** Rates are cached in `chrome.storage.local` for 24 hours to minimize API calls.
*   **Communication:** Content scripts query the service worker via `chrome.runtime.sendMessage`.

### 3. User Interface (`src/content/content.js` & `tooltip.css`)
*   **Tooltip:** A custom DOM element injected into the page that appears when hovering over detected prices.
*   **Popup:** Allows users to toggle the extension, switch to manual rates, or refresh cached rates.
*   **Storage:** User preferences (enabled status, manual rates) are synced using `chrome.storage.sync`.

## Development & Usage

### Running the Extension
Since there is no build step, you can load the source directly:
1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (top right).
3.  Click **Load unpacked**.
4.  Select the `chrome-extension/` directory.

### Testing
The project uses **Vitest** with a **JSDOM** environment for unit testing.

*   **Run all tests:**
    ```bash
    cd chrome-extension
    npm test
    ```
*   **Watch mode:**
    ```bash
    npm run test:watch
    ```
*   **Run coverage:**
    ```bash
    npm run test:coverage
    ```
*   **Run specific test file:**
    ```bash
    npx vitest tests/unit/detector.test.js
    ```

**Test Configuration (`vitest.config.js`):**
*   Environment: `jsdom`
*   Setup: `tests/setup.js` mocks Chrome APIs (`chrome.storage`, `chrome.runtime`) to allow testing extension logic in isolation.

## Coding Conventions
*   **Style:** Pure Vanilla JS. No transpilation.
*   **Formatting:** Follows the existing style (semicolons, 2-space indentation).
*   **Tests:** New logic should include unit tests in `tests/unit/`.
*   **Icons:** Placeholder icons can be regenerated using `node create-icons.js`.

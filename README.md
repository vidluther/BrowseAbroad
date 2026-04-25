# BrowseAbroad

A browser extension for navigating websites across borders. Detects prices on web pages and shows live currency conversions on hover.

I built this for myself while living between countries. I needed an easy way to compare prices between INR and USD without constantly using a calculator. Unit conversions (cm/inches, kg/lbs, °F/°C) are next.

## Install

### Firefox

- **From addons.mozilla.org** (once published): search for "BrowseAbroad" and click Add.
- **From GitHub Releases**: download the latest `.xpi` from the [Releases page](https://github.com/vidluther/BrowseAbroad/releases) and drag it into Firefox. The XPI is signed by Mozilla so it works in any Firefox build.

### Chrome / Edge / Brave / other Chromium

Until the Chrome Web Store listing is live:

1. Download `browseabroad-chrome.zip` from the [Releases page](https://github.com/vidluther/BrowseAbroad/releases) and unzip it.
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and pick the unzipped folder.

## Features

- Detects INR, USD, EUR, GBP automatically
- Tooltip on hover shows the converted value and the live rate
- Rates from [exchangerate-api.com](https://www.exchangerate-api.com), cached for 24 hours
- Works on Amazon, IKEA, and other e-commerce sites with split-element prices
- Settings sync across devices via `chrome.storage.sync`

Tested against `amazon.in`, `amazon.com`, `namecheap.com`, `dell.com/en-in`, `dailyobjects.com`.

## Develop

Requires Node.js and pnpm.

```bash
pnpm install
pnpm test                # vitest, jsdom env
pnpm build               # builds dist/chrome/ and dist/firefox/
pnpm dev                 # build + watch both
pnpm package             # build + zip → dist/browseabroad-chrome.zip + dist/browseabroad-firefox.xpi
pnpm lint:firefox        # AMO validator (same one Mozilla runs)
```

Load `dist/chrome/` in `chrome://extensions` (Load unpacked) or `dist/firefox/manifest.json` in `about:debugging` (Load Temporary Add-on).

### Architecture

A single `src/` tree with two platform-specific manifests. `scripts/build.js` copies `src/`, `icons/`, and the right manifest into `dist/<platform>/`.

```
src/
  config/currencies.config.js   # currency definitions + locale → currency map
  utils/converters.js           # convertCurrency(), formatCurrency()
  content/detector.js           # TreeWalker + CSS-selector price detection
  content/content.js            # tooltip UI, hover handlers, MutationObserver
  content/tooltip.css
  background/service-worker.js  # rate fetch + 24h cache
  popup/popup.html|js|css       # settings popup
manifest.chrome.json            # → dist/chrome/manifest.json
manifest.firefox.json           # → dist/firefox/manifest.json
```

The same `chrome.*` API calls run on both browsers — Firefox aliases `chrome` to `browser` for MV3 extensions, so no polyfill is needed.

### Releasing

1. `pnpm version:bump patch|minor|major` — updates both manifests and `package.json` together.
2. Commit, then tag: `git tag v$(node -p "require('./package.json').version")` and push the tag.
3. The `.github/workflows/release.yml` action builds both platforms, signs the Firefox XPI via Mozilla's API (`web-ext sign --channel=unlisted`), and attaches both artifacts to the GitHub Release.

The signing step needs `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` configured as repo secrets — generate them at [addons.mozilla.org → Developer Hub → Manage API Keys](https://addons.mozilla.org/en-US/developers/addon/api/key/).

## License

MIT — see [LICENSE](./LICENSE).

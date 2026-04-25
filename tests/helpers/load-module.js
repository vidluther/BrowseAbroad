import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load a source file that uses window.X = {...} pattern into a test context
 * @param {string} relativePath - Path relative to repo root (e.g. "src/utils/converters.js")
 * @param {object} [existingWindow] - Optional shared window context for chaining multiple scripts
 * @returns {object} The window object with loaded modules
 */
export function loadWindowModule(relativePath, existingWindow) {
  const absolutePath = path.resolve(__dirname, '../../', relativePath);
  const code = fs.readFileSync(absolutePath, 'utf-8');

  const windowContext = existingWindow || {
    getComputedStyle: global.window.getComputedStyle.bind(global.window)
  };

  // Inject windowContext properties as bare-name parameters so scripts can reference them without `window.`
  const FIXED_PARAMS = new Set(['window', 'document', 'console', 'NodeFilter']);
  const globalNames = Object.keys(windowContext).filter(
    (k) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) && !FIXED_PARAMS.has(k)
  );
  const fn = new Function('window', 'document', 'console', 'NodeFilter', ...globalNames, code);
  fn(windowContext, global.document, console, global.NodeFilter, ...globalNames.map(k => windowContext[k]));

  return windowContext;
}

/**
 * Load the Converters module (with currencies.config.js loaded first for locale data)
 * @returns {object} The Converters object
 */
export function loadConverters() {
  // Mirrors manifest load order: currencies.config.js → converters.js
  const win = loadWindowModule('src/config/currencies.config.js');
  loadWindowModule('src/utils/converters.js', win);
  return win.Converters;
}

/**
 * Load the PriceDetector module
 * @returns {object} The PriceDetector object
 */
export function loadPriceDetector() {
  const window = loadWindowModule('src/content/detector.js');
  return window.PriceDetector;
}

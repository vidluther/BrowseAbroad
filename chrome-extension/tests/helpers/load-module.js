import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load a source file that uses window.X = {...} pattern into a test context
 * @param {string} relativePath - Path relative to chrome-extension directory
 * @returns {object} The window object with loaded modules
 */
export function loadWindowModule(relativePath) {
  const absolutePath = path.resolve(__dirname, '../../', relativePath);
  const code = fs.readFileSync(absolutePath, 'utf-8');

  // Create a window-like object that includes global browser APIs
  const windowContext = {
    getComputedStyle: global.window.getComputedStyle.bind(global.window)
  };

  // Create a context object that mimics the browser environment
  const context = {
    window: windowContext,
    document: global.document,
    console: console,
    NodeFilter: global.NodeFilter
  };

  // Create a function that executes the code with our context
  const fn = new Function('window', 'document', 'console', 'NodeFilter', code);
  fn(context.window, context.document, context.console, context.NodeFilter);

  return context.window;
}

/**
 * Load the Converters module
 * @returns {object} The Converters object
 */
export function loadConverters() {
  const window = loadWindowModule('src/utils/converters.js');
  return window.Converters;
}

/**
 * Load the PriceDetector module
 * @returns {object} The PriceDetector object
 */
export function loadPriceDetector() {
  const window = loadWindowModule('src/content/detector.js');
  return window.PriceDetector;
}

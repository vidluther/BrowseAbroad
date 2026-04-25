/**
 * Price detection module
 * Detects currency patterns in DOM text nodes and wraps them for conversion
 */

const PriceDetector = {
  // Currency detection patterns
  patterns: {
    INR: [
      // ₹1,234.56 or ₹ 1,234.56
      /₹\s*([\d,]+(?:\.\d{1,2})?)/g,
      // Rs. 1,234.56 or Rs 1,234.56 (word boundary prevents matching "hours 20")
      /\bRs\.?\s*([\d,]+(?:\.\d{1,2})?)/gi,
      // INR 1,234.56
      /INR\s*([\d,]+(?:\.\d{1,2})?)/gi,
    ],
    USD: [
      // $1,234.56 or $ 1,234.56 (not preceded by other currency symbols)
      /(?<![A-Z])\$\s*([\d,]+(?:\.\d{1,2})?)/g,
      // USD 1,234.56
      /USD\s*([\d,]+(?:\.\d{1,2})?)/gi,
      // US$ 1,234.56
      /US\$\s*([\d,]+(?:\.\d{1,2})?)/gi,
    ],
    EUR: [
      // €1,234.56 or € 1,234.56
      /€\s*([\d,]+(?:\.\d{1,2})?)/g,
      // EUR 1,234.56
      /EUR\s*([\d,]+(?:\.\d{1,2})?)/gi,
    ],
    GBP: [
      // £1,234.56 or £ 1,234.56
      /£\s*([\d,]+(?:\.\d{1,2})?)/g,
      // GBP 1,234.56
      /GBP\s*([\d,]+(?:\.\d{1,2})?)/gi,
    ],
  },

  // Combined pattern for matching any price
  combinedPattern: null,

  /**
   * Initialize the combined pattern from the patterns object
   */
  init() {
    const allSources = Object.values(this.patterns)
      .flat()
      .map((regex) => regex.source);
    this.combinedPattern = new RegExp(`(${allSources.join("|")})`, "gi");
  },

  /**
   * Parse a price string and extract amount and currency
   * @param {string} priceStr - The matched price string
   * @returns {object|null} { amount: number, currency: string } or null
   */
  parsePrice(priceStr) {
    const str = priceStr.trim();

    // Detect currency and extract amount
    let currency = null;
    let amountStr = null;

    if (/^₹/.test(str) || /^Rs\.?/i.test(str) || /^INR/i.test(str)) {
      currency = "INR";
      amountStr = str.replace(/^(₹|Rs\.?|INR)\s*/i, "");
    } else if (/\$/.test(str) || /^USD/i.test(str) || /^US\$/i.test(str)) {
      currency = "USD";
      amountStr = str.replace(/^(US\$|USD|\$)\s*/i, "");
    }

    if (!currency) {
      if (/^€/.test(str) || /^EUR/i.test(str)) {
        currency = "EUR";
        amountStr = str.replace(/^(€|EUR)\s*/i, "");
      }
    }

    if (!currency) {
      if (/^£/.test(str) || /^GBP/i.test(str)) {
        currency = "GBP";
        amountStr = str.replace(/^(£|GBP)\s*/i, "");
      }
    }

    if (!currency || !amountStr) return null;

    // Parse the amount (remove commas)
    const amount = parseFloat(amountStr.replace(/,/g, ""));

    if (isNaN(amount) || amount <= 0) return null;

    return { amount, currency, original: str };
  },

  /**
   * Check if an element should be skipped
   * @param {Element} element - The element to check
   * @returns {boolean} True if element should be skipped
   */
  shouldSkipElement(element) {
    if (!element) return true;

    // Skip script, style, and other non-visible elements
    const skipTags = [
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
      "IFRAME",
      "TEXTAREA",
      "INPUT",
      "SELECT",
    ];
    if (skipTags.includes(element.tagName)) return true;

    // Skip elements we've already processed
    if (element.hasAttribute("data-price-detected")) return true;

    // Skip editable elements
    if (element.isContentEditable) return true;

    // Skip hidden elements (checked last since getComputedStyle triggers reflow)
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return true;

    return false;
  },

  /**
   * Wrap detected prices in a text node with span elements
   * @param {Text} textNode - The text node to process
   * @returns {boolean} True if any prices were detected
   */
  processTextNode(textNode) {
    const text = textNode.textContent;
    if (!text || text.trim().length === 0) return false;

    // Reset the pattern
    this.combinedPattern.lastIndex = 0;

    const matches = [];
    let match;

    while ((match = this.combinedPattern.exec(text)) !== null) {
      const parsed = this.parsePrice(match[0]);
      if (parsed) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          ...parsed,
        });
      }
    }

    if (matches.length === 0) return false;

    // Create a document fragment to replace the text node
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach((m) => {
      // Add text before the match
      if (m.start > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, m.start)),
        );
      }

      // Create the price span
      const span = document.createElement("span");
      span.className = "currency-converter-price";
      span.setAttribute("data-price-detected", "true");
      span.setAttribute("data-amount", m.amount);
      span.setAttribute("data-currency", m.currency);
      span.setAttribute("tabindex", "0");
      span.textContent = m.text;
      fragment.appendChild(span);

      lastIndex = m.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    // Replace the text node with the fragment
    textNode.parentNode.replaceChild(fragment, textNode);

    return true;
  },

  /**
   * Detect structured price elements (like Amazon's split-element prices)
   * @param {Element} root - The root element to scan
   */
  scanStructuredPrices(root = document.body) {
    if (!root) return;

    // Amazon-specific selectors are listed first so they take precedence over
    // the generic [class*="price"] catch-all on Amazon pages.
    const selectors = [
      ".a-price:not([data-price-detected])",
      ".a-price-whole:not([data-price-detected])",
      '[data-a-color="price"] .a-offscreen:not([data-price-detected])',
      '[class*="price"]:not([data-price-detected])',
      '[class*="Price"]:not([data-price-detected])',
    ];

    for (const selector of selectors) {
      const elements = root.querySelectorAll(selector);
      elements.forEach((el) => this.processStructuredPriceElement(el));
    }
  },

  /**
   * Process a structured price element (extracts price from child elements)
   * @param {Element} element - The price container element
   */
  processStructuredPriceElement(element) {
    if (!element || element.hasAttribute("data-price-detected")) return;

    // Skip if already processed or hidden
    if (this.shouldSkipElement(element)) return;

    const text = element.textContent.trim();
    if (!text) return;

    // Try standard parsing first (reuses parsePrice logic)
    let result = this.parsePrice(text);

    // Fallback: bare number with currency symbol in a parent price container
    // Handles Amazon-style split prices where symbol and amount are in separate elements
    if (!result) {
      const numberMatch = text.match(/^[\d,]+(?:\.\d{1,2})?$/);
      if (numberMatch) {
        const parentText =
          element.closest?.('[class*="price"]')?.textContent || "";
        const amount = parseFloat(numberMatch[0].replace(/,/g, ""));
        if (amount > 0) {
          if (/₹|\bRs\.?/i.test(parentText)) result = { amount, currency: "INR" };
          else if (/\$/.test(parentText)) result = { amount, currency: "USD" };
          else if (/€|\bEUR\b/i.test(parentText)) result = { amount, currency: "EUR" };
          else if (/£|\bGBP\b/i.test(parentText)) result = { amount, currency: "GBP" };
        }
      }
    }

    if (!result) return;

    // Mark as detected and add data attributes
    element.setAttribute("data-price-detected", "true");
    element.setAttribute("data-amount", result.amount);
    element.setAttribute("data-currency", result.currency);
    element.classList.add("currency-converter-price");
  },

  /**
   * Scan the DOM for prices using TreeWalker
   * @param {Element} root - The root element to scan
   */
  scanDOM(root = document.body) {
    if (!root) return;

    // First, scan for structured price elements (Amazon, etc.)
    this.scanStructuredPrices(root);

    // Then use TreeWalker for text-based detection
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (this.shouldSkipElement(node.parentElement)) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip if parent already has price detection
        if (node.parentElement?.closest("[data-price-detected]")) {
          return NodeFilter.FILTER_REJECT;
        }
        // Only accept nodes with potential price content
        if (this.combinedPattern.test(node.textContent)) {
          this.combinedPattern.lastIndex = 0;
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      },
    });

    // Collect text nodes first (to avoid modifying DOM while walking)
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    // Process collected text nodes
    textNodes.forEach((node) => this.processTextNode(node));
  },
};

// Initialize patterns
PriceDetector.init();

// Make available globally
if (typeof window !== "undefined") {
  window.PriceDetector = PriceDetector;
}

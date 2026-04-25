/**
 * Main content script
 * Coordinates price detection, tooltip display, and exchange rate management
 */

(function () {
  "use strict";

  const TOOLTIP_ID = "currency-converter-tooltip";

  // State
  let settings = {
    enabled: true,
    homeCurrency: "USD",
  };

  let exchangeRates = null;
  let tooltip = null;
  let isInitialized = false;
  let setupComplete = false;
  let initAttempts = 0;
  let currentPriceEl = null;
  const MAX_INIT_ATTEMPTS = 3;

  /**
   * Initialize the extension
   */
  async function init() {
    if (isInitialized) return;

    try {
      await loadSettings();

      if (!settings.enabled) {
        isInitialized = true;
        return;
      }

      if (!setupComplete) {
        createTooltip();
        setupEventListeners();
        setupMutationObserver();
        setupComplete = true;
      }

      await fetchExchangeRates();

      if (document.body) {
        PriceDetector.scanDOM(document.body);
      }

      isInitialized = true;
    } catch (e) {
      console.warn("Currency Converter: init failed, will retry", e);
      initAttempts++;
      if (initAttempts < MAX_INIT_ATTEMPTS) {
        setTimeout(init, 5000);
      }
    }
  }

  /**
   * Load settings from chrome.storage
   */
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(["enabled", "homeCurrency"]);
      settings = {
        enabled: result.enabled !== false, // Default to true
        homeCurrency: result.homeCurrency || "USD",
      };
    } catch (e) {
      console.warn("Currency Converter: Could not load settings", e);
    }
  }

  /**
   * Fetch exchange rates from the background service worker
   */
  async function fetchExchangeRates() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getExchangeRates",
      });
      if (response && response.rates) {
        exchangeRates = response.rates;
      }
    } catch (e) {
      console.warn("Currency Converter: Could not fetch exchange rates", e);
    }
  }

  /**
   * Create the tooltip element
   */
  function createTooltip() {
    if (tooltip) return;
    tooltip = document.createElement("div");
    tooltip.className = "currency-converter-tooltip";
    tooltip.id = TOOLTIP_ID;
    tooltip.setAttribute("role", "tooltip");
    const content = document.createElement("div");
    content.className = "currency-converter-tooltip-content";
    tooltip.appendChild(content);
    document.body.appendChild(tooltip);
  }

  /**
   * Show tooltip with converted price
   * @param {Element} priceElement - The price element being hovered
   */
  function showTooltip(priceElement) {
    if (!tooltip || !settings.enabled) return;

    priceElement.setAttribute("aria-describedby", TOOLTIP_ID);
    currentPriceEl = priceElement;

    const amount = parseFloat(priceElement.getAttribute("data-amount"));
    const currency = priceElement.getAttribute("data-currency");

    if (isNaN(amount) || !currency) return;

    if (currency === settings.homeCurrency) return;

    const targetCurrency = settings.homeCurrency;

    if (!exchangeRates) {
      updateTooltipContent({
        loading: true,
        message: "Loading rates...",
      });
      positionTooltip(priceElement);
      tooltip.classList.add("visible");
      return;
    }

    const convertedAmount = Converters.convertCurrency(
      amount,
      currency,
      targetCurrency,
      exchangeRates,
    );

    if (convertedAmount === null) {
      updateTooltipContent({
        error: `No rate available for ${currency} → ${targetCurrency}`,
      });
      positionTooltip(priceElement);
      tooltip.classList.add("visible");
      return;
    }

    const formattedConverted = Converters.formatCurrency(
      convertedAmount,
      targetCurrency,
    );
    const formattedOriginal = Converters.formatCurrency(amount, currency);

    const oneUnitConverted = Converters.convertCurrency(
      1,
      currency,
      targetCurrency,
      exchangeRates,
    );

    updateTooltipContent({
      value: formattedConverted,
      original: `${formattedOriginal} ${currency}`,
      rate: `1 ${currency} = ${oneUnitConverted.toFixed(2)} ${targetCurrency}`,
    });

    positionTooltip(priceElement);
    tooltip.classList.add("visible");
  }

  /**
   * Update tooltip content
   * @param {object} content - Content to display
   */
  function updateTooltipContent(content) {
    const container = tooltip.querySelector(
      ".currency-converter-tooltip-content",
    );
    if (!container) return;

    container.replaceChildren();

    const make = (className, text) => {
      const el = document.createElement("div");
      el.className = className;
      el.textContent = text;
      return el;
    };

    if (content.loading) {
      container.appendChild(
        make("currency-converter-tooltip-loading", content.message),
      );
    } else if (content.error) {
      container.appendChild(
        make("currency-converter-tooltip-error", content.error),
      );
    } else {
      container.appendChild(
        make("currency-converter-tooltip-value", content.value),
      );
      container.appendChild(
        make("currency-converter-tooltip-original", content.original),
      );
      container.appendChild(
        make("currency-converter-tooltip-rate", content.rate),
      );
    }
  }

  /**
   * Position tooltip near the price element
   * @param {Element} priceElement - The price element
   */
  function positionTooltip(priceElement) {
    const rect = priceElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = rect.bottom + 8;
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

    tooltip.classList.remove("position-top", "position-bottom");
    if (top + tooltipRect.height > viewportHeight - 10) {
      top = rect.top - tooltipRect.height - 8;
      tooltip.classList.add("position-top");
    } else {
      tooltip.classList.add("position-bottom");
    }

    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  /**
   * Hide the tooltip
   */
  function hideTooltip() {
    if (tooltip) {
      tooltip.classList.remove("visible");
    }
    if (currentPriceEl) {
      currentPriceEl.removeAttribute("aria-describedby");
      currentPriceEl = null;
    }
  }

  /**
   * Set up event listeners for price hover
   */
  function setupEventListeners() {
    // mouseover/mouseout bubble, enabling event delegation
    document.body.addEventListener("mouseover", (e) => {
      const priceEl = e.target.closest(".currency-converter-price");
      if (priceEl && priceEl !== currentPriceEl) {
        showTooltip(priceEl);
      }
    });

    document.body.addEventListener("mouseout", (e) => {
      const priceEl = e.target.closest(".currency-converter-price");
      if (priceEl) {
        const relatedTarget = e.relatedTarget;
        if (!relatedTarget || !priceEl.contains(relatedTarget)) {
          hideTooltip();
        }
      }
    });

    document.body.addEventListener("focusin", (e) => {
      const priceEl = e.target.closest(".currency-converter-price");
      if (priceEl) {
        showTooltip(priceEl);
      }
    });

    document.body.addEventListener("focusout", (e) => {
      const priceEl = e.target.closest(".currency-converter-price");
      if (priceEl) {
        hideTooltip();
      }
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "sync") {
        if (changes.enabled !== undefined) {
          settings.enabled = changes.enabled.newValue;
        }
        if (changes.homeCurrency !== undefined) {
          settings.homeCurrency = changes.homeCurrency.newValue;
        }
      }
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "ratesUpdated" && message.rates) {
        exchangeRates = message.rates;
      }
    });
  }

  /**
   * Set up MutationObserver for dynamic content
   */
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!settings.enabled) return;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            PriceDetector.scanDOM(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

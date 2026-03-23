/**
 * Popup UI Logic
 * Manages home currency selection and displays exchange rates
 */

document.addEventListener("DOMContentLoaded", init);

// Derived from currencies.config.js (loaded via popup.html script tag)
const DETECTED_CURRENCIES = typeof SUPPORTED_CURRENCIES !== "undefined"
  ? Object.keys(SUPPORTED_CURRENCIES)
  : ["USD", "INR", "EUR", "GBP"];

// Currency display names for the dropdown
const CURRENCY_NAMES = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  INR: "Indian Rupee",
  JPY: "Japanese Yen",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan",
  KRW: "South Korean Won",
  SEK: "Swedish Krona",
  NOK: "Norwegian Krone",
  DKK: "Danish Krone",
  NZD: "New Zealand Dollar",
  SGD: "Singapore Dollar",
  HKD: "Hong Kong Dollar",
  MXN: "Mexican Peso",
  BRL: "Brazilian Real",
  PLN: "Polish Zloty",
  THB: "Thai Baht",
  ZAR: "South African Rand",
  AED: "UAE Dirham",
  SAR: "Saudi Riyal",
  TWD: "New Taiwan Dollar",
  MYR: "Malaysian Ringgit",
  PHP: "Philippine Peso",
  IDR: "Indonesian Rupiah",
  TRY: "Turkish Lira",
  RUB: "Russian Ruble",
  CZK: "Czech Koruna",
  HUF: "Hungarian Forint",
  ILS: "Israeli Shekel",
  CLP: "Chilean Peso",
  ARS: "Argentine Peso",
  COP: "Colombian Peso",
  PEN: "Peruvian Sol",
  EGP: "Egyptian Pound",
  NGN: "Nigerian Naira",
  KES: "Kenyan Shilling",
  PKR: "Pakistani Rupee",
  BDT: "Bangladeshi Taka",
  VND: "Vietnamese Dong",
  RON: "Romanian Leu",
  BGN: "Bulgarian Lev",
  HRK: "Croatian Kuna",
  UAH: "Ukrainian Hryvnia",
  QAR: "Qatari Riyal",
  KWD: "Kuwaiti Dinar",
  BHD: "Bahraini Dinar",
  OMR: "Omani Rial",
  JOD: "Jordanian Dinar",
  LKR: "Sri Lankan Rupee",
  MMK: "Myanmar Kyat",
  NPR: "Nepalese Rupee",
};

// DOM Elements
let enabledToggle;
let homeCurrencySelect;
let rateRowsEl;
let rateSourceEl;
let lastUpdatedEl;
let refreshBtn;
let popupContainer;

// State
let allRates = null;
let rateTimestamp = null;
let homeCurrency = "USD";

function init() {
  enabledToggle = document.getElementById("enabledToggle");
  homeCurrencySelect = document.getElementById("homeCurrencySelect");
  rateRowsEl = document.getElementById("rateRows");
  rateSourceEl = document.getElementById("rateSource");
  lastUpdatedEl = document.getElementById("lastUpdated");
  refreshBtn = document.getElementById("refreshBtn");
  popupContainer = document.querySelector(".popup-container");

  loadExchangeRates();
  loadSettings();
  setupEventListeners();
}

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(["enabled", "homeCurrency"]);

    enabledToggle.checked = result.enabled !== false;
    homeCurrency = result.homeCurrency || getDefaultHomeCurrency(navigator.language);

    // If no homeCurrency was stored yet, save the default
    if (!result.homeCurrency) {
      await chrome.storage.sync.set({ homeCurrency });
    }

    updateUIState();
  } catch (e) {
    console.error("Error loading settings:", e);
  }
}

async function loadExchangeRates() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getExchangeRates",
    });

    if (response && response.rates) {
      allRates = response.rates;
      rateTimestamp = response.timestamp;
      populateCurrencySelect();
      updateRateDisplay();
    } else if (response && response.error) {
      showRateError(response.error);
    }
  } catch (e) {
    console.error("Error loading rates:", e);
    showRateError("Could not load rates");
  }
}

function populateCurrencySelect() {
  if (!allRates) return;

  // Get all currency codes from API, sorted alphabetically
  const currencies = Object.keys(allRates).sort();

  homeCurrencySelect.innerHTML = "";

  currencies.forEach((code) => {
    const option = document.createElement("option");
    option.value = code;
    const name = CURRENCY_NAMES[code] || code;
    option.textContent = `${code} - ${name}`;
    if (code === homeCurrency) {
      option.selected = true;
    }
    homeCurrencySelect.appendChild(option);
  });
}

function updateRateDisplay() {
  if (!allRates) {
    rateRowsEl.innerHTML =
      '<div class="rate-row-placeholder">Loading rates...</div>';
    rateSourceEl.textContent = "Loading...";
    rateSourceEl.className = "rate-source";
    return;
  }

  // Show rates for each detected currency except the home currency
  const foreignCurrencies = DETECTED_CURRENCIES.filter(
    (c) => c !== homeCurrency,
  );

  if (foreignCurrencies.length === 0) {
    rateRowsEl.innerHTML =
      '<div class="rate-row-placeholder">Home currency matches all detected currencies</div>';
  } else {
    rateRowsEl.innerHTML = foreignCurrencies
      .map((code) => {
        // Calculate: 1 [foreign] = X [home]
        const rateInUSD = 1 / allRates[code]; // 1 foreign in USD
        const rateInHome = rateInUSD * (allRates[homeCurrency] || 1); // USD to home
        const displayRate = homeCurrency === "USD" ? rateInUSD : rateInHome;

        return `
        <div class="rate-row">
          <span class="rate-row-from">1 ${code}</span>
          <span class="rate-row-value">${displayRate.toFixed(4)} ${homeCurrency}</span>
        </div>
      `;
      })
      .join("");
  }

  rateSourceEl.textContent = "Live rate";
  rateSourceEl.className = "rate-source";

  if (rateTimestamp) {
    const date = new Date(rateTimestamp);
    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
    lastUpdatedEl.textContent = `Exchange Rate Updated on: ${dateStr} at ${timeStr}`;
  }
}

function showRateError(message) {
  rateRowsEl.innerHTML = `<div class="rate-row-placeholder">${message}</div>`;
  rateSourceEl.textContent = message;
  rateSourceEl.className = "rate-source error";
}

function updateUIState() {
  const isEnabled = enabledToggle.checked;

  if (isEnabled) {
    popupContainer.classList.remove("disabled");
  } else {
    popupContainer.classList.add("disabled");
  }

  // Update the currency select to reflect current homeCurrency
  if (homeCurrencySelect.value !== homeCurrency) {
    homeCurrencySelect.value = homeCurrency;
  }

  updateRateDisplay();
}

function setupEventListeners() {
  enabledToggle.addEventListener("change", async () => {
    const enabled = enabledToggle.checked;
    await chrome.storage.sync.set({ enabled });
    updateUIState();
  });

  homeCurrencySelect.addEventListener("change", async () => {
    homeCurrency = homeCurrencySelect.value;
    await chrome.storage.sync.set({ homeCurrency });
    updateRateDisplay();
  });

  refreshBtn.addEventListener("click", async () => {
    refreshBtn.classList.add("loading");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "refreshRates",
      });

      if (response && response.success && response.rates) {
        allRates = response.rates;
        rateTimestamp = Date.now();
        populateCurrencySelect();
        updateRateDisplay();
      } else {
        showRateError("Failed to refresh");
      }
    } catch (e) {
      showRateError("Failed to refresh");
    } finally {
      refreshBtn.classList.remove("loading");
    }
  });
}

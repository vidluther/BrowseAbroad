/**
 * Popup UI Logic
 * Manages settings and displays exchange rate information
 */

document.addEventListener("DOMContentLoaded", init);

// DOM Elements
let enabledToggle;
let manualRateToggle;
let manualRateInput;
let manualRateContainer;
let currentRateEl;
let rateSourceEl;
let lastUpdatedEl;
let refreshBtn;
let popupContainer;

// State
let liveRate = null;
let rateTimestamp = null;

function init() {
  // Get DOM elements
  enabledToggle = document.getElementById("enabledToggle");
  manualRateToggle = document.getElementById("manualRateToggle");
  manualRateInput = document.getElementById("manualRateInput");
  manualRateContainer = document.getElementById("manualRateContainer");
  currentRateEl = document.getElementById("currentRate");
  rateSourceEl = document.getElementById("rateSource");
  lastUpdatedEl = document.getElementById("lastUpdated");
  refreshBtn = document.getElementById("refreshBtn");
  popupContainer = document.querySelector(".popup-container");

  // Load settings and rates
  loadSettings();
  loadExchangeRates();

  // Set up event listeners
  setupEventListeners();
}

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get([
      "enabled",
      "useManualRate",
      "manualRate",
    ]);

    enabledToggle.checked = result.enabled !== false;
    manualRateToggle.checked = result.useManualRate || false;
    manualRateInput.value = result.manualRate || 83.0;

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
      liveRate = response.rates.INR;
      rateTimestamp = response.timestamp;
      updateRateDisplay();
    } else if (response && response.error) {
      showRateError(response.error);
    }
  } catch (e) {
    console.error("Error loading rates:", e);
    showRateError("Could not load rates");
  }
}

function updateRateDisplay() {
  const useManual = manualRateToggle.checked;
  const manualRate = parseFloat(manualRateInput.value);

  if (useManual && !isNaN(manualRate) && manualRate > 0) {
    currentRateEl.textContent = manualRate.toFixed(2);
    rateSourceEl.textContent = "Manual rate";
    rateSourceEl.className = "rate-source manual";
  } else if (liveRate) {
    currentRateEl.textContent = liveRate.toFixed(2);
    rateSourceEl.textContent = "Live rate";
    rateSourceEl.className = "rate-source";
  } else {
    currentRateEl.textContent = "--";
    rateSourceEl.textContent = "Loading...";
    rateSourceEl.className = "rate-source";
  }

  // Update last updated time
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
  currentRateEl.textContent = "--";
  rateSourceEl.textContent = message;
  rateSourceEl.className = "rate-source error";
}

function updateUIState() {
  const isEnabled = enabledToggle.checked;
  const useManual = manualRateToggle.checked;

  // Toggle disabled state
  if (isEnabled) {
    popupContainer.classList.remove("disabled");
  } else {
    popupContainer.classList.add("disabled");
  }

  // Toggle manual rate input visibility
  if (useManual) {
    manualRateContainer.classList.add("visible");
  } else {
    manualRateContainer.classList.remove("visible");
  }

  updateRateDisplay();
}

function setupEventListeners() {
  // Enable/disable toggle
  enabledToggle.addEventListener("change", async () => {
    const enabled = enabledToggle.checked;
    await chrome.storage.sync.set({ enabled });
    updateUIState();
  });

  // Manual rate toggle
  manualRateToggle.addEventListener("change", async () => {
    const useManualRate = manualRateToggle.checked;
    await chrome.storage.sync.set({ useManualRate });
    updateUIState();
  });

  // Manual rate input
  let inputTimeout;
  manualRateInput.addEventListener("input", () => {
    // Debounce the save
    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(async () => {
      const value = parseFloat(manualRateInput.value);
      if (!isNaN(value) && value > 0) {
        await chrome.storage.sync.set({ manualRate: value });
        updateRateDisplay();
      }
    }, 300);
  });

  // Refresh button
  refreshBtn.addEventListener("click", async () => {
    refreshBtn.classList.add("loading");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "refreshRates",
      });

      if (response && response.success && response.rates) {
        liveRate = response.rates.INR;
        rateTimestamp = Date.now();
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

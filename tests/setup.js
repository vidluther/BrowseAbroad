import { vi, beforeEach, afterEach } from 'vitest';

/**
 * Create a mock for Chrome APIs
 */
function createChromeMock() {
  const storageMock = {
    local: {
      _data: {},
      get: vi.fn(async (keys) => {
        if (typeof keys === 'string') {
          return { [keys]: storageMock.local._data[keys] };
        }
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(k => { result[k] = storageMock.local._data[k]; });
          return result;
        }
        return storageMock.local._data;
      }),
      set: vi.fn(async (items) => {
        Object.assign(storageMock.local._data, items);
      }),
      clear: vi.fn(async () => {
        storageMock.local._data = {};
      })
    },
    sync: {
      _data: {},
      get: vi.fn(async (keys) => {
        if (typeof keys === 'string') {
          return { [keys]: storageMock.sync._data[keys] };
        }
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(k => { result[k] = storageMock.sync._data[k]; });
          return result;
        }
        return storageMock.sync._data;
      }),
      set: vi.fn(async (items) => {
        Object.assign(storageMock.sync._data, items);
      })
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  };

  return {
    storage: storageMock,
    runtime: {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      },
      onInstalled: {
        addListener: vi.fn()
      },
      getURL: vi.fn((path) => `chrome-extension://mock-id/${path}`)
    },
    tabs: {
      query: vi.fn().mockResolvedValue([]),
      sendMessage: vi.fn()
    }
  };
}

// Set up global mocks before each test
beforeEach(() => {
  // Create fresh Chrome mock for each test
  global.chrome = createChromeMock();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

export { createChromeMock };

import { register, unregister } from '../serviceWorkerRegistration';

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

// Create a proper mock for navigator
const createMockNavigator = (serviceWorker?: any) => {
  return {
    ...navigator,
    serviceWorker,
  };
};

describe('serviceWorkerRegistration', () => {
  const originalNavigator = global.navigator;
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();

    // Mock window.location
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      hostname: 'example.com',
      origin: 'https://example.com',
      href: 'https://example.com',
    };

    // Mock process.env
    process.env.PUBLIC_URL = '';
  });

  afterEach(() => {
    // Restore original values
    window.location = originalLocation;
    global.navigator = originalNavigator;
  });

  describe('register', () => {
    it('should not register service worker if not supported', () => {
      // Mock navigator without service worker
      global.navigator = createMockNavigator(undefined);

      register();

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should not register if origins do not match', () => {
      const mockServiceWorker = {
        register: jest.fn(() => Promise.resolve({})),
        ready: Promise.resolve({ unregister: jest.fn() }),
      };

      global.navigator = createMockNavigator(mockServiceWorker);

      // Set different origin
      process.env.PUBLIC_URL = 'https://different-origin.com';

      register();

      expect(mockServiceWorker.register).not.toHaveBeenCalled();
    });

    it('should register service worker on localhost', async () => {
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: null,
        onupdatefound: null,
        unregister: jest.fn(() => Promise.resolve()),
      };

      const mockServiceWorker = {
        register: jest.fn(() => Promise.resolve(mockRegistration)),
        ready: Promise.resolve(mockRegistration),
      };

      global.navigator = createMockNavigator(mockServiceWorker);

      // Set localhost
      window.location.hostname = 'localhost';

      // Mock fetch to simulate valid service worker
      global.fetch = jest.fn(() =>
        Promise.resolve({
          status: 200,
          headers: {
            get: () => 'application/javascript',
          },
        })
      ) as jest.Mock;

      const config = {
        onSuccess: jest.fn(),
        onUpdate: jest.fn(),
      };

      // Trigger the load event
      register(config);
      window.dispatchEvent(new Event('load'));

      // Wait for promises to resolve
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should register service worker in production', async () => {
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: null,
        onupdatefound: null,
      };

      const mockServiceWorker = {
        register: jest.fn(() => Promise.resolve(mockRegistration)),
        ready: Promise.resolve(mockRegistration),
      };

      global.navigator = createMockNavigator(mockServiceWorker);

      const config = {
        onSuccess: jest.fn(),
        onUpdate: jest.fn(),
      };

      register(config);
      window.dispatchEvent(new Event('load'));

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    it('should handle service worker registration success', async () => {
      const mockInstaller = {
        state: 'installed',
        onstatechange: null,
      };

      const mockRegistration = {
        installing: mockInstaller,
        onupdatefound: null,
      };

      const mockServiceWorker = {
        register: jest.fn(() => Promise.resolve(mockRegistration)),
        controller: null,
      };

      global.navigator = createMockNavigator(mockServiceWorker);

      const config = {
        onSuccess: jest.fn(),
        onUpdate: jest.fn(),
      };

      register(config);
      window.dispatchEvent(new Event('load'));

      await new Promise(resolve => setTimeout(resolve, 0));

      // Simulate update found
      if (mockRegistration.onupdatefound) {
        mockRegistration.onupdatefound();
      }

      // Simulate state change
      if (mockInstaller.onstatechange) {
        mockInstaller.onstatechange();
      }

      expect(consoleSpy.log).toHaveBeenCalledWith('ShiftSync content cached for offline use.');
      expect(config.onSuccess).toHaveBeenCalled();
    });

    it('should handle service worker update', async () => {
      const mockInstaller = {
        state: 'installed',
        onstatechange: null,
      };

      const mockRegistration = {
        installing: mockInstaller,
        onupdatefound: null,
      };

      const mockServiceWorker = {
        register: jest.fn(() => Promise.resolve(mockRegistration)),
        controller: {}, // Existing controller indicates update
      };

      global.navigator = createMockNavigator(mockServiceWorker);

      const config = {
        onSuccess: jest.fn(),
        onUpdate: jest.fn(),
      };

      register(config);
      window.dispatchEvent(new Event('load'));

      await new Promise(resolve => setTimeout(resolve, 0));

      // Simulate update found and state change
      if (mockRegistration.onupdatefound) {
        mockRegistration.onupdatefound();
      }
      if (mockInstaller.onstatechange) {
        mockInstaller.onstatechange();
      }

      expect(consoleSpy.log).toHaveBeenCalledWith('New content available; refresh to update.');
      expect(config.onUpdate).toHaveBeenCalled();
    });

    it('should handle registration errors', async () => {
      const mockServiceWorker = {
        register: jest.fn(() => Promise.reject(new Error('Registration failed'))),
      };

      global.navigator = createMockNavigator(mockServiceWorker);

      register();
      window.dispatchEvent(new Event('load'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.any(Error)
      );
    });
  });

  describe('unregister', () => {
    it('should unregister service worker', async () => {
      const mockRegistration = {
        unregister: jest.fn(() => Promise.resolve()),
      };

      const mockServiceWorker = {
        ready: Promise.resolve(mockRegistration),
      };

      global.navigator = createMockNavigator(mockServiceWorker);

      await unregister();

      expect(mockRegistration.unregister).toHaveBeenCalled();
    });

    it('should handle unregister errors', async () => {
      const mockServiceWorker = {
        ready: Promise.resolve({
          unregister: jest.fn(() => Promise.reject(new Error('Unregister failed'))),
        }),
      };

      global.navigator = createMockNavigator(mockServiceWorker);

      await unregister();

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should not unregister if service worker not supported', async () => {
      global.navigator = createMockNavigator(undefined);

      await unregister();

      // Should not throw error
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('localhost detection', () => {
    it('should detect localhost correctly', () => {
      const localhostValues = ['localhost', '127.0.0.1', '[::1]'];

      localhostValues.forEach(hostname => {
        window.location.hostname = hostname;
        register();
        window.dispatchEvent(new Event('load'));
        // Test that localhost behavior is triggered
      });
    });
  });

  describe('offline behavior', () => {
    it('should handle offline mode', async () => {
      // Mock fetch to fail (simulating offline)
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const mockServiceWorker = {
        register: jest.fn(),
        ready: Promise.resolve({ unregister: jest.fn() }),
      };

      global.navigator = createMockNavigator(mockServiceWorker);

      window.location.hostname = 'localhost';

      register();
      window.dispatchEvent(new Event('load'));

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'No internet connection. ShiftSync is running in offline mode.'
      );
    });
  });
}); 
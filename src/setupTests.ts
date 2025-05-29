// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock CSS imports
jest.mock('react-datepicker/dist/react-datepicker.css', () => ({}));

// Mock framer-motion completely for testing
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    path: 'path',
    svg: 'svg',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    p: 'p',
    section: 'section',
    article: 'article',
    header: 'header',
    footer: 'footer',
    nav: 'nav',
    aside: 'aside',
    main: 'main',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: (initial: any) => ({ get: () => initial, set: jest.fn() }),
  useTransform: () => ({ get: () => 0, set: jest.fn() }),
  useSpring: (value: any) => ({ get: () => value, set: jest.fn() }),
  useCycle: () => [0, jest.fn()],
  useMotionTemplate: () => '',
}));

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.matchMedia for responsive design tests and framer-motion
const createMatchMediaMock = () => {
  const mockResult = {
    matches: false,
    media: '',
    onchange: null,
    addListener: jest.fn(), // Deprecated but still used by some libraries
    removeListener: jest.fn(), // Deprecated but still used by some libraries
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
  
  return jest.fn().mockImplementation((query) => {
    const result = {
      ...mockResult,
      media: query,
    };
    
    // Special case for prefers-reduced-motion to support framer-motion
    if (query === '(prefers-reduced-motion: reduce)') {
      result.matches = false;
    }
    
    return result;
  });
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: createMatchMediaMock(),
});

// Additional framer-motion support
Object.defineProperty(window, 'CSS', {
  value: {
    supports: jest.fn(() => true),
  },
  writable: true,
});

// Mock requestAnimationFrame for animations
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

// Mock navigator.vibrate for haptic feedback tests
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
});

// Mock service worker for PWA tests
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      onupdatefound: null,
    })),
    ready: Promise.resolve({
      unregister: jest.fn(() => Promise.resolve()),
    }),
  },
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Enhanced fetch mock with proper promise handling
const createMockResponse = (data: any, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Error',
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  headers: {
    get: (name: string) => {
      if (name === 'content-type') return 'text/html';
      return null;
    },
  },
});

// Global fetch mock
global.fetch = jest.fn().mockImplementation((url: string) => {
  // Default successful response for service worker
  if (typeof url === 'string' && url.includes('sw.js')) {
    return Promise.resolve(createMockResponse('', true, 200));
  }
  // Default response for other requests
  return Promise.resolve(createMockResponse({ success: true }));
});

// Service Worker mock
const mockServiceWorker = {
  register: jest.fn(() => Promise.resolve({
    installing: null,
    waiting: null,
    active: {
      scriptURL: '/sw.js',
      state: 'activated',
    },
    scope: '/',
    update: jest.fn(() => Promise.resolve()),
    unregister: jest.fn(() => Promise.resolve(true)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
  getRegistration: jest.fn(() => Promise.resolve(null)),
  getRegistrations: jest.fn(() => Promise.resolve([])),
};

// Only define serviceWorker if it doesn't exist
if (!navigator.serviceWorker) {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: mockServiceWorker,
    writable: true,
    configurable: true,
  });
}

// Silence console.error during tests unless needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('DATEUTILS:') ||
       args[0].includes('Failed to create AudioContext') ||
       args[0].includes('Error playing sound') ||
       args[0].includes('React Router Future Flag Warning'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests to prevent memory leaks
afterEach(() => {
  // Clean up any timers that might be hanging
  jest.clearAllTimers();
});

// Remove the problematic global timer mocks that conflict with individual test files
// Individual test files should handle their own timer mocking as needed 
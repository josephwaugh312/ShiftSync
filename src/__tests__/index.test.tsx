import React from 'react';
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';

// Mock React DOM
const mockRender = jest.fn();
const mockCreateRoot = jest.fn(() => ({
  render: mockRender
}));

jest.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot
}));

// Mock the App component
jest.mock('../App', () => {
  return function MockApp() {
    return 'div';
  };
});

// Mock the store
jest.mock('../store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(),
    subscribe: jest.fn()
  }
}));

// Mock service worker registration
const mockRegister = jest.fn();
jest.mock('../serviceWorkerRegistration', () => ({
  register: mockRegister
}));

// Mock CSS import
jest.mock('../styles/index.css', () => ({}));

describe('Application Bootstrap (index.tsx)', () => {
  let mockConsoleLog: jest.SpyInstance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset the createRoot mock to return proper object
    mockCreateRoot.mockReturnValue({
      render: mockRender
    });
    
    // Setup DOM
    document.body.innerHTML = '<div id="root"></div>';
    
    // Mock console.log for service worker messages
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    
    // Clear the module from cache to ensure fresh import
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('React Application Initialization', () => {
    it('should create React root with the correct DOM element', () => {
      // Import index.tsx to trigger initialization
      require('../index');
      
      const rootElement = document.getElementById('root');
      expect(mockCreateRoot).toHaveBeenCalledWith(rootElement);
    });

    it('should render the app with all required providers', () => {
      // Import index.tsx to trigger initialization
      require('../index');
      
      expect(mockRender).toHaveBeenCalledTimes(1);
      
      // Verify the rendered structure includes all providers
      const renderedElement = mockRender.mock.calls[0][0];
      expect(renderedElement.type).toBe(React.StrictMode);
      
      // Check nested structure - Provider is the first child of StrictMode
      const strictModeChild = renderedElement.props.children;
      expect(strictModeChild.type.displayName || strictModeChild.type.name).toContain('Provider');
      
      // BrowserRouter is child of Provider
      const providerChild = strictModeChild.props.children;
      expect(providerChild.type.displayName || providerChild.type.name).toContain('Router');
    });

    it('should include Redux Provider with store', () => {
      // Import index.tsx to trigger initialization
      require('../index');
      
      const renderedElement = mockRender.mock.calls[0][0];
      const strictModeChild = renderedElement.props.children;
      
      expect(strictModeChild.props.store).toBeDefined();
    });

    it('should wrap app in React.StrictMode', () => {
      // Import index.tsx to trigger initialization
      require('../index');
      
      const renderedElement = mockRender.mock.calls[0][0];
      expect(renderedElement.type).toBe(React.StrictMode);
    });
  });

  describe('Service Worker Registration', () => {
    it('should register service worker with success and update callbacks', () => {
      // Import index.tsx to trigger initialization
      require('../index');
      
      expect(mockRegister).toHaveBeenCalledTimes(1);
      expect(mockRegister).toHaveBeenCalledWith({
        onSuccess: expect.any(Function),
        onUpdate: expect.any(Function)
      });
    });

    it('should log success message when service worker registration succeeds', () => {
      // Import index.tsx to trigger initialization
      require('../index');
      
      const registerCall = mockRegister.mock.calls[0][0];
      const { onSuccess } = registerCall;
      
      onSuccess();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'ShiftSync PWA: App cached successfully for offline use'
      );
    });

    it('should log update message when service worker has updates', () => {
      // Import index.tsx to trigger initialization
      require('../index');
      
      const registerCall = mockRegister.mock.calls[0][0];
      const { onUpdate } = registerCall;
      
      onUpdate();
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'ShiftSync PWA: New version available, refresh to update'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing root element gracefully', () => {
      // Remove root element
      document.body.innerHTML = '';
      
      // Mock createRoot to handle null element
      mockCreateRoot.mockImplementation((element) => {
        if (!element) {
          return {
            render: jest.fn()
          };
        }
        return {
          render: mockRender
        };
      });
      
      expect(() => {
        require('../index');
      }).not.toThrow();
      
      expect(mockCreateRoot).toHaveBeenCalledWith(null);
    });

    it('should handle service worker registration errors', () => {
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      
      mockRegister.mockImplementation(() => {
        throw new Error('Service worker registration failed');
      });
      
      expect(() => {
        require('../index');
      }).not.toThrow();
      
      // Verify error was logged
      expect(consoleDebugSpy).toHaveBeenCalledWith('Service worker registration failed:', expect.any(Error));
      
      consoleDebugSpy.mockRestore();
    });
  });

  describe('Integration Test', () => {
    it('should successfully bootstrap the complete application', () => {
      // Import index.tsx to trigger initialization
      require('../index');
      
      // Verify all critical initialization steps
      expect(mockCreateRoot).toHaveBeenCalled();
      expect(mockRender).toHaveBeenCalled();
      expect(mockRegister).toHaveBeenCalled();
      
      // Verify the app structure
      const renderedElement = mockRender.mock.calls[0][0];
      expect(renderedElement.type).toBe(React.StrictMode);
    });
  });
}); 
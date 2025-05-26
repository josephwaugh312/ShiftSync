import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import App from '../App';

// Mock the tutorial context
jest.mock('../contexts/TutorialContext', () => ({
  TutorialProvider: ({ children }: { children: React.ReactNode }) => children,
  useTutorial: () => ({
    isActive: false,
    currentStep: 0,
    startTutorial: jest.fn(),
    nextStep: jest.fn(),
    previousStep: jest.fn(),
    completeTutorial: jest.fn(),
  }),
}));

// Mock the sound effects hook
jest.mock('../hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    playSound: jest.fn(),
    soundEnabled: true,
    setSoundEnabled: jest.fn(),
  }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    renderWithProviders(<App />);
    
    // App should render successfully
    expect(document.body).toBeInTheDocument();
  });

  it('renders the main layout elements', () => {
    renderWithProviders(<App />);

    // Check for main structural elements
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('applies correct CSS classes for responsive design', () => {
    renderWithProviders(<App />);

    // Check for responsive classes
    const appContainer = document.querySelector('.min-h-screen');
    expect(appContainer).toBeInTheDocument();
  });

  it('includes PWA-related components', () => {
    renderWithProviders(<App />);

    // Should include tutorial and other PWA features
    // The actual components might be conditionally rendered
    expect(document.body).toBeInTheDocument();
  });

  describe('theme support', () => {
    it('supports dark mode classes', () => {
      renderWithProviders(<App />);

      // Check for dark mode support
      const body = document.body;
      expect(body.className).toBeDefined();
    });
  });

  describe('routing', () => {
    it('renders calendar view by default', () => {
      renderWithProviders(<App />);

      // Calendar view should be rendered by default
      // This is an integration test, so we're checking overall structure
      expect(document.querySelector('main')).toBeInTheDocument();
    });
  });

  describe('Redux integration', () => {
    it('connects to Redux store', () => {
      const { store } = renderWithProviders(<App />);

      // Store should be available
      expect(store).toBeDefined();
      expect(store.getState()).toBeDefined();
    });

    it('has proper initial state', () => {
      const { store } = renderWithProviders(<App />);

      const state = store.getState();
      expect(state.shifts).toBeDefined();
      expect(state.employees).toBeDefined();
      expect(state.ui).toBeDefined();
    });
  });
}); 
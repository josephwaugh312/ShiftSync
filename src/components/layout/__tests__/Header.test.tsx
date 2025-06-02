import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';

// Test wrapper with future flags
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}
  >
    {children}
  </BrowserRouter>
);

describe('Header', () => {
  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
  });

  it('should display the app title', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    expect(screen.getByText('ShiftSync')).toBeInTheDocument();
  });

  describe('rendering', () => {
    it('should render the logo link', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );
      
      const logoLink = screen.getByRole('link');
      expect(logoLink).toBeInTheDocument();
    });

    it('should render the ShiftSync title', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );
      
      const title = screen.getByText('ShiftSync');
      expect(title).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );
      
      const container = document.querySelector('.flex.items-center');
      expect(container).toBeInTheDocument();
    });

    it('should render the logo gradient design', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );
      
      // Check for the gradient background elements
      const outerCircle = document.querySelector('.bg-gradient-to-r.from-blue-500.to-orange-500');
      expect(outerCircle).toBeInTheDocument();
    });

    it('should have dark mode classes', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );
      
      const title = screen.getByText('ShiftSync');
      expect(title).toHaveClass('dark:text-white');
    });
  });

  describe('accessibility', () => {
    it('should have a clickable logo link', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );
      
      const logoLink = screen.getByRole('link');
      expect(logoLink).toBeInTheDocument();
    });

    it('should have proper text content for screen readers', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );
      
      const title = screen.getByText('ShiftSync');
      expect(title).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should use flexbox layout', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );
      
      const container = document.querySelector('.flex.items-center');
      expect(container).toBeInTheDocument();
    });

    it('should have proper spacing and sizing', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );
      
      // Check logo circle sizing
      const outerCircle = document.querySelector('.h-10.w-10');
      expect(outerCircle).toBeInTheDocument();
      
      const innerCircle = document.querySelector('.h-8.w-8');
      expect(innerCircle).toBeInTheDocument();
      
      const centerCircle = document.querySelector('.h-6.w-6');
      expect(centerCircle).toBeInTheDocument();
    });
  });
}); 
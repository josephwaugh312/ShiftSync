import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';

// Helper function to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      {component}
    </BrowserRouter>
  );
};

describe('Header', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      renderWithRouter(<Header />);
      
      expect(screen.getByText('ShiftSync')).toBeInTheDocument();
    });

    it('should render the logo link', () => {
      renderWithRouter(<Header />);
      
      const logoLink = screen.getByRole('link');
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('should render the ShiftSync title', () => {
      renderWithRouter(<Header />);
      
      const title = screen.getByText('ShiftSync');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-xl', 'font-bold');
    });

    it('should have proper styling classes', () => {
      renderWithRouter(<Header />);
      
      const container = document.querySelector('.flex.items-center');
      expect(container).toBeInTheDocument();
      
      const logoLink = screen.getByRole('link');
      expect(logoLink).toHaveClass('flex-shrink-0', 'flex', 'items-center');
    });

    it('should render the logo gradient design', () => {
      renderWithRouter(<Header />);
      
      // Check for the gradient background elements
      const outerCircle = document.querySelector('.bg-gradient-to-r.from-blue-500.to-orange-500');
      expect(outerCircle).toBeInTheDocument();
      
      const innerCircle = document.querySelector('.bg-gradient-to-br.from-blue-500.to-orange-500');
      expect(innerCircle).toBeInTheDocument();
    });

    it('should have dark mode classes', () => {
      renderWithRouter(<Header />);
      
      const title = screen.getByText('ShiftSync');
      expect(title).toHaveClass('dark:text-white');
    });
  });

  describe('accessibility', () => {
    it('should have a clickable logo link', () => {
      renderWithRouter(<Header />);
      
      const logoLink = screen.getByRole('link');
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('should have proper text content for screen readers', () => {
      renderWithRouter(<Header />);
      
      const title = screen.getByText('ShiftSync');
      expect(title).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should use flexbox layout', () => {
      renderWithRouter(<Header />);
      
      const container = document.querySelector('.flex.items-center');
      expect(container).toBeInTheDocument();
      
      const logoContainer = document.querySelector('.flex-shrink-0.flex.items-center');
      expect(logoContainer).toBeInTheDocument();
    });

    it('should have proper spacing and sizing', () => {
      renderWithRouter(<Header />);
      
      // Check logo circle sizing
      const outerCircle = document.querySelector('.h-10.w-10');
      expect(outerCircle).toBeInTheDocument();
      
      const innerCircle = document.querySelector('.h-8.w-8');
      expect(innerCircle).toBeInTheDocument();
      
      const centerCircle = document.querySelector('.h-6.w-6');
      expect(centerCircle).toBeInTheDocument();
      
      // Check text spacing
      const title = screen.getByText('ShiftSync');
      expect(title).toHaveClass('ml-2');
    });
  });
}); 
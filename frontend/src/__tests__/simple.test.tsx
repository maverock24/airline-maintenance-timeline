import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Simple mock for Header component
const MockHeader = ({ isDarkMode, toggleTheme }: { isDarkMode: boolean; toggleTheme: () => void }) => (
  <div data-testid="mock-header">
    <h1>Aircraft Maintenance Timeline</h1>
    <button onClick={toggleTheme}>
      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
    </button>
  </div>
);

describe('Simple Component Tests', () => {
  it('renders mock header correctly', () => {
    const mockToggle = jest.fn();
    render(<MockHeader isDarkMode={false} toggleTheme={mockToggle} />);
    
    expect(screen.getByText('Aircraft Maintenance Timeline')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('calls toggle function when button clicked', async () => {
    const mockToggle = jest.fn();
    render(<MockHeader isDarkMode={false} toggleTheme={mockToggle} />);
    
    const button = screen.getByText('Dark Mode');
    await userEvent.click(button);
    
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('shows correct mode when dark mode is active', () => {
    const mockToggle = jest.fn();
    render(<MockHeader isDarkMode={true} toggleTheme={mockToggle} />);
    
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
  });
});

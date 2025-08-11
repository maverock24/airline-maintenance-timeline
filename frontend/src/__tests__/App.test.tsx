import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import App after mocks are set up
import App from '../App';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock moment with proper implementation
jest.mock('moment', () => {
  const mockMoment = () => ({
    startOf: () => mockMoment(),
    endOf: () => mockMoment(),
    format: () => 'Jan 01, 2024',
    add: () => mockMoment(),
    subtract: () => mockMoment(),
    clone: () => mockMoment(),
    diff: () => 0,
    isAfter: () => false,
    isBefore: () => false,
    isSame: () => false,
    valueOf: () => 1704110400000
  });
  
  return {
    __esModule: true,
    default: mockMoment
  };
});

// Mock the custom hook to avoid complex data fetching logic
jest.mock('../hooks/useTimelineData', () => ({
  __esModule: true,
  default: () => ({
    loading: false,
    error: null,
    items: [],
    groups: [],
    allRegistrations: [],
    allStatuses: [],
    workPackages: [],
    flights: []
  })
}));

// Mock all child components to focus on App logic
jest.mock('../components/Header', () => {
  return function MockHeader({ isDarkMode, toggleTheme }: any) {
    return (
      <div data-testid="header">
        <button onClick={toggleTheme} data-testid="theme-toggle">
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    );
  };
});

jest.mock('../components/ControlsAndStats', () => {
  return function MockControlsAndStats({ 
    viewMode, 
    setViewMode, 
    showFlights,
    setShowFlights 
  }: any) {
    return (
      <div data-testid="controls-and-stats">
        <button onClick={() => setViewMode('day')} data-testid="day-btn">Day</button>
        <button onClick={() => setViewMode('week')} data-testid="week-btn">Week</button>
        <button onClick={() => setViewMode('month')} data-testid="month-btn">Month</button>
        <button onClick={() => setShowFlights(!showFlights)} data-testid="flights-toggle">
          {showFlights ? 'Hide Flights' : 'Show Flights'}
        </button>
        <span data-testid="current-view-mode">{viewMode}</span>
      </div>
    );
  };
});

jest.mock('../components/TimelineControls', () => {
  return function MockTimelineControls() {
    return <div data-testid="timeline-controls">Timeline Controls</div>;
  };
});

jest.mock('../components/SelectedItemDisplay', () => {
  return function MockSelectedItemDisplay() {
    return <div data-testid="selected-item-display">Selected Item Display</div>;
  };
});

jest.mock('../components/SimpleTimeline', () => {
  return function MockSimpleTimeline() {
    return <div data-testid="simple-timeline">Timeline</div>;
  };
});

describe('App Component Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Mock the API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders all main components', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('controls-and-stats')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-controls')).toBeInTheDocument();
    expect(screen.getByTestId('selected-item-display')).toBeInTheDocument();
    expect(screen.getByTestId('simple-timeline')).toBeInTheDocument();
  });

  it('toggles dark mode', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    const toggleButton = screen.getByTestId('theme-toggle');
    expect(toggleButton).toHaveTextContent('Dark Mode');
    
    await userEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent('Light Mode');
  });

  it('changes view mode', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('current-view-mode')).toBeInTheDocument();
    });

    expect(screen.getByTestId('current-view-mode')).toHaveTextContent('week');

    const dayButton = screen.getByTestId('day-btn');
    await userEvent.click(dayButton);
    expect(screen.getByTestId('current-view-mode')).toHaveTextContent('day');

    const monthButton = screen.getByTestId('month-btn');
    await userEvent.click(monthButton);
    expect(screen.getByTestId('current-view-mode')).toHaveTextContent('month');
  });

  it('toggles flight visibility', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('flights-toggle')).toBeInTheDocument();
    });

    const flightsToggle = screen.getByTestId('flights-toggle');
    expect(flightsToggle).toHaveTextContent('Hide Flights'); // Initially true
    
    await userEvent.click(flightsToggle);
    expect(flightsToggle).toHaveTextContent('Show Flights');
  });

  it('has correct initial state', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('current-view-mode')).toHaveTextContent('week');
    });
    
    expect(screen.getByTestId('flights-toggle')).toHaveTextContent('Hide Flights');
    expect(screen.getByTestId('theme-toggle')).toHaveTextContent('Dark Mode');
  });
});

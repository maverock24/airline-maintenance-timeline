import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import '@testing-library/jest-dom';
import Header from '../../components/Header';
import { TIME_CONSTANTS } from '../../utils/constants';

// Mock moment to control time
jest.mock('moment', () => {
  const mockMoment = () => ({
    format: (format: string) => {
      if (format === 'dddd, MMMM DD, YYYY') return 'Monday, January 01, 2024';
      if (format === 'HH:mm:ss') return '12:34:56';
      return 'formatted-date';
    },
  });

  return {
    __esModule: true,
    default: mockMoment,
  };
});

describe('Header Component', () => {
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock timer functions before using fake timers
    Object.defineProperty(global, 'setInterval', {
      value: jest.fn(setInterval),
      writable: true,
    });
    Object.defineProperty(global, 'clearInterval', {
      value: jest.fn(clearInterval),
      writable: true,
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders header with title and subtitle', () => {
    render(<Header isDarkMode={false} toggleTheme={mockToggleTheme} />);

    expect(
      screen.getByText('✈️ Aircraft Maintenance Timeline')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Real-time visualization of flight schedules and maintenance work packages'
      )
    ).toBeInTheDocument();
  });

  it('displays current date and time', () => {
    render(<Header isDarkMode={false} toggleTheme={mockToggleTheme} />);

    expect(screen.getByText('Monday, January 01, 2024')).toBeInTheDocument();
    expect(screen.getByText('12:34:56')).toBeInTheDocument();
  });

  it('shows moon icon when in light mode', () => {
    render(<Header isDarkMode={false} toggleTheme={mockToggleTheme} />);

    const themeButton = screen.getByTitle('Switch to dark mode');
    expect(themeButton).toBeInTheDocument();
    expect(themeButton).toHaveTextContent('🌙');
  });

  it('shows sun icon when in dark mode', () => {
    render(<Header isDarkMode={true} toggleTheme={mockToggleTheme} />);

    const themeButton = screen.getByTitle('Switch to light mode');
    expect(themeButton).toBeInTheDocument();
    expect(themeButton).toHaveTextContent('☀️');
  });

  it('calls toggleTheme when theme button is clicked', async () => {
    render(<Header isDarkMode={false} toggleTheme={mockToggleTheme} />);

    const themeButton = screen.getByTitle('Switch to dark mode');
    await userEvent.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('updates time every second', () => {
    const setInterval = jest.spyOn(global, 'setInterval');
    const clearInterval = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(
      <Header isDarkMode={false} toggleTheme={mockToggleTheme} />
    );

    expect(setInterval).toHaveBeenCalledWith(
      expect.any(Function),
      TIME_CONSTANTS.CLOCK_UPDATE_INTERVAL
    );

    unmount();
    expect(clearInterval).toHaveBeenCalled();
  });

  it.skip('has correct accessibility attributes', () => {
    render(<Header isDarkMode={false} toggleTheme={mockToggleTheme} />);

    const themeButton = screen.getByTitle('Switch to dark mode');
    expect(themeButton).toHaveAttribute('title', 'Switch to dark mode');
  });
});

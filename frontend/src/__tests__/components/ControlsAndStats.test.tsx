import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import moment from 'moment';
import React from 'react';
import ControlsAndStats from '../../components/ControlsAndStats';
import { Flight, WorkPackage, TimelineItem } from '../../utils/types';

// Mock the helpers module
jest.mock('../../utils/helpers', () => ({
  getStatusColor: jest.fn(
    (status: string) => `color-${status.toLowerCase().replace(' ', '-')}`
  ),
  getStatusSymbol: jest.fn((status: string) => `${status[0].toLowerCase()}`),
}));

describe('ControlsAndStats Component', () => {
  const mockProps = {
    viewMode: 'week' as const,
    setViewMode: jest.fn(),
    navigateTimeline: jest.fn(),
    goToToday: jest.fn(),
    highlightedDate: null,
    timelineStart: moment('2024-01-01'),
    jumpToDate: jest.fn(),
    showFlights: true,
    setShowFlights: jest.fn(),
    flights: [
      {
        flightId: '1',
        flightNum: 'AA123',
        registration: 'N123AB',
        schedDepStation: 'JFK',
        schedArrStation: 'LAX',
        schedDepTime: '2024-01-01T10:00:00Z',
        schedArrTime: '2024-01-01T13:00:00Z',
      },
    ] as Flight[],
    workPackages: [
      {
        workPackageId: '1',
        name: 'A-Check',
        registration: 'N123AB',
        startDateTime: '2024-01-01T08:00:00Z',
        endDateTime: '2024-01-01T18:00:00Z',
        workOrders: 5,
        status: 'In Progress',
      },
      {
        workPackageId: '2',
        name: 'B-Check',
        registration: 'N456CD',
        startDateTime: '2024-01-02T09:00:00Z',
        endDateTime: '2024-01-02T17:00:00Z',
        workOrders: 3,
        status: 'Open',
      },
    ] as WorkPackage[],
    allStatuses: ['Open', 'In Progress', 'Completed'],
    filteredStatuses: [],
    handleStatusFilter: jest.fn(),
    items: [
      {
        id: '1',
        group: 'N123AB',
        title: 'Flight AA123',
        start_time: moment('2024-01-01T10:00:00Z'),
        end_time: moment('2024-01-01T13:00:00Z'),
      },
      {
        id: '2',
        group: 'N123AB',
        title: 'A-Check',
        start_time: moment('2024-01-01T08:00:00Z'),
        end_time: moment('2024-01-01T18:00:00Z'),
      },
    ] as TimelineItem[],
    allRegistrations: ['N123AB', 'N456CD'],
    filteredRegistrations: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation controls', () => {
    render(<ControlsAndStats {...mockProps} />);

    expect(
      screen.getByRole('button', { name: /previous/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
  });

  it('renders view mode buttons', () => {
    render(<ControlsAndStats {...mockProps} />);

    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  it('highlights current view mode', () => {
    render(<ControlsAndStats {...mockProps} />);

    const weekButton = screen.getByText('Week');
    expect(weekButton).toHaveClass('active');
  });

  it('calls setViewMode when view mode button is clicked', async () => {
    render(<ControlsAndStats {...mockProps} />);

    const dayButton = screen.getByText('Day');
    await userEvent.click(dayButton);

    expect(mockProps.setViewMode).toHaveBeenCalledWith('day');
  });

  it('calls navigateTimeline when navigation buttons are clicked', async () => {
    render(<ControlsAndStats {...mockProps} />);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    const nextButton = screen.getByRole('button', { name: /next/i });

    await userEvent.click(prevButton);
    expect(mockProps.navigateTimeline).toHaveBeenCalledWith('prev');

    await userEvent.click(nextButton);
    expect(mockProps.navigateTimeline).toHaveBeenCalledWith('next');
  });

  it('calls goToToday when today button is clicked', async () => {
    render(<ControlsAndStats {...mockProps} />);

    const todayButton = screen.getByRole('button', { name: /today/i });
    await userEvent.click(todayButton);

    expect(mockProps.goToToday).toHaveBeenCalledTimes(1);
  });

  it('displays statistics correctly', () => {
    render(<ControlsAndStats {...mockProps} />);

    // Should show visible flights count
    expect(screen.getByText('Visible Flights')).toBeInTheDocument();
    // Should show total work orders count
    expect(screen.getByText('Total WOs')).toBeInTheDocument();
    // Should show total aircraft count
    expect(screen.getByText('Total Aircraft')).toBeInTheDocument();
  });

  it('renders status filter buttons', () => {
    render(<ControlsAndStats {...mockProps} />);

    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /in progress/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /completed/i })
    ).toBeInTheDocument();
  });

  it('calls handleStatusFilter when status button is clicked', async () => {
    render(<ControlsAndStats {...mockProps} />);

    const openStatusButton = screen.getByRole('button', { name: /open/i });
    await userEvent.click(openStatusButton);

    expect(mockProps.handleStatusFilter).toHaveBeenCalledWith('Open');
  });

  it('renders flight toggle', () => {
    render(<ControlsAndStats {...mockProps} />);

    const flightButton = screen.getByRole('button', { name: /flights/i });
    expect(flightButton).toBeInTheDocument();
  });

  it('calls setShowFlights when flight toggle is clicked', async () => {
    render(<ControlsAndStats {...mockProps} />);

    const flightButton = screen.getByRole('button', { name: /flights/i });
    await userEvent.click(flightButton);

    expect(mockProps.setShowFlights).toHaveBeenCalledWith(expect.any(Function));
  });

  it('displays filtered status correctly', () => {
    const propsWithFilteredStatus = {
      ...mockProps,
      filteredStatuses: ['Open'],
    };

    render(<ControlsAndStats {...propsWithFilteredStatus} />);

    const openStatusButton = screen.getByRole('button', { name: /open/i });
    expect(openStatusButton).toHaveClass('inactive');
  });

  it('shows correct stats when flights are hidden', () => {
    const propsWithoutFlights = {
      ...mockProps,
      showFlights: false,
    };

    render(<ControlsAndStats {...propsWithoutFlights} />);

    // When flights are hidden, visible flights should be 0
    expect(screen.getByText(/visible flights/i)).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import moment from 'moment';
import React from 'react';
import SelectedItemDisplay from '../../components/SelectedItemDisplay';
import { TimelineItem } from '../../utils/types';

// Mock moment to control time
jest.mock('moment', () => {
  const mockMoment = () => ({
    format: (format: string) => {
      if (format === 'MMM DD HH:mm') return 'Jan 01 10:00';
      if (format === 'HH:mm') return '13:00';
      return 'formatted-date';
    },
    diff: () => 10800000, // 3 hours in milliseconds
    isAfter: () => false,
    valueOf: () => 1704110400000, // Fixed timestamp
  });

  mockMoment.duration = () => ({
    humanize: () => '3 hours',
  });

  return {
    __esModule: true,
    default: mockMoment,
  };
});

describe('SelectedItemDisplay Component', () => {
  const mockOnDeselect = jest.fn();

  const mockFlightItem: TimelineItem = {
    id: 'flight-1',
    group: 'N123AB',
    title: 'Flight | AA123 JFK→LAX',
    start_time: moment('2024-01-01T10:00:00Z'),
    end_time: moment('2024-01-01T13:00:00Z'),
  };

  const mockWorkPackageItem: TimelineItem = {
    id: 'wp-1',
    group: 'N123AB',
    title: 'A-Check',
    start_time: moment('2024-01-01T08:00:00Z'),
    end_time: moment('2024-01-01T18:00:00Z'),
  };

  const mockItems: TimelineItem[] = [mockFlightItem, mockWorkPackageItem];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays message when no item is selected and no upcoming items', () => {
    render(
      <SelectedItemDisplay
        selectedItem={null}
        onDeselect={mockOnDeselect}
        items={[]}
      />
    );

    expect(
      screen.getByText(
        'No item selected. Click an item on the timeline to see details.'
      )
    ).toBeInTheDocument();
  });

  it('displays selected flight item correctly', () => {
    render(
      <SelectedItemDisplay
        selectedItem={mockFlightItem}
        onDeselect={mockOnDeselect}
        items={mockItems}
      />
    );

    expect(screen.getByText('✈️ N123AB')).toBeInTheDocument();
    expect(screen.getByText('Jan 01 10:00')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
    expect(screen.getByText('13:00')).toBeInTheDocument();
    expect(screen.getByText('(3 hours)')).toBeInTheDocument();
    expect(screen.getByText('AA123 JFK→LAX')).toBeInTheDocument();
  });

  it('displays selected work package item correctly', () => {
    render(
      <SelectedItemDisplay
        selectedItem={mockWorkPackageItem}
        onDeselect={mockOnDeselect}
        items={mockItems}
      />
    );

    expect(screen.getByText('🔧 N123AB')).toBeInTheDocument();
    expect(screen.getByText('Jan 01 10:00')).toBeInTheDocument();
    expect(screen.getByText('A-Check')).toBeInTheDocument();
  });

  it('handles title parsing for flight items', () => {
    const flightWithPipe = {
      ...mockFlightItem,
      title: 'Flight | UA456 LAX→JFK',
    };

    render(
      <SelectedItemDisplay
        selectedItem={flightWithPipe}
        onDeselect={mockOnDeselect}
        items={mockItems}
      />
    );

    expect(screen.getByText('UA456 LAX→JFK')).toBeInTheDocument();
  });

  it('handles title without pipe separator', () => {
    const itemWithoutPipe = {
      ...mockWorkPackageItem,
      title: 'Simple Title',
    };

    render(
      <SelectedItemDisplay
        selectedItem={itemWithoutPipe}
        onDeselect={mockOnDeselect}
        items={mockItems}
      />
    );

    expect(screen.getByText('Simple Title')).toBeInTheDocument();
  });

  it('displays flight icon for flight items', () => {
    render(
      <SelectedItemDisplay
        selectedItem={mockFlightItem}
        onDeselect={mockOnDeselect}
        items={mockItems}
      />
    );

    expect(screen.getByText(/✈️/)).toBeInTheDocument();
  });

  it('displays maintenance icon for non-flight items', () => {
    render(
      <SelectedItemDisplay
        selectedItem={mockWorkPackageItem}
        onDeselect={mockOnDeselect}
        items={mockItems}
      />
    );

    expect(screen.getByText(/🔧/)).toBeInTheDocument();
  });

  it('shows duration in human readable format', () => {
    render(
      <SelectedItemDisplay
        selectedItem={mockFlightItem}
        onDeselect={mockOnDeselect}
        items={mockItems}
      />
    );

    expect(screen.getByText('(3 hours)')).toBeInTheDocument();
  });

  it('renders correctly', () => {
    render(
      <SelectedItemDisplay
        selectedItem={mockFlightItem}
        onDeselect={mockOnDeselect}
        items={mockItems}
        inline={true}
      />
    );

    expect(screen.getByText('✈️ N123AB')).toBeInTheDocument();
  });
});

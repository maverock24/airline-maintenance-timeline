import { renderHook, waitFor } from '@testing-library/react';
import useTimelineData from '../../hooks/useTimelineData';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock helpers
jest.mock('../../utils/helpers', () => ({
  getStatusColor: jest.fn(
    (status: string) => `color-${status.toLowerCase().replace(' ', '-')}`
  ),
  getStatusSymbol: jest.fn((status: string) => `${status[0].toLowerCase()}`),
}));

describe('useTimelineData Hook', () => {
  const mockFlights = [
    {
      flightId: '1',
      flightNum: 'AA123',
      registration: 'N123AB',
      schedDepStation: 'JFK',
      schedArrStation: 'LAX',
      schedDepTime: '2024-01-01T10:00:00Z',
      schedArrTime: '2024-01-01T13:00:00Z',
    },
    {
      flightId: '2',
      flightNum: 'UA456',
      registration: 'N456CD',
      schedDepStation: 'LAX',
      schedArrStation: 'JFK',
      schedDepTime: '2024-01-02T14:00:00Z',
      schedArrTime: '2024-01-02T17:00:00Z',
    },
  ];

  const mockWorkPackages = [
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
  ];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches and processes data successfully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFlights,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkPackages,
      } as Response);

    const { result } = renderHook(() =>
      useTimelineData({
        showFlights: true,
        filteredRegistrations: [],
        filteredStatuses: [],
      })
    );

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.flights).toEqual(mockFlights);
    expect(result.current.workPackages).toEqual(mockWorkPackages);
    expect(result.current.allRegistrations).toEqual(['N123AB', 'N456CD']);
    expect(result.current.allStatuses).toEqual(['In Progress', 'Open']);
    expect(result.current.items).toHaveLength(4); // 2 flights + 2 work packages
    expect(result.current.groups).toHaveLength(2); // 2 aircraft registrations
  });

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useTimelineData({
        showFlights: true,
        filteredRegistrations: [],
        filteredStatuses: [],
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.flights).toEqual([]);
    expect(result.current.workPackages).toEqual([]);
  });

  it('handles HTTP errors correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(() =>
      useTimelineData({
        showFlights: true,
        filteredRegistrations: [],
        filteredStatuses: [],
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch flights: 404');
  });

  it('filters out flights when showFlights is false', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFlights,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkPackages,
      } as Response);

    const { result } = renderHook(() =>
      useTimelineData({
        showFlights: false,
        filteredRegistrations: [],
        filteredStatuses: [],
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toHaveLength(2); // Only work packages
    expect(
      result.current.items.every((item) => item.title.includes('Check'))
    ).toBe(true);
  });

  it('filters by registration correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFlights,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkPackages,
      } as Response);

    const { result } = renderHook(() =>
      useTimelineData({
        showFlights: true,
        filteredRegistrations: ['N123AB'],
        filteredStatuses: [],
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toHaveLength(2); // Only items for N123AB
    expect(result.current.items.every((item) => item.group === 'N123AB')).toBe(
      true
    );
  });

  it('filters by status correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFlights,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkPackages,
      } as Response);

    const { result } = renderHook(() =>
      useTimelineData({
        showFlights: true,
        filteredRegistrations: [],
        filteredStatuses: ['Open'],
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have flights (2) + work packages that are not 'Open' (1)
    expect(result.current.items).toHaveLength(3);
    const workPackageItems = result.current.items.filter((item) =>
      item.title.includes('Check')
    );
    expect(workPackageItems).toHaveLength(1);
    expect(workPackageItems[0].title).toContain('A-Check');
  });

  it('creates timeline groups for all registrations', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFlights,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkPackages,
      } as Response);

    const { result } = renderHook(() =>
      useTimelineData({
        showFlights: true,
        filteredRegistrations: [],
        filteredStatuses: [],
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.groups).toEqual([
      { id: 'N123AB', title: 'N123AB' },
      { id: 'N456CD', title: 'N456CD' },
    ]);
  });

  it('processes data correctly without refetch dependency issues', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFlights,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkPackages,
      } as Response);

    const { result } = renderHook(() =>
      useTimelineData({
        showFlights: true,
        filteredRegistrations: [],
        filteredStatuses: [],
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.current.items).toHaveLength(4); // 2 flights + 2 work packages
  });
});

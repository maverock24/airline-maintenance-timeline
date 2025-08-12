import moment from 'moment';
import { useMemo } from 'react';
import { getStatusColor, getStatusSymbol } from '../utils/helpers';
import { Flight, WorkPackage, TimelineItem } from '../utils/types';
import './ControlsAndStats.css';

interface ControlsAndStatsProps {
  viewMode: 'day' | 'week' | 'month';
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  navigateTimeline: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  highlightedDate: moment.Moment | null;
  timelineStart: moment.Moment;
  jumpToDate: (date: moment.Moment) => void;
  showFlights: boolean;
  setShowFlights: (show: boolean | ((prev: boolean) => boolean)) => void;
  flights: Flight[];
  workPackages: WorkPackage[];
  allStatuses: string[];
  filteredStatuses: string[];
  handleStatusFilter: (status: string) => void;
  items: TimelineItem[];
  allRegistrations: string[];
  filteredRegistrations: string[];
}

const ControlsAndStats: React.FC<ControlsAndStatsProps> = ({
  viewMode,
  setViewMode,
  navigateTimeline,
  goToToday,
  highlightedDate,
  timelineStart,
  jumpToDate,
  showFlights,
  setShowFlights,
  flights,
  workPackages,
  allStatuses,
  filteredStatuses,
  handleStatusFilter,
  items,
  allRegistrations,
  filteredRegistrations,
}) => {
  const stats = useMemo(() => {
    const now = moment();
    return {
      activeNow: items.filter(
        (item: TimelineItem) =>
          item.start_time.isBefore(now) && item.end_time.isAfter(now)
      ).length,
      upcoming: items.filter((item: TimelineItem) =>
        item.start_time.isAfter(now)
      ).length,
      today: items.filter((item: TimelineItem) =>
        item.start_time.isSame(now, 'day')
      ).length,
      inProgress: workPackages.filter(
        (wp: WorkPackage) => wp.status.toLowerCase() === 'in progress'
      ).length,
      open: workPackages.filter(
        (wp: WorkPackage) => wp.status.toLowerCase() === 'open'
      ).length,
      completed: workPackages.filter(
        (wp: WorkPackage) => wp.status.toLowerCase() === 'completed'
      ).length,
      visibleWorkPackages: workPackages.filter(
        (wp: WorkPackage) => !filteredStatuses.includes(wp.status)
      ).length,
      visibleFlights: showFlights ? flights.length : 0,
      totalItems: items.length,
      totalWorkOrders: workPackages.reduce(
        (sum: number, wp: WorkPackage) => sum + wp.workOrders,
        0
      ),
      totalAircraft: allRegistrations.length,
      visibleAircraft:
        filteredRegistrations.length === 0
          ? allRegistrations.length
          : filteredRegistrations.length,
    };
  }, [
    items,
    workPackages,
    flights,
    allRegistrations,
    filteredRegistrations,
    filteredStatuses,
    showFlights,
  ]);

  return (
    <div className='controls-layout'>
      {/* View & Navigation */}
      <div className='control-section view-navigation-section'>
        <h3>📅 View & Navigation</h3>
        <div className='control-group'>
          <div className='sub-control'>
            <label>View Mode:</label>
            <div className='view-buttons'>
              {(['day', 'week', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  className={`view-btn ${viewMode === mode ? 'active' : ''}`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className='sub-control'>
            <label>Navigate:</label>
            <div className='nav-controls'>
              <button
                onClick={() => navigateTimeline('prev')}
                className='nav-btn'
              >
                ⬅️ Previous
              </button>
              <button onClick={goToToday} className='today-btn'>
                📍 Today
              </button>
              <button
                onClick={() => navigateTimeline('next')}
                className='nav-btn'
              >
                Next ➡️
              </button>
            </div>
          </div>
          <div className='sub-control'>
            <label htmlFor='view-date'>Date:</label>
            <input
              id='view-date'
              type='date'
              value={(highlightedDate || timelineStart).format('YYYY-MM-DD')}
              onChange={(e) =>
                e.target.value &&
                jumpToDate(moment(e.target.value, 'YYYY-MM-DD'))
              }
              onClick={(e) => {
                const input = e.target as HTMLInputElement;
                if (input.showPicker) {
                  input.showPicker();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='control-section filters-section'>
        <h3>🔍 Filters</h3>
        <div className='control-group'>
          <div className='filter-tiles'>
            <button
              className={`filter-tile flight ${showFlights ? 'active' : 'inactive'}`}
              onClick={() => setShowFlights((p) => !p)}
              title={`${showFlights ? 'Hide' : 'Show'} Flights`}
            >
              <span className='tile-icon'>✈️</span>
              <span className='tile-content'>
                <span className='tile-title'>Flights</span>
                <span className='tile-sub'>
                  (
                  {filteredRegistrations.length === 0
                    ? flights.length
                    : flights.filter((f) =>
                        filteredRegistrations.includes(f.registration)
                      ).length}
                  )
                </span>
              </span>
            </button>
            {allStatuses.map((status: string) => {
              const count =
                filteredRegistrations.length === 0
                  ? workPackages.filter(
                      (wp: WorkPackage) => wp.status === status
                    ).length
                  : workPackages.filter(
                      (wp: WorkPackage) =>
                        wp.status === status &&
                        filteredRegistrations.includes(wp.registration)
                    ).length;
              const isHidden = filteredStatuses.includes(status);
              return (
                <button
                  key={status}
                  className={`filter-tile status ${isHidden ? 'inactive' : 'active'}`}
                  onClick={() => handleStatusFilter(status)}
                  style={{
                    backgroundColor: isHidden
                      ? 'var(--bg-tertiary)'
                      : getStatusColor(status),
                    color: isHidden ? 'var(--text-tertiary)' : 'white',
                    borderColor: getStatusColor(status),
                  }}
                  title={`${isHidden ? 'Show' : 'Hide'} ${status}`}
                >
                  <span className='tile-icon'>{getStatusSymbol(status)}</span>
                  <span className='tile-content'>
                    <span className='tile-title'>{status}</span>
                    <span className='tile-sub'>({count})</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className='control-section stats-section expanded'>
        <h3>📊 Statistics</h3>
        <div className='control-group'>
          <div className='stats-grid'>
            <div className='stat-item'>
              <span className='stat-number'>{stats.activeNow}</span>
              <span className='stat-label'>Active Now</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{stats.upcoming}</span>
              <span className='stat-label'>Upcoming</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{stats.today}</span>
              <span className='stat-label'>Today's Items</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{stats.inProgress}</span>
              <span className='stat-label'>In Progress</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{stats.open}</span>
              <span className='stat-label'>Open</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{stats.completed}</span>
              <span className='stat-label'>Completed</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{stats.visibleWorkPackages}</span>
              <span className='stat-label'>Visible WPs</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{stats.visibleFlights}</span>
              <span className='stat-label'>Visible Flights</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{stats.totalItems}</span>
              <span className='stat-label'>Visible Items</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{stats.totalWorkOrders}</span>
              <span className='stat-label'>Total WOs</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{stats.totalAircraft}</span>
              <span className='stat-label'>Total Aircraft</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{stats.visibleAircraft}</span>
              <span className='stat-label'>Visible Aircraft</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlsAndStats;

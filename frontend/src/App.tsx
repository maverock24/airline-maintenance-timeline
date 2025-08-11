import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import moment from 'moment';
import SimpleTimeline from './components/SimpleTimeline';
import 'react-calendar-timeline/style.css';
import './App.css';

interface Flight {
  flightId: string;
  flightNum: string;
  registration: string;
  schedDepStation: string;
  schedArrStation: string;
  schedDepTime: string;
  schedArrTime: string;
}

interface WorkPackage {
  workPackageId: string;
  name: string;
  registration: string;
  startDateTime: string;
  endDateTime: string;
  workOrders: number;
  status: string;
}

interface TimelineItem {
  id: string | number;
  group: string;
  title: string;
  start_time: moment.Moment;
  end_time: moment.Moment;
  itemProps?: React.HTMLAttributes<HTMLDivElement>;
}

interface TimelineGroup {
  id: string;
  title: string;
}

const App: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [currentNavigationIndex, setCurrentNavigationIndex] = useState<number>(-1);
  const [filteredRegistrations, setFilteredRegistrations] = useState<string[]>([]);
  const [filteredStatuses, setFilteredStatuses] = useState<string[]>([]);
  const [registrationDropdownOpen, setRegistrationDropdownOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [timelineStart, setTimelineStart] = useState<moment.Moment>(moment().startOf('day'));
  const [timelineEnd, setTimelineEnd] = useState<moment.Moment>(moment().add(1, 'day').endOf('day'));
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currentDateTime, setCurrentDateTime] = useState<moment.Moment>(moment());
  const [showFlights, setShowFlights] = useState<boolean>(true);
  
  // New: highlighted date range (start of selected day)
  const [highlightedDate, setHighlightedDate] = useState<moment.Moment | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navIndexRef = useRef<number>(-1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const flightsResponse = await fetch('/api/flights');
        if (!flightsResponse.ok) {
          throw new Error(`Failed to fetch flights: ${flightsResponse.status}`);
        }
        const flightsData: Flight[] = await flightsResponse.json();
        setFlights(flightsData);

        const workPackagesResponse = await fetch('/api/work-packages');
        if (!workPackagesResponse.ok) {
          throw new Error(`Failed to fetch work packages: ${workPackagesResponse.status}`);
        }
        const workPackagesData: WorkPackage[] = await workPackagesResponse.json();
        setWorkPackages(workPackagesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update current date/time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(moment());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const newItems: TimelineItem[] = [];
    const newGroups: TimelineGroup[] = [];
    const uniqueRegistrations = new Set<string>();

    // Filter flights
    const filteredFlights = showFlights ? flights.filter(flight => 
      filteredRegistrations.length === 0 || filteredRegistrations.includes(flight.registration)
    ) : [];

    // Filter work packages
    const filteredWorkPackages = workPackages.filter(wp => {
      const registrationMatch = filteredRegistrations.length === 0 || filteredRegistrations.includes(wp.registration);
      const statusMatch = filteredStatuses.length === 0 || !filteredStatuses.includes(wp.status);
      return registrationMatch && statusMatch;
    });

    filteredFlights.forEach((flight) => {
      uniqueRegistrations.add(flight.registration);
      const depTime = moment(flight.schedDepTime).format('HH:mm');
      const arrTime = moment(flight.schedArrTime).format('HH:mm');
      
      newItems.push({
        id: `flight-${flight.flightId}`,
        group: flight.registration,
        title: `${flight.flightNum} | ${flight.schedDepStation} ${depTime} → ${flight.schedArrStation} ${arrTime}`,
        start_time: moment(flight.schedDepTime),
        end_time: moment(flight.schedArrTime),
        itemProps: { 
          style: { 
            background: '#bee3f8', // Professional muted light blue
            color: '#2d3748', // Professional dark text
            border: '1px solid #90cdf4' // Professional muted blue border
          },
          className: 'timeline-flight-item'
        },
      });
    });

    filteredWorkPackages.forEach((wp) => {
      uniqueRegistrations.add(wp.registration);
      const startTime = moment(wp.startDateTime).format('HH:mm');
      const endTime = moment(wp.endDateTime).format('HH:mm');
      
      newItems.push({
        id: `wp-${wp.workPackageId}`,
        group: wp.registration,
        title: `${getStatusSymbol(wp.status)} ${wp.name} | ${wp.workOrders} WOs | ${wp.status} | ${startTime}-${endTime}`,
        start_time: moment(wp.startDateTime),
        end_time: moment(wp.endDateTime),
        itemProps: { 
          style: { 
            background: getStatusColor(wp.status),
            border: `2px solid ${getStatusColor(wp.status)}`,
            color: 'white'
          },
          className: 'timeline-workpackage-item'
        },
      });
    });

    uniqueRegistrations.forEach((reg) => {
      newGroups.push({
        id: reg,
        title: reg,
      });
    });

    setItems(newItems);
    setGroups(newGroups.sort((a, b) => a.title.localeCompare(b.title)));
  }, [flights, workPackages, filteredRegistrations, filteredStatuses, showFlights]);

  // When items or selection change, realign the navigation ref index
  useEffect(() => {
    if (!items || items.length === 0) {
      navIndexRef.current = -1;
      setCurrentNavigationIndex(-1);
      return;
    }
    if (selectedItem) {
      const sorted = items.slice().sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf());
      const idx = sorted.findIndex(i => i.id === selectedItem.id);
      navIndexRef.current = idx;
      setCurrentNavigationIndex(idx);
    } else if (currentNavigationIndex >= items.length) {
      navIndexRef.current = -1;
      setCurrentNavigationIndex(-1);
    }
  }, [items, selectedItem, currentNavigationIndex]);

  // Get unique registrations for filter
  const allRegistrations = useMemo(() => {
    const regs = new Set<string>();
    flights.forEach(f => regs.add(f.registration));
    workPackages.forEach(wp => regs.add(wp.registration));
    return Array.from(regs).sort();
  }, [flights, workPackages]);

  // Get unique statuses for filter
  const allStatuses = useMemo(() => {
    const statuses = new Set<string>();
    workPackages.forEach(wp => statuses.add(wp.status));
    return Array.from(statuses).sort();
  }, [workPackages]);

  // Calculate timeline bounds based on view mode
  const getTimelineBounds = (mode: 'day' | 'week' | 'month', baseTime: moment.Moment = moment()) => {
    let start = baseTime.clone();
    let end: moment.Moment;

    switch (mode) {
      case 'day': {
        start = start.startOf('day');
        end = start.clone().add(1, 'day');
        break;
      }
      case 'week': {
        start = start.startOf('week');
        end = start.clone().add(1, 'week');
        break;
      }
      case 'month': {
        start = start.startOf('month');
        end = start.clone().add(1, 'month');
        break;
      }
    }
    return { start, end };
  };

  // Update timeline bounds when view mode changes; keep selected item centered across zoom levels
  useEffect(() => {
    const mode = viewMode;

    if (selectedItem) {
      const itemCenter = selectedItem.start_time.clone().add(selectedItem.end_time.diff(selectedItem.start_time) / 2);
      let durationMs: number;
      if (mode === 'day') {
        durationMs = 24 * 60 * 60 * 1000;
      } else if (mode === 'week') {
        durationMs = 7 * 24 * 60 * 60 * 1000;
      } else {
        const startOfMonth = itemCenter.clone().startOf('month');
        const endOfMonth = itemCenter.clone().endOf('month');
        durationMs = endOfMonth.diff(startOfMonth);
      }
      const newStart = itemCenter.clone().subtract(durationMs / 2);
      const newEnd = newStart.clone().add(durationMs);
      setTimelineStart(newStart);
      setTimelineEnd(newEnd);
    } else {
      const bounds = getTimelineBounds(mode, timelineStart);
      setTimelineStart(bounds.start);
      setTimelineEnd(bounds.end);
    }
  }, [viewMode, selectedItem, timelineStart]);

  // Auto-focus functionality - find next upcoming item
  const getNextUpcomingItem = useCallback(() => {
    const now = moment();
    const upcomingItems = items
      .filter(item => item.start_time.isAfter(now))
      .sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf());
    
    return upcomingItems.length > 0 ? upcomingItems[0] : null;
  }, [items]);

  // Navigate to next/previous item considering visible group and center selection
  const navigateToItem = (direction: 'prev' | 'next') => {
    // Helper: check if an item is within the current time window
    const isInWindow = (it: TimelineItem) => it.end_time.isAfter(timelineStart) && it.start_time.isBefore(timelineEnd);

    // Determine target group (lane): if a selection exists, stay in that lane; otherwise pick the top lane (first group)
    let visibleGroupId: string | null = null;
    if (selectedItem) {
      visibleGroupId = selectedItem.group;
    } else if (groups.length > 0) {
      visibleGroupId = groups[0].id;
    }

    // Build the candidate list limited to the visible group
    const inGroup = items
      .filter(i => (visibleGroupId ? i.group === visibleGroupId : true))
      .slice()
      .sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf());

    // If no items in that lane, do nothing
    const sortedItems = inGroup;
    if (sortedItems.length === 0) return;

    const currentDuration = timelineEnd.diff(timelineStart);
    const currentCenter = timelineStart.clone().add(currentDuration / 2);
    // const now = moment(); // no longer needed for lane-scoped stepping

    // Establish a base index and choose target taking the current window into account
    const selectedIdxInGroup = selectedItem ? sortedItems.findIndex(i => i.id === selectedItem.id) : -1;
    const selectedVisible = selectedItem ? isInWindow(selectedItem) : false;

    let targetItem: TimelineItem | undefined;

    if (direction === 'next') {
      // Step to the next item within the same lane
      if (selectedIdxInGroup !== -1 && selectedVisible) {
        targetItem = sortedItems[Math.min(sortedItems.length - 1, selectedIdxInGroup + 1)];
      } else {
        // Choose the first item starting at/after the current center; if none, pick the last in lane
        targetItem = sortedItems.find(i => i.start_time.isSameOrAfter(currentCenter)) || sortedItems[sortedItems.length - 1];
      }
    } else {
      // Previous: step to the previous item within the same lane
      if (selectedIdxInGroup !== -1 && selectedVisible) {
        targetItem = sortedItems[Math.max(0, selectedIdxInGroup - 1)];
      } else {
        // Prefer last item ending before current window start, else last before center, else first
        for (let i = sortedItems.length - 1; i >= 0; i--) {
          if (sortedItems[i].end_time.isBefore(timelineStart)) { targetItem = sortedItems[i]; break; }
        }
        if (!targetItem) {
          for (let i = sortedItems.length - 1; i >= 0; i--) {
            if (sortedItems[i].start_time.isBefore(currentCenter)) { targetItem = sortedItems[i]; break; }
          }
          if (!targetItem) targetItem = sortedItems[0];
        }
      }
    }

    if (!targetItem) return;

    // Update nav index references using the index in the global sorted list for consistency
    const globalSorted = items.slice().sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf());
    const globalIdx = globalSorted.findIndex(i => i.id === targetItem!.id);
    navIndexRef.current = globalIdx;
    setCurrentNavigationIndex(globalIdx);

    // Keep the current zoom duration and center horizontally on the item's center
    const itemCenter = targetItem.start_time.clone().add(targetItem.end_time.diff(targetItem.start_time) / 2);
    const newStart = itemCenter.clone().subtract(currentDuration / 2);
    const newEnd = newStart.clone().add(currentDuration);

    setTimelineStart(newStart);
    setTimelineEnd(newEnd);
    setSelectedItem(targetItem);
    // Sync calendar date to selected item's day
    setHighlightedDate(targetItem.start_time.clone().startOf('day'));

    // After render, center vertically on the item's row, accounting for sticky header height
    const centerVertically = () => {
      const container = document.querySelector('.timeline-container') as HTMLElement | null;
      if (!container) return;
      const row = document.querySelector(`.st-row[data-group-id="${targetItem!.group}"]`) as HTMLElement | null;
      if (!row) return;

      const cRect = container.getBoundingClientRect();
      const rRect = row.getBoundingClientRect();
      const header = document.querySelector('.st-tick-header') as HTMLElement | null;
      const stickyH = header ? header.clientHeight : 0;

      const visibleTop = cRect.top + stickyH;
      const visibleHeight = Math.max(1, cRect.height - stickyH);
      const targetCenterY = visibleTop + visibleHeight / 2;
      const elementCenterY = rRect.top + rRect.height / 2;
      const delta = elementCenterY - targetCenterY;

      if (Math.abs(delta) > 1) {
        try {
          container.scrollBy({ top: delta, behavior: 'smooth' });
        } catch {
          container.scrollTop += delta;
        }
      }
    };

    // Wait for React to commit and layout, then center (double RAF for reliability)
    requestAnimationFrame(() => requestAnimationFrame(centerVertically));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRegistrationDropdownOpen(false);
      }

      // Do not clear selection when using navigation controls
      const target = event.target as HTMLElement;
      const navSection = document.querySelector('.view-navigation-section');
      if (navSection && navSection.contains(target)) {
        return;
      }

      // Clear selected item when clicking outside timeline and selected item section
      const timelineContainer = document.querySelector('.timeline-container');
      const selectedItemSection = document.querySelector('.selected-item-section');
      if (
        selectedItem &&
        timelineContainer &&
        selectedItemSection &&
        !timelineContainer.contains(target) &&
        !selectedItemSection.contains(target)
      ) {
        setSelectedItem(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedItem]);

  const handleRegistrationFilter = (registration: string) => {
    setFilteredRegistrations(prev => 
      prev.includes(registration) 
        ? prev.filter(r => r !== registration)
        : [...prev, registration]
    );
  };

  const handleSelectAllRegistrations = () => {
    if (filteredRegistrations.length === allRegistrations.length) {
      setFilteredRegistrations([]);
    } else {
      setFilteredRegistrations([...allRegistrations]);
    }
  };

  const clearFilters = () => {
    setFilteredRegistrations([]);
    setFilteredStatuses([]);
    setRegistrationDropdownOpen(false);
  };

  const getStatusSymbol = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '✅';
      case 'in progress':
        return '🔧';
      case 'open':
        return '📋';
      case 'cancelled':
        return '❌';
      default:
        return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#38a169'; // Professional muted green
      case 'in progress':
        return '#d69e2e'; // Professional muted amber/yellow
      case 'open':
        return '#3182ce'; // Professional muted blue
      case 'cancelled':
        return '#e53e3e'; // Professional muted red
      default:
        return '#718096'; // Professional muted gray
    }
  };

  const handleStatusFilter = (status: string) => {
    setFilteredStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const getSelectedRegistrationsText = () => {
    if (filteredRegistrations.length === 0) {
      return 'All Aircraft';
    } else if (filteredRegistrations.length === 1) {
      return filteredRegistrations[0];
    } else if (filteredRegistrations.length === allRegistrations.length) {
      return 'All Aircraft';
    } else {
      return `${filteredRegistrations.length} Selected`;
    }
  };

  const navigateTimeline = (direction: 'prev' | 'next') => {
    // Navigate to specific items instead of just time periods
    navigateToItem(direction);
  };

  // Unified helper: jump timeline to a given date's week, clear selection, and highlight the day
  const jumpToDate = (d: moment.Moment) => {
    // Deselect any selected item and reset navigation
    setSelectedItem(null);
    setCurrentNavigationIndex(-1);
    navIndexRef.current = -1;
    // Remember highlighted day and jump to that week
    const dayStart = d.clone().startOf('day');
    setHighlightedDate(dayStart);
    setViewMode('week');
    const bounds = getTimelineBounds('week', d);
    setTimelineStart(bounds.start);
    setTimelineEnd(bounds.end);
  };

  const goToToday = () => {
    // Force a jump to today regardless of previous selection
    const today = moment();
    setViewMode('week');
    // Defer timeline updates to next tick to avoid conflicts with selection/zoom effects
    requestAnimationFrame(() => {
      jumpToDate(today);
    });
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>✈️ Aircraft Maintenance Timeline</h1>
            <p className="subtitle">Real-time visualization of flight schedules and maintenance work packages</p>
          </div>
          <div className="header-right">
            <div className="current-datetime">
              <div className="date-display">
                {currentDateTime.format('dddd, MMMM DD, YYYY')}
              </div>
              <div className="time-display">
                {currentDateTime.format('HH:mm:ss')}
              </div>
            </div>
            <button 
              onClick={toggleTheme} 
              className="theme-toggle-btn"
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Control Sections */}
      <div className="controls-layout">
        {/* View & Navigation Section */}
        <div className="control-section view-navigation-section">
          <h3>📅 View & Navigation</h3>
          <div className="control-group">
            <div className="sub-control">
              <label>View Mode:</label>
              <div className="view-buttons">
                {(['day', 'week', 'month'] as const).map(mode => (
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
            <div className="sub-control">
              <label>Navigate:</label>
              <div className="nav-controls">
                <button onClick={() => navigateTimeline('prev')} className="nav-btn">
                  ⬅️ Previous Item
                </button>
                <button onClick={goToToday} className="today-btn">
                  📍 Today
                </button>
                <button onClick={() => navigateTimeline('next')} className="nav-btn">
                  ➡️ Next Item
                </button>
              </div>
            </div>
            <div className="sub-control">
              <label htmlFor="view-date">Date:</label>
              <input
                id="view-date"
                type="date"
                value={(highlightedDate || timelineStart).format('YYYY-MM-DD')}
                onChange={(e) => {
                  const val = e.target.value;
                  const d = moment(val, 'YYYY-MM-DD');
                  if (!d.isValid()) return;
                  jumpToDate(d);
                }}
              />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="control-section filters-section">
          <h3>🔍 Filters</h3>
          <div className="control-group">
            <div className="filter-tiles">
              {/* Flights tile */}
              <button
                type="button"
                className={`filter-tile flight ${showFlights ? 'active' : 'inactive'}`}
                onClick={() => setShowFlights(prev => !prev)}
                style={{
                  backgroundColor: showFlights ? '#bee3f8' : 'var(--bg-tertiary)',
                  color: showFlights ? '#2d3748' : 'var(--text-tertiary)',
                  borderColor: '#90cdf4'
                }}
                title={`${showFlights ? 'Hide' : 'Show'} Flights`}
              >
                <span className="tile-icon">✈️</span>
                <span className="tile-content">
                  <span className="tile-title">Flights</span>
                  <span className="tile-sub">({flights.length})</span>
                </span>
              </button>

              {/* Work package status tiles */}
              {allStatuses.map(status => {
                const statusCount = workPackages.filter(wp => wp.status === status).length;
                const isHidden = filteredStatuses.includes(status);
                const color = getStatusColor(status);
                return (
                  <button
                    key={status}
                    type="button"
                    className={`filter-tile status ${isHidden ? 'inactive' : 'active'}`}
                    onClick={() => handleStatusFilter(status)}
                    style={{
                      backgroundColor: isHidden ? 'var(--bg-tertiary)' : color,
                      color: isHidden ? 'var(--text-tertiary)' : 'white',
                      borderColor: color,
                      opacity: isHidden ? 0.6 : 1
                    }}
                    title={`${isHidden ? 'Show' : 'Hide'} ${status}`}
                  >
                    <span className="tile-icon">{getStatusSymbol(status)}</span>
                    <span className="tile-content">
                      <span className="tile-title">{status}</span>
                      <span className="tile-sub">({statusCount})</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="control-section stats-section expanded">
          <h3>📊 Statistics</h3>
          <div className="control-group">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{(() => {
                  const now = moment();
                  const activeItems = items.filter(item => 
                    item.start_time.isBefore(now) && item.end_time.isAfter(now)
                  );
                  return activeItems.length;
                })()}</span>
                <span className="stat-label">Active Now</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{(() => {
                  const now = moment();
                  const upcomingItems = items.filter(item => item.start_time.isAfter(now));
                  return upcomingItems.length;
                })()}</span>
                <span className="stat-label">Upcoming Items</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{(() => {
                  const today = moment().startOf('day');
                  const tomorrow = moment().add(1, 'day').startOf('day');
                  const todayItems = items.filter(item => 
                    item.start_time.isBetween(today, tomorrow, null, '[)')
                  );
                  return todayItems.length;
                })()}</span>
                <span className="stat-label">Today's Items</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{workPackages.filter(wp => wp.status.toLowerCase() === 'in progress').length}</span>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{workPackages.filter(wp => wp.status.toLowerCase() === 'open').length}</span>
                <span className="stat-label">Open</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{workPackages.filter(wp => wp.status.toLowerCase() === 'completed').length}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{workPackages.filter(wp => filteredStatuses.length === 0 || !filteredStatuses.includes(wp.status)).length}</span>
                <span className="stat-label">Work Packages {filteredStatuses.length > 0 ? '(Filtered)' : ''}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{showFlights ? flights.length : 0}</span>
                <span className="stat-label">Flights {!showFlights ? '(Hidden)' : ''}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{items.length}</span>
                <span className="stat-label">Total Items</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{workPackages.reduce((sum, wp) => sum + wp.workOrders, 0)}</span>
                <span className="stat-label">Total Work Orders</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{allRegistrations.length}</span>
                <span className="stat-label">Aircraft</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{(() => {
                  if (filteredRegistrations.length === 0) return allRegistrations.length;
                  return filteredRegistrations.length;
                })()}</span>
                <span className="stat-label">Visible Aircraft</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    

      {/* Timeline Controls */}
      <div className="timeline-controls">
        <div className="timeline-control-group">
          <label>Aircraft:</label>
          <div className="dropdown-container" ref={dropdownRef}>
            <button 
              className="dropdown-trigger"
              onClick={() => setRegistrationDropdownOpen(!registrationDropdownOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setRegistrationDropdownOpen(!registrationDropdownOpen);
                } else if (e.key === 'Escape') {
                  setRegistrationDropdownOpen(false);
                }
              }}
              type="button"
              aria-expanded={registrationDropdownOpen}
              aria-haspopup="listbox"
            >
              <span className="dropdown-text">{getSelectedRegistrationsText()}</span>
              <span className={`dropdown-arrow ${registrationDropdownOpen ? 'open' : ''}`}>▼</span>
            </button>
            
            {registrationDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <button 
                    className="select-all-btn"
                    onClick={handleSelectAllRegistrations}
                    type="button"
                  >
                    {filteredRegistrations.length === allRegistrations.length ? '🗹 Deselect All' : '☐ Select All'}
                  </button>
                  <button 
                    className="close-dropdown-btn"
                    onClick={() => setRegistrationDropdownOpen(false)}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="dropdown-options">
                  {allRegistrations.map(reg => (
                    <label key={reg} className="dropdown-option">
                      <input
                        type="checkbox"
                        checked={filteredRegistrations.length === 0 || filteredRegistrations.includes(reg)}
                        onChange={() => handleRegistrationFilter(reg)}
                      />
                      <span className="registration-badge-dropdown">{reg}</span>
                      <span className="checkmark">{(filteredRegistrations.length === 0 || filteredRegistrations.includes(reg)) ? '✓' : ''}</span>
                    </label>
                  ))}
                </div>
                
                {filteredRegistrations.length > 0 && (
                  <div className="dropdown-footer">
                    <small>{filteredRegistrations.length} of {allRegistrations.length} selected</small>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="timeline-control-group">
          <button onClick={clearFilters} className="clear-filters-btn compact">
            Clear All Filters
          </button>
        </div>
      </div>

        {/* Selected Item Info Section */}
      <div className="selected-item-section compact">
        {selectedItem ? (
          <>
            <div className="selected-item-content">
              <div className="selected-item-compact">
                <span>{selectedItem.id.toString().startsWith('flight-') ? '✈️' : '🔧'} {selectedItem.group}</span>
                <span><strong>{selectedItem.start_time.format('MMM DD HH:mm')}</strong> → <strong>{selectedItem.end_time.format('HH:mm')}</strong></span>
                <span>({moment.duration(selectedItem.end_time.diff(selectedItem.start_time)).humanize()})</span>
                <span className="item-title">{selectedItem.title.split(' | ')[1] || selectedItem.title}</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedItem(null);
                }} 
                className="close-selection-btn compact"
              >
                ×
              </button>
            </div>
          </>
        ) : (
          <>
            
            <div className="selected-item-content">
              {(() => {
                const nextItem = getNextUpcomingItem();
                return nextItem ? (
                  <div className="selected-item-compact">
                    <span>⏭️ Next: {(() => {
              const nextItem = getNextUpcomingItem();
              return nextItem ? `${nextItem.id.toString().startsWith('flight-') ? '✈️' : '🔧'} ${nextItem.group}` : 'None';
            })()}</span>
                    <span><strong>{nextItem.start_time.format('MMM DD HH:mm')}</strong> → <strong>{nextItem.end_time.format('HH:mm')}</strong></span>
                    <span>({moment.duration(nextItem.end_time.diff(nextItem.start_time)).humanize()})</span>
                    <span className="item-title">{nextItem.title.split(' | ')[1] || nextItem.title}</span>
                    <span className="starts-in">Starts in {moment.duration(nextItem.start_time.diff(moment())).humanize()}</span>
                  </div>
                ) : (
                  <div className="no-upcoming-compact">
                    <span>No upcoming items scheduled</span>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {loading && <div className="loading">⏳ Loading timeline data...</div>}
      
      {error && (
        <div className="error">
          <strong>❌ Error:</strong> {error}
          <button onClick={() => window.location.reload()} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="timeline-container positioned-container">
          <SimpleTimeline
            groups={groups}
            items={items}
            visibleTimeStart={timelineStart.valueOf()}
            visibleTimeEnd={timelineEnd.valueOf()}
            sidebarWidth={200}
            itemHeightRatio={0.8}
            canMove={false}
            canResize={false}
            canSelect={true}
            stackItems
            lineHeight={70}
            selectedItemId={selectedItem ? selectedItem.id : undefined}
            // Gentle highlight for selected calendar date
            highlightRanges={highlightedDate ? [{
              start: highlightedDate.clone().startOf('day').valueOf(),
              end: highlightedDate.clone().startOf('day').add(1, 'day').valueOf(),
              className: 'hl-selected-day'
            }] : []}
            onItemSelect={(itemId, e, time) => {
              console.log('Item selected:', itemId);
              const item = items.find(i => i.id === itemId);
              if (item) {
                setSelectedItem(item);
                const sorted = items.slice().sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf());
                const idx = sorted.findIndex(i => i.id === item.id);
                navIndexRef.current = idx;
                setCurrentNavigationIndex(idx);

                // Keep current zoom and center horizontally on the item's center
                const currentDuration = timelineEnd.diff(timelineStart);
                const itemCenter = item.start_time.clone().add(item.end_time.diff(item.start_time) / 2);
                const newStart = itemCenter.clone().subtract(currentDuration / 2);
                const newEnd = newStart.clone().add(currentDuration);
                setTimelineStart(newStart);
                setTimelineEnd(newEnd);

                // Sync calendar date to selected item's day
                setHighlightedDate(item.start_time.clone().startOf('day'));

                // After render, center vertically on the item's row, accounting for sticky header height
                const centerVertically = () => {
                  const container = document.querySelector('.timeline-container') as HTMLElement | null;
                  if (!container) return;
                  const row = document.querySelector(`.st-row[data-group-id="${item.group}"]`) as HTMLElement | null;
                  if (!row) return;

                  const cRect = container.getBoundingClientRect();
                  const rRect = row.getBoundingClientRect();
                  const header = document.querySelector('.st-tick-header') as HTMLElement | null;
                  const stickyH = header ? header.clientHeight : 0;

                  const visibleTop = cRect.top + stickyH;
                  const visibleHeight = Math.max(1, cRect.height - stickyH);
                  const targetCenterY = visibleTop + visibleHeight / 2;
                  const elementCenterY = rRect.top + rRect.height / 2;
                  const delta = elementCenterY - targetCenterY;

                  if (Math.abs(delta) > 1) {
                    try {
                      container.scrollBy({ top: delta, behavior: 'smooth' });
                    } catch {
                      container.scrollTop += delta;
                    }
                  }
                };
                // Wait for React to commit and layout, then center (double RAF for reliability)
                requestAnimationFrame(() => requestAnimationFrame(centerVertically));
              }
            }}
            onItemDeselect={() => {
              setSelectedItem(null);
              setCurrentNavigationIndex(-1);
              navIndexRef.current = -1;
            }}
            onTimeChange={(visibleTimeStart, visibleTimeEnd) => {
              setTimelineStart(moment(visibleTimeStart));
              setTimelineEnd(moment(visibleTimeEnd));
            }}
          />
        </div>
      )}
    </div>
  );
};

export default App;

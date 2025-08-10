
import React, { useState, useEffect, useMemo, useRef } from 'react';
import moment from 'moment';
import Timeline from 'react-calendar-timeline';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredStatuses, setFilteredStatuses] = useState<string[]>([]);
  const [registrationDropdownOpen, setRegistrationDropdownOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [autoFocus, setAutoFocus] = useState<boolean>(false);
  const [timelineStart, setTimelineStart] = useState<moment.Moment>(moment().startOf('day'));
  const [timelineEnd, setTimelineEnd] = useState<moment.Moment>(moment().add(1, 'day').endOf('day'));
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currentDateTime, setCurrentDateTime] = useState<moment.Moment>(moment());
  const [selectedItemPosition, setSelectedItemPosition] = useState<{x: number, y: number} | null>(null);
  const [showFlights, setShowFlights] = useState<boolean>(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const start = baseTime.clone();
    let end = baseTime.clone();

    switch (mode) {
      case 'day':
        start.startOf('day');
        end.add(1, 'day').endOf('day');
        break;
      case 'week':
        start.startOf('week');
        end.add(1, 'week').endOf('week');
        break;
      case 'month':
        start.startOf('month');
        end.add(1, 'month').endOf('month');
        break;
    }
    return { start, end };
  };

  // Update timeline bounds when view mode changes
  useEffect(() => {
    const bounds = getTimelineBounds(viewMode, timelineStart);
    setTimelineStart(bounds.start);
    setTimelineEnd(bounds.end);
  }, [viewMode]);

  // Auto-focus functionality - find next upcoming item
  const getNextUpcomingItem = () => {
    const now = moment();
    const upcomingItems = items
      .filter(item => item.start_time.isAfter(now))
      .sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf());
    
    return upcomingItems.length > 0 ? upcomingItems[0] : null;
  };

  // Navigate to next/previous item considering filters
  const navigateToItem = (direction: 'prev' | 'next') => {
    const sortedItems = items
      .slice()
      .sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf());
    
    if (sortedItems.length === 0) return;

    let targetItem: TimelineItem | null = null;
    let newIndex = -1;

    // If we have a current navigation index, use it
    if (currentNavigationIndex >= 0 && currentNavigationIndex < sortedItems.length) {
      if (direction === 'next') {
        newIndex = currentNavigationIndex + 1;
        if (newIndex >= sortedItems.length) newIndex = 0; // Wrap to beginning
      } else {
        newIndex = currentNavigationIndex - 1;
        if (newIndex < 0) newIndex = sortedItems.length - 1; // Wrap to end
      }
    } else {
      // Initialize navigation index based on current timeline position or selected item
      if (selectedItem) {
        const currentIndex = sortedItems.findIndex(item => 
          item.id === selectedItem.id && 
          item.group === selectedItem.group &&
          item.title === selectedItem.title
        );
        if (currentIndex >= 0) {
          if (direction === 'next') {
            newIndex = currentIndex + 1 >= sortedItems.length ? 0 : currentIndex + 1;
          } else {
            newIndex = currentIndex - 1 < 0 ? sortedItems.length - 1 : currentIndex - 1;
          }
        }
      } else {
        // Find the closest item to the current timeline center
        const currentCenter = timelineStart.clone().add(timelineEnd.diff(timelineStart) / 2);
        let closestDistance = Infinity;
        let closestIndex = 0;
        
        sortedItems.forEach((item, index) => {
          const distance = Math.abs(item.start_time.diff(currentCenter));
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

        if (direction === 'next') {
          newIndex = closestIndex + 1 >= sortedItems.length ? 0 : closestIndex + 1;
        } else {
          newIndex = closestIndex - 1 < 0 ? sortedItems.length - 1 : closestIndex - 1;
        }
      }
    }

    targetItem = sortedItems[newIndex];

    if (targetItem) {
      // Update navigation index
      setCurrentNavigationIndex(newIndex);
      
      // Center timeline on the target item
      const bounds = getTimelineBounds(viewMode, targetItem.start_time);
      setTimelineStart(bounds.start);
      setTimelineEnd(bounds.end);
      
      // Select the item for better user feedback
      setSelectedItem(targetItem);
    }
  };

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && items.length > 0) {
      const nextItem = getNextUpcomingItem();
      if (nextItem) {
        // Center timeline on the next item
        const itemTime = nextItem.start_time;
        const bounds = getTimelineBounds(viewMode, itemTime);
        setTimelineStart(bounds.start);
        setTimelineEnd(bounds.end);
      }
    }
  }, [autoFocus, items, viewMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRegistrationDropdownOpen(false);
      }
      
      // Clear selected item when clicking outside timeline and selected item section
      const target = event.target as HTMLElement;
      const timelineContainer = document.querySelector('.timeline-container');
      const selectedItemSection = document.querySelector('.selected-item-section');
      
      if (selectedItem && 
          timelineContainer && 
          selectedItemSection &&
          !timelineContainer.contains(target) && 
          !selectedItemSection.contains(target)) {
        setSelectedItem(null);
        setSelectedItemPosition(null);
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

  const goToToday = () => {
    const bounds = getTimelineBounds(viewMode, moment());
    setTimelineStart(bounds.start);
    setTimelineEnd(bounds.end);
    
    // Clear selected item and reset navigation state
    setSelectedItem(null);
    setCurrentNavigationIndex(-1);
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
              <div className="current-view-info">
                <span className="view-range">
                  {timelineStart.format('MMM DD, YYYY')} - {timelineEnd.format('MMM DD, YYYY')}
                </span>
                <span className="view-duration">
                  ({viewMode === 'day' ? '24 hours' : 
                     viewMode === 'week' ? '7 days' : 
                     '1 month'} view)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="control-section filters-section">
          <h3>🔍 Filters</h3>
          <div className="control-group">
            <div className="status-symbols">
              {allStatuses.map(status => {
                const statusCount = workPackages.filter(wp => wp.status === status).length;
                const isHidden = filteredStatuses.includes(status);
                const isVisible = filteredStatuses.length === 0 || !filteredStatuses.includes(status);
                
                return (
                  <button
                    key={status}
                    className={`status-symbol ${isHidden ? 'hidden' : 'visible'}`}
                    onClick={() => handleStatusFilter(status)}
                    style={{
                      backgroundColor: isVisible ? getStatusColor(status) : 'var(--bg-tertiary)',
                      color: isVisible ? 'white' : 'var(--text-tertiary)',
                      opacity: isHidden ? 0.5 : 1,
                      textDecoration: isHidden ? 'line-through' : 'none'
                    }}
                    title={`${status} - ${statusCount} work packages - Click to ${isHidden ? 'show' : 'hide'}`}
                  >
                    <span className="status-icon">{getStatusSymbol(status)}</span>
                    <span className="status-text">{status}</span>
                    <span className="status-count">({statusCount})</span>
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

      {/* Selected Item Info Section */}
      <div className="selected-item-section compact">
        {selectedItem ? (
          <>
            <h3>📋 Selected: {selectedItem.id.toString().startsWith('flight-') ? '✈️' : '🔧'} {selectedItem.group}</h3>
            <div className="selected-item-content">
              <div className="selected-item-compact">
                <span><strong>{selectedItem.start_time.format('MMM DD HH:mm')}</strong> → <strong>{selectedItem.end_time.format('HH:mm')}</strong></span>
                <span>({moment.duration(selectedItem.end_time.diff(selectedItem.start_time)).humanize()})</span>
                <span className="item-title">{selectedItem.title.split(' | ')[1] || selectedItem.title}</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedItem(null);
                  setSelectedItemPosition(null);
                }} 
                className="close-selection-btn compact"
              >
                ×
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>⏭️ Next: {(() => {
              const nextItem = getNextUpcomingItem();
              return nextItem ? `${nextItem.id.toString().startsWith('flight-') ? '✈️' : '🔧'} ${nextItem.group}` : 'None';
            })()}</h3>
            <div className="selected-item-content">
              {(() => {
                const nextItem = getNextUpcomingItem();
                return nextItem ? (
                  <div className="selected-item-compact">
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
          <label>Show Items:</label>
          <div className="item-visibility-controls horizontal">
            <label className="visibility-toggle">
              <input
                type="checkbox"
                checked={showFlights}
                onChange={(e) => setShowFlights(e.target.checked)}
              />
              <span>✈️ Flights ({flights.length})</span>
            </label>
            <label className="visibility-toggle">
              <input
                type="checkbox"
                checked={true}
                disabled={true}
              />
              <span>🔧 Work Packages ({workPackages.length})</span>
            </label>
          </div>
        </div>
        
        <div className="timeline-control-group">
          <label className="auto-focus-label">
            <input
              type="checkbox"
              checked={autoFocus}
              onChange={(e) => setAutoFocus(e.target.checked)}
            />
            <span>🎯 Auto-focus on next item</span>
          </label>
        </div>
        
        <div className="timeline-control-group">
          <button onClick={clearFilters} className="clear-filters-btn compact">
            Clear All Filters
          </button>
        </div>
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
          <Timeline
            groups={groups}
            items={items}
            defaultTimeStart={timelineStart.valueOf()}
            defaultTimeEnd={timelineEnd.valueOf()}
            visibleTimeStart={timelineStart.valueOf()}
            visibleTimeEnd={timelineEnd.valueOf()}
            sidebarWidth={200}
            itemHeightRatio={0.8}
            canMove={false}
            canResize={false}
            canSelect={true}
            stackItems
            lineHeight={70}
            onItemSelect={(itemId, e, time) => {
              console.log('Item selected:', itemId);
              const item = items.find(i => i.id === itemId);
              if (item) {
                setSelectedItem(item);
                // Reset navigation index when manually selecting
                setCurrentNavigationIndex(-1);
                // Clear position since we're using a fixed section now
                setSelectedItemPosition(null);
                
                // Automatically switch to day view for detailed view
                setViewMode('day');
                
                // Center timeline on the selected item's start time
                const bounds = getTimelineBounds('day', item.start_time);
                setTimelineStart(bounds.start);
                setTimelineEnd(bounds.end);
              }
            }}
            onItemDeselect={() => {
              setSelectedItem(null);
              setSelectedItemPosition(null);
              setCurrentNavigationIndex(-1);
            }}
            onTimeChange={(visibleTimeStart, visibleTimeEnd) => {
              // Allow manual timeline dragging to update the view
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

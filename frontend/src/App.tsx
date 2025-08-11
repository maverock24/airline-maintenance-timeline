// src/App.tsx
import React, { useState, useCallback, useRef, useEffect, startTransition } from 'react';
import moment from 'moment';
import { TimelineItem } from './utils/types';
import useTimelineData from './hooks/useTimelineData';
import Header from './components/Header';
import ControlsAndStats from './components/ControlsAndStats';
import TimelineControls from './components/TimelineControls';
import SelectedItemDisplay from './components/SelectedItemDisplay';
import SimpleTimeline from './components/SimpleTimeline';
import './App.css';

const App: React.FC = () => {
  // UI and Filter State
  const [filteredRegistrations, setFilteredRegistrations] = useState<string[]>([]);
  const [filteredStatuses, setFilteredStatuses] = useState<string[]>([]);
  const [showFlights, setShowFlights] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [registrationDropdownOpen, setRegistrationDropdownOpen] = useState<boolean>(false);

  // Timeline View and Selection State
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [timelineStart, setTimelineStart] = useState<moment.Moment>(moment().startOf('week'));
  const [timelineEnd, setTimelineEnd] = useState<moment.Moment>(moment().endOf('week'));
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [highlightedDate, setHighlightedDate] = useState<moment.Moment | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Data Fetching Hook
  const { loading, error, items, groups, allRegistrations, allStatuses, workPackages, flights } = useTimelineData({
    showFlights,
    filteredRegistrations,
    filteredStatuses,
  });

  // Callbacks and Handlers
  const handleRegistrationFilter = useCallback((registration: string) => {
    setFilteredRegistrations(prev =>
      prev.includes(registration) ? prev.filter(r => r !== registration) : [...prev, registration]
    );
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setFilteredStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  }, []);
  
  const handleSelectAllRegistrations = useCallback(() => {
    setFilteredRegistrations(prev => prev.length === allRegistrations.length ? [] : [...allRegistrations]);
  }, [allRegistrations]);

  const clearFilters = useCallback(() => {
    setFilteredRegistrations([]);
    setFilteredStatuses([]);
    setRegistrationDropdownOpen(false);
  }, []);

  const getSelectedRegistrationsText = useCallback(() => {
    if (!filteredRegistrations.length || filteredRegistrations.length === allRegistrations.length) return 'All Aircraft';
    if (filteredRegistrations.length === 1) return filteredRegistrations[0];
    return `${filteredRegistrations.length} Selected`;
  }, [filteredRegistrations, allRegistrations]);

  const jumpToDate = useCallback((date: moment.Moment) => {
    setSelectedItem(null);
    const dayStart = date.clone().startOf('day');
    setHighlightedDate(dayStart);
    setViewMode('week');
    const bounds = { start: date.clone().startOf('week'), end: date.clone().endOf('week') };
    setTimelineStart(bounds.start);
    setTimelineEnd(bounds.end);
  }, []);

  const goToToday = useCallback(() => jumpToDate(moment()), [jumpToDate]);

  const viewModeChangeRef = useRef<{ viewMode: string; selectedItemId: string | number | null }>({ viewMode: 'week', selectedItemId: null });

  useEffect(() => {
    // Only update timeline if viewMode or selectedItem actually changed
    const currentViewMode = viewMode;
    const currentSelectedItemId = selectedItem?.id || null;
    
    if (viewModeChangeRef.current.viewMode === currentViewMode && 
        viewModeChangeRef.current.selectedItemId === currentSelectedItemId) {
      return;
    }

    viewModeChangeRef.current = { viewMode: currentViewMode, selectedItemId: currentSelectedItemId };

    // Logic for changing timeline view based on viewMode
    let newStart: moment.Moment;
    let newEnd: moment.Moment;
    let centerPoint: moment.Moment;

    // If an item is selected, center the view around it
    // If no item is selected, use the current timeline center to preserve position
    if (selectedItem) {
      centerPoint = selectedItem.start_time.clone().add(selectedItem.end_time.diff(selectedItem.start_time) / 2);
    } else {
      // Use current timeline center to preserve position
      const currentCenter = timelineStart.clone().add(timelineEnd.diff(timelineStart) / 2);
      centerPoint = currentCenter;
    }

    switch (viewMode) {
      case 'day':
        newStart = centerPoint.clone().startOf('day');
        newEnd = centerPoint.clone().endOf('day');
        break;
      case 'week':
        newStart = centerPoint.clone().startOf('week');
        newEnd = centerPoint.clone().endOf('week');
        break;
      case 'month':
        newStart = centerPoint.clone().startOf('month');
        newEnd = centerPoint.clone().endOf('month');
        break;
      default:
        return;
    }

    setTimelineStart(newStart);
    setTimelineEnd(newEnd);
    
    if (selectedItem) {
      setHighlightedDate(selectedItem.start_time.clone().startOf('day'));
    }
  }, [viewMode, selectedItem, timelineStart, timelineEnd]);

  const handleItemSelect = useCallback((itemId: string | number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Update selection immediately for responsive feedback
    setSelectedItem(item);
    setHighlightedDate(item.start_time.clone().startOf('day'));

    // Check if item is already reasonably centered before adjusting timeline
    const itemStartTime = item.start_time.valueOf();
    const currentStart = timelineStart.valueOf();
    const currentEnd = timelineEnd.valueOf();
    const currentDuration = currentEnd - currentStart;
    const currentCenter = currentStart + currentDuration / 2;
    
    // Define a tolerance zone around the center (20% of the duration on each side)
    const tolerance = currentDuration * 0.2;
    const isAlreadyCentered = Math.abs(itemStartTime - currentCenter) <= tolerance;
    
    // Only adjust timeline if item is not already reasonably centered
    if (!isAlreadyCentered) {
      // Defer timeline positioning to avoid flickering
      startTransition(() => {
        // Center timeline on the item's start time for proper visual alignment
        const newStart = item.start_time.clone().subtract(currentDuration / 2);
        const newEnd = item.start_time.clone().add(currentDuration / 2);
        
        // Apply the new timeline bounds for smooth scrolling
        setTimelineStart(newStart);
        setTimelineEnd(newEnd);
      });
    }
  }, [items, timelineEnd, timelineStart]);

  const navigateToItem = useCallback((direction: 'prev' | 'next') => {
    if (!items.length) return;

    let targetItem: TimelineItem | null = null;

    if (selectedItem) {
      // If an item is already selected, navigate within the same aircraft row
      const sameAircraftItems = items
        .filter(item => item.group === selectedItem.group)
        .sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf());
      
      const currentIndex = sameAircraftItems.findIndex(item => item.id === selectedItem.id);
      
      if (direction === 'next' && currentIndex < sameAircraftItems.length - 1) {
        targetItem = sameAircraftItems[currentIndex + 1];
      } else if (direction === 'prev' && currentIndex > 0) {
        targetItem = sameAircraftItems[currentIndex - 1];
      } else {
        // No more items in the same aircraft, look for next/prev item in other filtered aircraft
        const filteredItems = items
          .filter(item => filteredRegistrations.length === 0 || filteredRegistrations.includes(item.group))
          .sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf());
        
        const currentTime = selectedItem.start_time;
        
        if (direction === 'next') {
          // Find next item after current selected item's time in filtered aircraft
          targetItem = filteredItems.find(item => 
            item.start_time.isAfter(currentTime) && item.id !== selectedItem.id
          ) || null;
        } else {
          // Find previous item before current selected item's time in filtered aircraft
          const pastItems = filteredItems.filter(item => 
            item.start_time.isBefore(currentTime) && item.id !== selectedItem.id
          );
          targetItem = pastItems[pastItems.length - 1] || null;
        }
      }
    } else {
      // No item selected - use current timeline view center and navigate within filtered aircraft
      const filteredItems = items
        .filter(item => filteredRegistrations.length === 0 || filteredRegistrations.includes(item.group))
        .sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf());

      if (filteredItems.length === 0) return;

      const currentViewCenter = timelineStart.clone().add(timelineEnd.diff(timelineStart) / 2);

      if (direction === 'next') {
        // Find next item after current view center in filtered aircraft
        targetItem = filteredItems.find(item => item.start_time.isAfter(currentViewCenter)) || null;
      } else {
        // Find previous item before current view center in filtered aircraft
        const pastItems = filteredItems.filter(item => item.start_time.isBefore(currentViewCenter));
        targetItem = pastItems[pastItems.length - 1] || null;
      }
    }

    if (targetItem) {
      handleItemSelect(targetItem.id);
    }
  }, [items, filteredRegistrations, selectedItem, timelineStart, timelineEnd, handleItemSelect]);

  // Clear status filters that are no longer available when aircraft selection changes
  useEffect(() => {
    if (filteredStatuses.length > 0) {
      const validStatuses = filteredStatuses.filter(status => allStatuses.includes(status));
      if (validStatuses.length !== filteredStatuses.length) {
        setFilteredStatuses(validStatuses);
      }
    }
  }, [filteredRegistrations, allStatuses, filteredStatuses]);

  // Effect to handle clicks outside of dropdown and timeline for deselection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRegistrationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) return <div className="loading">⏳ Loading timeline data...</div>;
  if (error) return <div className="error"><strong>❌ Error:</strong> {error}</div>;

  return (
    <div className={`App ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <Header isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(p => !p)} />
      
      <ControlsAndStats
        viewMode={viewMode} setViewMode={setViewMode} navigateTimeline={navigateToItem} goToToday={goToToday}
        highlightedDate={highlightedDate} timelineStart={timelineStart} jumpToDate={jumpToDate}
        showFlights={showFlights} setShowFlights={setShowFlights} flights={flights} workPackages={workPackages}
        allStatuses={allStatuses} filteredStatuses={filteredStatuses} handleStatusFilter={handleStatusFilter}
        items={items} allRegistrations={allRegistrations} filteredRegistrations={filteredRegistrations}
      />
      
      {/* Combined timeline header with aircraft dropdown and selected item display */}
      <div className="timeline-header-row">
        <div className="aircraft-dropdown-section">
          <TimelineControls
            dropdownRef={dropdownRef} registrationDropdownOpen={registrationDropdownOpen} setRegistrationDropdownOpen={setRegistrationDropdownOpen}
            getSelectedRegistrationsText={getSelectedRegistrationsText} handleSelectAllRegistrations={handleSelectAllRegistrations}
            filteredRegistrations={filteredRegistrations} allRegistrations={allRegistrations}
            handleRegistrationFilter={handleRegistrationFilter} clearFilters={clearFilters}
          />
        </div>
        <div className="selected-item-section">
          <SelectedItemDisplay selectedItem={selectedItem} onDeselect={() => setSelectedItem(null)} items={items} inline={true} />
        </div>
      </div>

      <div className="timeline-container">
        <SimpleTimeline
          groups={groups}
          items={items}
          visibleTimeStart={timelineStart.valueOf()}
          visibleTimeEnd={timelineEnd.valueOf()}
          sidebarWidth={200}
          itemHeightRatio={0.8}
          canMove={false}
          canResize={false}
          stackItems
          lineHeight={70}
          selectedItemId={selectedItem?.id}
          highlightRanges={highlightedDate ? [{
            start: highlightedDate.clone().startOf('day').valueOf(),
            end: highlightedDate.clone().endOf('day').valueOf(),
            className: 'hl-selected-day'
          }] : []}
          onItemSelect={handleItemSelect}
          onItemDeselect={() => setSelectedItem(null)}
          onTimeChange={(start, end) => {
            setTimelineStart(moment(start));
            setTimelineEnd(moment(end));
          }}
        />
      </div>
    </div>
  );
};

export default App;
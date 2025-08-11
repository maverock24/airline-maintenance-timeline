import React, { useMemo, useRef, useState, useEffect } from 'react';
import moment from 'moment';
import './SimpleTimeline.css';
import { SimpleTimelineItem, SimpleTimelineProps } from '../utils/types';

const SimpleTimeline: React.FC<SimpleTimelineProps> = ({
  groups,
  items,
  visibleTimeStart,
  visibleTimeEnd,
  sidebarWidth = 200,
  lineHeight = 70,
  itemHeightRatio = 0.8,
  canSelect = true,
  stackItems = true,
  onItemSelect,
  onItemDeselect,
  onTimeChange,
  selectedItemId,
  viewMode,
  highlightRanges = [],
}) => {
  const start = useMemo(() => moment(visibleTimeStart), [visibleTimeStart]);
  const end = useMemo(() => moment(visibleTimeEnd), [visibleTimeEnd]);
  const totalMs = useMemo(() => Math.max(1, end.diff(start)), [start, end]);

  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRowsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Combined drag state for both horizontal and vertical dragging
  const [dragging, setDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'horizontal' | 'vertical' | null>(null);
  const dragStateRef = useRef<{ 
    x: number; 
    y: number; 
    startMs: number; 
    endMs: number; 
    startScrollTop: number;
  } | null>(null);

  // Track user interactions to prevent auto-scroll when user is actively positioning
  const [userInteracting, setUserInteracting] = useState(false);
  const userInteractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to mark user interaction and prevent auto-scroll for a period
  const markUserInteraction = () => {
    setUserInteracting(true);
    
    // Clear any existing timeout
    if (userInteractionTimeoutRef.current) {
      clearTimeout(userInteractionTimeoutRef.current);
    }
    
    // Set a timeout to allow auto-scroll again after 2 seconds of inactivity
    userInteractionTimeoutRef.current = setTimeout(() => {
      setUserInteracting(false);
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
    };
  }, []);

  // Read parent timeline container padding-top so sticky headers can visually cover it
  const [containerTopPad, setContainerTopPad] = useState<string>('0px');
  useEffect(() => {
    const updatePad = () => {
      const el = rootRef.current;
      if (!el) return;
      const container = el.closest('.timeline-container') as HTMLElement | null;
      if (!container) return;
      const cs = getComputedStyle(container);
      setContainerTopPad(cs.paddingTop || '0px');
    };
    updatePad();
    window.addEventListener('resize', updatePad);
    return () => window.removeEventListener('resize', updatePad);
  }, []);

  // Responsive + content-based sidebar width
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [computedSidebarWidth, setComputedSidebarWidth] = useState<number>(sidebarWidth);
  useEffect(() => {
    // Measure longest group title width using canvas with computed font
    const el = rootRef.current;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) {
      setComputedSidebarWidth(sidebarWidth);
      return;
    }
    let font = '14px system-ui';
    if (el) {
      const probe = el.querySelector('.st-group') as HTMLElement | null;
      if (probe) {
        const cs = getComputedStyle(probe);
        // canvas font syntax: style variant weight size family
        font = `${cs.fontStyle || ''} ${cs.fontVariant || ''} ${cs.fontWeight || ''} ${cs.fontSize || '14px'} ${cs.fontFamily || 'system-ui'}`.trim();
      }
    }
    ctx.font = font;
    const horizontalPadding = 24; // .st-group padding: 0 12px

    let maxW = ctx.measureText('Aircraft').width;
    for (const g of groups) {
      const w = ctx.measureText(g.title).width;
      if (w > maxW) maxW = w;
    }

    const raw = Math.ceil(maxW + horizontalPadding);
    const minW = 100;
    const maxWCap = viewportWidth < 768 ? 180 : 340;
    const next = Math.max(minW, Math.min(raw, maxWCap));

    // Defer to next frame to avoid layout thrash
    requestAnimationFrame(() => setComputedSidebarWidth(next));
  }, [groups, viewportWidth, sidebarWidth]);

  // Touch state for mobile pan/pinch
  const touchStateRef = useRef<{
    mode: 'pan' | 'pinch' | null;
    startX: number;
    startY: number;
    startMs: number;
    endMs: number;
    width: number;
    lockedPan?: boolean;
    startDist?: number;
    anchorRatio?: number; // 0..1 across content width
  } | null>(null);

  // Simplified scroll synchronization between sidebar and content
  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollRef.current && scrollRef.current.scrollTop !== scrollTop) {
      scrollRef.current.scrollTop = scrollTop;
    }
  };

  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    
    // Mark user interaction when scrolling (unless it's a programmatic scroll)
    // We use a simple heuristic: if the user is not currently dragging and 
    // the scroll event happens, it's likely a user-initiated scroll
    if (!dragging) {
      markUserInteraction();
    }
    
    if (sidebarRowsRef.current && sidebarRowsRef.current.scrollTop !== scrollTop) {
      sidebarRowsRef.current.scrollTop = scrollTop;
    }
  };

  // Derived: group -> items with stacking lanes
  type PlacedItem = SimpleTimelineItem & { lane: number };
  const grouped = useMemo(() => {
    const byGroup: Record<string, PlacedItem[]> = {};
    const itemHeight = Math.floor(lineHeight * itemHeightRatio);
    for (const g of groups) byGroup[g.id] = [];

    // Sort items by start time per group
    const itemsPerGroup: Record<string, SimpleTimelineItem[]> = {};
    for (const g of groups) itemsPerGroup[g.id] = [];
    for (const it of items) {
      if (!itemsPerGroup[it.group]) itemsPerGroup[it.group] = [];
      itemsPerGroup[it.group].push(it);
    }
    for (const gid of Object.keys(itemsPerGroup)) {
      itemsPerGroup[gid].sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf());
    }

    const rowHeights: Record<string, number> = {};

    for (const g of groups) {
      const gi = itemsPerGroup[g.id] || [];
      const lanes: moment.Moment[] = []; // track end_time per lane
      const placed: PlacedItem[] = [];
      for (const it of gi) {
        let laneIdx = 0;
        if (stackItems) {
          laneIdx = lanes.findIndex((laneEnd) => it.start_time.isSameOrAfter(laneEnd));
          if (laneIdx === -1) {
            laneIdx = lanes.length;
            lanes.push(it.end_time.clone());
          } else {
            lanes[laneIdx] = it.end_time.clone();
          }
        } else {
          laneIdx = 0;
        }
        placed.push({ ...it, lane: laneIdx });
      }
      byGroup[g.id] = placed;
      const laneCount = Math.max(1, placed.reduce((m, p) => Math.max(m, p.lane + 1), 1));
      rowHeights[g.id] = Math.max(lineHeight, laneCount * (itemHeight + 4) + 4);
    }

    return { byGroup, rowHeights, itemHeight };
  }, [groups, items, stackItems, lineHeight, itemHeightRatio]);

  const { byGroup, rowHeights, itemHeight } = grouped;

  // Scroll to selected item when selectedItemId changes
  useEffect(() => {
    if (!selectedItemId || !scrollRef.current || userInteracting) return;

    // Small delay to allow horizontal timeline positioning to complete first
    const scrollTimeout = setTimeout(() => {
      // Find which group contains the selected item and the specific item
      let targetGroupIndex = -1;
      let targetItem: PlacedItem | null = null;

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const groupItems = byGroup[group.id] || [];
        const foundItem = groupItems.find(item => item.id === selectedItemId);
        if (foundItem) {
          targetGroupIndex = i;
          targetItem = foundItem;
          break;
        }
      }

      if (!targetItem || targetGroupIndex === -1 || !scrollRef.current) return;

      // Calculate the vertical position of the target item
      let targetTop = 0;
      
      for (let i = 0; i < targetGroupIndex; i++) {
        const group = groups[i];
        targetTop += rowHeights[group.id] || lineHeight;
      }

      const itemTopWithinGroup = 4 + targetItem.lane * (itemHeight + 4);
      const itemCenterY = targetTop + itemTopWithinGroup + itemHeight / 2;

      // Get the current scroll container dimensions
      const scrollContainer = scrollRef.current;
      const containerHeight = scrollContainer.clientHeight;
      const currentScrollTop = scrollContainer.scrollTop;
      
      // Check if the item is already reasonably visible
      const itemTop = targetTop + itemTopWithinGroup;
      const itemBottom = itemTop + itemHeight;
      const visibleTop = currentScrollTop;
      const visibleBottom = currentScrollTop + containerHeight;
      
      // Add some padding for comfortable viewing (20% of container height)
      const padding = containerHeight * 0.2;
      const comfortableTop = visibleTop + padding;
      const comfortableBottom = visibleBottom - padding;
      
      // Only scroll if the item is not comfortably visible
      if (itemTop < comfortableTop || itemBottom > comfortableBottom) {
        // Center the item vertically in the viewport
        const newScrollTop = itemCenterY - containerHeight / 2;
        
        scrollContainer.scrollTo({
          top: Math.max(0, newScrollTop),
          behavior: 'smooth'
        });

        // Also sync the sidebar scroll
        if (sidebarRowsRef.current) {
          sidebarRowsRef.current.scrollTo({
            top: Math.max(0, newScrollTop),
            behavior: 'smooth'
          });
        }
      }
    }, 50); // 50ms delay to coordinate with horizontal scrolling

    return () => clearTimeout(scrollTimeout);
  }, [selectedItemId, byGroup, groups, rowHeights, lineHeight, itemHeight, userInteracting]);

  // Track scrollbar presence to maintain consistent positioning
  const [scrollbarWidth, setScrollbarWidth] = useState<number>(0);
  
  useEffect(() => {
    const updateScrollbarWidth = () => {
      if (scrollRef.current) {
        // Calculate scrollbar width as difference between offset and client width
        const scrollbarW = scrollRef.current.offsetWidth - scrollRef.current.clientWidth;
        setScrollbarWidth(scrollbarW);
      }
    };
    
    updateScrollbarWidth();
    
    // Use ResizeObserver to detect when scrollbar appears/disappears
    const resizeObserver = new ResizeObserver(updateScrollbarWidth);
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [groups, items]); // Update when data changes that might affect scrollbar

  // Helpers
  const timeToPercent = (t: moment.Moment) => {
    const msFromStart = t.diff(start);
    return Math.max(0, Math.min(100, (msFromStart / totalMs) * 100));
  };

  const onMouseDownContent: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!onTimeChange) return;
    
    // Mark user interaction to prevent auto-scroll
    markUserInteraction();
    
    setDragging(true);
    setDragDirection(null); // Will be determined by first mouse movement
    const scrollTop = scrollRef.current?.scrollTop || 0;
    dragStateRef.current = { 
      x: e.clientX, 
      y: e.clientY,
      startMs: start.valueOf(), 
      endMs: end.valueOf(),
      startScrollTop: scrollTop
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging || !onTimeChange || !contentRef.current || !dragStateRef.current) return;
      
      const { x, y, startMs, endMs, startScrollTop } = dragStateRef.current;
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      
      // Determine drag direction based on initial movement (if not already determined)
      if (dragDirection === null) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        
        // Require minimum movement to determine direction
        if (absX > 5 || absY > 5) {
          setDragDirection(absX > absY ? 'horizontal' : 'vertical');
        }
        return;
      }
      
      if (dragDirection === 'horizontal') {
        // Horizontal timeline dragging
        const width = contentRef.current.clientWidth || 1;
        const shiftRatio = dx / width;
        const shiftMs = -Math.round(shiftRatio * (endMs - startMs));
        onTimeChange(startMs + shiftMs, endMs + shiftMs);
      } else if (dragDirection === 'vertical' && scrollRef.current) {
        // Vertical scroll dragging
        const newScrollTop = startScrollTop - dy;
        scrollRef.current.scrollTop = Math.max(0, newScrollTop);
      }
    };
    
    const onUp = () => {
      setDragging(false);
      setDragDirection(null);
      dragStateRef.current = null;
    };
    
    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, dragDirection, onTimeChange]);

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!onTimeChange) return;
    const content = contentRef.current;
    const curStart = start.valueOf();
    const curEnd = end.valueOf();
    const duration = curEnd - curStart;

    const isZoom = e.ctrlKey || e.altKey || e.metaKey;
    const verticalIntent = Math.abs(e.deltaY) >= Math.abs(e.deltaX);

    if (isZoom && content) {
      e.preventDefault();
      // Mark user interaction for zoom
      markUserInteraction();
      
      // Zoom around cursor point
      const rect = content.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / Math.max(1, rect.width)));
      const anchor = curStart + ratio * duration;
      const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8333; // zoom out / in
      const newDuration = Math.max(60_000, Math.round(duration * zoomFactor));
      const newStart = Math.round(anchor - ratio * newDuration);
      const newEnd = newStart + newDuration;
      onTimeChange(newStart, newEnd);
      return;
    }

    // If user is scrolling vertically, allow default behavior so the outer container scrolls
    if (verticalIntent) {
      // Mark user interaction for vertical scrolling
      markUserInteraction();
      return;
    }

    // Horizontal pan with wheel
    e.preventDefault();
    // Mark user interaction for horizontal panning
    markUserInteraction();
    
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY; // support trackpads
    const shiftMs = Math.round(duration * (delta > 0 ? 0.1 : -0.1));
    onTimeChange(curStart + shiftMs, curEnd + shiftMs);
  };

  // Ultra-simple unified time markers - one source for both header and grid
  const sharedTimeMarkers = useMemo(() => {
    const markers: { timestamp: number; label: string; leftPercent: number; centerPercent: number }[] = [];
    const duration = totalMs;
    
    // Simple step logic: hourly for short durations, daily for longer
    const stepMs = duration <= 2 * 24 * 60 * 60 * 1000 ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const isHourly = stepMs === 60 * 60 * 1000;
    
    // Start from the first aligned boundary
    const startMs = start.valueOf();
    const endMs = end.valueOf();
    const alignedStart = isHourly 
      ? start.clone().startOf('hour').valueOf()
      : start.clone().startOf('day').valueOf();
    
    // Generate markers at fixed intervals
    for (let ts = alignedStart; ts <= endMs; ts += stepMs) {
      if (ts <= startMs) continue; // Skip markers before visible range
      
      // Calculate the center position of the time interval
      const intervalStart = ts;
      const intervalCenter = intervalStart + (stepMs / 2);
      
      const percent = ((intervalStart - startMs) / duration) * 100;
      const centerPercent = ((intervalCenter - startMs) / duration) * 100;
      
      const label = isHourly 
        ? moment(ts).format('HH:00')
        : moment(ts).format('ddd DD');
        
      markers.push({
        timestamp: ts,
        label,
        leftPercent: percent,
        centerPercent
      });
    }
    
    return markers;
  }, [start, end, totalMs]);

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!onTimeChange || !contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStateRef.current = {
        mode: 'pan',
        startX: t.clientX,
        startY: t.clientY,
        startMs: start.valueOf(),
        endMs: end.valueOf(),
        width: Math.max(1, rect.width),
        lockedPan: false,
      };
    } else if (e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStateRef.current = {
        mode: 'pinch',
        startX: midX,
        startY: (t1.clientY + t2.clientY) / 2,
        startMs: start.valueOf(),
        endMs: end.valueOf(),
        width: Math.max(1, rect.width),
        startDist: Math.max(1, dist),
        anchorRatio: Math.max(0, Math.min(1, midX / Math.max(1, rect.width))),
      };
      e.preventDefault();
    }
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!onTimeChange || !contentRef.current || !touchStateRef.current) return;
    const state = touchStateRef.current;
    const curStart = state.startMs;
    const curEnd = state.endMs;
    const duration = curEnd - curStart;

    if (state.mode === 'pinch' && e.touches.length >= 2 && state.startDist && state.anchorRatio !== undefined) {
      // Pinch to zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const curDist = Math.max(1, Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY));
      const scale = curDist / state.startDist; // >1 fingers apart
      const newDuration = Math.max(60_000, Math.round(duration / scale));
      const anchor = curStart + state.anchorRatio * duration;
      const newStart = Math.round(anchor - state.anchorRatio * newDuration);
      const newEnd = newStart + newDuration;
      onTimeChange(newStart, newEnd);
      e.preventDefault();
      return;
    }

    if (state.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - state.startX;
      const dy = t.clientY - state.startY;
      // Decide if we lock into horizontal pan; else let vertical scroll happen
      if (!state.lockedPan) {
        if (Math.abs(dx) > Math.abs(dy) + 6) {
          state.lockedPan = true;
        } else {
          return; // let vertical scroll bubble
        }
      }
      // Horizontal pan
      const shiftRatio = dx / state.width;
      const shiftMs = -Math.round(shiftRatio * duration);
      onTimeChange(curStart + shiftMs, curEnd + shiftMs);
      e.preventDefault();
      return;
    }
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    // Reset when touches end
    touchStateRef.current = null;
  };

  return (
    <div className="simple-timeline" onWheel={handleWheel} ref={rootRef} style={{ ['--tc-pad' as any]: containerTopPad }}>
      <div className="st-sidebar" style={{ width: computedSidebarWidth }}>
        <div className="st-sidebar-header">Aircraft</div>
        {/* remove spacer; one sticky row across both panes */}
        <div className="st-sidebar-rows" ref={sidebarRowsRef} onScroll={handleSidebarScroll}>
          {groups.map(g => (
            <div key={g.id} className="st-group" style={{ height: rowHeights[g.id] || lineHeight }}>
              {g.title}
            </div>
          ))}
        </div>
      </div>
      <div
        className="st-content"
        ref={contentRef}
        data-scrollbar-width={scrollbarWidth}
        onMouseDown={onMouseDownContent}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {/* Sticky tick header that adjusts for scrollbar width */}
        <div className="st-tick-header">
          {/* Grid lines for header */}
          {sharedTimeMarkers.map((marker) => {
            return (
              <div key={`header-grid-${marker.timestamp}`} className="st-tick-border" style={{ left: `${marker.leftPercent}%` }} />
            );
          })}
          {/* Centered text labels */}
          {sharedTimeMarkers.map((marker) => {
            return (
              <div key={marker.timestamp} className="st-tick" style={{ left: `${marker.centerPercent}%` }}>
                <span className="st-tick-label">{marker.label}</span>
              </div>
            );
          })}
        </div>
        <div className="st-scroll" ref={scrollRef} onScroll={handleContentScroll}>
          {/* Gentle vertical highlights for ranges (e.g., selected date) */}
          <div className="st-highlights" style={{ 
            height: Object.values(rowHeights).reduce((sum, height) => sum + height, 0) + 'px'
          }}>
            {/* Weekend highlighting temporarily removed for debugging */}
            {/* Custom highlight ranges (e.g., selected date) */}
            {highlightRanges.map((hr, idx) => {
              const l = timeToPercent(moment(hr.start));
              const r = timeToPercent(moment(hr.end));
              const w = Math.max(0, r - l);
              if (w <= 0) return null;
              return (
                <div
                  key={`${hr.start}-${hr.end}-${idx}`}
                  className={`st-highlight-range ${hr.className || ''}`}
                  style={{ left: `${l}%`, width: `${w}%` }}
                />
              );
            })}
          </div>
          <div className="st-grid" style={{ 
            height: Object.values(rowHeights).reduce((sum, height) => sum + height, 0) + 'px'
          }}>
            {sharedTimeMarkers.map((marker) => {
              return <div key={`grid-${marker.timestamp}`} className="st-grid-line" style={{ left: `${marker.leftPercent}%` }} />;
            })}
          </div>
          <div className="st-rows">
            {groups.map((group) => {
              const gi = (byGroup[group.id] || []) as PlacedItem[];
              const rowH = rowHeights[group.id] || lineHeight;
              return (
                <div key={group.id} className="st-row" data-group-id={group.id} style={{ height: rowH }}>
                  {gi.map(item => {
                    const left = timeToPercent(item.start_time);
                    const right = timeToPercent(item.end_time);
                    const width = Math.max(0.5, right - left);
                    const top = 4 + item.lane * (itemHeight + 4);
                    const isSelected = selectedItemId !== undefined && selectedItemId === item.id;
                    const isFlightItem = item.id.toString().startsWith('flight-');
                    return (
                      <div
                        key={item.id}
                        className={`st-item ${item.itemProps?.className || ''} ${isSelected ? 'selected' : ''} ${isFlightItem ? 'flight-item' : ''}`}
                        data-item-id={item.id}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          height: itemHeight,
                          top,
                          position: 'absolute',
                          zIndex: isSelected ? 10 : 2,
                          ...(item.itemProps?.style || {}),
                          ...(isSelected ? {} : { boxShadow: (item.itemProps?.style as any)?.boxShadow }),
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canSelect && onItemSelect) {
                            onItemSelect(item.id, e, item.start_time.valueOf());
                          }
                        }}
                        title={item.title}
                      >
                        <div className="st-item-title">{item.title}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTimeline;

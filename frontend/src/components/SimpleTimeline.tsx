import React, { useMemo, useRef, useState, useEffect } from 'react';
import moment from 'moment';

export interface SimpleTimelineGroup {
  id: string;
  title: string;
}

export interface SimpleTimelineItem {
  id: string | number;
  group: string;
  title: string;
  start_time: moment.Moment;
  end_time: moment.Moment;
  itemProps?: React.HTMLAttributes<HTMLDivElement>;
}

interface SimpleTimelineProps {
  groups: SimpleTimelineGroup[];
  items: SimpleTimelineItem[];
  visibleTimeStart: number;
  visibleTimeEnd: number;
  sidebarWidth?: number;
  lineHeight?: number;
  itemHeightRatio?: number;
  canMove?: boolean;
  canResize?: boolean;
  canSelect?: boolean;
  stackItems?: boolean;
  onItemSelect?: (itemId: string | number, e: React.SyntheticEvent, time: number) => void;
  onItemDeselect?: () => void;
  onTimeChange?: (visibleTimeStart: number, visibleTimeEnd: number) => void;
  // New: selected item highlight
  selectedItemId?: string | number;
  // New: view mode hint for tick labels
  viewMode?: 'day' | 'week' | 'month';
}

// Minimal, custom timeline compatible with used features of react-calendar-timeline
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
}) => {
  const start = useMemo(() => moment(visibleTimeStart), [visibleTimeStart]);
  const end = useMemo(() => moment(visibleTimeEnd), [visibleTimeEnd]);
  const totalMs = useMemo(() => Math.max(1, end.diff(start)), [start, end]);

  const contentRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStateRef = useRef<{ x: number; startMs: number; endMs: number } | null>(null);

  // Responsive sidebar width
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const actualSidebarWidth = useMemo(() => (viewportWidth < 768 ? Math.min(120, sidebarWidth) : sidebarWidth), [viewportWidth, sidebarWidth]);

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
          // Find first lane where this item doesn't overlap
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

  // Helpers
  const timeToPercent = (t: moment.Moment) => {
    const msFromStart = t.diff(start);
    return Math.max(0, Math.min(100, (msFromStart / totalMs) * 100));
  };

  const onMouseDownContent: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!onTimeChange) return;
    setDragging(true);
    dragStateRef.current = { x: e.clientX, startMs: start.valueOf(), endMs: end.valueOf() };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging || !onTimeChange || !contentRef.current || !dragStateRef.current) return;
      const { x, startMs, endMs } = dragStateRef.current;
      const dx = e.clientX - x;
      const width = contentRef.current.clientWidth || 1;
      const shiftRatio = dx / width; // positive dx => move forward in time to the left visually; we want pan left visually => start increases
      const shiftMs = -Math.round(shiftRatio * (endMs - startMs));
      onTimeChange(startMs + shiftMs, endMs + shiftMs);
    };
    const onUp = () => {
      setDragging(false);
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
  }, [dragging, onTimeChange]);

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
      return;
    }

    // Horizontal pan with wheel
    e.preventDefault();
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY; // support trackpads
    const shiftMs = Math.round(duration * (delta > 0 ? 0.1 : -0.1));
    onTimeChange(curStart + shiftMs, curEnd + shiftMs);
  };

  // Build time grid lines (major/minor) and tick labels based on visible range
  const tickHeader = useMemo(() => {
    const duration = totalMs;
    // Determine mode if not provided
    let mode: 'day' | 'week' | 'month' = viewMode || 'day';
    if (!viewMode) {
      if (duration <= 2 * 24 * 60 * 60 * 1000) mode = 'day';
      else if (duration <= 21 * 24 * 60 * 60 * 1000) mode = 'week';
      else mode = 'month';
    }

    let unit: moment.unitOfTime.DurationConstructor;
    let step = 1;
    let format = 'HH:mm';

    if (mode === 'day') {
      unit = 'hour';
      step = 1;
      format = 'HH:00';
    } else {
      unit = 'day';
      step = 1;
      format = mode === 'week' ? 'ddd DD' : 'MMM DD';
    }

    const ticks: { ts: number; next: number; label: string }[] = [];
    const aligned = start.clone().startOf(unit);
    for (let t = aligned.clone(); t.isBefore(end); t.add(step, unit)) {
      const ts = t.valueOf();
      const next = t.clone().add(step, unit).valueOf();
      if (next <= start.valueOf()) continue;
      if (ts < start.valueOf()) continue;
      ticks.push({ ts, next, label: t.format(format) });
    }
    return { ticks };
  }, [start, end, totalMs, viewMode]);

  const grid = useMemo(() => {
    const duration = totalMs;
    const minors: number[] = [];
    const majors: number[] = [];

    let unit: moment.unitOfTime.DurationConstructor = 'hour';
    let step = 1;
    if (duration <= 36 * 60 * 60 * 1000) {
      unit = 'hour'; step = duration <= 12 * 60 * 60 * 1000 ? 1 : 3;
    } else if (duration <= 21 * 24 * 60 * 60 * 1000) {
      unit = 'day'; step = 1;
    } else {
      unit = 'day'; step = 7; // weekly
    }

    const startAligned = start.clone().startOf(unit);
    for (let t = startAligned.clone(); t.isBefore(end); t.add(step, unit)) {
      const ts = t.valueOf();
      if (ts <= start.valueOf()) continue;
      if (t.hours && unit === 'hour' && (t.hours() % 6 === 0)) majors.push(ts); else majors.push(ts);
      minors.push(ts);
    }

    return { minors, majors };
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
    <div className="simple-timeline" onWheel={handleWheel}>
      <div className="st-sidebar" style={{ width: actualSidebarWidth }}>
        <div className="st-sidebar-header">Aircraft</div>
        {/* remove spacer; one sticky row across both panes */}
        <div className="st-sidebar-rows">
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
        onMouseDown={onMouseDownContent}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {/* Sticky tick header outside the horizontal scroller so it sticks to the top while the container scrolls vertically */}
        <div className="st-tick-header">
          {tickHeader.ticks.map((tk) => {
            const left = timeToPercent(moment(tk.ts));
            const right = timeToPercent(moment(tk.next));
            const width = Math.max(0, right - left);
            return (
              <div key={tk.ts} className="st-tick" style={{ left: `${left}%`, width: `${width}%` }}>
                <span className="st-tick-label">{tk.label}</span>
              </div>
            );
          })}
        </div>
        <div className="st-scroll">
          <div className="st-grid">
            {grid.minors.map((ts) => {
              const p = timeToPercent(moment(ts));
              return <div key={ts} className="st-grid-line" style={{ left: `${p}%` }} />;
            })}
          </div>
          <div className="st-rows" onClick={() => onItemDeselect && onItemDeselect()}>
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
                    return (
                      <div
                        key={item.id}
                        className={`st-item ${item.itemProps?.className || ''} ${isSelected ? 'selected' : ''}`}
                        data-item-id={item.id}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          height: itemHeight,
                          top,
                          position: 'absolute',
                          zIndex: isSelected ? 5 : 2,
                          ...(item.itemProps?.style || {}),
                          boxShadow: isSelected ? '0 0 0 2px #e53e3e' : (item.itemProps?.style as any)?.boxShadow,
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
      <style>{`
        .simple-timeline { display: flex; width: 100%; border: 1px solid var(--border-primary); background: var(--bg-primary); color: var(--text-primary); user-select: none; --st-tick-height: 32px; overflow: visible; }
        .st-sidebar { border-right: 1px solid var(--border-primary); background: var(--bg-secondary); position: sticky; left: 0; z-index: 2; }
        .st-sidebar-header { position: sticky; top: 0; z-index: 3; height: var(--st-tick-height); padding: 0 12px; display: flex; align-items: center; border-bottom: 1px solid var(--border-primary); background: var(--bg-secondary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-sizing: border-box; }
        .st-sidebar-rows { border-top: 2px solid var(--border-primary); }
        .st-group { display: flex; align-items: center; padding: 0 12px; border-bottom: 2px solid var(--border-primary); box-sizing: border-box; }
        .st-content { flex: 1; position: relative; overflow: visible; }
        .st-tick-header { position: sticky; top: 0; z-index: 3; height: var(--st-tick-height); background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); }
        .st-scroll { position: relative; overflow-x: auto; overflow-y: visible; }
        .st-tick { position: absolute; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; border-left: 1px solid var(--border-primary); }
        .st-tick-label { font-size: 11px; color: var(--text-secondary); }
        .st-grid { position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: 1; }
        .st-grid-line { position: absolute; top: 0; bottom: 0; width: 0.5px; background: var(--border-primary); opacity: 0.35; }
        .st-rows { position: relative; z-index: 2; border-top: 2px solid var(--border-primary); }
        .st-row { position: relative; border-bottom: 2px solid var(--border-primary); box-sizing: border-box; }
        .st-item { border-radius: 4px; overflow: hidden; cursor: pointer; padding: 6px 8px; box-sizing: border-box; }
        .st-item.selected { box-shadow: 0 0 0 2px #e53e3e; }
        .st-item-title { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        @media (max-width: 768px) {
          .st-group { font-size: 12px; padding: 0 8px; }
          .st-item-title { font-size: 11px; }
        }
      `}</style>
    </div>
  );
};

export default SimpleTimeline;

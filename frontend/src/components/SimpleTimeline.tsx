import moment from 'moment';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import './SimpleTimeline.css';
import {
  TIMELINE_CONFIG,
  TIME_CONSTANTS,
  INTERACTION_CONFIG,
  GRID_CONFIG,
  DATE_FORMATS,
} from '../utils/constants';
import { SimpleTimelineItem, SimpleTimelineProps } from '../utils/types';

const SimpleTimeline: React.FC<SimpleTimelineProps> = ({
  groups,
  items,
  visibleTimeStart,
  visibleTimeEnd,
  sidebarWidth = TIMELINE_CONFIG.DEFAULT_SIDEBAR_WIDTH,
  lineHeight = TIMELINE_CONFIG.DEFAULT_LINE_HEIGHT,
  itemHeightRatio = TIMELINE_CONFIG.DEFAULT_ITEM_HEIGHT_RATIO,
  canSelect = true,
  stackItems = true,
  onItemSelect,
  onItemDeselect: _onItemDeselect,
  onTimeChange,
  selectedItemId,
  viewMode: _viewMode,
  highlightRanges = [],
}) => {
  const start = useMemo(() => moment(visibleTimeStart), [visibleTimeStart]);
  const end = useMemo(() => moment(visibleTimeEnd), [visibleTimeEnd]);
  const totalMs = useMemo(() => Math.max(1, end.diff(start)), [start, end]);

  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRowsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<
    'horizontal' | 'vertical' | null
  >(null);
  const dragStateRef = useRef<{
    x: number;
    y: number;
    startMs: number;
    endMs: number;
    startScrollTop: number;
  } | null>(null);

  const [userInteracting, setUserInteracting] = useState(false);
  const userInteractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const markUserInteraction = () => {
    setUserInteracting(true);

    if (userInteractionTimeoutRef.current) {
      clearTimeout(userInteractionTimeoutRef.current);
    }

    userInteractionTimeoutRef.current = setTimeout(() => {
      setUserInteracting(false);
    }, INTERACTION_CONFIG.USER_INTERACTION_TIMEOUT);
  };

  useEffect(() => {
    return () => {
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
    };
  }, []);

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

  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [computedSidebarWidth, setComputedSidebarWidth] =
    useState<number>(sidebarWidth);
  useEffect(() => {
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
        font =
          `${cs.fontStyle || ''} ${cs.fontVariant || ''} ${cs.fontWeight || ''} ${cs.fontSize || '14px'} ${cs.fontFamily || 'system-ui'}`.trim();
      }
    }
    ctx.font = font;
    const horizontalPadding = TIMELINE_CONFIG.HORIZONTAL_PADDING;

    let maxW = ctx.measureText('Aircraft').width;
    for (const g of groups) {
      const w = ctx.measureText(g.title).width;
      if (w > maxW) maxW = w;
    }

    const raw = Math.ceil(maxW + horizontalPadding);
    const minW = TIMELINE_CONFIG.MIN_SIDEBAR_WIDTH;
    const maxWCap =
      viewportWidth < TIMELINE_CONFIG.MOBILE_BREAKPOINT
        ? TIMELINE_CONFIG.MOBILE_MAX_SIDEBAR_WIDTH
        : TIMELINE_CONFIG.DESKTOP_MAX_SIDEBAR_WIDTH;
    const next = Math.max(minW, Math.min(raw, maxWCap));

    requestAnimationFrame(() => setComputedSidebarWidth(next));
  }, [groups, viewportWidth, sidebarWidth]);

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

  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollRef.current && scrollRef.current.scrollTop !== scrollTop) {
      scrollRef.current.scrollTop = scrollTop;
    }
  };

  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;

    if (!dragging) {
      markUserInteraction();
    }

    if (
      sidebarRowsRef.current &&
      sidebarRowsRef.current.scrollTop !== scrollTop
    ) {
      sidebarRowsRef.current.scrollTop = scrollTop;
    }
  };

  type PlacedItem = SimpleTimelineItem & { lane: number };
  const grouped = useMemo(() => {
    const byGroup: Record<string, PlacedItem[]> = {};
    const itemHeight = Math.floor(lineHeight * itemHeightRatio);
    for (const g of groups) byGroup[g.id] = [];

    const itemsPerGroup: Record<string, SimpleTimelineItem[]> = {};
    for (const g of groups) itemsPerGroup[g.id] = [];
    for (const it of items) {
      if (!itemsPerGroup[it.group]) itemsPerGroup[it.group] = [];
      itemsPerGroup[it.group].push(it);
    }
    for (const gid of Object.keys(itemsPerGroup)) {
      itemsPerGroup[gid].sort(
        (a, b) => a.start_time.valueOf() - b.start_time.valueOf()
      );
    }

    const rowHeights: Record<string, number> = {};

    for (const g of groups) {
      const gi = itemsPerGroup[g.id] || [];
      const lanes: moment.Moment[] = [];
      const placed: PlacedItem[] = [];
      for (const it of gi) {
        let laneIdx = 0;
        if (stackItems) {
          laneIdx = lanes.findIndex((laneEnd) =>
            it.start_time.isSameOrAfter(laneEnd)
          );
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
      const laneCount = Math.max(
        1,
        placed.reduce((m, p) => Math.max(m, p.lane + 1), 1)
      );
      rowHeights[g.id] = Math.max(
        lineHeight,
        laneCount * (itemHeight + TIMELINE_CONFIG.ITEM_LANE_SPACING) +
          TIMELINE_CONFIG.ITEM_LANE_SPACING
      );
    }

    return { byGroup, rowHeights, itemHeight };
  }, [groups, items, stackItems, lineHeight, itemHeightRatio]);

  const { byGroup, rowHeights, itemHeight } = grouped;

  useEffect(() => {
    if (!selectedItemId || !scrollRef.current || userInteracting) return;

    const scrollTimeout = setTimeout(() => {
      let targetGroupIndex = -1;
      let targetItem: PlacedItem | null = null;

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const groupItems = byGroup[group.id] || [];
        const foundItem = groupItems.find((item) => item.id === selectedItemId);
        if (foundItem) {
          targetGroupIndex = i;
          targetItem = foundItem;
          break;
        }
      }

      if (!targetItem || targetGroupIndex === -1 || !scrollRef.current) return;

      let targetTop = 0;

      for (let i = 0; i < targetGroupIndex; i++) {
        const group = groups[i];
        targetTop += rowHeights[group.id] || lineHeight;
      }

      const itemTopWithinGroup =
        TIMELINE_CONFIG.ITEM_LANE_SPACING +
        targetItem.lane * (itemHeight + TIMELINE_CONFIG.ITEM_LANE_SPACING);
      const itemCenterY = targetTop + itemTopWithinGroup + itemHeight / 2;

      const scrollContainer = scrollRef.current;
      const containerHeight = scrollContainer.clientHeight;
      const currentScrollTop = scrollContainer.scrollTop;

      const itemTop = targetTop + itemTopWithinGroup;
      const itemBottom = itemTop + itemHeight;
      const visibleTop = currentScrollTop;
      const visibleBottom = currentScrollTop + containerHeight;

      const padding =
        containerHeight * INTERACTION_CONFIG.COMFORTABLE_VIEWING_PADDING_RATIO;
      const comfortableTop = visibleTop + padding;
      const comfortableBottom = visibleBottom - padding;

      if (itemTop < comfortableTop || itemBottom > comfortableBottom) {
        const newScrollTop = itemCenterY - containerHeight / 2;

        scrollContainer.scrollTo({
          top: Math.max(0, newScrollTop),
          behavior: 'smooth',
        });

        if (sidebarRowsRef.current) {
          sidebarRowsRef.current.scrollTo({
            top: Math.max(0, newScrollTop),
            behavior: 'smooth',
          });
        }
      }
    }, INTERACTION_CONFIG.SCROLL_COORDINATION_DELAY);

    return () => clearTimeout(scrollTimeout);
  }, [
    selectedItemId,
    byGroup,
    groups,
    rowHeights,
    lineHeight,
    itemHeight,
    userInteracting,
  ]);

  const [scrollbarWidth, setScrollbarWidth] = useState<number>(0);

  useEffect(() => {
    const updateScrollbarWidth = () => {
      if (scrollRef.current) {
        const scrollbarW =
          scrollRef.current.offsetWidth - scrollRef.current.clientWidth;
        setScrollbarWidth(scrollbarW);
      }
    };

    updateScrollbarWidth();

    const resizeObserver = new ResizeObserver(updateScrollbarWidth);
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [groups, items]);

  const timeToPercent = (t: moment.Moment) => {
    const msFromStart = t.diff(start);
    return Math.max(
      0,
      Math.min(
        TIMELINE_CONFIG.MAX_PERCENT,
        (msFromStart / totalMs) * TIMELINE_CONFIG.MAX_PERCENT
      )
    );
  };

  const onMouseDownContent: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!onTimeChange) return;

    markUserInteraction();

    setDragging(true);
    setDragDirection(null);
    const scrollTop = scrollRef.current?.scrollTop || 0;
    dragStateRef.current = {
      x: e.clientX,
      y: e.clientY,
      startMs: start.valueOf(),
      endMs: end.valueOf(),
      startScrollTop: scrollTop,
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (
        !dragging ||
        !onTimeChange ||
        !contentRef.current ||
        !dragStateRef.current
      )
        return;

      const { x, y, startMs, endMs, startScrollTop } = dragStateRef.current;
      const dx = e.clientX - x;
      const dy = e.clientY - y;

      if (dragDirection === null) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (
          absX > TIMELINE_CONFIG.DRAG_DIRECTION_THRESHOLD ||
          absY > TIMELINE_CONFIG.DRAG_DIRECTION_THRESHOLD
        ) {
          setDragDirection(absX > absY ? 'horizontal' : 'vertical');
        }
        return;
      }

      if (dragDirection === 'horizontal') {
        const width = contentRef.current.clientWidth || 1;
        const shiftRatio = dx / width;
        const shiftMs = -Math.round(shiftRatio * (endMs - startMs));
        onTimeChange(startMs + shiftMs, endMs + shiftMs);
      } else if (dragDirection === 'vertical' && scrollRef.current) {
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
      markUserInteraction();

      const rect = content.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / Math.max(1, rect.width)));
      const anchor = curStart + ratio * duration;
      const zoomFactor =
        e.deltaY > 0
          ? INTERACTION_CONFIG.ZOOM_OUT_FACTOR
          : INTERACTION_CONFIG.ZOOM_IN_FACTOR;
      const newDuration = Math.max(
        TIME_CONSTANTS.MIN_ZOOM_DURATION_MS,
        Math.round(duration * zoomFactor)
      );
      const newStart = Math.round(anchor - ratio * newDuration);
      const newEnd = newStart + newDuration;
      onTimeChange(newStart, newEnd);
      return;
    }

    if (verticalIntent) {
      markUserInteraction();
      return;
    }

    e.preventDefault();
    markUserInteraction();

    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    const shiftMs = Math.round(
      duration *
        (delta > 0
          ? INTERACTION_CONFIG.PAN_SHIFT_RATIO
          : -INTERACTION_CONFIG.PAN_SHIFT_RATIO)
    );
    onTimeChange(curStart + shiftMs, curEnd + shiftMs);
  };

  const sharedTimeMarkers = useMemo(() => {
    const markers: {
      timestamp: number;
      label: string;
      leftPercent: number;
      centerPercent: number;
    }[] = [];
    const duration = totalMs;

    const stepMs =
      duration <= GRID_CONFIG.HOURLY_GRID_THRESHOLD
        ? GRID_CONFIG.HOURLY_STEP_MS
        : GRID_CONFIG.DAILY_STEP_MS;
    const isHourly = stepMs === GRID_CONFIG.HOURLY_STEP_MS;

    const startMs = start.valueOf();
    const endMs = end.valueOf();
    const alignedStart = isHourly
      ? start.clone().startOf('hour').valueOf()
      : start.clone().startOf('day').valueOf();

    for (let ts = alignedStart; ts <= endMs; ts += stepMs) {
      if (ts <= startMs) continue;

      const intervalStart = ts;
      const intervalCenter = intervalStart + stepMs / 2;

      const percent = ((intervalStart - startMs) / duration) * 100;
      const centerPercent = ((intervalCenter - startMs) / duration) * 100;

      const label = isHourly
        ? moment(ts).format(DATE_FORMATS.HOUR_MARKER)
        : moment(ts).format(DATE_FORMATS.DAY_MARKER);

      markers.push({
        timestamp: ts,
        label,
        leftPercent: percent,
        centerPercent,
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
        width: Math.max(INTERACTION_CONFIG.MIN_PINCH_DISTANCE, rect.width),
        startDist: Math.max(INTERACTION_CONFIG.MIN_PINCH_DISTANCE, dist),
        anchorRatio: Math.max(
          0,
          Math.min(
            1,
            midX / Math.max(INTERACTION_CONFIG.MIN_PINCH_DISTANCE, rect.width)
          )
        ),
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

    if (
      state.mode === 'pinch' &&
      e.touches.length >= 2 &&
      state.startDist &&
      state.anchorRatio !== undefined
    ) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const curDist = Math.max(
        INTERACTION_CONFIG.MIN_PINCH_DISTANCE,
        Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      );
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
      if (!state.lockedPan) {
        if (
          Math.abs(dx) >
          Math.abs(dy) + INTERACTION_CONFIG.TOUCH_LOCK_THRESHOLD
        ) {
          state.lockedPan = true;
        } else {
          return;
        }
      }
      const shiftRatio = dx / state.width;
      const shiftMs = -Math.round(shiftRatio * duration);
      onTimeChange(curStart + shiftMs, curEnd + shiftMs);
      e.preventDefault();
      return;
    }
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    touchStateRef.current = null;
  };

  return (
    <div
      className='simple-timeline'
      onWheel={handleWheel}
      ref={rootRef}
      style={{ ['--tc-pad' as string]: containerTopPad } as React.CSSProperties}
    >
      <div className='st-sidebar' style={{ width: computedSidebarWidth }}>
        <div className='st-sidebar-header'>Aircraft</div>
        {/* remove spacer; one sticky row across both panes */}
        <div
          className='st-sidebar-rows'
          ref={sidebarRowsRef}
          onScroll={handleSidebarScroll}
        >
          {groups.map((g) => (
            <div
              key={g.id}
              className='st-group'
              style={{ height: rowHeights[g.id] || lineHeight }}
            >
              {g.title}
            </div>
          ))}
        </div>
      </div>
      <div
        className='st-content'
        ref={contentRef}
        data-scrollbar-width={scrollbarWidth}
        onMouseDown={onMouseDownContent}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div className='st-tick-header'>
          {sharedTimeMarkers.map((marker) => {
            return (
              <div
                key={`header-grid-${marker.timestamp}`}
                className='st-tick-border'
                style={{ left: `${marker.leftPercent}%` }}
              />
            );
          })}
          {sharedTimeMarkers.map((marker) => {
            return (
              <div
                key={marker.timestamp}
                className='st-tick'
                style={{ left: `${marker.centerPercent}%` }}
              >
                <span className='st-tick-label'>{marker.label}</span>
              </div>
            );
          })}
        </div>
        <div
          className='st-scroll'
          ref={scrollRef}
          onScroll={handleContentScroll}
        >
          <div
            className='st-highlights'
            style={{
              height:
                Object.values(rowHeights).reduce(
                  (sum, height) => sum + height,
                  0
                ) + 'px',
            }}
          >
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
          <div
            className='st-grid'
            style={{
              height:
                Object.values(rowHeights).reduce(
                  (sum, height) => sum + height,
                  0
                ) + 'px',
            }}
          >
            {sharedTimeMarkers.map((marker) => {
              return (
                <div
                  key={`grid-${marker.timestamp}`}
                  className='st-grid-line'
                  style={{ left: `${marker.leftPercent}%` }}
                />
              );
            })}
          </div>
          <div className='st-rows'>
            {groups.map((group) => {
              const gi = (byGroup[group.id] || []) as PlacedItem[];
              const rowH = rowHeights[group.id] || lineHeight;
              return (
                <div
                  key={group.id}
                  className='st-row'
                  data-group-id={group.id}
                  style={{ height: rowH }}
                >
                  {gi.map((item) => {
                    const left = timeToPercent(item.start_time);
                    const right = timeToPercent(item.end_time);
                    const width = Math.max(
                      TIMELINE_CONFIG.MIN_ITEM_WIDTH_PERCENT,
                      right - left
                    );
                    const top =
                      TIMELINE_CONFIG.ITEM_LANE_SPACING +
                      item.lane *
                        (itemHeight + TIMELINE_CONFIG.ITEM_LANE_SPACING);
                    const isSelected =
                      selectedItemId !== undefined &&
                      selectedItemId === item.id;
                    const isFlightItem = item.id
                      .toString()
                      .startsWith('flight-');
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
                          ...(isSelected
                            ? {}
                            : {
                                boxShadow: (
                                  item.itemProps?.style as React.CSSProperties
                                )?.boxShadow,
                              }),
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canSelect && onItemSelect) {
                            onItemSelect(item.id, e, item.start_time.valueOf());
                          }
                        }}
                        title={item.title}
                      >
                        <div className='st-item-title'>{item.title}</div>
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

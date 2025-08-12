import moment from 'moment';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTimelineInteractions } from '../hooks/useTimelineInteractions';
import { useTimelineLayout } from '../hooks/useTimelineLayout';
import { useTimeMarkers } from '../hooks/useTimeMarkers';
import { INTERACTION_CONFIG, TIMELINE_CONFIG } from '../utils/constants';
import { SimpleTimelineItem, SimpleTimelineProps } from '../utils/types';
import './SimpleTimeline.css';
import TimelineHeader from './TimelineHeader';
import TimelineItem from './TimelineItem';

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
  const timeMarkers = useTimeMarkers(start, end, totalMs);

  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRowsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const interactions = useTimelineInteractions({
    start,
    end,
    onTimeChange,
    contentRef,
    scrollRef,
  });

  const layout = useTimelineLayout({
    rootRef,
    scrollRef,
    groups,
    sidebarWidth,
    items,
  });

  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollRef.current && scrollRef.current.scrollTop !== scrollTop) {
      scrollRef.current.scrollTop = scrollTop;
    }
  };

  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;

    if (!interactions.dragging) {
      interactions.markUserInteraction();
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
    if (!selectedItemId || !scrollRef.current || interactions.userInteracting)
      return;

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
    interactions.userInteracting,
  ]);

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

  return (
    <div
      className='simple-timeline'
      onWheel={interactions.handleWheel}
      ref={rootRef}
      style={
        {
          ['--tc-pad' as string]: layout.containerTopPad,
        } as React.CSSProperties
      }
    >
      <div
        className='st-sidebar'
        style={{ width: layout.computedSidebarWidth }}
      >
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
        data-scrollbar-width={layout.scrollbarWidth}
        onMouseDown={interactions.onMouseDownContent}
        onTouchStart={interactions.onTouchStart}
        onTouchMove={interactions.onTouchMove}
        onTouchEnd={interactions.onTouchEnd}
        onTouchCancel={interactions.onTouchEnd}
      >
        <TimelineHeader start={start} end={end} totalMs={totalMs} />
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
            {timeMarkers.map((marker) => {
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
                      <TimelineItem
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        left={left}
                        width={width}
                        height={itemHeight}
                        top={top}
                        isSelected={isSelected}
                        isFlightItem={isFlightItem}
                        itemProps={item.itemProps}
                        canSelect={canSelect}
                        onItemSelect={onItemSelect}
                        startTime={item.start_time}
                      />
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

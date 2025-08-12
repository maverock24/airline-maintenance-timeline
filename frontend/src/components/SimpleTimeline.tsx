import moment from 'moment';
import React, { useMemo, useRef } from 'react';
import { useTimelineInteractions } from '../hooks/useTimelineInteractions';
import { useTimelineLayout } from '../hooks/useTimelineLayout';
import { useTimelineScrolling } from '../hooks/useTimelineScrolling';
import { useTimeMarkers } from '../hooks/useTimeMarkers';
import { TIMELINE_CONFIG } from '../utils/constants';
import { SimpleTimelineItem, SimpleTimelineProps } from '../utils/types';
import './SimpleTimeline.css';
import TimelineGrid from './TimelineGrid';
import TimelineHeader from './TimelineHeader';
import TimelineHighlights from './TimelineHighlights';
import TimelineRow from './TimelineRow';
import TimelineSidebar from './TimelineSidebar';

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

  const scrolling = useTimelineScrolling({
    selectedItemId,
    userInteracting: interactions.userInteracting,
    groups,
    byGroup,
    rowHeights,
    lineHeight,
    itemHeight,
    scrollRef,
    sidebarRowsRef,
    isDragging: interactions.dragging,
    markUserInteraction: interactions.markUserInteraction,
  });

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

  const totalHeight = Object.values(rowHeights).reduce(
    (sum, height) => sum + height,
    0
  );

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
      <TimelineSidebar
        groups={groups}
        rowHeights={rowHeights}
        lineHeight={lineHeight}
        computedSidebarWidth={layout.computedSidebarWidth}
        sidebarRowsRef={sidebarRowsRef}
        onSidebarScroll={scrolling.handleSidebarScroll}
      />
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
          onScroll={scrolling.handleContentScroll}
        >
          <TimelineHighlights
            highlightRanges={highlightRanges}
            totalHeight={totalHeight}
            timeToPercent={timeToPercent}
          />
          <TimelineGrid timeMarkers={timeMarkers} totalHeight={totalHeight} />
          <div className='st-rows'>
            {groups.map((group) => {
              const gi = (byGroup[group.id] || []) as PlacedItem[];
              const rowH = rowHeights[group.id] || lineHeight;
              return (
                <TimelineRow
                  key={group.id}
                  group={group}
                  items={gi}
                  rowHeight={rowH}
                  itemHeight={itemHeight}
                  selectedItemId={selectedItemId}
                  canSelect={canSelect}
                  onItemSelect={onItemSelect}
                  timeToPercent={timeToPercent}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTimeline;

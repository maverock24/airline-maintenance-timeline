import moment from 'moment';
import { useMemo } from 'react';
import { TIMELINE_CONFIG } from '../utils/constants';
import { SimpleTimelineItem, TimelineGroup } from '../utils/types';

type PlacedItem = SimpleTimelineItem & { lane: number };

interface UseTimelineProcessingProps {
  groups: TimelineGroup[];
  items: SimpleTimelineItem[];
  stackItems: boolean;
  lineHeight: number;
  itemHeightRatio: number;
  start: moment.Moment;
  totalMs: number;
}

interface TimelineProcessingData {
  byGroup: Record<string, PlacedItem[]>;
  rowHeights: Record<string, number>;
  itemHeight: number;
  timeToPercent: (t: moment.Moment) => number;
  totalHeight: number;
}

export const useTimelineProcessing = ({
  groups,
  items,
  stackItems,
  lineHeight,
  itemHeightRatio,
  start,
  totalMs,
}: UseTimelineProcessingProps): TimelineProcessingData => {
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

  const timeToPercent = useMemo(
    () => (t: moment.Moment) => {
      const msFromStart = t.diff(start);
      return Math.max(
        0,
        Math.min(
          TIMELINE_CONFIG.MAX_PERCENT,
          (msFromStart / totalMs) * TIMELINE_CONFIG.MAX_PERCENT
        )
      );
    },
    [start, totalMs]
  );

  const totalHeight = useMemo(
    () =>
      Object.values(grouped.rowHeights).reduce(
        (sum, height) => sum + height,
        0
      ),
    [grouped.rowHeights]
  );

  return {
    byGroup: grouped.byGroup,
    rowHeights: grouped.rowHeights,
    itemHeight: grouped.itemHeight,
    timeToPercent,
    totalHeight,
  };
};

import moment from 'moment';
import React from 'react';
import { TIMELINE_CONFIG } from '../utils/constants';
import { SimpleTimelineItem, TimelineGroup } from '../utils/types';
import TimelineItem from './TimelineItem';
import './TimelineRow.css';

type PlacedItem = SimpleTimelineItem & { lane: number };

interface TimelineRowProps {
  group: TimelineGroup;
  items: PlacedItem[];
  rowHeight: number;
  itemHeight: number;
  selectedItemId?: string | number;
  canSelect: boolean;
  onItemSelect?: (
    itemId: string | number,
    e: React.SyntheticEvent,
    time: number
  ) => void;
  timeToPercent: (t: moment.Moment) => number;
}

const TimelineRow: React.FC<TimelineRowProps> = ({
  group,
  items,
  rowHeight,
  itemHeight,
  selectedItemId,
  canSelect,
  onItemSelect,
  timeToPercent,
}) => {
  return (
    <div
      key={group.id}
      className='st-row'
      data-group-id={group.id}
      style={{ height: rowHeight }}
    >
      {items.map((item) => {
        const left = timeToPercent(item.start_time);
        const right = timeToPercent(item.end_time);
        const width = Math.max(
          TIMELINE_CONFIG.MIN_ITEM_WIDTH_PERCENT,
          right - left
        );
        const top =
          TIMELINE_CONFIG.ITEM_LANE_SPACING +
          item.lane * (itemHeight + TIMELINE_CONFIG.ITEM_LANE_SPACING);
        const isSelected =
          selectedItemId !== undefined && selectedItemId === item.id;
        const isFlightItem = item.id.toString().startsWith('flight-');

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
};

export default TimelineRow;

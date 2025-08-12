import moment from 'moment';
import React from 'react';
import './TimelineItem.css';

export interface TimelineItemProps {
  id: string | number;
  title: string;
  left: number;
  width: number;
  height: number;
  top: number;
  isSelected: boolean;
  isFlightItem: boolean;
  itemProps?: React.HTMLAttributes<HTMLDivElement>;
  canSelect: boolean;
  onItemSelect?: (
    itemId: string | number,
    e: React.SyntheticEvent,
    time: number
  ) => void;
  startTime: moment.Moment;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  id,
  title,
  left,
  width,
  height,
  top,
  isSelected,
  isFlightItem,
  itemProps,
  canSelect,
  onItemSelect,
  startTime,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (canSelect && onItemSelect) {
      onItemSelect(id, e, startTime.valueOf());
    }
  };

  return (
    <div
      className={`timeline-item ${itemProps?.className || ''} ${isSelected ? 'selected' : ''} ${isFlightItem ? 'flight-item' : ''}`}
      data-item-id={id}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        height,
        top,
        position: 'absolute',
        zIndex: isSelected ? 10 : 2,
        ...(itemProps?.style || {}),
        ...(isSelected
          ? {}
          : {
              boxShadow: (itemProps?.style as React.CSSProperties)?.boxShadow,
            }),
      }}
      onClick={handleClick}
      title={title}
    >
      <div className='timeline-item-title'>{title}</div>
    </div>
  );
};

export default TimelineItem;

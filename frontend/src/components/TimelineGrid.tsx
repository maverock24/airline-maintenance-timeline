import React from 'react';
import { TimelineMarker } from '../hooks/useTimeMarkers';
import './TimelineGrid.css';

interface TimelineGridProps {
  timeMarkers: TimelineMarker[];
  totalHeight: number;
}

const TimelineGrid: React.FC<TimelineGridProps> = ({
  timeMarkers,
  totalHeight,
}) => {
  return (
    <div
      className='st-grid'
      style={{
        height: totalHeight + 'px',
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
  );
};

export default TimelineGrid;

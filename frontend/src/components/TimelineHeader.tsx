import moment from 'moment';
import React from 'react';
import { useTimeMarkers } from '../hooks/useTimeMarkers';
import './TimelineHeader.css';

export interface TimelineHeaderProps {
  start: moment.Moment;
  end: moment.Moment;
  totalMs: number;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  start,
  end,
  totalMs,
}) => {
  const timeMarkers = useTimeMarkers(start, end, totalMs);

  return (
    <div className='timeline-header'>
      {timeMarkers.map((marker) => {
        return (
          <div
            key={`header-grid-${marker.timestamp}`}
            className='timeline-header-border'
            style={{ left: `${marker.leftPercent}%` }}
          />
        );
      })}
      {timeMarkers.map((marker) => {
        return (
          <div
            key={marker.timestamp}
            className='timeline-header-tick'
            style={{ left: `${marker.centerPercent}%` }}
          >
            <span className='timeline-header-label'>{marker.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineHeader;

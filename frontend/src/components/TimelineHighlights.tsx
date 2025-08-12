import moment from 'moment';
import React from 'react';
import './TimelineHighlights.css';

interface HighlightRange {
  start: number;
  end: number;
  className?: string;
}

interface TimelineHighlightsProps {
  highlightRanges: HighlightRange[];
  totalHeight: number;
  timeToPercent: (t: moment.Moment) => number;
}

const TimelineHighlights: React.FC<TimelineHighlightsProps> = ({
  highlightRanges,
  totalHeight,
  timeToPercent,
}) => {
  return (
    <div
      className='st-highlights'
      style={{
        height: totalHeight + 'px',
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
  );
};

export default TimelineHighlights;

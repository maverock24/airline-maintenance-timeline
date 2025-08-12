import React from 'react';
import { TimelineGroup } from '../utils/types';
import './TimelineSidebar.css';

interface TimelineSidebarProps {
  groups: TimelineGroup[];
  rowHeights: Record<string, number>;
  lineHeight: number;
  computedSidebarWidth: number;
  sidebarRowsRef: React.RefObject<HTMLDivElement | null>;
  onSidebarScroll: (event: React.UIEvent<HTMLDivElement>) => void;
}

const TimelineSidebar: React.FC<TimelineSidebarProps> = ({
  groups,
  rowHeights,
  lineHeight,
  computedSidebarWidth,
  sidebarRowsRef,
  onSidebarScroll,
}) => {
  return (
    <div className='st-sidebar' style={{ width: computedSidebarWidth }}>
      <div className='st-sidebar-header'>Aircraft</div>
      <div
        className='st-sidebar-rows'
        ref={sidebarRowsRef}
        onScroll={onSidebarScroll}
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
  );
};

export default TimelineSidebar;

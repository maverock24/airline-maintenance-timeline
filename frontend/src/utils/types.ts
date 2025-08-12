// src/utils/types.ts
import moment from 'moment';
import React from 'react';

export interface Flight {
  flightId: string;
  flightNum: string;
  registration: string;
  schedDepStation: string;
  schedArrStation: string;
  schedDepTime: string;
  schedArrTime: string;
}

export interface WorkPackage {
  workPackageId: string;
  name: string;
  registration: string;
  startDateTime: string;
  endDateTime: string;
  workOrders: number;
  status: string;
}

export interface TimelineItem {
  id: string | number;
  group: string;
  title: string;
  start_time: moment.Moment;
  end_time: moment.Moment;
  itemProps?: React.HTMLAttributes<HTMLDivElement>;
}

export interface TimelineGroup {
  id: string;
  title: string;
}

export interface TimelineControlsProps {
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  registrationDropdownOpen: boolean;
  setRegistrationDropdownOpen: (
    value: boolean | ((prev: boolean) => boolean)
  ) => void;
  getSelectedRegistrationsText: () => string;
  handleSelectAllRegistrations: () => void;
  filteredRegistrations: string[];
  allRegistrations: string[];
  handleRegistrationFilter: (registration: string) => void;
  clearFilters: () => void;
}

// SimpleTimeline interfaces
export interface SimpleTimelineGroup {
  id: string;
  title: string;
}

export interface SimpleTimelineItem {
  id: string | number;
  group: string;
  title: string;
  start_time: moment.Moment;
  end_time: moment.Moment;
  itemProps?: React.HTMLAttributes<HTMLDivElement>;
}

export interface SimpleTimelineProps {
  groups: SimpleTimelineGroup[];
  items: SimpleTimelineItem[];
  visibleTimeStart: number;
  visibleTimeEnd: number;
  sidebarWidth?: number;
  lineHeight?: number;
  itemHeightRatio?: number;
  canMove?: boolean;
  canResize?: boolean;
  canSelect?: boolean;
  stackItems?: boolean;
  onItemSelect?: (
    itemId: string | number,
    e: React.SyntheticEvent,
    time: number
  ) => void;
  onItemDeselect?: () => void;
  onTimeChange?: (visibleTimeStart: number, visibleTimeEnd: number) => void;
  // New: selected item highlight
  selectedItemId?: string | number;
  // New: view mode hint for tick labels
  viewMode?: 'day' | 'week' | 'month';
  // New: highlight ranges for vertical shading (e.g., selected date)
  highlightRanges?: Array<{ start: number; end: number; className?: string }>;
}

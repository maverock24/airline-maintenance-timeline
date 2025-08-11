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
  setRegistrationDropdownOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  getSelectedRegistrationsText: () => string;
  handleSelectAllRegistrations: () => void;
  filteredRegistrations: string[];
  allRegistrations: string[];
  handleRegistrationFilter: (registration: string) => void;
  clearFilters: () => void;
}
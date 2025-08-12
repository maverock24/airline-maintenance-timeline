// src/utils/helpers.ts
import { STATUS_CONFIG } from './constants';

export const getStatusSymbol = (status: string): string => {
  switch (status.toLowerCase()) {
    case STATUS_CONFIG.NAMES.COMPLETED:
      return STATUS_CONFIG.SYMBOLS.COMPLETED;
    case STATUS_CONFIG.NAMES.IN_PROGRESS:
      return STATUS_CONFIG.SYMBOLS.IN_PROGRESS;
    case STATUS_CONFIG.NAMES.OPEN:
      return STATUS_CONFIG.SYMBOLS.OPEN;
    case STATUS_CONFIG.NAMES.CANCELLED:
      return STATUS_CONFIG.SYMBOLS.CANCELLED;
    default:
      return STATUS_CONFIG.SYMBOLS.DEFAULT;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case STATUS_CONFIG.NAMES.COMPLETED:
      return STATUS_CONFIG.COLORS.COMPLETED;
    case STATUS_CONFIG.NAMES.IN_PROGRESS:
      return STATUS_CONFIG.COLORS.IN_PROGRESS;
    case STATUS_CONFIG.NAMES.OPEN:
      return STATUS_CONFIG.COLORS.OPEN;
    case STATUS_CONFIG.NAMES.CANCELLED:
      return STATUS_CONFIG.COLORS.CANCELLED;
    default:
      return STATUS_CONFIG.COLORS.DEFAULT;
  }
};

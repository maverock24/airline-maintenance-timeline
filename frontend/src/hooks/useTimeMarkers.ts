import moment from 'moment';
import { useMemo } from 'react';
import { DATE_FORMATS, GRID_CONFIG } from '../utils/constants';

export interface TimelineMarker {
  timestamp: number;
  label: string;
  leftPercent: number;
  centerPercent: number;
}

export const useTimeMarkers = (
  start: moment.Moment,
  end: moment.Moment,
  totalMs: number
): TimelineMarker[] => {
  return useMemo(() => {
    const markers: TimelineMarker[] = [];
    const duration = totalMs;

    const stepMs =
      duration <= GRID_CONFIG.HOURLY_GRID_THRESHOLD
        ? GRID_CONFIG.HOURLY_STEP_MS
        : GRID_CONFIG.DAILY_STEP_MS;
    const isHourly = stepMs === GRID_CONFIG.HOURLY_STEP_MS;

    const startMs = start.valueOf();
    const endMs = end.valueOf();
    const alignedStart = isHourly
      ? start.clone().startOf('hour').valueOf()
      : start.clone().startOf('day').valueOf();

    for (let ts = alignedStart; ts <= endMs; ts += stepMs) {
      if (ts <= startMs) continue;

      const intervalStart = ts;
      const intervalCenter = intervalStart + stepMs / 2;

      const percent = ((intervalStart - startMs) / duration) * 100;
      const centerPercent = ((intervalCenter - startMs) / duration) * 100;

      const label = isHourly
        ? moment(ts).format(DATE_FORMATS.HOUR_MARKER)
        : moment(ts).format(DATE_FORMATS.DAY_MARKER);

      markers.push({
        timestamp: ts,
        label,
        leftPercent: percent,
        centerPercent,
      });
    }

    return markers;
  }, [start, end, totalMs]);
};

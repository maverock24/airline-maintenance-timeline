import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import {
  INTERACTION_CONFIG,
  TIMELINE_CONFIG,
  TIME_CONSTANTS,
} from '../utils/constants';

export interface UseTimelineInteractionsProps {
  start: moment.Moment;
  end: moment.Moment;
  onTimeChange?: (visibleTimeStart: number, visibleTimeEnd: number) => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export interface UseTimelineInteractionsReturn {
  // State
  userInteracting: boolean;
  dragging: boolean;

  // Functions
  markUserInteraction: () => void;

  // Event handlers
  onMouseDownContent: React.MouseEventHandler<HTMLDivElement>;
  handleWheel: React.WheelEventHandler<HTMLDivElement>;
  onTouchStart: React.TouchEventHandler<HTMLDivElement>;
  onTouchMove: React.TouchEventHandler<HTMLDivElement>;
  onTouchEnd: React.TouchEventHandler<HTMLDivElement>;
}

export const useTimelineInteractions = ({
  start,
  end,
  onTimeChange,
  contentRef,
  scrollRef,
}: UseTimelineInteractionsProps): UseTimelineInteractionsReturn => {
  // State
  const [dragging, setDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<
    'horizontal' | 'vertical' | null
  >(null);
  const [userInteracting, setUserInteracting] = useState(false);

  // Refs
  const dragStateRef = useRef<{
    x: number;
    y: number;
    startMs: number;
    endMs: number;
    startScrollTop: number;
  } | null>(null);

  const userInteractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const touchStateRef = useRef<{
    mode: 'pan' | 'pinch' | null;
    startX: number;
    startY: number;
    startMs: number;
    endMs: number;
    width: number;
    lockedPan?: boolean;
    startDist?: number;
    anchorRatio?: number; // 0..1 across content width
  } | null>(null);

  // Mark user interaction function
  const markUserInteraction = () => {
    setUserInteracting(true);

    if (userInteractionTimeoutRef.current) {
      clearTimeout(userInteractionTimeoutRef.current);
    }

    userInteractionTimeoutRef.current = setTimeout(() => {
      setUserInteracting(false);
    }, INTERACTION_CONFIG.USER_INTERACTION_TIMEOUT);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
    };
  }, []);

  // Mouse down handler for dragging
  const onMouseDownContent: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!onTimeChange) return;

    markUserInteraction();

    setDragging(true);
    setDragDirection(null);
    const scrollTop = scrollRef.current?.scrollTop || 0;
    dragStateRef.current = {
      x: e.clientX,
      y: e.clientY,
      startMs: start.valueOf(),
      endMs: end.valueOf(),
      startScrollTop: scrollTop,
    };
  };

  // Mouse move and up handlers
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (
        !dragging ||
        !onTimeChange ||
        !contentRef.current ||
        !dragStateRef.current
      )
        return;

      const { x, y, startMs, endMs, startScrollTop } = dragStateRef.current;
      const dx = e.clientX - x;
      const dy = e.clientY - y;

      if (dragDirection === null) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (
          absX > TIMELINE_CONFIG.DRAG_DIRECTION_THRESHOLD ||
          absY > TIMELINE_CONFIG.DRAG_DIRECTION_THRESHOLD
        ) {
          setDragDirection(absX > absY ? 'horizontal' : 'vertical');
        }
        return;
      }

      if (dragDirection === 'horizontal') {
        const width = contentRef.current.clientWidth || 1;
        const shiftRatio = dx / width;
        const shiftMs = -Math.round(shiftRatio * (endMs - startMs));
        onTimeChange(startMs + shiftMs, endMs + shiftMs);
      } else if (dragDirection === 'vertical' && scrollRef.current) {
        const newScrollTop = startScrollTop - dy;
        scrollRef.current.scrollTop = Math.max(0, newScrollTop);
      }
    };

    const onUp = () => {
      setDragging(false);
      setDragDirection(null);
      dragStateRef.current = null;
    };

    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [
    dragging,
    dragDirection,
    onTimeChange,
    contentRef,
    scrollRef,
    start,
    end,
  ]);

  // Wheel handler for zoom and pan
  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!onTimeChange) return;
    const content = contentRef.current;
    const curStart = start.valueOf();
    const curEnd = end.valueOf();
    const duration = curEnd - curStart;

    const isZoom = e.ctrlKey || e.altKey || e.metaKey;
    const verticalIntent = Math.abs(e.deltaY) >= Math.abs(e.deltaX);

    if (isZoom && content) {
      e.preventDefault();
      markUserInteraction();

      const rect = content.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / Math.max(1, rect.width)));
      const anchor = curStart + ratio * duration;
      const zoomFactor =
        e.deltaY > 0
          ? INTERACTION_CONFIG.ZOOM_OUT_FACTOR
          : INTERACTION_CONFIG.ZOOM_IN_FACTOR;
      const newDuration = Math.max(
        TIME_CONSTANTS.MIN_ZOOM_DURATION_MS,
        Math.round(duration * zoomFactor)
      );
      const newStart = Math.round(anchor - ratio * newDuration);
      const newEnd = newStart + newDuration;
      onTimeChange(newStart, newEnd);
      return;
    }

    if (verticalIntent) {
      markUserInteraction();
      return;
    }

    e.preventDefault();
    markUserInteraction();

    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    const shiftMs = Math.round(
      duration *
        (delta > 0
          ? INTERACTION_CONFIG.PAN_SHIFT_RATIO
          : -INTERACTION_CONFIG.PAN_SHIFT_RATIO)
    );
    onTimeChange(curStart + shiftMs, curEnd + shiftMs);
  };

  // Touch handlers
  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!onTimeChange || !contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStateRef.current = {
        mode: 'pan',
        startX: t.clientX,
        startY: t.clientY,
        startMs: start.valueOf(),
        endMs: end.valueOf(),
        width: Math.max(1, rect.width),
        lockedPan: false,
      };
    } else if (e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStateRef.current = {
        mode: 'pinch',
        startX: midX,
        startY: (t1.clientY + t2.clientY) / 2,
        startMs: start.valueOf(),
        endMs: end.valueOf(),
        width: Math.max(INTERACTION_CONFIG.MIN_PINCH_DISTANCE, rect.width),
        startDist: Math.max(INTERACTION_CONFIG.MIN_PINCH_DISTANCE, dist),
        anchorRatio: Math.max(
          0,
          Math.min(
            1,
            midX / Math.max(INTERACTION_CONFIG.MIN_PINCH_DISTANCE, rect.width)
          )
        ),
      };
      e.preventDefault();
    }
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!onTimeChange || !contentRef.current || !touchStateRef.current) return;
    const state = touchStateRef.current;
    const curStart = state.startMs;
    const curEnd = state.endMs;
    const duration = curEnd - curStart;

    if (
      state.mode === 'pinch' &&
      e.touches.length >= 2 &&
      state.startDist &&
      state.anchorRatio !== undefined
    ) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const curDist = Math.max(
        INTERACTION_CONFIG.MIN_PINCH_DISTANCE,
        Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      );
      const scale = curDist / state.startDist;
      const newDuration = Math.max(60_000, Math.round(duration / scale));
      const anchor = curStart + state.anchorRatio * duration;
      const newStart = Math.round(anchor - state.anchorRatio * newDuration);
      const newEnd = newStart + newDuration;
      onTimeChange(newStart, newEnd);
      e.preventDefault();
      return;
    }

    if (state.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - state.startX;
      const dy = t.clientY - state.startY;
      if (!state.lockedPan) {
        if (
          Math.abs(dx) >
          Math.abs(dy) + INTERACTION_CONFIG.TOUCH_LOCK_THRESHOLD
        ) {
          state.lockedPan = true;
        } else {
          return;
        }
      }
      const shiftRatio = dx / state.width;
      const shiftMs = -Math.round(shiftRatio * duration);
      onTimeChange(curStart + shiftMs, curEnd + shiftMs);
      e.preventDefault();
      return;
    }
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    touchStateRef.current = null;
  };

  return {
    // State
    userInteracting,
    dragging,

    // Functions
    markUserInteraction,

    // Event handlers
    onMouseDownContent,
    handleWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

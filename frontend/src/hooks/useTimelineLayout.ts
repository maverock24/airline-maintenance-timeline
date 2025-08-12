import { useEffect, useState } from 'react';
import { TIMELINE_CONFIG } from '../utils/constants';
import { SimpleTimelineGroup } from '../utils/types';

export interface UseTimelineLayoutProps {
  rootRef: React.RefObject<HTMLDivElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  groups: SimpleTimelineGroup[];
  sidebarWidth: number;
  items: unknown[];
}

export interface UseTimelineLayoutReturn {
  computedSidebarWidth: number;
  viewportWidth: number;
  scrollbarWidth: number;
  containerTopPad: string;
}

export const useTimelineLayout = ({
  rootRef,
  scrollRef,
  groups,
  sidebarWidth,
  items,
}: UseTimelineLayoutProps): UseTimelineLayoutReturn => {
  // Container top padding calculation
  const [containerTopPad, setContainerTopPad] = useState<string>('0px');
  useEffect(() => {
    const updatePad = () => {
      const el = rootRef.current;
      if (!el) return;
      const container = el.closest('.timeline-container') as HTMLElement | null;
      if (!container) return;
      const cs = getComputedStyle(container);
      setContainerTopPad(cs.paddingTop || '0px');
    };
    updatePad();
    window.addEventListener('resize', updatePad);
    return () => window.removeEventListener('resize', updatePad);
  }, [rootRef]);

  // Viewport width tracking
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Computed sidebar width calculation
  const [computedSidebarWidth, setComputedSidebarWidth] =
    useState<number>(sidebarWidth);
  useEffect(() => {
    const el = rootRef.current;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) {
      setComputedSidebarWidth(sidebarWidth);
      return;
    }
    let font = '14px system-ui';
    if (el) {
      const probe = el.querySelector('.st-group') as HTMLElement | null;
      if (probe) {
        const cs = getComputedStyle(probe);
        font =
          `${cs.fontStyle || ''} ${cs.fontVariant || ''} ${cs.fontWeight || ''} ${cs.fontSize || '14px'} ${cs.fontFamily || 'system-ui'}`.trim();
      }
    }
    ctx.font = font;
    const horizontalPadding = TIMELINE_CONFIG.HORIZONTAL_PADDING;

    let maxW = ctx.measureText('Aircraft').width;
    for (const g of groups) {
      const w = ctx.measureText(g.title).width;
      if (w > maxW) maxW = w;
    }

    const raw = Math.ceil(maxW + horizontalPadding);
    const minW = TIMELINE_CONFIG.MIN_SIDEBAR_WIDTH;
    const maxWCap =
      viewportWidth < TIMELINE_CONFIG.MOBILE_BREAKPOINT
        ? TIMELINE_CONFIG.MOBILE_MAX_SIDEBAR_WIDTH
        : TIMELINE_CONFIG.DESKTOP_MAX_SIDEBAR_WIDTH;
    const next = Math.max(minW, Math.min(raw, maxWCap));

    requestAnimationFrame(() => setComputedSidebarWidth(next));
  }, [groups, viewportWidth, sidebarWidth, rootRef]);

  // Scrollbar width calculation
  const [scrollbarWidth, setScrollbarWidth] = useState<number>(0);
  useEffect(() => {
    const updateScrollbarWidth = () => {
      if (scrollRef.current) {
        const scrollbarW =
          scrollRef.current.offsetWidth - scrollRef.current.clientWidth;
        setScrollbarWidth(scrollbarW);
      }
    };

    updateScrollbarWidth();

    const resizeObserver = new ResizeObserver(updateScrollbarWidth);
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [groups, items, scrollRef]);

  return {
    computedSidebarWidth,
    viewportWidth,
    scrollbarWidth,
    containerTopPad,
  };
};

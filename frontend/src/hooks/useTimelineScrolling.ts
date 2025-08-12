import { useEffect } from 'react';
import { INTERACTION_CONFIG, TIMELINE_CONFIG } from '../utils/constants';
import { SimpleTimelineGroup, SimpleTimelineItem } from '../utils/types';

export interface UseTimelineScrollingProps {
  selectedItemId?: string | number;
  userInteracting: boolean;
  groups: SimpleTimelineGroup[];
  byGroup: Record<string, Array<SimpleTimelineItem & { lane: number }>>;
  rowHeights: Record<string, number>;
  lineHeight: number;
  itemHeight: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  sidebarRowsRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  markUserInteraction: () => void;
}

export interface UseTimelineScrollingReturn {
  handleSidebarScroll: React.UIEventHandler<HTMLDivElement>;
  handleContentScroll: React.UIEventHandler<HTMLDivElement>;
}

export const useTimelineScrolling = ({
  selectedItemId,
  userInteracting,
  groups,
  byGroup,
  rowHeights,
  lineHeight,
  itemHeight,
  scrollRef,
  sidebarRowsRef,
  isDragging,
  markUserInteraction,
}: UseTimelineScrollingProps): UseTimelineScrollingReturn => {
  // Auto-scroll to selected item
  useEffect(() => {
    if (!selectedItemId || !scrollRef.current || userInteracting) return;

    const scrollTimeout = setTimeout(() => {
      let targetGroupIndex = -1;
      let targetItem: (SimpleTimelineItem & { lane: number }) | null = null;

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const groupItems = byGroup[group.id] || [];
        const foundItem = groupItems.find((item) => item.id === selectedItemId);
        if (foundItem) {
          targetGroupIndex = i;
          targetItem = foundItem;
          break;
        }
      }

      if (!targetItem || targetGroupIndex === -1 || !scrollRef.current) return;

      let targetTop = 0;

      for (let i = 0; i < targetGroupIndex; i++) {
        const group = groups[i];
        targetTop += rowHeights[group.id] || lineHeight;
      }

      const itemTopWithinGroup =
        TIMELINE_CONFIG.ITEM_LANE_SPACING +
        targetItem.lane * (itemHeight + TIMELINE_CONFIG.ITEM_LANE_SPACING);
      const itemCenterY = targetTop + itemTopWithinGroup + itemHeight / 2;

      const scrollContainer = scrollRef.current;
      const containerHeight = scrollContainer.clientHeight;
      const currentScrollTop = scrollContainer.scrollTop;

      const itemTop = targetTop + itemTopWithinGroup;
      const itemBottom = itemTop + itemHeight;
      const visibleTop = currentScrollTop;
      const visibleBottom = currentScrollTop + containerHeight;

      const padding =
        containerHeight * INTERACTION_CONFIG.COMFORTABLE_VIEWING_PADDING_RATIO;
      const comfortableTop = visibleTop + padding;
      const comfortableBottom = visibleBottom - padding;

      if (itemTop < comfortableTop || itemBottom > comfortableBottom) {
        const newScrollTop = itemCenterY - containerHeight / 2;

        scrollContainer.scrollTo({
          top: Math.max(0, newScrollTop),
          behavior: 'smooth',
        });

        if (sidebarRowsRef.current) {
          sidebarRowsRef.current.scrollTo({
            top: Math.max(0, newScrollTop),
            behavior: 'smooth',
          });
        }
      }
    }, INTERACTION_CONFIG.SCROLL_COORDINATION_DELAY);

    return () => clearTimeout(scrollTimeout);
  }, [
    selectedItemId,
    byGroup,
    groups,
    rowHeights,
    lineHeight,
    itemHeight,
    userInteracting,
    scrollRef,
    sidebarRowsRef,
  ]);

  // Scroll event handlers
  const handleSidebarScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollRef.current && scrollRef.current.scrollTop !== scrollTop) {
      scrollRef.current.scrollTop = scrollTop;
    }
  };

  const handleContentScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const scrollTop = e.currentTarget.scrollTop;

    if (!isDragging) {
      markUserInteraction();
    }

    if (
      sidebarRowsRef.current &&
      sidebarRowsRef.current.scrollTop !== scrollTop
    ) {
      sidebarRowsRef.current.scrollTop = scrollTop;
    }
  };

  return {
    handleSidebarScroll,
    handleContentScroll,
  };
};

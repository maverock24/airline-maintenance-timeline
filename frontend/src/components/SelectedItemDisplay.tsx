import moment from 'moment';
import { useMemo } from 'react';
import { TimelineItem } from '../utils/types';
import './SelectedItemDisplay.css';

const SelectedItemDisplay: React.FC<{
  selectedItem: TimelineItem | null;
  onDeselect: () => void;
  items: TimelineItem[];
  inline?: boolean;
}> = ({
  selectedItem,
  onDeselect: _onDeselect,
  items,
  inline: _inline = false,
}) => {
  const nextUpcomingItem = useMemo(() => {
    if (selectedItem) return null;
    const now = moment();
    return (
      items
        .filter((item) => item.start_time.isAfter(now))
        .sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf())[0] ||
      null
    );
  }, [items, selectedItem]);

  const displayItem = selectedItem || nextUpcomingItem;
  const isNext = !selectedItem && nextUpcomingItem;

  if (!displayItem) {
    return (
      <div className='selected-item-section'>
        <div className='selected-item-content'>
          <span>
            No item selected. Click an item on the timeline to see details.
          </span>
        </div>
      </div>
    );
  }

  const duration = moment
    .duration(displayItem.end_time.diff(displayItem.start_time))
    .humanize();
  const titleParts = displayItem.title.split(' | ');
  const displayTitle =
    titleParts.length > 1 ? titleParts[1] : displayItem.title;

  return (
    <div className='selected-item-section'>
      <div className='selected-item-content'>
        <div className='selected-item-content'>
          <span>
            {isNext
              ? '⏭️ Next:'
              : displayItem.id.toString().startsWith('flight-')
                ? '✈️'
                : '🔧'}{' '}
            {displayItem.group}
          </span>
          <span>
            <strong>{displayItem.start_time.format('MMM DD HH:mm')}</strong> →{' '}
            <strong>{displayItem.end_time.format('HH:mm')}</strong>
          </span>
          <span>({duration})</span>
          <span>{displayTitle}</span>
          {isNext && (
            <span className='starts-in'>
              Starts in{' '}
              {moment
                .duration(displayItem.start_time.diff(moment()))
                .humanize()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectedItemDisplay;

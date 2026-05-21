import echo from './echo';

const EVENT_TIMELINE_ITEM_CREATED = '.timeline.item.created';

/**
 * @param {number} companyId
 * @param {string} apiType
 * @param {number} entityId
 * @param {(payload: object) => void} handler
 * @returns {() => void}
 */
export function subscribeTimeline(companyId, apiType, entityId, handler) {
  const channelName = `company.${companyId}.timeline.${apiType}.${entityId}`;
  const channel = echo.private(channelName);
  channel.listen(EVENT_TIMELINE_ITEM_CREATED, handler);

  return () => {
    channel.stopListening(EVENT_TIMELINE_ITEM_CREATED);
    echo.leave(channelName);
  };
}

export const timelineRealtimeEvent = EVENT_TIMELINE_ITEM_CREATED;

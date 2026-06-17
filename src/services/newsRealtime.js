import echo from './echo';

const EVENT_NEWS_CREATED = '.news.created';
const EVENT_NEWS_REACTION = '.news.reaction.updated';
const EVENT_NEWS_VIEWED = '.news.viewed.updated';
const EVENT_NEWS_ACKNOWLEDGED = '.news.acknowledged.updated';
const EVENT_COMMENT_REACTION = '.comment.reaction.updated';
const EVENT_COMMENT_UPDATED = '.comment.updated';
const EVENT_COMMENT_DELETED = '.comment.deleted';
const EVENT_TIMELINE_ITEM = '.timeline.item.created';

/**
 * @param {number} companyId
 * @param {{ onNewsCreated?: (payload: object) => void }} handlers
 * @returns {() => void}
 */
export function subscribeNewsFeed(companyId, handlers = {}) {
  const channelName = `company.${companyId}.news.feed`;
  const channel = echo.private(channelName);

  if (handlers.onNewsCreated) {
    channel.listen(EVENT_NEWS_CREATED, handlers.onNewsCreated);
  }

  return () => {
    if (handlers.onNewsCreated) {
      channel.stopListening(EVENT_NEWS_CREATED);
    }
    echo.leave(channelName);
  };
}

/**
 * @param {number} companyId
 * @param {number} newsId
 * @param {{
 *   onNewsReaction?: (payload: object) => void,
 *   onCommentReaction?: (payload: object) => void,
 *   onCommentUpdated?: (payload: object) => void,
 *   onCommentDeleted?: (payload: object) => void,
 *   onTimelineItem?: (payload: object) => void,
 *   onViewedUpdated?: (payload: object) => void,
 *   onAcknowledgedUpdated?: (payload: object) => void,
 * }} handlers
 * @returns {() => void}
 */
export function subscribeNewsEngagement(companyId, newsId, handlers = {}) {
  const newsChannelName = `company.${companyId}.news.${newsId}`;
  const timelineChannelName = `company.${companyId}.timeline.news.${newsId}`;

  const newsChannel = echo.private(newsChannelName);
  const timelineChannel = echo.private(timelineChannelName);

  if (handlers.onNewsReaction) {
    newsChannel.listen(EVENT_NEWS_REACTION, handlers.onNewsReaction);
  }
  if (handlers.onViewedUpdated) {
    newsChannel.listen(EVENT_NEWS_VIEWED, handlers.onViewedUpdated);
  }
  if (handlers.onAcknowledgedUpdated) {
    newsChannel.listen(EVENT_NEWS_ACKNOWLEDGED, handlers.onAcknowledgedUpdated);
  }
  if (handlers.onCommentReaction) {
    newsChannel.listen(EVENT_COMMENT_REACTION, handlers.onCommentReaction);
  }
  if (handlers.onCommentUpdated) {
    newsChannel.listen(EVENT_COMMENT_UPDATED, handlers.onCommentUpdated);
  }
  if (handlers.onCommentDeleted) {
    newsChannel.listen(EVENT_COMMENT_DELETED, handlers.onCommentDeleted);
  }
  if (handlers.onTimelineItem) {
    timelineChannel.listen(EVENT_TIMELINE_ITEM, handlers.onTimelineItem);
  }

  return () => {
    if (handlers.onNewsReaction) {
      newsChannel.stopListening(EVENT_NEWS_REACTION);
    }
    if (handlers.onViewedUpdated) {
      newsChannel.stopListening(EVENT_NEWS_VIEWED);
    }
    if (handlers.onAcknowledgedUpdated) {
      newsChannel.stopListening(EVENT_NEWS_ACKNOWLEDGED);
    }
    if (handlers.onCommentReaction) {
      newsChannel.stopListening(EVENT_COMMENT_REACTION);
    }
    if (handlers.onCommentUpdated) {
      newsChannel.stopListening(EVENT_COMMENT_UPDATED);
    }
    if (handlers.onCommentDeleted) {
      newsChannel.stopListening(EVENT_COMMENT_DELETED);
    }
    if (handlers.onTimelineItem) {
      timelineChannel.stopListening(EVENT_TIMELINE_ITEM);
    }
    echo.leave(newsChannelName);
    echo.leave(timelineChannelName);
  };
}

import echo from './echo';

const EVENT_NEWS_REACTION = '.news.reaction.updated';
const EVENT_COMMENT_REACTION = '.comment.reaction.updated';

/**
 * @param {number} companyId
 * @param {number} newsId
 * @param {{ onNewsReaction?: (payload: object) => void, onCommentReaction?: (payload: object) => void, onTimelineItem?: (payload: object) => void }} handlers
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
  if (handlers.onCommentReaction) {
    newsChannel.listen(EVENT_COMMENT_REACTION, handlers.onCommentReaction);
  }
  if (handlers.onTimelineItem) {
    timelineChannel.listen('.timeline.item.created', handlers.onTimelineItem);
  }

  return () => {
    if (handlers.onNewsReaction) {
      newsChannel.stopListening(EVENT_NEWS_REACTION);
    }
    if (handlers.onCommentReaction) {
      newsChannel.stopListening(EVENT_COMMENT_REACTION);
    }
    if (handlers.onTimelineItem) {
      timelineChannel.stopListening('.timeline.item.created');
    }
    echo.leave(newsChannelName);
    echo.leave(timelineChannelName);
  };
}

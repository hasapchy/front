export function normalizeReaction(reaction) {
  if (!reaction) return reaction;
  return {
    ...reaction,
    creatorId: reaction.creator_id ?? reaction.creatorId,
  };
}

export function normalizeReactions(reactions) {
  return (reactions || []).map((reaction) => normalizeReaction(reaction));
}

export function findMyReaction(reactions, myUserId) {
  const myId = Number(myUserId);
  return (reactions || []).find((reaction) => Number(reaction.creatorId) === myId);
}

export function resolveToggleReactionEmoji(reactions, myUserId, emoji) {
  const mine = findMyReaction(reactions, myUserId);
  return mine?.emoji === emoji ? null : emoji;
}

export function groupReactions(list, myUserId) {
  const myId = Number(myUserId);
  const byEmoji = {};
  (list || []).forEach((reaction) => {
    const emoji = reaction.emoji || '👍';
    if (!byEmoji[emoji]) {
      byEmoji[emoji] = { emoji, count: 0, my: false };
    }
    byEmoji[emoji].count += 1;
    if (Number(reaction.creatorId) === myId) {
      byEmoji[emoji].my = true;
    }
  });
  return Object.values(byEmoji);
}

export function mapSummaryToGroups(summary) {
  return (summary || []).map((row) => ({
    emoji: row.emoji,
    count: row.count || 0,
    my: false,
  }));
}

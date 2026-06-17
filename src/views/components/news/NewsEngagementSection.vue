<template>
  <div class="mt-3">
    <div class="flex items-start justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="group in postReactionsGrouped"
          :key="`post_${group.emoji}`"
          type="button"
          class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors"
          :class="group.my ? 'border-[var(--nav-accent)] bg-[color-mix(in_srgb,var(--nav-accent)_14%,transparent)] text-[var(--nav-accent)]' : 'border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:border-[var(--nav-accent)]'"
          @click="togglePostReaction(group.emoji)"
        >
          <span>{{ group.emoji }}</span>
          <span class="font-medium tabular-nums">{{ group.count }}</span>
        </button>
        <ReactionPickerPopover
          :open="postReactionPickerOpen"
          picker-key="post"
          @update:open="postReactionPickerOpen = $event"
          @select="togglePostReaction"
        >
          <template #trigger="{ toggle }">
            <button
              ref="postReactionBtn"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1 text-[var(--text-secondary)] transition-colors hover:border-[var(--nav-accent)] hover:text-[var(--nav-accent)]"
              :title="$t('messengerAddReactionTooltip')"
              @click="toggle"
            >
              <i class="far fa-smile text-sm" />
              <span class="hidden text-xs font-medium sm:inline">{{ $t('messengerAddReactionTooltip') }}</span>
            </button>
          </template>
        </ReactionPickerPopover>
        <button
          type="button"
          class="text-xs font-medium text-[var(--nav-accent)] hover:underline dark:text-[var(--label-accent)]"
          @click="toggleComments"
        >
          {{ commentsToggleLabel }}
          <span
            v-if="unreadCommentsCount > 0 && !commentsExpanded"
            class="ml-1 inline-flex min-w-[16px] h-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-semibold text-white no-underline"
          >
            {{ unreadCommentsCount }}
          </span>
        </button>
      </div>
      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <slot name="header-right" />
      </div>
    </div>

    <div
      v-if="commentsExpanded"
      class="news-comments-panel mt-2 rounded-lg bg-[color-mix(in_srgb,var(--surface-muted)_40%,transparent)] p-2 sm:p-3"
    >
      <div class="news-comments-panel__content">
        <div
          v-if="commentsLoading && !comments.length"
          class="flex items-center justify-center gap-2 py-4 text-xs text-[var(--text-secondary)]"
        >
          <i class="fas fa-spinner fa-spin text-[var(--nav-accent)]" />
          {{ $t('loading') }}
        </div>

        <template v-else-if="comments.length">
          <NewsCommentRow
            v-for="comment in comments"
            :key="comment.id"
            :comment="comment"
          />
        </template>

        <button
          v-if="commentsHasMore"
          type="button"
          class="mx-auto flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-1.5 text-xs font-medium text-[var(--nav-accent)] transition-colors hover:border-[var(--nav-accent)] disabled:opacity-50"
          :disabled="commentsLoading"
          @click="loadMoreComments"
        >
          <i
            v-if="commentsLoading"
            class="fas fa-spinner fa-spin"
          />
          {{ $t('timelineLoadMore') }}
        </button>
      </div>

      <div class="news-comments-panel__composer">
        <NewsCommentComposer
          :draft="draft"
          :sending="sending"
          :replying-to="replyingTo"
          :current-user="currentUser"
          @update:draft="draft = $event"
          @send="sendComment"
          @cancel-reply="replyingTo = null"
        />
      </div>
    </div>

    <CommentContextMenu
      ref="commentMenuEl"
      :visible="commentMenuVisible"
      :menu-style="commentMenuStyle"
      :can-edit="commentMenuTarget ? canEditComment(commentMenuTarget) : false"
      :can-delete="commentMenuTarget ? canDeleteComment(commentMenuTarget) : false"
      @reply="menuReply"
      @edit="menuEdit"
      @delete="menuDelete"
    />
  </div>
</template>

<script>
import { computed } from 'vue';
import CommentController from '@/api/CommentController';
import NewsController from '@/api/NewsController';
import {
  groupReactions,
  mapSummaryToGroups,
  normalizeReactions,
  resolveToggleReactionEmoji,
} from '@/utils/reactionUtils';
import { subscribeNewsEngagement } from '@/services/newsRealtime';
import echo from '@/services/echo';
import { eventBus } from '@/eventBus';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import ReactionPickerPopover from '@/views/components/news/ReactionPickerPopover.vue';
import NewsCommentRow from '@/views/components/news/NewsCommentRow.vue';
import NewsCommentComposer from '@/views/components/news/NewsCommentComposer.vue';
import CommentContextMenu from '@/views/components/news/CommentContextMenu.vue';

export default {
  name: 'NewsEngagementSection',
  components: {
    ReactionPickerPopover,
    NewsCommentRow,
    NewsCommentComposer,
    CommentContextMenu,
  },
  mixins: [notificationMixin, getApiErrorMessageMixin],
  props: {
    newsId: {
      type: Number,
      required: true,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    reactionsSummary: {
      type: Array,
      default: () => [],
    },
    unreadCommentsCount: {
      type: Number,
      default: 0,
    },
  },
  emits: ['unread-cleared', 'comments-count-changed', 'unread-increment', 'viewed-updated', 'acknowledged-updated'],
  provide() {
    return {
      newsCommentCtx: computed(() => ({
        myUserId: this.myUserId,
        editingCommentId: this.editingCommentId,
        editingBody: this.editingBody,
        viewedByCommentId: this.viewedByCommentId,
        reactionPickerOpenId: this.commentReactionPickerId,
      })),
      newsCommentActions: {
        openMenu: (event, comment) => this.openCommentMenu(event, comment),
        toggleViewedBy: (commentId) => this.toggleViewedBy(commentId),
        closeViewedBy: () => { this.viewedByCommentId = null; },
        toggleReaction: (comment, emoji) => this.toggleCommentReaction(comment, emoji),
        setReactionPickerOpen: (id) => { this.commentReactionPickerId = id; },
        updateEditingBody: (value) => { this.editingBody = value; },
        saveEdit: (comment) => this.saveEdit(comment),
        cancelEdit: () => this.cancelEdit(),
      },
    };
  },
  data() {
    return {
      postReactions: [],
      commentsExpanded: false,
      comments: [],
      commentsCursor: null,
      commentsHasMore: false,
      commentsLoading: false,
      draft: '',
      sending: false,
      replyingTo: null,
      editingCommentId: null,
      editingBody: '',
      viewedByCommentId: null,
      postReactionPickerOpen: false,
      commentReactionPickerId: null,
      unsubscribeRealtime: null,
      pollTimer: null,
      trackedCommentsCount: 0,
      seenCommentIds: new Set(),
      commentMenuVisible: false,
      commentMenuTarget: null,
      commentMenuX: 0,
      commentMenuY: 0,
      commentMenuAdjustedY: 0,
    };
  },
  computed: {
    myUserId() {
      return Number(this.$store.state.user?.id || 0);
    },
    commentsToggleLabel() {
      const count = Math.max(this.trackedCommentsCount, this.countAllComments());
      if (count > 0) return this.$t('commentsCount', count, { count });
      return this.$t('comment');
    },
    postReactionsGrouped() {
      if (this.postReactions.length) {
        return groupReactions(this.postReactions, this.myUserId);
      }
      return mapSummaryToGroups(this.reactionsSummary);
    },
    commentMenuStyle() {
      return {
        left: `${this.commentMenuX}px`,
        top: `${this.commentMenuAdjustedY}px`,
      };
    },
    currentUser() {
      return this.$store.state.user || null;
    },
  },
  watch: {
    commentsCount: {
      immediate: true,
      handler(value) {
        const next = Number(value || 0);
        if (next > this.trackedCommentsCount) {
          this.trackedCommentsCount = next;
        }
      },
    },
    '$store.state.currentCompany.id'() {
      this.bindRealtime();
    },
  },
  beforeUnmount() {
    this.teardownRealtime();
    this.clearEngagementPolling();
    document.removeEventListener('click', this.closeCommentMenu);
    document.removeEventListener('click', this.closeReactionPickersOnClickOutside);
  },
  mounted() {
    document.addEventListener('click', this.closeReactionPickersOnClickOutside);
    this.bindRealtime();
    this.bindEngagementPolling();
  },
  methods: {
    showEngagementError(error, fallbackKey = 'error') {
      const subtitle = this.apiErrorLinesAsString(error) || this.$t(fallbackKey);
      this.showNotification(this.$t('error'), subtitle, true);
    },
    emitCommentsCountChanged(count = null) {
      const next = count ?? (this.commentsExpanded
        ? this.countAllComments()
        : this.trackedCommentsCount);
      this.trackedCommentsCount = next;
      this.$emit('comments-count-changed', { newsId: this.newsId, count: next });
    },
    registerNewComment(commentId) {
      const id = Number(commentId);
      if (!id || this.seenCommentIds.has(id)) return false;
      this.seenCommentIds.add(id);
      return true;
    },
    seedSeenCommentIds(items = []) {
      items.forEach((comment) => {
        const id = Number(comment?.id);
        if (id) this.seenCommentIds.add(id);
        (comment?.replies || []).forEach((reply) => {
          const replyId = Number(reply?.id);
          if (replyId) this.seenCommentIds.add(replyId);
        });
      });
    },
    emitTimelineItemCreated() {
      eventBus.emit('timeline-item-created', { apiType: 'news', entityId: this.newsId });
    },
    emitNewsUnreadIncrement() {
      eventBus.emit('news-unread-increment', { apiType: 'news', entityId: this.newsId });
    },
    commentExistsInTree(commentId) {
      const id = Number(commentId);
      return this.comments.some((c) => {
        if (Number(c.id) === id) return true;
        return (c.replies || []).some((r) => Number(r.id) === id);
      });
    },
    removeCommentFromTree(commentId) {
      const id = Number(commentId);
      this.comments = this.comments
        .filter((c) => Number(c.id) !== id)
        .map((c) => ({
          ...c,
          replies: (c.replies || []).filter((r) => Number(r.id) !== id),
        }));
    },
    closeReactionPickersOnClickOutside(event) {
      if (!this.postReactionPickerOpen && !this.commentReactionPickerId) return;
      const postBtn = this.$refs.postReactionBtn;
      if (postBtn?.contains(event.target)) return;
      if (event.target.closest?.('.news-reaction-picker')) return;
      this.postReactionPickerOpen = false;
      this.commentReactionPickerId = null;
    },
    canEditComment(comment) {
      return Number(comment?.creatorId) === this.myUserId;
    },
    canDeleteComment(comment) {
      if (this.canEditComment(comment)) return true;
      return this.$store.getters.hasPermission('news_delete_all') || Boolean(this.$store.state.user?.is_admin);
    },
    countAllComments() {
      return this.comments.reduce((sum, comment) => sum + 1 + (comment.replies?.length || 0), 0);
    },
    toggleViewedBy(commentId) {
      this.viewedByCommentId = this.viewedByCommentId === commentId ? null : commentId;
    },
    upsertComment(comment, parentId = null) {
      const normalized = CommentController.normalizeComment(comment);
      const id = Number(normalized?.id);
      if (!id) return false;

      const parent = parentId ?? normalized.parentId ?? null;
      this.removeCommentFromTree(id);

      if (parent) {
        const parentExists = this.comments.some((c) => Number(c.id) === Number(parent));
        if (!parentExists) return false;
        this.comments = this.comments.map((c) => {
          if (Number(c.id) !== Number(parent)) return c;
          return { ...c, replies: [...(c.replies || []), normalized] };
        });
      } else {
        this.comments = [...this.comments, { ...normalized, replies: normalized.replies || [] }];
      }
      return true;
    },
    openCommentMenu(event, comment) {
      this.commentMenuTarget = comment;
      this.commentMenuX = event.clientX;
      this.commentMenuY = event.clientY;
      this.commentMenuAdjustedY = event.clientY;
      this.commentMenuVisible = true;
      document.addEventListener('click', this.closeCommentMenu, { once: true });
      this.$nextTick(() => {
        const el = this.$refs.commentMenuEl?.$refs?.menuEl;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - this.commentMenuY;
        if (rect.height > spaceBelow && this.commentMenuY > rect.height) {
          this.commentMenuAdjustedY = this.commentMenuY - rect.height;
        }
      });
    },
    closeCommentMenu() {
      this.commentMenuVisible = false;
      this.commentMenuTarget = null;
    },
    menuReply() {
      if (this.commentMenuTarget) {
        this.startReply(this.commentMenuTarget);
      }
      this.closeCommentMenu();
    },
    menuEdit() {
      if (this.commentMenuTarget) {
        this.startEdit(this.commentMenuTarget);
      }
      this.closeCommentMenu();
    },
    async menuDelete() {
      const target = this.commentMenuTarget;
      this.closeCommentMenu();
      if (target) {
        await this.deleteComment(target);
      }
    },
    async openComments() {
      if (!this.commentsExpanded) {
        this.commentsExpanded = true;
      }
      await this.loadComments(true);
      await CommentController.markTimelineRead('news', this.newsId);
      this.$emit('unread-cleared', this.newsId);
    },
    async toggleComments() {
      if (this.commentsExpanded) {
        this.commentsExpanded = false;
        this.viewedByCommentId = null;
        this.closeCommentMenu();
        return;
      }
      await this.openComments();
    },
    async loadComments(reset = false, { silent = false } = {}) {
      if (this.commentsLoading) return;
      this.commentsLoading = true;
      try {
        const page = await CommentController.getCommentsPage('news', this.newsId, {
          limit: 20,
          cursor: reset ? null : this.commentsCursor,
        });
        const items = page.items || [];
        if (reset) {
          this.comments = items;
          this.seedSeenCommentIds(items);
        } else {
          items.forEach((item) => {
            this.upsertComment(item);
            this.seedSeenCommentIds([item]);
          });
        }
        this.commentsCursor = page.nextCursor;
        this.commentsHasMore = page.hasMore;
        if (reset && !silent) {
          this.emitCommentsCountChanged();
        }
      } catch (error) {
        if (!silent) {
          this.showEngagementError(error, 'error');
        }
      } finally {
        this.commentsLoading = false;
      }
    },
    async reloadCommentsForMissingParent() {
      if (this.commentsLoading) return;
      await this.loadComments(true, { silent: true });
    },
    loadMoreComments() {
      if (!this.commentsHasMore) return;
      return this.loadComments(false);
    },
    bindRealtime() {
      this.teardownRealtime();
      const companyId = Number(this.$store.state.currentCompany?.id || 0);
      if (!companyId) return;
      this.unsubscribeRealtime = subscribeNewsEngagement(companyId, this.newsId, {
        onTimelineItem: (payload) => this.onTimelineItem(payload),
        onNewsReaction: (payload) => {
          if (Array.isArray(payload?.reactions)) {
            this.postReactions = normalizeReactions(payload.reactions);
          }
        },
        onCommentReaction: (payload) => {
          const commentId = Number(payload?.comment_id);
          if (!commentId) return;
          this.patchCommentReactions(commentId, payload.reactions);
        },
        onCommentUpdated: (payload) => this.onCommentUpdated(payload),
        onCommentDeleted: (payload) => this.onCommentDeleted(payload),
        onViewedUpdated: (payload) => this.$emit('viewed-updated', payload),
        onAcknowledgedUpdated: (payload) => this.$emit('acknowledged-updated', payload),
      });
    },
    bindEngagementPolling() {
      this.clearEngagementPolling();
      this.pollTimer = setInterval(() => {
        if (echo?.connector?.pusher?.connection?.state === 'connected') {
          return;
        }
        if (this.commentsExpanded) {
          this.loadComments(true, { silent: true });
          return;
        }
        this.emitTimelineItemCreated();
      }, 60000);
    },
    clearEngagementPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },
    teardownRealtime() {
      if (typeof this.unsubscribeRealtime === 'function') {
        this.unsubscribeRealtime();
        this.unsubscribeRealtime = null;
      }
    },
    onTimelineItem(payload) {
      const item = payload?.item;
      if (!item || item.type !== 'comment') return;

      const normalized = CommentController.normalizeCommentFromTimeline(item);
      const parentId = normalized.parentId ?? null;
      const isNew = this.registerNewComment(normalized.id);

      if (this.commentsExpanded) {
        const inserted = this.upsertComment(normalized, parentId);
        if (!inserted && parentId) {
          this.reloadCommentsForMissingParent();
        }
      }

      if (!isNew) return;

      this.emitCommentsCountChanged(this.trackedCommentsCount + 1);
      const creatorId = Number(normalized.creatorId ?? normalized.user?.id ?? 0);
      if (creatorId !== this.myUserId) {
        if (!this.commentsExpanded) {
          this.emitNewsUnreadIncrement();
        }
        this.emitTimelineItemCreated();
      }
    },
    onCommentUpdated(payload) {
      const commentId = Number(payload?.comment_id);
      if (!commentId) return;
      const body = payload?.body;
      if (typeof body !== 'string') return;
      if (!this.commentsExpanded) return;
      this.patchCommentBody(commentId, body);
    },
    onCommentDeleted(payload) {
      const commentId = Number(payload?.comment_id);
      if (!commentId) return;
      const hadComment = this.commentExistsInTree(commentId) || this.seenCommentIds.has(commentId);
      this.seenCommentIds.delete(commentId);
      if (this.commentsExpanded) {
        this.removeCommentFromTree(commentId);
      }
      if (!hadComment) return;
      this.emitCommentsCountChanged(Math.max(0, this.trackedCommentsCount - 1));
    },
    patchCommentBody(commentId, body) {
      const id = Number(commentId);
      this.comments = this.comments.map((c) => {
        if (Number(c.id) === id) return { ...c, body };
        const replies = (c.replies || []).map((r) =>
          Number(r.id) === id ? { ...r, body } : r
        );
        return { ...c, replies };
      });
    },
    patchCommentReactions(commentId, reactions) {
      const mapped = normalizeReactions(reactions);
      this.comments = this.comments.map((c) => {
        if (Number(c.id) === commentId) return { ...c, reactions: mapped };
        const replies = (c.replies || []).map((r) =>
          Number(r.id) === commentId ? { ...r, reactions: mapped } : r
        );
        return { ...c, replies };
      });
    },
    async togglePostReaction(emoji) {
      this.postReactionPickerOpen = false;
      try {
        const nextEmoji = resolveToggleReactionEmoji(this.postReactions, this.myUserId, emoji);
        this.postReactions = await NewsController.setReaction(this.newsId, nextEmoji);
      } catch (error) {
        this.showEngagementError(error, 'error');
      }
    },
    async toggleCommentReaction(comment, emoji) {
      this.commentReactionPickerId = null;
      try {
        const nextEmoji = resolveToggleReactionEmoji(comment.reactions, this.myUserId, emoji);
        const reactions = await CommentController.setReaction(comment.id, nextEmoji);
        this.patchCommentReactions(comment.id, reactions);
      } catch (error) {
        this.showEngagementError(error, 'error');
      }
    },
    startReply(comment) {
      const parent = comment.parentId || comment.parent_id
        ? this.comments.find((c) => (c.replies || []).some((r) => Number(r.id) === Number(comment.id))) || comment
        : comment;
      this.replyingTo = parent;
      this.editingCommentId = null;
    },
    startEdit(comment) {
      this.editingCommentId = comment.id;
      this.editingBody = comment.body || '';
      this.replyingTo = null;
    },
    cancelEdit() {
      this.editingCommentId = null;
      this.editingBody = '';
    },
    async saveEdit(comment) {
      const body = this.editingBody.trim();
      if (!body) return;
      try {
        await CommentController.updateItem(comment.id, { body });
        this.comments = this.comments.map((c) => {
          if (Number(c.id) === Number(comment.id)) return { ...c, body };
          const replies = (c.replies || []).map((r) =>
            Number(r.id) === Number(comment.id) ? { ...r, body } : r
          );
          return { ...c, replies };
        });
        this.cancelEdit();
      } catch (error) {
        this.showEngagementError(error, 'error');
      }
    },
    async deleteComment(comment) {
      try {
        await CommentController.deleteItem(comment.id);
        this.seenCommentIds.delete(Number(comment.id));
        this.removeCommentFromTree(comment.id);
        this.emitCommentsCountChanged();
      } catch (error) {
        this.showEngagementError(error, 'error');
      }
    },
    async sendComment() {
      const body = this.draft.trim();
      if (!body || this.sending) return;
      this.sending = true;
      const parentId = this.replyingTo?.id || null;
      try {
        const result = await CommentController.create('news', this.newsId, body, { parentId });
        const comment = result.comment
          ? CommentController.normalizeComment(result.comment)
          : (result.timelineItem
            ? CommentController.normalizeCommentFromTimeline(result.timelineItem)
            : null);
        if (comment) {
          if (this.commentsExpanded) {
            const inserted = this.upsertComment(comment, parentId);
            if (!inserted && parentId) {
              this.reloadCommentsForMissingParent();
            }
          }
          if (this.registerNewComment(comment.id)) {
            this.emitCommentsCountChanged(this.trackedCommentsCount + 1);
          }
          this.emitTimelineItemCreated();
        }
        this.draft = '';
        this.replyingTo = null;
      } catch (error) {
        this.showEngagementError(error, 'timelineCommentSendFailed');
      } finally {
        this.sending = false;
      }
    },
  },
};
</script>

<style scoped>
.news-comments-panel {
  display: flex;
  max-height: min(34rem, 70vh);
  flex-direction: column;
  gap: 0.625rem;
  animation: news-comments-in 0.2s ease-out;
}

.news-comments-panel__content {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 0.125rem;
}

.news-comments-panel__composer {
  flex-shrink: 0;
}

@keyframes news-comments-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

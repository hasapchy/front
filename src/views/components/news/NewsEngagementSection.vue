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
              class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors hover:border-[var(--nav-accent)] hover:text-[var(--nav-accent)]"
              @click="toggle"
            >
              <i class="far fa-smile" />
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
  emits: ['unread-cleared', 'comments-count-changed'],
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
      const count = Math.max(this.commentsCount, this.countAllComments());
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
  beforeUnmount() {
    this.teardownRealtime();
    document.removeEventListener('click', this.closeCommentMenu);
    document.removeEventListener('click', this.closeReactionPickersOnClickOutside);
  },
  mounted() {
    document.addEventListener('click', this.closeReactionPickersOnClickOutside);
  },
  methods: {
    showEngagementError(error, fallbackKey = 'error') {
      const subtitle = this.apiErrorLinesAsString(error) || this.$t(fallbackKey);
      this.showNotification(this.$t('error'), subtitle, true);
    },
    emitTimelineItemCreated() {
      eventBus.emit('timeline-item-created', { apiType: 'news', entityId: this.newsId });
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
    commentExists(commentId) {
      const id = Number(commentId);
      if (!id) return false;
      return this.comments.some((c) => Number(c.id) === id)
        || this.comments.some((c) => (c.replies || []).some((r) => Number(r.id) === id));
    },
    upsertComment(comment, parentId = null) {
      const normalized = comment?.id ? comment : CommentController.normalizeComment(comment);
      const id = Number(normalized?.id);
      if (!id || this.commentExists(id)) return false;

      const parent = parentId ?? normalized.parentId ?? normalized.parent_id ?? null;
      if (parent) {
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
    async toggleComments() {
      this.commentsExpanded = !this.commentsExpanded;
      if (!this.commentsExpanded) {
        this.teardownRealtime();
        this.viewedByCommentId = null;
        this.closeCommentMenu();
        return;
      }
      await this.loadComments(true);
      await CommentController.markTimelineRead('news', this.newsId);
      this.$emit('unread-cleared', this.newsId);
      this.bindRealtime();
    },
    async loadComments(reset = false) {
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
        } else {
          items.forEach((item) => {
            this.upsertComment(item);
          });
        }
        this.commentsCursor = page.nextCursor;
        this.commentsHasMore = page.hasMore;
        if (reset) {
          this.$emit('comments-count-changed', { newsId: this.newsId, count: this.countAllComments() });
        }
      } catch (error) {
        this.showEngagementError(error, 'error');
      } finally {
        this.commentsLoading = false;
      }
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
      });
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
      if (this.commentExists(normalized.id)) return;
      const parentId = normalized.parentId ?? normalized.parent_id ?? null;
      if (this.upsertComment(normalized, parentId)) {
        this.$emit('comments-count-changed', { newsId: this.newsId, count: this.countAllComments() });
        this.emitTimelineItemCreated();
      }
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
        if (comment.parentId || comment.parent_id) {
          const parentId = Number(comment.parentId ?? comment.parent_id);
          this.comments = this.comments.map((c) => {
            if (Number(c.id) !== parentId) return c;
            return { ...c, replies: (c.replies || []).filter((r) => Number(r.id) !== Number(comment.id)) };
          });
        } else {
          this.comments = this.comments.filter((c) => Number(c.id) !== Number(comment.id));
        }
        this.$emit('comments-count-changed', { newsId: this.newsId, count: this.countAllComments() });
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
        const added = (result.comment && this.upsertComment(result.comment, parentId))
          || (result.timelineItem && this.upsertComment(
            CommentController.normalizeCommentFromTimeline(result.timelineItem),
            parentId
          ));
        if (added) {
          this.$emit('comments-count-changed', { newsId: this.newsId, count: this.countAllComments() });
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

<template>
  <div
    class="group flex gap-2.5 sm:gap-3"
    :class="isReply ? 'group/reply gap-2' : ''"
  >
    <EntityCardCreatorAvatar
      v-if="comment.user"
      :user="comment.user"
      :class="isReply ? 'mt-0.5 shrink-0 scale-90' : 'mt-1 shrink-0'"
    />
    <div class="min-w-0 flex-1 space-y-2">
      <div
        class="news-comment-bubble relative rounded-2xl rounded-tl-md border px-3 py-2.5 shadow-sm transition-shadow"
        :class="bubbleClass"
      >
        <div class="mb-1 flex items-start justify-between gap-2">
          <span
            class="font-semibold text-[var(--text-primary)]"
            :class="isReply ? 'text-[11px]' : 'text-xs'"
          >
            {{ userName }}
          </span>
          <div class="flex shrink-0 items-center gap-0.5">
            <ReactionPickerPopover
              :open="reactionPickerOpenId === comment.id"
              dense
              :picker-key="`comment_${comment.id}`"
              @update:open="(val) => newsCommentActions.setReactionPickerOpen(val ? comment.id : null)"
              @select="(emoji) => newsCommentActions.toggleReaction(comment, emoji)"
            >
              <template #trigger="{ toggle, open }">
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full text-[10px] text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-muted)] hover:text-[var(--nav-accent)] dark:hover:text-[var(--label-accent)]"
                  :class="[
                    isReply ? 'h-5 w-5' : 'h-6 w-6',
                    open ? 'text-[var(--nav-accent)]' : '',
                  ]"
                  @click="toggle"
                >
                  <i class="far fa-smile" />
                </button>
              </template>
            </ReactionPickerPopover>
            <span class="text-[10px] tabular-nums text-[var(--text-secondary)]">
              {{ formattedDate }}
            </span>
            <CommentViewedByTooltip
              trigger="click"
              :viewed-by="comment.viewedBy"
              :visible="viewedByCommentId === comment.id"
              @toggle="newsCommentActions.toggleViewedBy(comment.id)"
              @hover-end="newsCommentActions.closeViewedBy()"
            />
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full text-[10px] text-[var(--text-secondary)] opacity-100 transition-all hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              :class="isReply ? 'h-5 w-5 md:opacity-0 md:group-hover/reply:opacity-100' : 'h-6 w-6 md:opacity-0 md:group-hover:opacity-100'"
              @click.stop="newsCommentActions.openMenu($event, comment)"
            >
              <i class="fas fa-ellipsis-v" />
            </button>
          </div>
        </div>

        <div
          v-if="editingCommentId !== comment.id"
          class="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-primary)]"
        >
          {{ comment.body }}
        </div>
        <div
          v-else
          class="space-y-2"
        >
          <textarea
            :value="editingBody"
            rows="2"
            class="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--nav-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--nav-accent)_20%,transparent)]"
            @input="newsCommentActions.updateEditingBody($event.target.value)"
          />
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg bg-[var(--nav-accent)] px-3 py-1 text-xs font-medium text-white hover:opacity-90"
              @click="newsCommentActions.saveEdit(comment)"
            >
              {{ $t('save') }}
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
              @click="newsCommentActions.cancelEdit()"
            >
              {{ $t('cancel') }}
            </button>
          </div>
        </div>

        <div
          v-if="reactionsGrouped.length"
          class="mt-2 flex flex-wrap items-center gap-1 border-t border-[var(--border-subtle)] pt-2"
        >
          <button
            v-for="group in reactionsGrouped"
            :key="`c_${comment.id}_${group.emoji}`"
            type="button"
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition-colors"
            :class="group.my
              ? 'bg-[color-mix(in_srgb,var(--nav-accent)_14%,transparent)] text-[var(--nav-accent)]'
              : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:opacity-90'"
            @click="newsCommentActions.toggleReaction(comment, group.emoji)"
          >
            <span>{{ group.emoji }}</span>
            <span class="font-medium tabular-nums">{{ group.count }}</span>
          </button>
        </div>
      </div>

      <div
        v-if="!isReply && comment.replies?.length"
        class="ml-2 space-y-2 border-l-2 border-[color-mix(in_srgb,var(--nav-accent)_25%,var(--border-subtle))] pl-3 sm:ml-3 sm:pl-4"
      >
        <NewsCommentRow
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          is-reply
        />
      </div>
    </div>
  </div>
</template>

<script>
import EntityCardCreatorAvatar from '@/views/components/app/cards/EntityCardCreatorAvatar.vue';
import CommentViewedByTooltip from '@/views/components/app/comments/CommentViewedByTooltip.vue';
import ReactionPickerPopover from '@/views/components/news/ReactionPickerPopover.vue';
import { groupReactions } from '@/utils/reactionUtils';
import { dtoDateFormatters } from '@/utils/dateUtils';
import { getUserDisplayName } from '@/utils/displayUtils';

export default {
  name: 'NewsCommentRow',
  components: {
    EntityCardCreatorAvatar,
    CommentViewedByTooltip,
    ReactionPickerPopover,
  },
  inject: {
    newsCommentCtx: { default: null },
    newsCommentActions: { default: null },
  },
  props: {
    comment: {
      type: Object,
      required: true,
    },
    isReply: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    myUserId() {
      return this.newsCommentCtx?.myUserId ?? 0;
    },
    editingCommentId() {
      return this.newsCommentCtx?.editingCommentId ?? null;
    },
    editingBody() {
      return this.newsCommentCtx?.editingBody ?? '';
    },
    viewedByCommentId() {
      return this.newsCommentCtx?.viewedByCommentId ?? null;
    },
    reactionPickerOpenId() {
      return this.newsCommentCtx?.reactionPickerOpenId ?? null;
    },
    userName() {
      return getUserDisplayName(this.comment?.user) || this.$t('unknownAuthor');
    },
    formattedDate() {
      return dtoDateFormatters.formatDate(this.comment.createdAt || this.comment.created_at);
    },
    reactionsGrouped() {
      return groupReactions(this.comment?.reactions || [], this.myUserId);
    },
    bubbleClass() {
      if (this.isReply) {
        return 'news-comment-bubble_reply min-w-0 flex-1 border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-muted)_90%,transparent)] shadow-sm dark:bg-[color-mix(in_srgb,var(--surface-elevated)_80%,transparent)]';
      }
      return 'border-[var(--border-subtle)] bg-[var(--surface-elevated)] group-hover:shadow-md';
    },
  },
};
</script>

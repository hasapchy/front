<template>
  <div>
    <div
      v-if="replyingTo"
      class="news-reply-banner"
    >
      <div class="news-reply-banner__accent" />
      <div class="news-reply-banner__body">
        <div class="news-reply-banner__title">
          {{ $t('replyTo') }} {{ replyUserName }}
        </div>
        <div class="news-reply-banner__text">
          {{ replyingTo.body }}
        </div>
      </div>
      <button
        type="button"
        class="news-reply-banner__close"
        @click="$emit('cancel-reply')"
      >
        <i class="fas fa-times" />
      </button>
    </div>

    <div class="news-composer-wrap">
      <EntityCardCreatorAvatar
        v-if="currentUser"
        :user="currentUser"
        class="news-composer-wrap__avatar"
      />
      <div class="news-composer">
        <textarea
          ref="composerTextarea"
          :value="draft"
          rows="1"
          class="news-composer__input"
          :placeholder="$t('timelineCommentPlaceholder')"
          @input="$emit('update:draft', $event.target.value)"
          @keydown.enter.exact.prevent="$emit('send')"
        />
        <div class="news-composer__footer">
          <ReactionPickerPopover
            :open="showEmojiPicker"
            picker-key="news-composer"
            @update:open="showEmojiPicker = $event"
            @select="onEmojiSelect"
          >
            <template #trigger="{ toggle }">
              <button
                type="button"
                class="news-composer__tool-btn"
                :class="{ 'news-composer__tool-btn--active': showEmojiPicker }"
                :title="$t('commentEmojiTitle')"
                @click="toggle"
              >
                <i class="far fa-smile" />
              </button>
            </template>
          </ReactionPickerPopover>
          <span class="news-composer__hint">{{ $t('commentEnterHint') }}</span>
          <button
            type="button"
            class="news-composer__send"
            :class="{ 'news-composer__send--ready': draft.trim() && !sending }"
            :disabled="!draft.trim() || sending"
            :title="$t('commentSendTitle')"
            @click="$emit('send')"
          >
            <i
              class="fas"
              :class="sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EntityCardCreatorAvatar from '@/views/components/app/cards/EntityCardCreatorAvatar.vue';
import ReactionPickerPopover from '@/views/components/news/ReactionPickerPopover.vue';
import { insertEmojiAtCaret } from '@/utils/emojiInsertUtils';
import { getUserDisplayName } from '@/utils/displayUtils';

export default {
  name: 'NewsCommentComposer',
  components: {
    EntityCardCreatorAvatar,
    ReactionPickerPopover,
  },
  props: {
    draft: {
      type: String,
      default: '',
    },
    sending: {
      type: Boolean,
      default: false,
    },
    replyingTo: {
      type: Object,
      default: null,
    },
    currentUser: {
      type: Object,
      default: null,
    },
  },
  emits: ['update:draft', 'send', 'cancel-reply'],
  data() {
    return {
      showEmojiPicker: false,
    };
  },
  computed: {
    replyUserName() {
      return getUserDisplayName(this.replyingTo?.user) || this.$t('unknownAuthor');
    },
  },
  methods: {
    onEmojiSelect(emoji) {
      const ta = this.$refs.composerTextarea;
      insertEmojiAtCaret(ta, this.draft, (val) => this.$emit('update:draft', val), emoji);
      this.showEmojiPicker = false;
    },
  },
};
</script>

<style scoped>
.news-reply-banner {
  display: flex;
  align-items: stretch;
  gap: 0.625rem;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--nav-accent) 28%, var(--border-subtle));
  background: color-mix(in srgb, var(--nav-accent) 7%, var(--surface-elevated));
  margin-bottom: 0.5rem;
}

.news-reply-banner__accent {
  width: 3px;
  flex-shrink: 0;
  background: linear-gradient(
    180deg,
    var(--nav-accent),
    color-mix(in srgb, var(--nav-accent) 55%, var(--color-success))
  );
}

.news-reply-banner__body {
  min-width: 0;
  flex: 1;
  padding: 0.5rem 0;
}

.news-reply-banner__title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--nav-accent);
}

.news-reply-banner__text {
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.news-reply-banner__close {
  display: flex;
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  align-self: center;
  margin-right: 0.375rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  color: var(--text-secondary);
  transition: color 0.15s ease, background-color 0.15s ease;
}

.news-reply-banner__close:hover {
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
}

.news-composer-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
}

.news-composer-wrap__avatar {
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.news-composer {
  min-width: 0;
  flex: 1;
  border-radius: 0.875rem;
  border: 1px solid var(--border-subtle);
  background: var(--surface-elevated);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.news-composer:focus-within {
  border-color: color-mix(in srgb, var(--nav-accent) 34%, var(--border-subtle));
  background: var(--surface-elevated);
}

.news-composer__input {
  display: block;
  width: 100%;
  min-height: 2.375rem;
  max-height: 6.5rem;
  resize: none;
  border: 0;
  background: transparent;
  padding: 0.625rem 0.875rem 0.25rem;
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--text-primary);
  outline: none;
}

.news-composer__input::placeholder {
  color: var(--text-secondary);
  opacity: 0.85;
}

.news-composer__footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem 0.5rem 0.625rem;
}

.news-composer__tool-btn {
  display: flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-size: 0.9375rem;
  color: var(--text-secondary);
  transition: color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
}

.news-composer__tool-btn:hover,
.news-composer__tool-btn--active {
  color: var(--nav-accent);
  background: color-mix(in srgb, var(--nav-accent) 12%, transparent);
}

.news-composer__tool-btn:active {
  transform: scale(0.94);
}

.news-composer__hint {
  margin-right: auto;
  font-size: 0.6875rem;
  letter-spacing: 0.02em;
  color: color-mix(in srgb, var(--text-secondary) 75%, transparent);
  user-select: none;
}

.news-composer__send {
  display: flex;
  height: 2.125rem;
  width: 2.125rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: var(--surface-elevated);
  background: color-mix(in srgb, var(--text-secondary) 35%, var(--surface-muted));
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease, opacity 0.2s ease;
}

.news-composer__send--ready {
  background: linear-gradient(
    145deg,
    var(--nav-accent),
    color-mix(in srgb, var(--nav-accent) 72%, var(--color-success))
  );
  box-shadow: 0 4px 12px color-mix(in srgb, var(--nav-accent) 38%, transparent);
}

.news-composer__send--ready:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--nav-accent) 42%, transparent);
}

.news-composer__send--ready:active {
  transform: translateY(0);
}

.news-composer__send:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
  box-shadow: none;
}
</style>

<template>
  <div
    ref="triggerWrap"
    class="inline-flex"
    @click.stop
  >
    <slot
      name="trigger"
      :toggle="toggle"
      :open="open"
    >
      <button
        type="button"
        class="inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--nav-accent)]"
        @click="toggle"
      >
        <i class="far fa-smile text-[10px]" />
      </button>
    </slot>
    <Teleport to="body">
      <div
        v-if="open"
        ref="pickerEl"
        class="news-reaction-picker fixed z-[9999] grid grid-cols-6 gap-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-lg"
        :class="dense ? 'p-1' : 'p-1.5'"
        :style="pickerStyle"
        @click.stop
      >
        <button
          v-for="emoji in emojis"
          :key="`${pickerKey}_${emoji}`"
          type="button"
          class="rounded-lg text-sm transition-colors hover:bg-[var(--surface-muted)]"
          :class="dense ? 'h-7 w-7' : 'h-8 w-8 text-base'"
          @click="onSelect(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { COMPOSER_EMOJIS } from '@/constants/composerEmojis';

export default {
  name: 'ReactionPickerPopover',
  props: {
    emojis: {
      type: Array,
      default: () => COMPOSER_EMOJIS,
    },
    open: {
      type: Boolean,
      default: false,
    },
    dense: {
      type: Boolean,
      default: false,
    },
    pickerKey: {
      type: String,
      default: 'picker',
    },
  },
  emits: ['update:open', 'select'],
  data() {
    return {
      pickerStyle: {
        top: '-9999px',
        left: '-9999px',
      },
    };
  },
  watch: {
    open(value) {
      if (value) {
        this.$nextTick(() => {
          this.updatePosition();
          window.addEventListener('resize', this.updatePosition);
          window.addEventListener('scroll', this.updatePosition, true);
        });
        return;
      }
      window.removeEventListener('resize', this.updatePosition);
      window.removeEventListener('scroll', this.updatePosition, true);
    },
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updatePosition);
    window.removeEventListener('scroll', this.updatePosition, true);
  },
  methods: {
    toggle() {
      this.$emit('update:open', !this.open);
    },
    updatePosition() {
      const triggerEl = this.$refs.triggerWrap;
      const pickerEl = this.$refs.pickerEl;
      if (!triggerEl || !pickerEl) return;

      const triggerRect = triggerEl.getBoundingClientRect();
      const pickerRect = pickerEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const offset = this.dense ? 4 : 8;

      let left = triggerRect.left;
      if (left + pickerRect.width > viewportWidth - 8) {
        left = viewportWidth - pickerRect.width - 8;
      }
      if (left < 8) left = 8;

      let top = triggerRect.top - pickerRect.height - offset;
      if (top < 8) {
        top = triggerRect.bottom + offset;
      }
      if (top + pickerRect.height > viewportHeight - 8) {
        top = Math.max(8, viewportHeight - pickerRect.height - 8);
      }

      this.pickerStyle = {
        top: `${Math.round(top)}px`,
        left: `${Math.round(left)}px`,
      };
    },
    onSelect(emoji) {
      this.$emit('select', emoji);
      this.$emit('update:open', false);
    },
  },
};
</script>

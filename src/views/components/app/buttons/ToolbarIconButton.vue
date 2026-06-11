<template>
  <button
    type="button"
    :disabled="disabled"
    :title="resolvedTitle"
    :aria-label="ariaLabel"
    :class="[buttonClass, extraClass]"
    :style="extraStyle"
    @click="$emit('click', $event)"
  >
    <slot>
      <i
        :class="[icon, iconClass]"
        aria-hidden="true"
      />
    </slot>
  </button>
</template>

<script>
const BUTTON_BASE_CLASS = 'flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded border px-3 py-2 shadow-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)] focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50';

const BUTTON_VARIANT_CLASS = {
  default: 'border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--surface-muted)_85%,var(--border-subtle))] dark:border-[var(--nav-accent)] dark:bg-[var(--nav-accent)] dark:text-white dark:hover:brightness-110',
  accent: 'border-[var(--nav-accent)] bg-[color-mix(in_srgb,var(--nav-accent)_12%,white)] text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--nav-accent)_20%,white)] dark:bg-[var(--nav-accent)] dark:text-white dark:hover:brightness-110',
  preset: 'border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--surface-muted)_85%,var(--border-subtle))] dark:hover:bg-[var(--surface-muted)]',
};

const ICON_BASE_CLASS = 'text-[12px] leading-none text-[var(--nav-accent)]';

export default {
  name: 'ToolbarIconButton',
  props: {
    icon: {
      type: String,
      default: '',
    },
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'accent', 'preset'].includes(value),
    },
    ariaLabel: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    extraClass: {
      type: String,
      default: '',
    },
    extraStyle: {
      type: [String, Object],
      default: null,
    },
  },
  emits: ['click'],
  computed: {
    resolvedTitle() {
      return this.title || this.ariaLabel;
    },
    buttonClass() {
      return `${BUTTON_BASE_CLASS} ${BUTTON_VARIANT_CLASS[this.variant]}`;
    },
    iconClass() {
      if (this.variant === 'preset') {
        return ICON_BASE_CLASS;
      }

      return `${ICON_BASE_CLASS} dark:text-inherit`;
    },
  },
};
</script>

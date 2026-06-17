<template>
  <div
    v-if="visible"
    ref="menuEl"
    class="fixed z-[100] min-w-[168px] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-1 shadow-xl"
    :style="menuStyle"
    @click.stop
  >
    <button
      type="button"
      class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)]"
      @click="$emit('reply')"
    >
      <i class="fas fa-reply w-4 text-xs text-[var(--nav-accent)]" />
      {{ $t('reply') }}
    </button>
    <button
      v-if="canEdit"
      type="button"
      class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)]"
      @click="$emit('edit')"
    >
      <i class="fas fa-pen w-4 text-xs text-[var(--nav-accent)]" />
      {{ $t('edit') }}
    </button>
    <button
      v-if="canDelete"
      type="button"
      class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)]"
      @click="$emit('delete')"
    >
      <i class="fas fa-trash w-4 text-xs" />
      {{ $t('delete') }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'CommentContextMenu',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    menuStyle: {
      type: Object,
      default: () => ({}),
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
    canDelete: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['reply', 'edit', 'delete'],
};
</script>

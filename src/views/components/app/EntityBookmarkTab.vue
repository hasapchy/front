<template>
  <button
    type="button"
    class="entity-share-bookmark__tab"
    :class="variantClass"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :title="title || ariaLabel"
    @click.stop="$emit('click', $event)"
  >
    <span class="entity-share-bookmark__icon">
      <i :class="iconClass" />
    </span>
    <span class="entity-share-bookmark__label">{{ ariaLabel }}</span>
    <span
      v-if="badge"
      class="entity-share-bookmark__badge"
    >
      {{ badge }}
    </span>
  </button>
</template>

<script>
export default {
  props: {
    iconClass: {
      type: String,
      required: true,
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
    badge: {
      type: String,
      default: '',
    },
    variant: {
      type: String,
      default: 'accent',
      validator: (value) => ['accent', 'success', 'danger'].includes(value),
    },
  },
  emits: ['click'],
  computed: {
    variantClass() {
      if (this.variant === 'success') {
        return 'entity-share-bookmark__tab--success';
      }
      if (this.variant === 'danger') {
        return 'entity-share-bookmark__tab--danger';
      }
      return 'entity-share-bookmark__tab--accent';
    },
  },
};
</script>

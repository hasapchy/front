<template>
  <div
    v-if="src || withIconFallback"
    :class="wrapperClass"
    class="inline-flex items-center justify-center shrink-0"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      :class="imgClass"
      :width="width"
      :height="height"
      loading="lazy"
    >
    <span
      v-else-if="withIconFallback"
      v-html="iconHtml"
    />
  </div>
</template>

<script>
import { resolveProductImageSrc } from '@/utils/dtoUtils';
import { defaultProductLineIconHtml } from '@/utils/productLineDisplayUtils';

export default {
  name: 'ProductLineImage',
  props: {
    item: {
      type: Object,
      default: null,
    },
    imgClass: {
      type: String,
      default: 'w-7 h-7 object-cover rounded',
    },
    wrapperClass: {
      type: String,
      default: 'w-7 h-7',
    },
    alt: {
      type: String,
      default: '',
    },
    width: {
      type: [String, Number],
      default: null,
    },
    height: {
      type: [String, Number],
      default: null,
    },
    withIconFallback: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    src() {
      return resolveProductImageSrc(this.item);
    },
    iconHtml() {
      const item = this.item;
      const icons = item?.icons;
      if (typeof icons === 'function') {
        return icons.call(item);
      }
      return defaultProductLineIconHtml(item);
    },
  },
};
</script>

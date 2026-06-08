<template>
  <span
    v-if="photoSrc || showIconWhenNoPhoto"
    class="inline-flex shrink-0 items-center justify-center"
  >
    <img
      v-if="photoSrc"
      :src="photoSrc"
      :alt="displayName"
      class="h-8 w-8 rounded-full object-cover"
      @error="onPhotoError"
    >
    <span
      v-else-if="showIconWhenNoPhoto"
      class="inline-flex h-8 w-8 items-center justify-center"
    >
      <i class="fas fa-user text-sm leading-none text-[var(--nav-accent)]" />
    </span>
  </span>
</template>

<script>
import userPhotoMixin from '@/mixins/userPhotoMixin';
import { getUserDisplayName } from '@/utils/displayUtils';

export default {
    name: 'UserPhotoCell',
    mixins: [userPhotoMixin],
    props: {
        user: {
            type: Object,
            default: null
        },
        showIconWhenNoPhoto: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        photoSrc() {
            return this.getUserPhotoSrc(this.user);
        },
        displayName() {
            return getUserDisplayName(this.user);
        }
    },
    methods: {
        onPhotoError(event) {
            const el = event?.target;
            if (el) {
                el.style.display = 'none';
            }
        }
    }
};
</script>

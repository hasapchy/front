<template>
  <span
    v-if="hasContent"
    class="entity-card__creator"
    :title="displayName"
  >
    <img
      v-if="photoVisible"
      :src="photoSrc"
      alt=""
      class="entity-card__creator-photo"
      loading="lazy"
      @error="onPhotoError"
    >
    <span
      v-else-if="initials"
      class="entity-card__creator-initials"
    >{{ initials }}</span>
  </span>
</template>

<script>
import userPhotoMixin from '@/mixins/userPhotoMixin';
import { getUserDisplayName, getUserInitials } from '@/utils/displayUtils';
import { normalizeUserForCell } from '@/utils/userCellUtils';

export default {
    name: 'EntityCardCreatorAvatar',
    mixins: [userPhotoMixin],
    props: {
        user: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            photoFailed: false,
        };
    },
    computed: {
        normalizedUser() {
            return normalizeUserForCell(this.user) ?? this.user;
        },
        photoSrc() {
            return this.getUserPhotoSrc(this.normalizedUser);
        },
        photoVisible() {
            return Boolean(this.photoSrc) && !this.photoFailed;
        },
        displayName() {
            return getUserDisplayName(this.normalizedUser);
        },
        initials() {
            return getUserInitials(this.normalizedUser);
        },
        hasContent() {
            return this.photoVisible || Boolean(this.initials);
        },
    },
    watch: {
        user() {
            this.photoFailed = false;
        },
        photoSrc() {
            this.photoFailed = false;
        },
    },
    methods: {
        onPhotoError() {
            this.photoFailed = true;
        },
    },
};
</script>

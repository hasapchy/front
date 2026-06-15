<template>
  <span class="inline-flex">
    <span
      v-if="hasContent"
      class="entity-card__creator"
      :class="{ 'entity-card__creator--clickable': canOpenActions }"
      :title="displayName"
      :role="canOpenActions ? 'button' : undefined"
      :tabindex="canOpenActions ? 0 : undefined"
      @click.stop="handleClick"
      @keydown.enter.stop.prevent="handleClick"
      @keydown.space.stop.prevent="handleClick"
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
    <UserActionsModal
      :show="userActionsDialog"
      :user="actionsUser"
      :onclose="closeUserActions"
    />
  </span>
</template>

<script>
import userPhotoMixin from '@/mixins/userPhotoMixin';
import { getUserDisplayName, getUserInitials } from '@/utils/displayUtils';
import { normalizeUserForCell } from '@/utils/userCellUtils';
import UserActionsModal from '@/views/components/app/UserActionsModal.vue';

export default {
    name: 'EntityCardCreatorAvatar',
    components: { UserActionsModal },
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
            userActionsDialog: false,
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
        canOpenActions() {
            return Number(this.normalizedUser?.id) > 0;
        },
        actionsUser() {
            if (!this.canOpenActions) {
                return null;
            }
            return {
                ...this.normalizedUser,
                name: this.displayName || this.normalizedUser?.name || '',
            };
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
        handleClick() {
            if (!this.canOpenActions) {
                return;
            }
            this.userActionsDialog = true;
        },
        closeUserActions() {
            this.userActionsDialog = false;
        },
    },
};
</script>

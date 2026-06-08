<template>
  <CenteredModalDialog
    :show-form="visible"
    :title="$t('participants')"
    overlay-class="z-[130]"
    panel-class="max-w-md"
    :onclose="handleCancel"
  >
    <UserSearch
      :selected-users="draftUserIds"
      :multiple="true"
      :show-label="true"
      :allow-deselect="true"
      :locked-user-ids="lockedUserIds"
      @update:selected-users="draftUserIds = $event"
    />
    <template #footer>
      <PrimaryButton
        :is-light="true"
        :onclick="handleCancel"
      >
        {{ $t('cancel') }}
      </PrimaryButton>
      <PrimaryButton :onclick="handleDone">
        {{ $t('done') }}
      </PrimaryButton>
    </template>
  </CenteredModalDialog>
</template>

<script>
import CenteredModalDialog from '@/views/components/app/dialog/CenteredModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';

export default {
  name: 'ProjectParticipantsDialog',
  components: {
    CenteredModalDialog,
    PrimaryButton,
    UserSearch,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    selectedUserIds: {
      type: Array,
      default: () => [],
    },
    lockedUserIds: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:selectedUserIds', 'close'],
  data() {
    return {
      draftUserIds: [],
    };
  },
  watch: {
    visible: {
      handler(value) {
        if (value) {
          this.draftUserIds = [...this.selectedUserIds];
        }
      },
      immediate: true,
    },
  },
  methods: {
    handleCancel() {
      this.$emit('close');
    },
    handleDone() {
      this.$emit('update:selectedUserIds', this.draftUserIds);
      this.$emit('close');
    },
  },
};
</script>

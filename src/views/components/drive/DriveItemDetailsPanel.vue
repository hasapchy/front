<template>
  <SideModalDialog
    :show-form="visible"
    :title="$t('details')"
    :onclose="handleClose"
    :close-on-escape="true"
  >
    <div class="space-y-3 p-4 text-sm">
      <div class="rounded-lg border border-gray-200 p-3">
        <strong>{{ $t('name') }}:</strong> {{ item?.name || '-' }}
      </div>
      <div class="rounded-lg border border-gray-200 p-3">
        <strong>{{ $t('type') }}:</strong> {{ type === 'folder' ? $t('folder') : (item?.mime_type || item?.mimeType || '-') }}
      </div>
      <div class="rounded-lg border border-gray-200 p-3">
        <strong>{{ $t('createdBy') }}:</strong> {{ creatorLabel }}
      </div>
      <div class="rounded-lg border border-gray-200 p-3">
        <strong>{{ $t('createdAt') }}:</strong> {{ createdAtLabel }}
      </div>
      <div
        v-if="type === 'file'"
        class="rounded-lg border border-gray-200 p-3"
      >
        <strong>{{ $t('size') }}:</strong> {{ sizeLabel }}
      </div>
    </div>
  </SideModalDialog>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import DriveFolderDto from '@/dto/drive/DriveFolderDto';
import DriveFileDto from '@/dto/drive/DriveFileDto';

export default {
  name: 'DriveItemDetailsPanel',
  components: {
    SideModalDialog,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: null,
    },
    item: {
      type: Object,
      default: null,
    },
  },
  emits: ['close'],
  methods: {
    handleClose() {
      this.$emit('close');
    },
  },
  computed: {
    dto() {
      if (!this.item) {
        return null;
      }
      if (this.type === 'folder') {
        return this.item instanceof DriveFolderDto ? this.item : DriveFolderDto.fromApi(this.item);
      }
      return this.item instanceof DriveFileDto ? this.item : DriveFileDto.fromApi(this.item);
    },
    creatorLabel() {
      return this.dto?.creatorDisplayName?.() ?? '-';
    },
    createdAtLabel() {
      return this.dto?.formatCreatedAt?.() ?? '-';
    },
    sizeLabel() {
      return this.dto?.formatSize?.() ?? '-';
    },
  },
};
</script>

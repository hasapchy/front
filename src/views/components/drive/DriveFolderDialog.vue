<template>
  <CenteredModalDialog
    :show-form="visible"
    :title="dialogTitle"
    :onclose="$emit('close')"
  >
    <div
      v-if="folderDialog.resourceType === 'file' && folderDialog.fileExtension"
      class="flex items-center gap-1"
    >
      <input
        :value="folderDialog.name"
        class="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2"
        :placeholder="$t('fileName')"
        @input="updateName($event.target.value)"
        @keyup.enter="$emit('save')"
      >
      <span class="shrink-0 text-sm text-gray-500">.{{ folderDialog.fileExtension }}</span>
    </div>
    <input
      v-else
      :value="folderDialog.name"
      class="w-full rounded border border-gray-300 px-3 py-2"
      :placeholder="folderDialog.resourceType === 'file' ? $t('fileName') : $t('folderName')"
      @input="updateName($event.target.value)"
      @keyup.enter="$emit('save')"
    >
    <div v-if="folderDialog.resourceType === 'folder'" class="mt-4 space-y-4">
      <div>
        <label>{{ $t('folderIcon') }}</label>
        <button
          type="button"
          class="mt-1.5 flex w-full items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:hover:bg-[var(--surface-muted)]"
          @click.stop="$emit('toggle-icon-picker')"
        >
          <i
            :class="[folderDialog.icon, 'text-3xl']"
            :style="{ color: folderDialog.iconColor }"
          />
          <span class="text-sm text-gray-600 dark:text-[var(--text-secondary)]">
            {{ $t('chooseFolderIcon') }}
          </span>
        </button>
        <div
          v-if="iconPickerVisible"
          class="mt-2 grid max-h-48 grid-cols-4 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-[var(--border-subtle)]"
        >
          <button
            v-for="item in folderIconOptions"
            :key="item.value"
            type="button"
            class="flex h-12 items-center justify-center rounded-lg border transition-colors"
            :class="folderDialog.icon === item.value
              ? 'border-[var(--label-accent)] bg-[color-mix(in_srgb,var(--label-accent)_12%,transparent)]'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:hover:bg-[var(--surface-muted)]'"
            @click="$emit('select-icon', item.value)"
          >
            <i
              :class="[item.value, 'text-xl']"
              :style="{ color: folderDialog.iconColor }"
            />
          </button>
        </div>
      </div>
      <div>
        <label>{{ $t('folderIconColor') }}</label>
        <div class="mt-1.5 flex flex-wrap gap-2">
          <button
            v-for="color in folderIconColors"
            :key="color"
            type="button"
            class="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
            :class="folderDialog.iconColor === color ? 'border-gray-900 dark:border-white' : 'border-transparent'"
            :style="{ backgroundColor: color }"
            :title="color"
            @click="$emit('update-icon-color', color)"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <PrimaryButton :is-light="true" :onclick="() => $emit('close')">
        {{ $t('cancel') }}
      </PrimaryButton>
      <PrimaryButton :onclick="() => $emit('save')">
        {{ $t('save') }}
      </PrimaryButton>
    </template>
  </CenteredModalDialog>
</template>

<script>
import CenteredModalDialog from '@/views/components/app/dialog/CenteredModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';

export default {
  name: 'DriveFolderDialog',
  components: {
    CenteredModalDialog,
    PrimaryButton,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    iconPickerVisible: {
      type: Boolean,
      default: false,
    },
    folderDialog: {
      type: Object,
      required: true,
    },
    dialogTitle: {
      type: String,
      default: '',
    },
    folderIconOptions: {
      type: Array,
      default: () => [],
    },
    folderIconColors: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['close', 'save', 'toggle-icon-picker', 'select-icon', 'update-name', 'update-icon-color'],
  methods: {
    updateName(value) {
      this.$emit('update-name', value);
    },
  },
};
</script>

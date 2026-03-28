<template>
  <div class="flex gap-2">
    <template
      v-for="(action, index) in batchActions"
      :key="index"
    >
      <StatusSelectCell
        v-if="showStatusSelect && action.render"
        :id="null"
        :value="null"
        :statuses="statuses"
        :on-change="(newStatusId) => handleChangeStatus(selectedIds, newStatusId)"
        :placeholder="$t('changeStatus')"
      />
      <PrimaryButton
        v-else
        :icon="action.icon"
        :is-danger="action.type === 'danger'"
        :is-info="action.type === 'info'"
        :is-light="action.type === 'light'"
        :is-full="action.isFull"
        :disabled="!!action.disabled"
        :aria-label="action.ariaLabel || action.label"
        @click="() => action.action(selectedIds)"
      >
        <span v-if="action.label">{{ action.label }}</span>
      </PrimaryButton>
    </template>
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import StatusSelectCell from './StatusSelectCell.vue';

export default {
    components: { PrimaryButton, StatusSelectCell },
    props: {
        selectedIds: Array,
        batchActions: Array,
        statuses: Array,
        handleChangeStatus: Function,
        showStatusSelect: { type: Boolean, default: false },
    },
};
</script>

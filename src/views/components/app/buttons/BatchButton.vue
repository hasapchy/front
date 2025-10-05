<template>
    <div class="flex flex-col gap-2 mb-1 mt-3">
        <div class="flex gap-2">
            <template v-for="(action, index) in batchActions" :key="index">
                <StatusSelectCell v-if="showStatusSelect && action.render" :id="null" :value="null" :statuses="statuses"
                    :onChange="(newStatusId) => handleChangeStatus(selectedIds, newStatusId)" />
                <PrimaryButton v-else :icon="action.icon" :isDanger="action.type === 'danger'"
                    :isInfo="action.type === 'info'" :isLight="action.type === 'light'" :isFull="action.isFull"
                    @click="() => action.action(selectedIds)" :disabled="!!action.disabled">
                </PrimaryButton>
            </template>
        </div>
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

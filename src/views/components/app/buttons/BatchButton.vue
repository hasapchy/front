<template>
    <div class="flex gap-2 mb-3">
        <PrimaryButton v-for="action in batchActions" :key="action.label" :icon="action.icon"
            :isDanger="action.type === 'danger'" :isInfo="action.type === 'info'" :isLight="action.type === 'light'"
            :isFull="action.isFull" @click="() => action.action(selectedIds)" :disabled="!!action.disabled">
            {{ action.label }}
        </PrimaryButton>
    </div>
</template>
<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';

export default {
    components: { PrimaryButton },
    props: {
        selectedIds: { type: Array, required: true },
        batchActions: { type: Array, required: true },
    },
}
</script>

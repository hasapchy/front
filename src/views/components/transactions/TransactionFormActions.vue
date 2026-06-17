<template>
  <div class="flex flex-wrap gap-2">
    <PrimaryButton
      icon="fas fa-save"
      :onclick="handleSave"
      :is-loading="saveLoading"
      :disabled="isDeletedTransaction || isTransferTransaction || !hasSavePermission"
      :aria-label="$t('save')"
    />
    <PrimaryButton
      v-if="editingItemId != null"
      :onclick="handleDelete"
      :is-danger="true"
      :is-loading="deleteLoading"
      icon="fas fa-trash"
      :disabled="isDeletedTransaction || isTransferTransaction || !hasDeletePermission"
    />
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';

export default {
    name: 'TransactionFormActions',
    components: { PrimaryButton },
    props: {
        editingItemId: { type: [String, Number], default: null },
        isDeletedTransaction: { type: Boolean, default: false },
        isTransferTransaction: { type: Boolean, default: false },
        saveLoading: { type: Boolean, default: false },
        deleteLoading: { type: Boolean, default: false },
    },
    emits: ['save', 'delete'],
    computed: {
        hasDeletePermission() {
            return this.$store.getters.hasPermission('transactions_delete');
        },
        hasSavePermission() {
            if (this.editingItemId != null) {
                return this.$store.getters.hasPermission('transactions_update');
            }
            return this.$store.getters.hasPermission('transactions_create');
        },
    },
    methods: {
        handleSave() {
            this.$emit('save');
        },
        handleDelete() {
            this.$emit('delete');
        },
    }
}
</script>


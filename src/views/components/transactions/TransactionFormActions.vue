<template>
    <div class="p-4 flex flex-wrap gap-2 bg-[#edf4fb] rounded">
        <PrimaryButton icon="fas fa-save" :onclick="handleSave" :is-loading="saveLoading"
            :disabled="isDeletedTransaction || isTransferTransaction || !hasSavePermission" :aria-label="$t('save')">
        </PrimaryButton>
        <PrimaryButton v-if="showTemplatesButton" :onclick="handleOpenTemplates" icon="fas fa-clone"
            :aria-label="$t('transactionTemplates')">
            {{ $t('transactionTemplates') }}
        </PrimaryButton>
        <PrimaryButton v-if="editingItemId != null" :onclick="handleDelete" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="isDeletedTransaction || isTransferTransaction || !hasDeletePermission">
        </PrimaryButton>
        <PrimaryButton v-if="editingItemId != null" :onclick="handleCopy" icon="fas fa-copy" :aria-label="$t('copyTransaction')"
            :disabled="isDeletedTransaction || isTransferTransaction || !hasCreatePermission">
        </PrimaryButton>
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
        showTemplatesButton: { type: Boolean, default: false },
    },
    emits: ['save', 'delete', 'copy', 'open-templates'],
    computed: {
        hasDeletePermission() {
            return this.$store.getters.hasPermission('transactions_delete');
        },
        hasCreatePermission() {
            return this.$store.getters.hasPermission('transactions_create');
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
        handleCopy() {
            this.$emit('copy');
        },
        handleOpenTemplates() {
            this.$emit('open-templates');
        },
    }
}
</script>


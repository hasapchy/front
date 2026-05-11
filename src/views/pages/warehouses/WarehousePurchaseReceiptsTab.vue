<template>
  <div>
    <DraggableTable
      table-key="warehouse.purchase.receipts"
      :columns-config="columnsConfig"
      :table-data="receipts || []"
      :item-mapper="itemMapper"
      :on-item-click="() => {}"
    >
      <template #tableSettingsAdditional>
        <PrimaryButton
          icon="fas fa-plus"
          :onclick="openCreateModal"
          :is-small="true"
          :disabled="!canCreateReceipt"
          :aria-label="$t('createReceipt')"
        />
      </template>
    </DraggableTable>

    <SideModalDialog
      :show-form="receiptModal"
      :title="$t('receipt')"
      :onclose="closeCreateModal"
      :level="3"
    >
      <WarehousesReceiptCreatePage
        v-if="receiptModal"
        :purchase-context="receiptCreateContext"
        @saved="handleSaved"
        @saved-error="$emit('error', $event)"
        @close-request="closeCreateModal"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import WarehousesReceiptCreatePage from '@/views/pages/warehouses/WarehousesReceiptCreatePage.vue';
import { formatDatabaseDateTime } from '@/utils/dateUtils';

export default {
    components: {
        DraggableTable,
        PrimaryButton,
        SideModalDialog,
        WarehousesReceiptCreatePage,
    },
    props: {
        receipts: { type: Array, default: () => [] },
        canCreateReceipt: { type: Boolean, default: false },
        receiptCreateContext: { type: Object, default: null },
    },
    emits: ['receipt-saved', 'error'],
    data() {
        return {
            receiptModal: false,
        };
    },
    computed: {
        columnsConfig() {
            return [
                { name: 'id', label: this.$t('number'), size: 60 },
                { name: 'status', label: this.$t('status') },
                { name: 'dateUser', label: this.$t('dateUser') },
                { name: 'amount', label: this.$t('amount') },
            ];
        },
    },
    methods: {
        openCreateModal() {
            if (!this.canCreateReceipt) {
                return;
            }
            this.receiptModal = true;
        },
        closeCreateModal() {
            this.receiptModal = false;
        },
        handleSaved(payload) {
            this.receiptModal = false;
            this.$emit('receipt-saved', payload);
        },
        receiptStatusLabel(status) {
            const labels = {
                draft: this.$t('receiptStatusDraft'),
                completed: this.$t('receiptStatusCompleted'),
            };
            return labels[status] || this.$t('receiptStatusDraft');
        },
        itemMapper(item, column) {
            switch (column) {
                case 'status':
                    return this.receiptStatusLabel(item?.status);
                case 'dateUser': {
                    const date = item?.date ? formatDatabaseDateTime(item.date) : '-';
                    return `${date} / ${item?.creator?.name || '-'}`;
                }
                case 'amount':
                    return item?.amount ?? '-';
                default:
                    return item?.[column] ?? '-';
            }
        },
    },
};
</script>

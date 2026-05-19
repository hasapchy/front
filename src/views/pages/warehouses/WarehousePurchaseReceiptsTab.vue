<template>
  <div>
    <DraggableTable
      table-key="warehouse.purchase.receipts"
      :columns-config="columnsConfig"
      :table-data="receipts || []"
      :item-mapper="itemMapper"
      highlight-draft-rows
      :on-item-click="editReceipt"
    >
      <template #tableSettingsAdditional>
        <div class="flex items-center gap-2">
          <PrimaryButton
            icon="fas fa-plus"
            :onclick="openCreateModal"
            :is-small="true"
            :disabled="!canCreateReceipt"
            :aria-label="$t('createReceipt')"
          />
          <FieldHint
            :text="$t('purchaseReceiptCreateHint')"
            placement="top"
          />
        </div>
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
        :editing-item="editingReceiptItem"
        :purchase-context="editingReceiptItem ? null : receiptCreateContext"
        @saved="handleSaved"
        @saved-error="$emit('error', $event)"
        @close-request="closeCreateModal"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import WarehousesReceiptCreatePage from '@/views/pages/warehouses/WarehousesReceiptCreatePage.vue';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import { createWarehouseDocumentStatusConfig, warehouseStatusLabel } from '@/utils/warehouseDocumentStatusSelect';

export default {
    components: {
        DraggableTable,
        FieldHint,
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
            editingReceiptItem: null,
        };
    },
    computed: {
        receiptStatusConfig() {
            return createWarehouseDocumentStatusConfig([
                ['draft', 'receiptStatusDraft'],
                ['completed', 'receiptStatusCompleted'],
            ], this.$t.bind(this));
        },
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
            this.editingReceiptItem = null;
            this.receiptModal = true;
        },
        closeCreateModal() {
            this.receiptModal = false;
            this.editingReceiptItem = null;
        },
        async editReceipt(item) {
            if (!item?.id) {
                return;
            }
            try {
                this.editingReceiptItem = await WarehouseReceiptController.getItem(item.id);
                this.receiptModal = true;
            } catch (error) {
                this.$emit('error', error);
            }
        },
        handleSaved(payload) {
            this.receiptModal = false;
            this.editingReceiptItem = null;
            this.$emit('receipt-saved', payload);
        },
        itemMapper(item, column) {
            switch (column) {
                case 'status':
                    return warehouseStatusLabel(this.receiptStatusConfig.options, item?.status);
                case 'dateUser':
                    return typeof item?.formatDateUser === 'function' ? item.formatDateUser() : '-';
                case 'amount':
                    return item?.amount ?? '-';
                default:
                    return item?.[column] ?? '-';
            }
        },
    },
};
</script>

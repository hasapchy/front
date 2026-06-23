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
      <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
        <TableControlsBar
          :reset-columns="resetColumns"
          :columns="columns"
          :toggle-visible="toggleVisible"
          :log="log"
        >
          <template #left>
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
          <template #gear="gearProps">
            <TableColumnsGearMenuWithDateModes
              v-bind="gearProps"
              table-columns-persist-key="warehouse.purchase.receipts"
            />
          </template>
        </TableControlsBar>
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
        :purchase-context="modalPurchaseContext"
        @saved="handleSaved"
        @saved-error="$emit('error', $event)"
        @close-request="closeCreateModal"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableColumnsGearMenuWithDateModes from '@/views/components/app/forms/TableColumnsGearMenuWithDateModes.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import WarehousesReceiptCreatePage from '@/views/pages/warehouses/WarehousesReceiptCreatePage.vue';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import { createWarehouseDocumentStatusConfig, warehouseStatusLabel } from '@/utils/warehouseDocumentStatusSelect';
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import { buildDateUserCellProps } from '@/utils/userCellUtils';
import { markRaw } from 'vue';
export default {
    components: {
        DraggableTable,
        TableControlsBar,
        TableColumnsGearMenuWithDateModes,
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
                ['approved', 'purchaseStatusApproved'],
                ['completed', 'receiptStatusCompleted'],
            ], this.$t.bind(this));
        },
        modalPurchaseContext() {
            const ctx = this.receiptCreateContext;
            if (!ctx?.purchaseId) {
                return null;
            }
            if (!this.editingReceiptItem) {
                return ctx;
            }
            const catalog = [...(ctx.catalog || [])];
            const caps = { ...ctx.caps };
            for (const line of this.editingReceiptItem.products || []) {
                const productId = Number(line.productId);
                if (!productId) {
                    continue;
                }
                const qty = Number(line.quantity) || 0;
                caps[productId] = (caps[productId] ?? 0) + qty;
                if (!catalog.some((p) => Number(p.id) === productId)) {
                    catalog.push({
                        id: productId,
                        name: line.productName,
                        type: 1,
                        purchasePrice: line.price,
                        retailPrice: line.price,
                    });
                }
            }
            return { ...ctx, catalog, caps };
        },
        columnsConfig() {
            return [
                { name: 'id', label: this.$t('number'), size: 60 },
                { name: 'status', label: this.$t('status') },
                {
                    name: 'dateUser',
                    label: this.$t('dateUser'),
                    type: 'datetime',
                    component: markRaw(DateUserCell),
                    props: (item, column) => buildDateUserCellProps(item, '', column?.dateDisplayMode),
                },
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

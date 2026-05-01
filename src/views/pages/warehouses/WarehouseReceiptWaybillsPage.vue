<template>
  <div>
    <div
      v-if="!receiptId"
      class="p-4 text-gray-500"
    >
      {{ $t('saveReceiptFirstForWaybills') }}
    </div>
    <transition
      v-else
      name="fade"
      mode="out-in"
    >
      <div
        v-if="!loading"
        key="table"
      >
        <DraggableTable
          table-key="warehouse.receipt.waybills"
          :columns-config="columnsConfig"
          :table-data="waybills"
          :item-mapper="itemMapper"
          :on-item-click="canEditWaybills ? openEditModal : null"
        >
          <template #tableSettingsAdditional>
            <PrimaryButton
              v-if="canEditWaybills"
              icon="fas fa-plus"
              :is-small="true"
              :disabled="!hasReceiptProductLines"
              :onclick="openCreateModal"
              :aria-label="$t('createWaybill')"
            />
          </template>
        </DraggableTable>
      </div>
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </transition>

    <SideModalDialog
      :show-form="modalOpen"
      :title="waybillModalTitle"
      :onclose="closeModal"
      :level="3"
    >
      <WarehouseReceiptWaybillCreatePage
        v-if="modalOpen && receiptId"
        :receipt-id="receiptId"
        :warehouse-id="warehouseId"
        :editing-waybill="modalEditingWaybill"
        @saved="handleSaved"
        @saved-error="handleSavedError"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import WarehouseReceiptWaybillCreatePage from '@/views/pages/warehouses/WarehouseReceiptWaybillCreatePage.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';

export default {
    components: {
        PrimaryButton,
        DraggableTable,
        SideModalDialog,
        WarehouseReceiptWaybillCreatePage,
        TableSkeleton,
    },
    props: {
        receiptId: { type: [Number, String], default: null },
        warehouseId: { type: [Number, String], default: null },
        canEditWaybills: { type: Boolean, default: false },
    },
    emits: ['changed'],
    data() {
        return {
            waybills: [],
            loading: false,
            modalOpen: false,
            modalEditingWaybill: null,
            allowedWaybillLineCount: 0,
        };
    },
    computed: {
        hasReceiptProductLines() {
            return this.allowedWaybillLineCount > 0;
        },
        columnsConfig() {
            return [
                { name: 'id', label: 'number', size: 60 },
                { name: 'dateDisplay', label: 'date' },
                { name: 'waybillNumber', label: 'waybillDocumentNumber' },
                { name: 'linesSummary', label: 'products' },
            ];
        },
        waybillModalTitle() {
            if (!this.modalOpen) {
                return '';
            }
            return this.modalEditingWaybill ? this.$t('editWaybill') : this.$t('createWaybill');
        },
    },
    watch: {
        receiptId: {
            handler() {
                this.load();
            },
            immediate: true,
        },
    },
    methods: {
        formatWaybillDate(d) {
            if (!d) {
                return '';
            }
            return String(d).replace('T', ' ').slice(0, 16);
        },
        itemMapper(item, col) {
            if (col === 'dateDisplay') {
                return this.formatWaybillDate(item.date);
            }
            if (col === 'waybillNumber') {
                return item.number || '—';
            }
            if (col === 'linesSummary') {
                return this.linesSummary(item);
            }
            return item[col];
        },
        linesSummary(item) {
            const lines = item.lines || [];
            if (!lines.length) {
                return '—';
            }
            return lines.map((l) => {
                const name = l.product?.name || (`#${l.product_id}`);
                return `${name}: ${l.quantity}×${l.price}`;
            }).join('; ');
        },
        async load() {
            if (!this.receiptId) {
                this.waybills = [];
                this.allowedWaybillLineCount = 0;
                return;
            }
            this.loading = true;
            try {
                const [rows, allowed] = await Promise.all([
                    WarehouseReceiptController.getWaybills(this.receiptId),
                    WarehouseReceiptController.getWaybillAllowedLines(this.receiptId, null),
                ]);
                this.waybills = Array.isArray(rows) ? rows : [];
                this.allowedWaybillLineCount = Array.isArray(allowed?.lines) ? allowed.lines.length : 0;
            } catch {
                this.waybills = [];
                this.allowedWaybillLineCount = 0;
            } finally {
                this.loading = false;
            }
        },
        openCreateModal() {
            this.modalEditingWaybill = null;
            this.modalOpen = true;
        },
        openEditModal(row) {
            this.modalEditingWaybill = row;
            this.modalOpen = true;
        },
        closeModal() {
            this.modalOpen = false;
            this.modalEditingWaybill = null;
        },
        async handleSaved() {
            this.$store.dispatch('showNotification', { title: this.$t('success'), isSuccess: true });
            this.closeModal();
            await this.load();
            this.$emit('changed');
        },
        handleSavedError(msg) {
            const text = Array.isArray(msg) ? msg.join(', ') : (msg || this.$t('error'));
            this.$store.dispatch('showNotification', {
                title: this.$t('error'),
                subtitle: text,
                isDanger: true,
            });
        },
    },
};
</script>

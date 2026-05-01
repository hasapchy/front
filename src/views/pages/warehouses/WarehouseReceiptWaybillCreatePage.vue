<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
      <div>
        <label>{{ $t('date') }}</label>
        <input
          v-model="formDate"
          type="datetime-local"
          class="w-full border rounded p-2"
        >
      </div>
      <div>
        <label>{{ $t('number') }}</label>
        <input
          v-model="formNumber"
          type="text"
          class="w-full border rounded p-2"
        >
      </div>
      <div>
        <label>{{ $t('note') }}</label>
        <input
          v-model="formNote"
          type="text"
          class="w-full border rounded p-2"
        >
      </div>
      <ProductSearch
        v-model="formLines"
        :show-quantity="true"
        :show-price="true"
        :is-receipt="true"
        :only-products="true"
        :warehouse-id="allowedApiLines.length ? null : warehouseId"
        :allow-all-warehouse-products="false"
        :receipt-waybill-catalog-products="receiptWaybillCatalogProducts"
        :waybill-remaining-cap-by-product-id="waybillRemainingCapByProductId"
        required
      />
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingWaybillId"
          icon="fas fa-trash"
          :is-danger="true"
          :onclick="removeWaybill"
          :is-loading="activeAction === 'delete'"
          :aria-label="$t('delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="submitForm"
          :is-loading="activeAction === 'save'"
          :aria-label="$t('save')"
        />
      </div>
    </teleport>
  </div>
</template>

<script>
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import ProductDto from '@/dto/product/ProductDto';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';

export default {
    components: { PrimaryButton, ProductSearch },
    mixins: [sideModalFooterPortal, getApiErrorMessage],
    props: {
        receiptId: { type: [Number, String], default: null },
        warehouseId: { type: [Number, String], default: null },
        editingWaybill: { type: Object, default: null },
    },
    emits: ['saved', 'saved-error'],
    data() {
        return {
            formDate: '',
            formNumber: '',
            formNote: '',
            formLines: [],
            activeAction: null,
            allowedApiLines: [],
        };
    },
    computed: {
        editingWaybillId() {
            return this.editingWaybill?.id ?? null;
        },
        waybillRemainingCapByProductId() {
            const caps = {};
            for (const row of this.allowedApiLines) {
                const pid = Number(row.product_id);
                caps[pid] = Number(row.max_quantity) || 0;
            }
            return caps;
        },
        receiptWaybillCatalogProducts() {
            return this.allowedApiLines.map((row) => {
                const pid = Number(row.product_id);
                const remaining = Number(row.max_quantity) || 0;
                return new ProductDto({
                    id: pid,
                    type: 1,
                    name: row.product_name,
                    description: '',
                    sku: '',
                    image: row.product_image,
                    category_id: null,
                    category_name: '',
                    categories: [],
                    stock_quantity: Math.max(0, remaining),
                    unit_id: row.unit_id,
                    unit_name: row.unit_name,
                    unit_short_name: row.unit_short_name,
                    barcode: null,
                    is_serialized: false,
                    date: null,
                    creator: null,
                    created_at: null,
                    updated_at: null,
                    retail_price: Number(row.default_price) || 0,
                    wholesale_price: 0,
                    purchase_price: Number(row.default_price) || 0,
                });
            });
        },
    },
    watch: {
        receiptId: {
            immediate: true,
            handler: 'loadWaybillAllowedCatalogAndSync',
        },
        editingWaybill: 'loadWaybillAllowedCatalogAndSync',
    },
    methods: {
        async loadWaybillAllowedCatalogAndSync() {
            await this.loadWaybillAllowedCatalog();
            this.syncFromEditing();
        },
        async loadWaybillAllowedCatalog() {
            if (!this.receiptId) {
                this.allowedApiLines = [];
                return;
            }
            try {
                const data = await WarehouseReceiptController.getWaybillAllowedLines(
                    this.receiptId,
                    this.editingWaybillId
                );
                this.allowedApiLines = Array.isArray(data?.lines) ? data.lines : [];
            } catch {
                this.allowedApiLines = [];
            }
        },
        syncFromEditing() {
            if (this.editingWaybill) {
                const wb = this.editingWaybill;
                this.formDate = wb.date ? String(wb.date).slice(0, 16) : this.localDateTimeNow();
                this.formNumber = wb.number || '';
                this.formNote = wb.note || '';
                this.formLines = (wb.lines || []).map((l) => ({
                    productId: l.product_id,
                    quantity: l.quantity,
                    price: l.price,
                    product: l.product,
                }));
                return;
            }
            this.formDate = this.localDateTimeNow();
            this.formNumber = '';
            this.formNote = '';
            this.formLines = [];
        },
        localDateTimeNow() {
            const d = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        },
        async submitForm() {
            if (!this.formLines?.length) {
                this.$emit('saved-error', this.$t('addProducts'));
                return;
            }
            const lines = this.formLines.map((p) => ({
                product_id: p.productId,
                quantity: Number(p.quantity),
                price: Number(p.price),
            }));
            const payload = {
                date: this.formDate,
                number: this.formNumber || null,
                note: this.formNote || null,
                lines,
            };
            this.activeAction = 'save';
            try {
                if (this.editingWaybillId) {
                    await WarehouseReceiptController.updateWaybill(this.receiptId, this.editingWaybillId, payload);
                } else {
                    await WarehouseReceiptController.storeWaybill(this.receiptId, payload);
                }
                this.$emit('saved');
            } catch (e) {
                this.$emit('saved-error', this.getApiErrorMessage(e));
            } finally {
                this.activeAction = null;
            }
        },
        async removeWaybill() {
            if (!window.confirm(this.$t('confirmDelete'))) {
                return;
            }
            this.activeAction = 'delete';
            try {
                await WarehouseReceiptController.deleteWaybill(this.receiptId, this.editingWaybillId);
                this.$emit('saved');
            } catch (e) {
                this.$emit('saved-error', this.getApiErrorMessage(e));
            } finally {
                this.activeAction = null;
            }
        },
    },
};
</script>

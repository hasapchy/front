<template>
  <div class="flex justify-center">
    <div
      v-if="sourceType && sourceId && !isSalary" 
      class="flex min-h-full w-full cursor-pointer items-center justify-center gap-2 rounded text-[#2a6496] hover:underline dark:text-white dark:hover:text-white dark:hover:opacity-90"
      @dblclick.stop="openSourceModal"
    >
      <span :class="iconPillClass">
        <i :class="[iconClass, 'text-sm leading-none']" />
      </span>
      <span v-html="displayText" />
    </div>
    <div
      v-else
      class="flex min-h-full w-full items-center justify-center gap-2"
    >
      <span :class="iconPillClass">
        <i :class="[iconClass, 'text-sm leading-none']" />
      </span>
      <span :class="sourceInfo.color">{{ displayText }}</span>
    </div>

    <component 
      :is="modalComponent" 
      v-if="modalOpen && modalComponent" 
      :show-form="modalOpen" 
      :title="sourceDetailModalTitle"
      :level="3"
      :onclose="() => modalOpen = false"
    >
      <component 
        :is="modalContentComponent"
        v-if="editingItem"
        :editing-item="editingItem"
        :project-id="editingItem?.projectId || null"
        @saved="handleSaved" 
        @saved-error="() => modalOpen = false" 
        @deleted="handleDeleted" 
        @close-request="() => modalOpen = false"
      />
    </component>
  </div>
</template>

<script>
import { markRaw } from 'vue';
import { highlightMatches } from '@/utils/searchUtils';
import SideModalDialog, { sideModalCrudTitle } from '@/views/components/app/dialog/SideModalDialog.vue';
import SaleController from '@/api/SaleController';
import OrderController from '@/api/OrderController';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import WarehouseWriteoffController from '@/api/WarehouseWriteoffController';
import WarehousePurchaseController from '@/api/WarehousePurchaseController';
import TransactionController from '@/api/TransactionController';
import ProjectContractController from '@/api/ProjectContractController';
import { getSourceDisplayText, getSourceKind } from '@/utils/transactionSourceUtils';

export default {
    props: {
        sourceType: String,
        sourceId: Number,
        source: {
            type: String,
            default: null
        },
        searchQuery: {
            type: String,
            default: ''
        },
        onUpdated: Function,
        onDeleted: Function
    },
    emits: ['updated', 'deleted', 'error'],
    data() {
        return {
            modalOpen: false,
            editingItem: null,
            loading: false,
            modalComponent: null,  // Динамический компонент модального окна
            modalContentComponent: null  // Динамический компонент содержимого
        };
    },
    computed: {
        iconPillClass() {
            return 'inline-flex shrink-0 items-center justify-center rounded-md border-2 border-transparent dark:h-6 dark:w-6 dark:rounded-full dark:border-0 dark:bg-white';
        },
        isSalary() {
            return this.sourceType && this.sourceType.includes('EmployeeSalary');
        },
        normalizedSource() {
            return getSourceKind(this.sourceType, this.source);
        },
        sourceMap() {
            return {
                'sale': { icon: 'fa-shopping-cart', color: 'text-[#5CB85C]', text: 'Продажа' },
                'order': { icon: 'fa-clipboard-list', color: 'text-[#337AB7]', text: 'Заказ' },
                'receipt': { icon: 'fa-box', color: 'text-[#FFA500]', text: 'Оприходование' },
                'wh_receipt': { icon: 'fa-box', color: 'text-[#FFA500]', text: 'Оприходование' },
                'writeoff': { icon: 'fa-box-open', color: 'text-[#EE4F47]', text: this.$t('writeoff') },
                'purchase': { icon: 'fa-cart-plus', color: 'text-[#337AB7]', text: this.$t('purchases') },
                'salary': { icon: 'fa-money-bill-wave', color: 'text-[#28A745]', text: 'Зарплата' },
                'contract': { icon: 'fa-file-contract', color: 'text-[#337AB7]', text: this.$t('contract') },
                'transaction': { icon: 'fa-money-bill-transfer', color: 'text-[#6C757D]', text: this.$t('transaction') }
            };
        },
        sourceInfo() {
            return this.sourceMap[this.normalizedSource] || this.sourceMap['transaction'];
        },
        sourceDetailModalTitle() {
            if (!this.modalOpen || !this.editingItem) {
                return '';
            }
            const t = this.$t.bind(this);
            const item = this.editingItem;
            const st = this.sourceType || '';
            if (st.includes('Sale')) {
                return sideModalCrudTitle(t, {
                    item,
                    entityGenitiveKey: 'sideModalGenSale',
                    entityNominativeKey: 'sideModalNomSale',
                });
            }
            if (st.includes('Order')) {
                return sideModalCrudTitle(t, {
                    item,
                    entityGenitiveKey: 'sideModalGenOrder',
                    entityNominativeKey: 'sideModalNomOrder',
                });
            }
            if (st.includes('WhReceipt') || st.includes('WarehouseReceipt')) {
                return sideModalCrudTitle(t, {
                    item,
                    entityGenitiveKey: 'sideModalGenReceipt',
                    entityNominativeKey: 'sideModalNomReceipt',
                });
            }
            if (st.includes('WhWriteoff') || st.includes('WarehouseWriteoff')) {
                return sideModalCrudTitle(t, {
                    item,
                    entityGenitiveKey: 'sideModalGenWriteoff',
                    entityNominativeKey: 'sideModalNomWriteoff',
                });
            }
            if (st.includes('WhPurchase') || st.includes('WarehousePurchase')) {
                return `${this.$t('purchases')} #${item?.id ?? this.sourceId}`;
            }
            if (st.includes('ProjectContract')) {
                return sideModalCrudTitle(t, {
                    item,
                    entityGenitiveKey: 'sideModalGenContract',
                    entityNominativeKey: 'sideModalNomContract',
                    getName: (c) => c?.number || c?.name || '',
                });
            }
            if (st.includes('Transaction')) {
                return sideModalCrudTitle(t, {
                    item,
                    entityGenitiveKey: 'sideModalGenTransaction',
                    entityNominativeKey: 'sideModalNomTransaction',
                    getName: (tr) => String(tr?.note ?? tr?.description ?? tr?.title ?? '').trim(),
                });
            }
            return '';
        },
        iconClass() {
            if (this.sourceType && this.sourceId) {
                if (this.normalizedSource === 'sale') {
                    return 'fas fa-shopping-cart text-[#5CB85C]';
                } else if (this.normalizedSource === 'order') {
                    return 'fas fa-file-invoice text-[#337AB7]';
                } else if (this.normalizedSource === 'receipt') {
                    return 'fas fa-box text-[#FFA500]';
                } else if (this.normalizedSource === 'writeoff') {
                    return 'fas fa-box-open text-[#EE4F47]';
                } else if (this.normalizedSource === 'purchase') {
                    return 'fas fa-cart-plus text-[#337AB7]';
                } else if (this.normalizedSource === 'salary') {
                    return 'fas fa-money-bill-wave text-[#28A745]';
                } else if (this.normalizedSource === 'contract') {
                    return 'fas fa-file-contract text-[#337AB7]';
                } else if (this.normalizedSource === 'transaction') {
                    return 'fas fa-exchange-alt text-[#6C757D]';
                } else {
                    return 'fas fa-link text-[#337AB7]';
                }
            }
            return `fas ${this.sourceInfo.icon} ${this.sourceInfo.color}`;
        },
        displayText() {
            if (this.sourceType && this.sourceId) {
                const text = getSourceDisplayText(this.$t.bind(this), this.sourceType, this.sourceId, this.source);
                
                if (this.searchQuery && this.searchQuery.trim()) {
                    return highlightMatches(text, this.searchQuery);
                }

                return text;
            }
            
            return this.sourceInfo.text;
        },
        defaultText() {
            return this.$t('transaction');
        }
    },
    methods: {
        async openSourceModal() {
            if ((!this.sourceType && !this.source) || !this.sourceId || this.isSalary) return;
            
            this.loading = true;
            try {
                this.modalComponent = markRaw(SideModalDialog);
                
                if (this.sourceType && this.sourceType.includes('Sale')) {
                    this.editingItem = await SaleController.getItem(this.sourceId);
                    const module = await import('@/views/pages/sales/SaleCreatePage.vue');
                    this.modalContentComponent = markRaw(module.default);
                } else if (this.sourceType && this.sourceType.includes('Order')) {
                    this.editingItem = await OrderController.getItem(this.sourceId);
                    const module = await import('@/views/pages/orders/OrderCreatePage.vue');
                    this.modalContentComponent = markRaw(module.default);
                } else if (this.sourceType && (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt'))) {
                    this.editingItem = await WarehouseReceiptController.getItem(this.sourceId);
                    const module = await import('@/views/pages/warehouses/WarehousesReceiptCreatePage.vue');
                    this.modalContentComponent = markRaw(module.default);
                } else if (this.sourceType && (this.sourceType.includes('WhWriteoff') || this.sourceType.includes('WarehouseWriteoff'))) {
                    this.editingItem = await WarehouseWriteoffController.getItem(this.sourceId);
                    const module = await import('@/views/pages/warehouses/WarehousesWriteoffCreatePage.vue');
                    this.modalContentComponent = markRaw(module.default);
                } else if (this.sourceType && (this.sourceType.includes('WhPurchase') || this.sourceType.includes('WarehousePurchase'))) {
                    this.editingItem = await WarehousePurchaseController.getItem(this.sourceId);
                    const module = await import('@/views/pages/warehouses/WarehousesPurchaseCreatePage.vue');
                    this.modalContentComponent = markRaw(module.default);
                } else if (this.sourceType && this.sourceType.includes('Transaction')) {
                    this.editingItem = await TransactionController.getItem(this.sourceId);
                    const module = await import('@/views/pages/transactions/TransactionCreatePage.vue');
                    this.modalContentComponent = markRaw(module.default);
                } else if (this.sourceType && this.sourceType.includes('ProjectContract')) {
                    this.editingItem = await ProjectContractController.getItem(this.sourceId);
                    const module = await import('@/views/pages/projects/ProjectContractCreatePage.vue');
                    this.modalContentComponent = markRaw(module.default);
                } else {
                    console.warn('[SourceButtonCell] Unknown source type:', this.sourceType, 'source:', this.source);
                    return;
                }
                
                this.modalOpen = true;
            } catch (error) {
                console.error('[SourceButtonCell] Ошибка загрузки данных:', error);
                this.$emit('error', error);
            } finally {
                this.loading = false;
            }
        },
        handleSaved() {
            this.modalOpen = false;
            this.editingItem = null;
            this.modalComponent = null;
            this.modalContentComponent = null;
            // Вызываем колбэк для обновления данных в родительском компоненте
            if (this.onUpdated) {
                this.onUpdated();
            }
        },
        handleDeleted() {
            this.modalOpen = false;
            this.editingItem = null;
            this.modalComponent = null;
            this.modalContentComponent = null;
            // Вызываем колбэк для обновления данных в родительском компоненте
            if (this.onDeleted) {
                this.onDeleted();
            }
        }
    }
};
</script>

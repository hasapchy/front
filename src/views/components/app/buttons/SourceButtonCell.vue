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
      :onclose="closeAndResetModalState"
    >
      <component 
        :is="modalContentComponent"
        v-if="editingItem"
        v-bind="modalContentBind"
        @saved="handleSaved" 
        @saved-error="closeAndResetModalState" 
        @deleted="handleDeleted" 
        @close-request="closeAndResetModalState"
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
import { getSourceDisplayText, getSourceKind, getSourceKindLabel } from '@/utils/transactionSourceUtils';
import { TRANSACTION_FORM_PRESETS } from '@/constants/transactionFormPresets';

const SOURCE_ICON_CLASS_MAP = {
    sale: 'fas fa-shopping-cart text-[var(--color-success)]',
    order: 'fas fa-file-invoice text-[var(--color-info)]',
    receipt: 'fas fa-box text-[#FFA500]',
    writeoff: 'fas fa-box-open text-[var(--color-danger)]',
    purchase: 'fas fa-cart-plus text-[var(--color-info)]',
    salary: 'fas fa-money-bill-wave text-[#28A745]',
    contract: 'fas fa-file-contract text-[var(--color-info)]',
    transaction: 'fas fa-exchange-alt text-[#6C757D]',
};

const SOURCE_BADGE_META_MAP = {
    sale: { icon: 'fa-shopping-cart', color: 'text-[var(--color-success)]' },
    order: { icon: 'fa-clipboard-list', color: 'text-[var(--color-info)]' },
    receipt: { icon: 'fa-box', color: 'text-[#FFA500]' },
    writeoff: { icon: 'fa-box-open', color: 'text-[var(--color-danger)]' },
    purchase: { icon: 'fa-cart-plus', color: 'text-[var(--color-info)]' },
    salary: { icon: 'fa-money-bill-wave', color: 'text-[#28A745]' },
    contract: { icon: 'fa-file-contract', color: 'text-[var(--color-info)]' },
    transaction: { icon: 'fa-money-bill-transfer', color: 'text-[#6C757D]' },
};

const SOURCE_MODAL_CONFIG = [
    {
        type: 'sale',
        loadItem: (id) => SaleController.getItem(id),
        loadComponent: () => import('@/views/pages/sales/SaleCreatePage.vue'),
    },
    {
        type: 'order',
        loadItem: (id) => OrderController.getItem(id),
        loadComponent: () => import('@/views/pages/orders/OrderCreatePage.vue'),
    },
    {
        type: 'receipt',
        loadItem: (id) => WarehouseReceiptController.getItem(id),
        loadComponent: () => import('@/views/pages/warehouses/WarehousesReceiptCreatePage.vue'),
    },
    {
        type: 'writeoff',
        loadItem: (id) => WarehouseWriteoffController.getItem(id),
        loadComponent: () => import('@/views/pages/warehouses/WarehousesWriteoffCreatePage.vue'),
    },
    {
        type: 'purchase',
        loadItem: (id) => WarehousePurchaseController.getItem(id),
        loadComponent: () => import('@/views/pages/warehouses/WarehousesPurchaseCreatePage.vue'),
    },
    {
        type: 'transaction',
        loadItem: (id) => TransactionController.getItem(id),
        loadComponent: () => import('@/views/pages/transactions/TransactionCreatePage.vue'),
    },
    {
        type: 'contract',
        loadItem: (id) => ProjectContractController.getItem(id),
        loadComponent: () => import('@/views/pages/projects/ProjectContractCreatePage.vue'),
    },
];

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
            modalComponent: null,
            modalContentComponent: null
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
        sourceInfo() {
            const kind = SOURCE_BADGE_META_MAP[this.normalizedSource] ? this.normalizedSource : 'transaction';
            return {
                ...SOURCE_BADGE_META_MAP[kind],
                text: getSourceKindLabel(this.$t.bind(this), kind),
            };
        },
        modalContentBind() {
            const bind = {
                'editing-item': this.editingItem,
                'project-id': this.editingItem?.projectId || null,
            };
            if (this.normalizedSource === 'transaction') {
                bind['form-config'] = TRANSACTION_FORM_PRESETS.full;
            }
            return bind;
        },
        sourceDetailModalTitle() {
            if (!this.modalOpen || !this.editingItem) {
                return '';
            }
            const t = this.$t.bind(this);
            const item = this.editingItem;
            const modalType = this.resolveSourceModalType();
            if (modalType === 'sale') {
                return sideModalCrudTitle(t, {
                    item,
                    entityGenitiveKey: 'sideModalGenSale',
                    entityNominativeKey: 'sideModalNomSale',
                });
            }
            if (modalType === 'order') {
                return sideModalCrudTitle(t, {
                    item,
                    entityGenitiveKey: 'sideModalGenOrder',
                    entityNominativeKey: 'sideModalNomOrder',
                });
            }
            if (modalType === 'receipt') {
                return sideModalCrudTitle(t, {
                    item,
                    entityGenitiveKey: 'sideModalGenReceipt',
                    entityNominativeKey: 'sideModalNomReceipt',
                });
            }
            if (modalType === 'writeoff') {
                return sideModalCrudTitle(t, {
                    item,
                    entityGenitiveKey: 'sideModalGenWriteoff',
                    entityNominativeKey: 'sideModalNomWriteoff',
                });
            }
            if (modalType === 'purchase') {
                return `${getSourceKindLabel(t, 'purchase')} #${item?.id ?? this.sourceId}`;
            }
            if (modalType === 'contract') {
                return sideModalCrudTitle(t, {
                    item,
                    entityGenitiveKey: 'sideModalGenContract',
                    entityNominativeKey: 'sideModalNomContract',
                    getName: (c) => c?.number || c?.name || '',
                });
            }
            if (modalType === 'transaction') {
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
                return SOURCE_ICON_CLASS_MAP[this.normalizedSource] || 'fas fa-link text-[var(--color-info)]';
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
        }
    },
    methods: {
        closeAndResetModalState() {
            this.modalOpen = false;
            this.editingItem = null;
            this.modalComponent = null;
            this.modalContentComponent = null;
        },
        resolveSourceModalConfig() {
            return SOURCE_MODAL_CONFIG.find((cfg) => cfg.type === this.normalizedSource) || null;
        },
        resolveSourceModalType() {
            return this.resolveSourceModalConfig()?.type || '';
        },
        async openSourceModal() {
            if ((!this.sourceType && !this.source) || !this.sourceId || this.isSalary) return;
            try {
                this.modalComponent = markRaw(SideModalDialog);

                const modalConfig = this.resolveSourceModalConfig();
                if (!modalConfig) {
                    console.warn('[SourceButtonCell] Unknown source type:', this.sourceType, 'source:', this.source);
                    return;
                }

                this.editingItem = await modalConfig.loadItem(this.sourceId);
                const module = await modalConfig.loadComponent();
                this.modalContentComponent = markRaw(module.default);
                this.modalOpen = true;
            } catch (error) {
                console.error('[SourceButtonCell] Ошибка загрузки данных:', error);
                this.$emit('error', error);
            }
        },
        handleSaved() {
            this.closeAndResetModalState();
            if (this.onUpdated) {
                this.onUpdated();
            }
        },
        handleDeleted() {
            this.closeAndResetModalState();
            if (this.onDeleted) {
                this.onDeleted();
            }
        }
    }
};
</script>

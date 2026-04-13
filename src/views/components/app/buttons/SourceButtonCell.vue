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
import SaleCreatePage from '@/views/pages/sales/SaleCreatePage.vue';
import OrderController from '@/api/OrderController';
import OrderCreatePage from '@/views/pages/orders/OrderCreatePage.vue';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import WarehousesReceiptCreatePage from '@/views/pages/warehouses/WarehousesReceiptCreatePage.vue';
import TransactionController from '@/api/TransactionController';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import ProjectContractController from '@/api/ProjectContractController';
import ProjectContractCreatePage from '@/views/pages/projects/ProjectContractCreatePage.vue';

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
            if (this.source) {
                return this.source.toLowerCase();
            }
            if (this.sourceType) {
                if (this.sourceType.includes('Sale')) return 'sale';
                if (this.sourceType.includes('Order')) return 'order';
                if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) return 'receipt';
                if (this.sourceType.includes('EmployeeSalary')) return 'salary';
                if (this.sourceType.includes('ProjectContract')) return 'contract';
                if (this.sourceType.includes('Transaction')) return 'transaction';
            }
            return 'transaction';
        },
        sourceMap() {
            return {
                'sale': { icon: 'fa-shopping-cart', color: 'text-[#5CB85C]', text: 'Продажа' },
                'order': { icon: 'fa-clipboard-list', color: 'text-[#337AB7]', text: 'Заказ' },
                'receipt': { icon: 'fa-box', color: 'text-[#FFA500]', text: 'Оприходование' },
                'wh_receipt': { icon: 'fa-box', color: 'text-[#FFA500]', text: 'Оприходование' },
                'salary': { icon: 'fa-money-bill-wave', color: 'text-[#28A745]', text: 'Зарплата' },
                'contract': { icon: 'fa-file-contract', color: 'text-[#337AB7]', text: this.$t('contract') },
                'transaction': { icon: 'fa-money-bill-transfer', color: 'text-[#6C757D]', text: 'Прочее' }
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
                if (this.sourceType.includes('Sale')) {
                    return 'fas fa-shopping-cart text-[#5CB85C]';
                } else if (this.sourceType.includes('Order')) {
                    return 'fas fa-file-invoice text-[#337AB7]';
                } else if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) {
                    return 'fas fa-box text-[#FFA500]';
                } else if (this.sourceType.includes('EmployeeSalary')) {
                    return 'fas fa-money-bill-wave text-[#28A745]';
                } else if (this.sourceType.includes('ProjectContract')) {
                    return 'fas fa-file-contract text-[#337AB7]';
                } else if (this.sourceType.includes('Transaction')) {
                    return 'fas fa-exchange-alt text-[#6C757D]';
                } else {
                    return 'fas fa-link text-[#337AB7]';
                }
            }
            return `fas ${this.sourceInfo.icon} ${this.sourceInfo.color}`;
        },
        displayText() {
            if (this.sourceType && this.sourceId) {
                let text;
                if (this.sourceType.includes('Sale')) {
                    text = `Продажа #${this.sourceId}`;
                } else if (this.sourceType.includes('Order')) {
                    text = `Заказ #${this.sourceId}`;
                } else if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) {
                    text = `Оприходование #${this.sourceId}`;
                } else if (this.sourceType.includes('EmployeeSalary')) {
                    text = `Зарплата`;
                } else if (this.sourceType.includes('ProjectContract')) {
                    text = `${this.$t('contract')} #${this.sourceId}`;
                } else if (this.sourceType.includes('Transaction')) {
                    text = `Транзакция #${this.sourceId}`;
                } else {
                    text = `Связь #${this.sourceId}`;
                }
                
                if (this.searchQuery && this.searchQuery.trim()) {
                    return highlightMatches(text, this.searchQuery);
                }

                return text;
            }
            
            return this.sourceInfo.text;
        },
        defaultText() {
            return 'Транзакция';
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
                    this.modalContentComponent = markRaw(SaleCreatePage);
                } else if (this.sourceType && this.sourceType.includes('Order')) {
                    this.editingItem = await OrderController.getItem(this.sourceId);
                    this.modalContentComponent = markRaw(OrderCreatePage);
                } else if (this.sourceType && (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt'))) {
                    this.editingItem = await WarehouseReceiptController.getItem(this.sourceId);
                    this.modalContentComponent = markRaw(WarehousesReceiptCreatePage);
                } else if (this.sourceType && this.sourceType.includes('Transaction')) {
                    this.editingItem = await TransactionController.getItem(this.sourceId);
                    this.modalContentComponent = markRaw(TransactionCreatePage);
                } else if (this.sourceType && this.sourceType.includes('ProjectContract')) {
                    this.editingItem = await ProjectContractController.getItem(this.sourceId);
                    this.modalContentComponent = markRaw(ProjectContractCreatePage);
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

    <template>
    <div>
        <transition name="fade" mode="out-in">
            <div v-if="data != null && !loading" key="table">
                <div @click="handleTableClick">
                <DraggableTable
                    table-key="transactions.templates"
                    :columns-config="columnsConfig"
                    :table-data="data.items"
                    :item-mapper="itemMapper"
                    :onItemClick="(i) => showModal(i)"
                >
                    <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                        <TableControlsBar
                            :show-pagination="true"
                            :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                            :on-page-change="fetchItems"
                            :on-per-page-change="handlePerPageChange"
                            :resetColumns="resetColumns"
                            :columns="columns"
                            :toggleVisible="toggleVisible"
                            :log="log"
                        >
                            <template #left>
                                <PrimaryButton
                                    :onclick="() => showModal(null)"
                                    icon="fas fa-plus"
                                    :disabled="!$store.getters.hasPermission('transaction_templates_create')"
                                />
                            </template>
                            <template #right>
                                <Pagination
                                    v-if="data != null"
                                    :currentPage="data.currentPage"
                                    :lastPage="data.lastPage"
                                    :per-page="perPage"
                                    :per-page-options="perPageOptions"
                                    :show-per-page-selector="true"
                                    @changePage="(page) => fetchItems(page)"
                                    @perPageChange="handlePerPageChange"
                                />
                            </template>
                            <template #gear="{ resetColumns, columns, toggleVisible, log }">
                                <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                    <ul>
                                        <draggable
                                            v-if="columns.length"
                                            class="dragArea list-group w-full"
                                            :list="columns"
                                            @change="log"
                                        >
                                            <li
                                                v-for="(element, index) in columns"
                                                :key="element.name"
                                                v-show="element.name !== 'select'"
                                                @click="toggleVisible(index)"
                                                class="flex items-center hover:bg-gray-100 p-2 rounded"
                                            >
                                                <div class="space-x-2 flex flex-row justify-between w-full select-none">
                                                    <div>
                                                        <i
                                                            class="text-sm mr-2 text-[#337AB7]"
                                                            :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                                                        />
                                                        {{ $te(element.label) ? $t(element.label) : element.label }}
                                                    </div>
                                                    <div>
                                                        <i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab" />
                                                    </div>
                                                </div>
                                            </li>
                                        </draggable>
                                    </ul>
                                </TableFilterButton>
                            </template>
                        </TableControlsBar>
                    </template>
                </DraggableTable>
                </div>
            </div>
            <div v-else key="loader" class="min-h-64">
                <TableSkeleton />
            </div>
        </transition>

        <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
            <TransactionTemplateCreatePage
                v-if="modalDialog"
                ref="templateForm"
                :editingItem="editingItem"
                :showHeader="true"
                @saved="handleSaved"
                @saved-error="handleSavedError"
                @deleted="handleDeleted"
                @deleted-error="handleDeletedError"
                @close-request="closeModal"
            />
        </SideModalDialog>
        <AlertDialog
            :dialog="deleteDialog"
            :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
            :confirm-text="$t('delete')"
            :leave-text="$t('cancel')"
            @confirm="confirmDeleteItems"
            @leave="deleteDialog = false"
        />
    </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import TransactionTemplateController from '@/api/TransactionTemplateController';
import RecurringTransactionController from '@/api/RecurringTransactionController';
import TransactionTemplateCreatePage from './TransactionTemplateCreatePage.vue';
import { formatDatabaseDate } from '@/utils/dateUtils';
import listPageMixin from '@/mixins/listPageMixin';

export default {
    name: 'TransactionTemplatesPage',
    mixins: [listPageMixin],
    components: {
        PrimaryButton,
        SideModalDialog,
        TransactionTemplateCreatePage,
        Pagination,
        DraggableTable,
        AlertDialog,
        TableControlsBar,
        TableFilterButton,
        TableSkeleton,
        draggable: VueDraggableNext
    },
    data() {
        return {
            controller: TransactionTemplateController,
            cacheInvalidationType: 'transactionTemplates',
            deletePermission: 'transaction_templates_delete',
            savedSuccessText: this.$t('success') || 'Успешно',
            savedErrorText: this.$t('error') || 'Ошибка',
            deletedSuccessText: this.$t('success') || 'Успешно',
            deletedErrorText: this.$t('error') || 'Ошибка',
            selectedIds: [],
            deleteDialog: false,
            columnsConfig: [
                { name: 'id', label: 'id', size: 60 },
                { name: 'name', label: this.$t('name') },
                { name: 'clientName', label: this.$t('client') },
                { name: 'projectName', label: this.$t('project') },
                { name: 'typeName', label: this.$t('type') },
                { name: 'cashName', label: this.$t('cashRegister') },
                { name: 'amount', label: this.$t('amount') },
                { name: 'categoryName', label: this.$t('category') },
                { name: 'date', label: this.$t('date') },
                { name: 'note', label: this.$t('note') },
                { name: 'recurring', label: this.$t('recurring'), html: true, size: 80 },
                { name: 'creatorName', label: this.$t('createdBy') },
                { name: 'createdAt', label: this.$t('creationDate') }
            ]
        };
    },
    created() {
        this.fetchItems();
    },
    methods: {
        async fetchItems(page = 1) {
            this.loading = true;
            try {
                const res = await TransactionTemplateController.getItems(page, this.perPage);
                this.data = {
                    items: res.items,
                    currentPage: res.currentPage,
                    lastPage: res.lastPage,
                    total: res.total
                };
            } catch (e) {
                console.error('Ошибка при получении шаблонов транзакций:', e);
                this.data = { items: [], currentPage: 1, lastPage: 1, total: 0 };
            }
            this.loading = false;
        },
        handlePerPageChange(perPage) {
            this.perPage = perPage;
            this.fetchItems(1);
        },
        itemMapper(item, columnName) {
            switch (columnName) {
                case 'id':
                    return item.id ?? '—';
                case 'name':
                    return item.name || '—';
                case 'clientName':
                    return item.clientName || '—';
                case 'projectName':
                    return item.projectName || '—';
                case 'typeName':
                    if (!item.typeName) {
                        return '—';
                    }
                    if (item.typeName === 'income') {
                        return this.$t('income');
                    }
                    if (item.typeName === 'outcome') {
                        return this.$t('expense');
                    }
                    return item.typeName;
                case 'cashName':
                    return item.cashName || '—';
                case 'amount':
                    if (item.amount == null) {
                        return '—';
                    }
                    return `${Number(item.amount).toFixed(2)}${item.currencySymbol ? ` ${item.currencySymbol}` : ''}`;
                case 'categoryName':
                    return item.categoryName || '—';
                case 'date':
                    if (!item.date) {
                        return '—';
                    }
                    return formatDatabaseDate(item.date);
                case 'note':
                    return item.note || '—';
                case 'creatorName':
                    return item.creatorName || '—';
                case 'createdAt':
                    if (!item.createdAt) {
                        return '—';
                    }
                    return formatDatabaseDate(item.createdAt);
                case 'recurring':
                    if (!item.activeScheduleId) {
                        return '—';
                    }
                    return `<span class="inline-flex items-center gap-1">
                        <i class="fas fa-rotate text-blue-500" title="${this.$t('recurringActive')}"></i>
                        <button
                            class="text-xs text-red-500 hover:text-red-700 border border-red-300 hover:border-red-500 rounded px-1 py-0.5 transition-colors"
                            data-stop-id="${item.activeScheduleId}"
                        >${this.$t('stopRecurring')}</button>
                    </span>`;
                default:
                    return item[columnName] ?? '';
            }
        },
        async handleTableClick(event) {
            const btn = event.target.closest('[data-stop-id]');
            if (!btn) return;
            event.stopPropagation();
            const scheduleId = parseInt(btn.getAttribute('data-stop-id'), 10);
            if (!scheduleId) return;
            try {
                await RecurringTransactionController.stopItem(scheduleId);
                this.showNotification(this.$t('recurringStoppedSuccess'), '', false);
                await this.fetchItems(1);
            } catch (e) {
                this.showNotification(this.$t('error'), e.message, true);
            }
        },
        confirmDeleteItems() {
            this.handleBatchDelete(this.selectedIds);
        }
    }
};
</script>


<template>
    <transition name="fade" mode="out-in">
        <div v-if="data && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.invoices" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="onItemClick" @selectionChange="selectedIds = $event">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar :show-filters="true" :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()" :on-filters-reset="resetFilters"
                        :show-pagination="true"
                        :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                        :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange"
                        :resetColumns="resetColumns" :columns="columns" :toggleVisible="toggleVisible" :log="log">
                        <template #left>
                            <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
                                :disabled="!$store.getters.hasPermission('invoices_create')">
                            </PrimaryButton>

                            <transition name="fade">
                                <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds"
                                    :batch-actions="getBatchActions()" />
                            </transition>

                            <FiltersContainer :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()" @reset="resetFilters"
                                @apply="applyFilters">
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') || 'Период'
                                    }}</label>
                                    <select v-model="dateFilter" class="w-full">
                                        <option value="all_time">{{ $t('allTime') }}</option>
                                        <option value="today">{{ $t('today') }}</option>
                                        <option value="yesterday">{{ $t('yesterday') }}</option>
                                        <option value="this_week">{{ $t('thisWeek') }}</option>
                                        <option value="this_month">{{ $t('thisMonth') }}</option>
                                        <option value="last_week">{{ $t('lastWeek') }}</option>
                                        <option value="last_month">{{ $t('lastMonth') }}</option>
                                        <option value="custom">{{ $t('selectDates') }}</option>
                                    </select>
                                </div>

                                <div v-if="dateFilter === 'custom'" class="space-y-2">
                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
                                        <input type="date" v-model="startDate" class="w-full" />
                                    </div>
                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
                                        <input type="date" v-model="endDate" class="w-full" />
                                    </div>
                                </div>

                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('status') }}</label>
                                    <select v-model="statusFilter" class="w-full">
                                        <option value="">{{ $t('allStatuses') }}</option>
                                        <option value="new">{{ $t('new') }}</option>
                                        <option value="in_progress">{{ $t('inProgress') }}</option>
                                        <option value="paid">{{ $t('paid') }}</option>
                                        <option value="cancelled">{{ $t('cancelled') }}</option>
                                    </select>
                                </div>
                            </FiltersContainer>
                        </template>

                        <template #right>
                            <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
                                :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
                                @changePage="fetchItems" @perPageChange="handlePerPageChange" />
                        </template>

                        <template #gear="{ resetColumns, columns, toggleVisible, log }">
                            <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                <ul>
                                    <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns"
                                        @change="log">
                                        <li v-for="(element, index) in columns" :key="element.name"
                                            @click="toggleVisible(index)"
                                            class="flex items-center hover:bg-gray-100 p-2 rounded">
                                            <div class="space-x-2 flex flex-row justify-between w-full select-none">
                                                <div>
                                                    <i class="text-sm mr-2 text-[#337AB7]"
                                                        :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                                    {{ $te(element.label) ? $t(element.label) : element.label }}
                                                </div>
                                                <div><i
                                                        class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i>
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
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>

    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <InvoiceCreatePage v-if="modalDialog" :key="editingItem ? editingItem.id : 'new-invoice'"
            ref="invoicecreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem"
            :preselectedOrderIds="preselectedOrderIds" />
    </SideModalDialog>

    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
    <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`"
        :confirm-text="$t('deleteSelected')" :leave-text="$t('cancel')" @confirm="confirmDeleteItems"
        @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import Pagination from "@/views/components/app/buttons/Pagination.vue";
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import { VueDraggableNext } from 'vue-draggable-next';
import InvoiceController from "@/api/InvoiceController";
import InvoiceCreatePage from "@/views/pages/invoices/InvoiceCreatePage.vue";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import ProductsListCell from "@/views/components/app/buttons/ProductsListCell.vue";
import { markRaw } from "vue";
import BatchButton from "@/views/components/app/buttons/BatchButton.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import crudEventMixin from "@/mixins/crudEventMixin";
import notificationMixin from "@/mixins/notificationMixin";
import batchActionsMixin from "@/mixins/batchActionsMixin";
import modalMixin from "@/mixins/modalMixin";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import { defineAsyncComponent } from "vue";
import { eventBus } from "@/eventBus";
import companyChangeMixin from "@/mixins/companyChangeMixin";
import searchMixin from "@/mixins/searchMixin";
import filtersMixin from "@/mixins/filtersMixin";


export default {
    mixins: [getApiErrorMessage, crudEventMixin, notificationMixin, modalMixin, batchActionsMixin, companyChangeMixin, searchMixin, filtersMixin],
    components: {
        NotificationToast,
        SideModalDialog,
        PrimaryButton,
        Pagination,
        DraggableTable,
        InvoiceCreatePage,
        ClientButtonCell,
        BatchButton,
        AlertDialog,
        FiltersContainer,
        TableControlsBar,
        TableFilterButton,
        draggable: VueDraggableNext
    },
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            editingItem: null,
            loadingDelete: false,
            controller: InvoiceController,
            cacheInvalidationType: 'invoices',
            itemViewRouteName: 'InvoiceView',
            baseRouteName: 'Invoices',
            errorGettingItemText: this.$t('errorGettingInvoiceList'),
            savedSuccessText: this.$t('invoiceSaved'),
            savedErrorText: this.$t('errorSavingInvoice'),
            deletedSuccessText: this.$t('invoiceDeleted'),
            deletedErrorText: this.$t('errorDeletingInvoice'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: "id", label: "№", size: 20 },
                { name: "invoiceNumber", label: 'invoiceNumber' },
                { name: "invoiceDate", label: 'invoiceDate' },
                { name: "client", label: 'client', component: markRaw(ClientButtonCell), props: (i) => ({ client: i.client, }), },
                { name: "status", label: 'status', html: true },
                {
                    name: "products",
                    label: 'products',
                    component: markRaw(ProductsListCell),
                    props: (item) => ({
                        products: item.products || [],
                        maxItems: 3
                    })
                },
                { name: "totalAmount", label: 'amount' },
                { name: "ordersCount", label: 'ordersCount' },
                { name: "note", label: 'note' },
            ],
            dateFilter: 'all_time',
            startDate: null,
            endDate: null,
            statusFilter: '',
            preselectedOrderIds: []
        };
    },
    created() {
        this.$store.commit("SET_SETTINGS_OPEN", false);

        eventBus.on('global-search', this.handleSearch);

        if (this.$route.query.create === 'true' && this.$route.query.order_ids) {
            this.preselectedOrderIds = this.$route.query.order_ids.split(',').map(id => parseInt(id));
        }
    },

    mounted() {
        this.fetchItems();
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
                if (this.preselectedOrderIds.length > 0) {
                    this.$nextTick(() => {
                        this.showModal(null);
                    });
                }
            }
        }
    },

    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },

    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        hasActiveFilters() {
            return this.dateFilter !== 'all_time' ||
                this.statusFilter !== '' ||
                this.startDate !== null ||
                this.endDate !== null;
        }
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case "invoiceDate":
                    return i.formatDate();
                case "products":
                    // Возвращаем количество продуктов для сортировки (отображение через компонент ProductsListCell)
                    return (i.products || []).length;
                case "client":
                    if (!i.client) return '<span class="text-gray-500">' + this.$t('notSpecified') + '</span>';
                    const name = i.client.fullName();
                    const phone = i.client.phones?.[0]?.phone;
                    return phone ? `<div>${name} (<span>${phone}</span>)</div>` : name;
                case "status":
                    return `<span class="px-2 py-1 rounded text-xs ${i.getStatusClass()}">${i.getStatusLabel()}</span>`;
                case "totalAmount":
                    return i.amountInfo();
                case "ordersCount":
                    return i.getOrdersCount();
                case "note":
                    return i.note || "";

                default:
                    return i[c];
            }
        },

        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async handleCompanyChanged(companyId) {
            // ✅ Очищаем фильтры при смене компании
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.statusFilter = '';
            this.selectedIds = [];

            // Перезагружаем данные со страницы 1
            await this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {

                const per_page = this.perPage;

                const newData = await InvoiceController.getItems(page, this.searchQuery, this.dateFilter, this.startDate, this.endDate, null, this.statusFilter, per_page);
                this.data = newData;
            } catch (error) {
                this.showNotification(this.$t('errorGettingInvoiceList'), error.message, true);
            }
            if (!silent) this.loading = false;
        },

        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Invoices' });
            }
        },
        resetFilters() {
            this.dateFilter = 'all_time';
            this.startDate = '';
            this.endDate = '';
            this.statusFilter = '';
            this.fetchItems();
        },
        getActiveFiltersCount() {
            let count = 0;
            if (this.dateFilter !== 'all_time') count++;
            if (this.statusFilter !== '') count++;
            if (this.startDate !== null && this.startDate !== '') count++;
            if (this.endDate !== null && this.endDate !== '') count++;
            return count;
        },

    }
};
</script>

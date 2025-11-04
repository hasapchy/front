<template>
    <div class="flex justify-between items-center mb-2">
        <div class="flex items-center">
            <PrimaryButton 
                :onclick="() => showModal(null)" 
                icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('invoices_create')">
            </PrimaryButton>
            
            
            <div class="ml-2">
                <select v-model="dateFilter" @change="fetchItems" class="pl-10">
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
            <div v-if="dateFilter === 'custom'" class="flex space-x-2 items-center ml-2">
                <input type="date" v-model="startDate" @change="fetchItems" />
                <input type="date" v-model="endDate" @change="fetchItems" />
            </div>


            <div class="ml-2">
                <select v-model="statusFilter" @change="fetchItems">
                    <option value="">{{ $t('allStatuses') }}</option>
                    <option value="new">{{ $t('new') }}</option>
                    <option value="in_progress">{{ $t('inProgress') }}</option>
                    <option value="paid">{{ $t('paid') }}</option>
                    <option value="cancelled">{{ $t('cancelled') }}</option>
                </select>
            </div>

            <div class="ml-2">
                <PrimaryButton 
                    :onclick="resetFilters"
                    icon="fas fa-trash"
                    :isLight="true">
                </PrimaryButton>
            </div>
        </div>
        <Pagination v-if="data" :currentPage="data.currentPage" :lastPage="data.lastPage" 
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    
    <transition name="fade" mode="out-in">
        <div v-if="data && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.invoices" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => showModal(i)" @selectionChange="selectedIds = $event" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
    </transition>
    
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <InvoiceCreatePage v-if="modalDialog" ref="invoicecreatepageForm" @saved="handleSaved" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" 
            :preselectedOrderIds="preselectedOrderIds" />
    </SideModalDialog>

    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
    <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`" :confirm-text="$t('deleteSelected')"
          :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import Pagination from "@/views/components/app/buttons/Pagination.vue";
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import InvoiceController from "@/api/InvoiceController";
import InvoiceCreatePage from "@/views/pages/invoices/InvoiceCreatePage.vue";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import { markRaw } from "vue";
import BatchButton from "@/views/components/app/buttons/BatchButton.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import crudEventMixin from "@/mixins/crudEventMixin";
import notificationMixin from "@/mixins/notificationMixin";
import batchActionsMixin from "@/mixins/batchActionsMixin";
import modalMixin from "@/mixins/modalMixin";
import tableTranslationMixin from "@/mixins/tableTranslationMixin";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import { defineAsyncComponent } from "vue";
import { eventBus } from "@/eventBus";
import companyChangeMixin from "@/mixins/companyChangeMixin";


export default {
    mixins: [getApiErrorMessage, crudEventMixin, notificationMixin, modalMixin, batchActionsMixin, tableTranslationMixin, companyChangeMixin],
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
    },
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            editingItem: null,
            loadingDelete: false,
            controller: InvoiceController,
            cacheInvalidationType: 'invoices',
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
                { name: "products", label: 'products', html: true },
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
        
        if (this.preselectedOrderIds.length > 0) {
            this.$nextTick(() => {
                this.showModal(null);
            });
        }
    },

    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },

    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        }
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case "products":
                    return i.productsHtmlList();
                case "invoiceDate":
                    return i.formatDate();
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

        handleSearch(query) {
            this.$store.dispatch('setSearchQuery', query);
            this.fetchItems(1, false);
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
                // ✅ Убеждаемся, что perPage всегда установлен (по умолчанию 10)
                const perPage = this.perPage || 10;
                
                const newData = await InvoiceController.getItemsPaginated(page, this.searchQuery, this.dateFilter, this.startDate, this.endDate, null, this.statusFilter, perPage);
                this.data = newData;
            } catch (error) {
                this.showNotification(this.$t('errorGettingInvoiceList'), error.message, true);
            }
            if (!silent) this.loading = false;
        },

        showModal(item) {
            this.editingItem = item;
            this.modalDialog = true;
        },
        closeModal() {
            this.modalDialog = false;
            this.editingItem = null;
        },
        resetFilters() {
            this.dateFilter = 'all_time';
            this.startDate = '';
            this.endDate = '';
            this.statusFilter = '';
            this.fetchItems();
        },

    }
};
</script>

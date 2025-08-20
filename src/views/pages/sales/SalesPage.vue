<template>
    <div class="flex justify-between items-center mb-2">
        <div class="flex justify-start items-center">
            <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('sales_create')">
                {{ $t('addSale') }}
            </PrimaryButton>
            
            <!-- Фильтр по дате -->
            <div class="ml-4">
                <select v-model="dateFilter" @change="fetchItems" class="w-full p-2 pl-10 border rounded">
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
            <div v-if="dateFilter === 'custom'" class="flex space-x-2 items-center ml-4">
                <input type="date" v-model="startDate" @change="fetchItems" class="w-full p-2 border rounded" />
                <input type="date" v-model="endDate" @change="fetchItems" class="w-full p-2 border rounded" />
            </div>


        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.sales" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <SaleCreatePage ref="salecreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" :confirm-text="$t('delete')"
            :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import SaleController from '@/api/SaleController';
import SaleCreatePage from '@/views/pages/sales/SaleCreatePage.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import { markRaw } from 'vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { eventBus } from '@/eventBus';


export default {
    mixins: [modalMixin, notificationMixin, batchActionsMixin, getApiErrorMessageMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, SaleCreatePage, ClientButtonCell, BatchButton, AlertDialog },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: SaleController,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'dateUser', label: 'dateUser' },
                { name: 'client', label: 'buyer', component: markRaw(ClientButtonCell), props: (item) => ({ client: item.client, }) },
                { name: 'cashName', label: 'cashRegister' },
                { name: 'warehouseName', label: 'warehouse' },
                { name: 'products', label: 'products', html: true },
                { name: 'price', label: 'saleAmount' },
                { name: 'note', label: 'note' },
            ],
            dateFilter: 'all_time',
            startDate: null,
            endDate: null,
        }
    },
    created() {
        this.fetchItems();
        this.$store.commit('SET_SETTINGS_OPEN', false);
        
        // Слушаем события поиска через eventBus
        eventBus.on('global-search', this.handleSearch);
    },
    beforeUnmount() {
        // Удаляем слушатель события
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        itemMapper(i, c) {
            if (c === 'cashName') {
                return i.cashNameDisplay();
            }
            switch (c) {
                case 'products':
                    return i.productsHtmlList();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.userName}`;
                case 'price':
                    return i.priceInfo();
                case 'client':
                    if (!i.client) return '<span class="text-gray-500">' + this.$t('notSpecified') + '</span>';
                    const name = i.client.fullName();
                    const phone = i.client.phones?.[0]?.phone;
                    return phone
                        ? `<div>${name} (<span>${phone}</span>)</div>`
                        : name;
                default:
                    return i[c];
            }
        },
        handleModalClose() {
            // Проверяем, есть ли изменения в форме
            const formRef = this.$refs.salecreatepageForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },
        handleSearch(query) {
            // Обновляем store напрямую
            this.$store.dispatch('setSearchQuery', query);
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const new_data = await SaleController.getItemsPaginated(page, this.searchQuery, this.dateFilter, this.startDate, this.endDate);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingSaleList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        handleSaved() {
            this.showNotification(this.$t('saleRecordAdded'), '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleSavedError(m) {
            this.showNotification(this.$t('errorSavingRecord'), m, true);
        },
        handleDeleted() {
            this.showNotification(this.$t('recordSuccessfullyDeleted'), '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleDeletedError(m) {
            this.showNotification(this.$t('errorDeletingRecord'), m, true);
        },

    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        translatedColumnsConfig() {
            return this.columnsConfig.map(column => ({
                ...column,
                label: column.label === '#' ? '#' : this.$t(column.label)
            }));
        }
    },
}
</script>
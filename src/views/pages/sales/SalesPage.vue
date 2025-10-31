<template>
    <div class="flex justify-between items-center mb-2">
        <div class="flex justify-start items-center">
            <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('sales_create')"></PrimaryButton>
            
            <!-- Фильтр по дате -->
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


        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
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
        <SaleCreatePage v-if="modalDialog" ref="salecreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import crudEventMixin from '@/mixins/crudEventMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';
import { eventBus } from '@/eventBus';
import companyChangeMixin from '@/mixins/companyChangeMixin';


export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, tableTranslationMixin, companyChangeMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, SaleCreatePage, ClientButtonCell, BatchButton, AlertDialog },
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            controller: SaleController,
            cacheInvalidationType: 'sales',
            showStatusSelect: false,
            savedSuccessText: this.$t('saleRecordAdded'),
            savedErrorText: this.$t('errorSavingRecord'),
            deletedSuccessText: this.$t('recordSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingRecord'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'dateUser', label: 'dateUser' },
                { name: 'cashName', label: 'cashRegister' },
                { name: 'warehouseName', label: 'warehouse' },
                { name: 'client', label: 'buyer', component: markRaw(ClientButtonCell), props: (item) => ({ client: item.client, }) },
                { name: 'products', label: 'products', html: true },
                { name: 'note', label: 'note' },
                { name: 'price', label: 'saleAmount' },
            ],
            dateFilter: 'all_time',
            startDate: null,
            endDate: null
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
        
        eventBus.on('global-search', this.handleSearch);
    },

    mounted() {
        this.fetchItems();
    },
    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        itemMapper(i, c) {
            if (c === 'cashName') {
                return i.cashNameDisplay();
            }
            if (c === 'warehouseName') {
                return i.warehouseNameDisplay();
            }
            switch (c) {
                case 'products':
                    return i.productsHtmlList();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.userName}`;
                case 'price':
                    return i.priceInfo();
                case 'client':
                    if (!i.client) return '';
                    const name = i.client.fullName();
                    const phone = i.client.phones?.[0]?.phone;
                    return phone
                        ? `<div>${name} (<span>${phone}</span>)</div>`
                        : name;
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
            this.selectedIds = [];
            
            // Перезагружаем данные со страницы 1
            await this.fetchItems(1, false);
            
            // Уведомляем пользователя о смене компании
            this.$store.dispatch('showNotification', {
              title: 'Компания изменена',
              isDanger: false
            });
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const new_data = await SaleController.getItemsPaginated(page, this.searchQuery, this.dateFilter, this.startDate, this.endDate, this.perPage);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingSaleList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        }
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        }
    },
}
</script>
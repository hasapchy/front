<template>
    <div class="flex justify-between items-center mb-4">
                <PrimaryButton :onclick="() => { showModal(null) }" 
            :disabled="!$store.getters.hasPermission('cash_registers_create')" icon="fas fa-plus">{{ $t('addCashRegister') }}
        </PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.cash_registers" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <CashRegisterCreatePage ref="cashregistercreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import CashRegisterController from '@/api/CashRegisterController';
import CashRegisterCreatePage from '@/views/pages/cash_registers/CashRegisterCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';

export default {
    mixins: [modalMixin, notificationMixin, batchActionsMixin, crudEventMixin, getApiErrorMessageMixin, companyChangeMixin],
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        Pagination,
        DraggableTable,
        CashRegisterCreatePage,
        BatchButton,
        AlertDialog,
        SpinnerIcon
    },
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            controller: CashRegisterController,
            cacheInvalidationType: 'cashRegisters',
            savedSuccessText: this.$t('cashRegisterSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingCashRegister'),
            deletedSuccessText: this.$t('cashRegisterSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingCashRegister'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: this.$t('number'), size: 60 },
                { name: 'name', label: this.$t('name') },
                { name: 'balance', label: this.$t('balance') },
                { name: 'currency', label: this.$t('currency') },
                { name: 'createdAt', label: this.$t('creationDate') },
                { name: 'dateUser', label: this.$t('dateUser'), html: true },
            ]
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },

    mounted() {
        this.fetchItems();
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'balance':
                    return this.$formatNumber(i.balance || 0, null, true) + ' ' + (i.currencySymbol || i.currencyCode || '');
                case 'users':
                    return (i.users || '').length + ' ' + this.$t('users');
                case 'currency':
                    return (i.currencyCode || '') + (i.currencySymbol ? ' (' + i.currencySymbol + ')' : '');
                case 'createdAt':
                    return i.formatCreatedAt();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.userName}`;
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
               
                const per_page = this.perPage || 20;
                
                const new_data = await CashRegisterController.getItems(page, per_page);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingCashRegisterList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        }
    },
    computed: {
    },
}
</script>
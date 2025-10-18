<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton 
            :onclick="() => showModal(null)" 
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('companies_create')">
        </PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <transition name="fade" mode="out-in">
        <div v-if="data && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.companies" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event" :onItemClick="(i) => showModal(i)" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <CompaniesCreatePage ref="companiescreatepageForm" @saved="handleSaved" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
            :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
    <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" :confirm-text="$t('delete')"
        :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import CompaniesController from '@/api/CompaniesController';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import CompaniesCreatePage from './CompaniesCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';
import { eventBus } from '@/eventBus';

export default {
    mixins: [notificationMixin, modalMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, tableTranslationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, CompaniesCreatePage, Pagination, DraggableTable, BatchButton, AlertDialog },
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            controller: CompaniesController,
            cacheInvalidationType: 'companies',
            savedSuccessText: this.$t('companySaved'),
            savedErrorText: this.$t('errorSavingCompany'),
            deletedSuccessText: this.$t('companyDeleted'),
            deletedErrorText: this.$t('errorDeletingCompany'),
            selectedCompanyId: null,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'ID', size: 60 },
                { name: 'name', label: 'name' },
                { name: 'logo', label: 'logo', html: true },
                { name: 'createdAt', label: 'created' },
            ]
        };
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },

    mounted() {
        this.fetchItems();
        // Слушаем события обновления компаний для перезагрузки данных
        eventBus.on('company-updated', this.handleCompanyUpdated);
    },

    beforeUnmount() {
        eventBus.off('company-updated', this.handleCompanyUpdated);
    },

    methods: {
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                this.data = await CompaniesController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingCompanies'), error.message, true);
            }
            if (!silent) this.loading = false;
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        handleCompanyUpdated() {
            // Перезагружаем список компаний и обновляем Store
            this.fetchItems();
            this.$store.dispatch('loadUserCompanies');
        },
        itemMapper(item, column) {
            switch (column) {
                case 'logo':
                    const logoUrl = item.logoUrl ? item.logoUrl() : '/logo.jpg';
                    return `<img src="${logoUrl}" alt="${item.name}" class="w-8 h-8 object-contain rounded">`;
                case 'createdAt':
                    return new Date(item.createdAt).toLocaleDateString();
                default:
                    return item[column];
            }
        },
    },
};
</script>

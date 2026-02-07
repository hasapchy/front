<template>
    <transition name="fade" mode="out-in">
        <div v-if="data && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.companies" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event" :onItemClick="(i) => showModal(i)">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-create-button="true"
                        :on-create-click="() => showModal(null)"
                        :create-button-disabled="!$store.getters.hasPermission('companies_create')"
                        :show-pagination="true"
                        :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                        :on-page-change="fetchItems"
                        :on-per-page-change="handlePerPageChange"
                        :resetColumns="resetColumns"
                        :columns="columns"
                        :toggleVisible="toggleVisible"
                        :log="log">
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
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose" :closeBlocked="companySaveLoading">
        <CompaniesCreatePage ref="companiescreatepageForm" @saved="handleSaved" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
            @save-loading="companySaveLoading = $event" :editingItem="editingItem" />
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
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import { formatDatabaseDate } from '@/utils/dateUtils';
import CompaniesCreatePage from './CompaniesCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

import { eventBus } from '@/eventBus';

export default {
    mixins: [notificationMixin, modalMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, ],
    components: { NotificationToast, PrimaryButton, SideModalDialog, CompaniesCreatePage, Pagination, DraggableTable, BatchButton, AlertDialog, TableControlsBar, TableFilterButton, draggable: VueDraggableNext },
    data() {
        return {
            companySaveLoading: false,
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            controller: CompaniesController,
            cacheInvalidationType: 'companies',
            savedSuccessText: this.$t('companySaved'),
            savedErrorText: this.$t('errorSavingCompany'),
            deletedSuccessText: this.$t('companyDeleted'),
            deletedErrorText: this.$t('errorDeletingCompany'),
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

    watch: {
        modalDialog(val) {
            if (!val) this.companySaveLoading = false;
        }
    },

    methods: {
        formatDatabaseDate(date) {
            return formatDatabaseDate(date);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
               
                const per_page = this.perPage;
                
                this.data = await CompaniesController.getItems(page, per_page);
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
                    const logoUrl = item.logoUrl ? item.logoUrl() : '/logo.png';
                    return `<img src="${logoUrl}" alt="${item.name}" class="w-8 h-8 object-contain rounded">`;
                case 'createdAt':
                    return this.formatDatabaseDate(item.createdAt);
                default:
                    return item[column];
            }
        }
    },
};
</script>

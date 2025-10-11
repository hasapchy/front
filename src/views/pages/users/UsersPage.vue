<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton 
            :onclick="() => showModal(null)" 
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('users_create')">
        </PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            storage-key="usersPerPage"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <transition name="fade" mode="out-in">
        <div v-if="data && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.users" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event" :onItemClick="(i) => showModal(i)" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <UsersCreatePage ref="userscreatepageForm" @saved="handleSaved" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
            :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" :confirm-text="$t('delete')"
            :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import UsersController from '@/api/UsersController';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import UsersCreatePage from './UsersCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';

export default {
    mixins: [notificationMixin, modalMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, tableTranslationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, UsersCreatePage, Pagination, DraggableTable, BatchButton, AlertDialog },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: UsersController,
            cacheInvalidationType: 'users', // Тип кэша для инвалидации
            savedSuccessText: this.$t('userSaved'),
            savedErrorText: this.$t('errorSavingUser'),
            deletedSuccessText: this.$t('userDeleted'),
            deletedErrorText: this.$t('errorDeletingUser'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'ID', size: 60 },
                { name: 'name', label: 'name' },
                { name: 'email', label: 'email' },
                { name: 'position', label: 'position' },
                { name: 'companies', label: 'companies' },
                { name: 'isActive', label: 'active', size: 80 },
                { name: 'isAdmin', label: 'admin', size: 80 },
                { name: 'lastLoginAt', label: 'lastLogin' },
                { name: 'createdAt', label: 'created' },
            ],
            perPage: 10,
            perPageOptions: [10, 25, 50, 100]
        };
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },

    mounted() {
        this.fetchItems();
    },

    methods: {
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                this.data = await UsersController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingUsers'), error.message, true);
            }
            if (!silent) this.loading = false;
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        handleModalClose() {
            const formRef = this.$refs.userscreatepageForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },
        itemMapper(item, column) {
            switch (column) {
                case 'isActive':
                    return item.isActive ? '✅' : '❌';
                case 'isAdmin':
                    return item.isAdmin ? '✅' : '❌';
                case 'createdAt':
                    return new Date(item.createdAt).toLocaleDateString();
                case 'lastLoginAt':
                    return item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleDateString() + ' ' + new Date(item.lastLoginAt).toLocaleTimeString() : '—';
                case 'companies':
                    return item.companies.map(c => c.name).join(', ');
                default:
                    return item[column];
            }
        }
    },
};
</script>

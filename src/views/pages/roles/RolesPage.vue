<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton 
            :onclick="() => showModal(null)" 
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('users_create')">
        </PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <transition name="fade" mode="out-in">
        <div v-if="data && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.roles" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event" :onItemClick="(i) => showModal(i)" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <RolesCreatePage ref="rolescreatepageForm" @saved="handleSaved" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
            :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
    <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" :confirm-text="$t('delete')"
        :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import RolesController from '@/api/RolesController';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import RolesCreatePage from './RolesCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

export default {
    mixins: [notificationMixin, modalMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, RolesCreatePage, Pagination, DraggableTable, AlertDialog },
    data() {
        return {
            controller: RolesController,
            cacheInvalidationType: 'roles',
            savedSuccessText: this.$t('roleSaved'),
            savedErrorText: this.$t('errorSavingRole'),
            deletedSuccessText: this.$t('roleDeleted'),
            deletedErrorText: this.$t('errorDeletingRole'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'ID', size: 60 },
                { name: 'name', label: 'name' },
                { name: 'permissionsCount', label: 'permissions', size: 120 },
                { name: 'createdAt', label: 'created' },
            ]
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
                const per_page = this.perPage || 20;
                this.data = await RolesController.getItems(page, per_page);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingRoles'), error.message, true);
            }
            if (!silent) this.loading = false;
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        itemMapper(item, column) {
            switch (column) {
                case 'permissionsCount':
                    return item.permissions ? item.permissions.length : 0;
                case 'createdAt':
                    return new Date(item.created_at).toLocaleDateString();
                default:
                    return item[column];
            }
        },
        async onAfterSaved() {
            setTimeout(async () => {
                try {
                    await this.$store.dispatch('refreshUserPermissions');
                    console.log('=== ПРАВА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (после обновления) ===');
                    console.log('Права:', this.$store.state.permissions);
                    console.log('Количество прав:', this.$store.state.permissions?.length || 0);
                    console.log('Есть clients_view:', this.$store.getters.hasPermission('clients_view'));
                    console.log('Есть projects_view:', this.$store.getters.hasPermission('projects_view'));
                    console.log('Есть orders_view:', this.$store.getters.hasPermission('orders_view'));
                    console.log('Есть users_view:', this.$store.getters.hasPermission('users_view'));
                    console.log('Есть roles_view:', this.$store.getters.hasPermission('roles_view'));
                    console.log('==================================================');
                } catch (error) {
                    console.error('Ошибка обновления прав:', error);
                }
            }, 500);
        },
    },
};
</script>


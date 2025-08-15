<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus">{{ $t('addUser') }}</PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
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
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';

export default {
    mixins: [notificationMixin, modalMixin, batchActionsMixin, getApiErrorMessageMixin, tableTranslationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, UsersCreatePage, Pagination, DraggableTable, BatchButton, AlertDialog },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: UsersController,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'ID', size: 60 },
                { name: 'name', label: 'name' },
                { name: 'email', label: 'email' },
                { name: 'position', label: 'position' },
                { name: 'isActive', label: 'active', size: 80 },
                { name: 'permissions', label: 'userPermissions' },
                { name: 'createdAt', label: 'created' },
            ],
        };
    },
    created() {
        this.fetchItems();
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },

    methods: {
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                this.data = await UsersController.getItems(page);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingUsers'), error.message, true);
            }
            if (!silent) this.loading = false;
        },
        handleModalClose() {
            // Проверяем, есть ли изменения в форме
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
                case 'createdAt':
                    return new Date(item.createdAt).toLocaleDateString();
                case 'permissions':
                    return item.permissions.join(', ');
                default:
                    return item[column];
            }
        },
        handleSaved() {
            this.showNotification(this.$t('userSaved'), '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleSavedError(m) {
            this.showNotification(this.$t('errorSavingUser'), m, true);
        },
        handleDeleted() {
            this.showNotification(this.$t('userDeleted'), '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleDeletedError(m) {
            this.showNotification(this.$t('errorDeletingUser'), m, true);
        },
    },
};
</script>

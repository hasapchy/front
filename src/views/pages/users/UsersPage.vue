<template>
    <div>
        <transition name="fade" mode="out-in">
            <div v-if="data != null && !loading" key="table">
                <DraggableTable table-key="admin.users" :columns-config="columnsConfig" :table-data="data.items"
                    :item-mapper="itemMapper" @selectionChange="selectedIds = $event" :onItemClick="onItemClick">
                    <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                        <TableControlsBar :show-pagination="true"
                            :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                            :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange"
                            :resetColumns="resetColumns" :columns="columns" :toggleVisible="toggleVisible" :log="log">
                            <template #left>
                                <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
                                    :disabled="!$store.getters.hasPermission('users_create')">
                                </PrimaryButton>

                                <transition name="fade">
                                    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds"
                                        :batch-actions="getBatchActions()" />
                                </transition>
                            </template>
                            <template #right>
                                <Pagination v-if="data != null" :currentPage="data.currentPage"
                                    :lastPage="data.lastPage" :per-page="perPage" :per-page-options="perPageOptions"
                                    :show-per-page-selector="true" @changePage="(page) => fetchItems(page)"
                                    @perPageChange="handlePerPageChange" />
                            </template>

                            <template #gear="{ resetColumns, columns, toggleVisible, log }">
                                <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                    <ul>
                                        <draggable v-if="columns.length" class="dragArea list-group w-full"
                                            :list="columns" @change="log">
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
            <UsersCreatePage :key="editingItem ? editingItem.id : 'new-user'" ref="userscreatepageForm"
                @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
                @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
        </SideModalDialog>
        <SideModalDialog :showForm="salaryAccrualModalOpen" :onclose="closeSalaryAccrualModal">
            <SalaryAccrualModal v-if="salaryAccrualModalOpen" :user-ids="selectedIds" :users="getSelectedUsers()"
                :operation-type="salaryOperationType" @success="handleSalaryAccrualSuccess"
                @cancel="closeSalaryAccrualModal" />
        </SideModalDialog>
        <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
            :is-danger="notificationIsDanger" @close="closeNotification" />
        <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
            :confirm-text="$t('delete')" :leave-text="$t('cancel')" @confirm="confirmDeleteItems"
            @leave="deleteDialog = false" />
    </div>
</template>

<script>
import UsersController from '@/api/UsersController';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import UsersCreatePage from './UsersCreatePage.vue';
import SalaryAccrualModal from '@/views/components/app/SalaryAccrualModal.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import { formatDatabaseDate, formatDatabaseDateTime } from '@/utils/dateUtils';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';

export default {
    mixins: [notificationMixin, modalMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, UsersCreatePage, SalaryAccrualModal, Pagination, DraggableTable, BatchButton, AlertDialog, TableControlsBar, TableFilterButton, draggable: VueDraggableNext },
    data() {
        return {
            controller: UsersController,
            cacheInvalidationType: 'users',
            itemViewRouteName: 'UserView',
            baseRouteName: 'users',
            errorGettingItemText: this.$t('errorLoadingUsers'),
            savedSuccessText: this.$t('userSaved'),
            savedErrorText: this.$t('errorSavingUser'),
            deletedSuccessText: this.$t('userDeleted'),
            deletedErrorText: this.$t('errorDeletingUser'),
            deletePermission: 'users_delete',
            salaryAccrualModalOpen: false,
            salaryOperationType: 'salaryAccrual',
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'ID', size: 60 },
                { name: 'name', label: 'firstName' },
                { name: 'surname', label: 'lastName' },
                { name: 'email', label: 'email' },
                { name: 'position', label: 'position' },
                { name: 'roles', label: 'roles' },
                { name: 'companies', label: 'companies' },
                { name: 'isActive', label: 'active', size: 80 },
                { name: 'isAdmin', label: 'admin', size: 80 },
                { name: 'lastLoginAt', label: 'lastLogin', visible: false },
                { name: 'createdAt', label: 'created', visible: false },
            ]
        };
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },

    mounted() {
        this.fetchItems();
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        }
    },
    methods: {
        formatDatabaseDate(date) {
            return formatDatabaseDate(date);
        },
        formatDatabaseDateTime(date) {
            return formatDatabaseDateTime(date);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const per_page = this.perPage;
                this.data = await UsersController.getItems(page, per_page);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingUsers'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        itemMapper(item, column) {
            switch (column) {
                case 'isActive':
                    return item.isActive ? '✅' : '❌';
                case 'isAdmin':
                    return item.isAdmin ? '✅' : '❌';
                case 'createdAt':
                    return this.formatDatabaseDate(item.createdAt);
                case 'lastLoginAt':
                    return item.lastLoginAt ? this.formatDatabaseDateTime(item.lastLoginAt) : '—';
                case 'roles':
                    return item.roles && item.roles.length > 0 ? item.roles.join(', ') : '—';
                case 'companies':
                    return item.companies.map(c => c.name).join(', ');
                default:
                    return item[column];
            }
        },
        async handleCompanyChanged(companyId) {
            // ✅ Очищаем выбранные элементы при смене компании
            this.selectedIds = [];

            // Перезагружаем данные
            await this.fetchItems(1, false);

            // Уведомляем пользователя о смене компании
            this.$store.dispatch('showNotification', {
                title: 'Компания изменена',
                isDanger: false
            });
        },
        openSalaryAccrualModal() {
            if (!this.selectedIds?.length) {
                this.showNotification(
                    this.$t('error'),
                    this.$t('selectUsersFirst'),
                    true
                );
                return;
            }
            this.salaryAccrualModalOpen = true;
        },
        closeSalaryAccrualModal() {
            this.salaryAccrualModalOpen = false;
            this.salaryOperationType = 'salaryAccrual';
        },
        async handleSalaryAccrualSuccess() {
            this.closeSalaryAccrualModal();
            this.selectedIds = [];
            await this.fetchItems(this.data?.currentPage || 1, false);
        },
        getBatchActions() {
            const actions = [];

            if (this.$store.getters.hasPermission('employee_salaries_accrue')) {
                actions.push({
                    label: this.$t('accrueSalary'),
                    icon: "fas fa-money-bill-wave",
                    type: "success",
                    action: () => this.openSalaryOperationModal('salaryAccrual'),
                    disabled: false,
                });
                actions.push({
                    label: this.$t('paySalary'),
                    icon: "fas fa-hand-holding-usd",
                    type: "success",
                    action: () => this.openSalaryOperationModal('salaryPayment'),
                    disabled: false,
                });
                actions.push({
                    label: this.$t('bonus'),
                    icon: "fas fa-gift",
                    type: "success",
                    action: () => this.openSalaryOperationModal('bonus'),
                    disabled: false,
                });
                actions.push({
                    label: this.$t('penalty'),
                    icon: "fas fa-exclamation-triangle",
                    type: "danger",
                    action: () => this.openSalaryOperationModal('penalty'),
                    disabled: false,
                });
                actions.push({
                    label: this.$t('advance'),
                    icon: "fas fa-money-check-alt",
                    type: "success",
                    action: () => this.openSalaryOperationModal('advance'),
                    disabled: false,
                });
            }

            const deletePermissions = Array.isArray(this.deletePermission)
                ? this.deletePermission
                : (this.deletePermission ? [this.deletePermission] : ['users_delete']);

            const hasDeletePermission = deletePermissions.some(perm =>
                this.$store.getters.hasPermission(perm)
            );

            if (hasDeletePermission) {
                actions.push({
                    label: this.$t('delete'),
                    icon: "fas fa-trash",
                    type: "danger",
                    action: this.deleteItems,
                    disabled: this.loadingBatch,
                });
            }

            return actions;
        },
        getSelectedUsers() {
            if (!this.data || !this.data.items) return [];
            return this.data.items.filter(user => this.selectedIds.includes(user.id));
        },
        openSalaryOperationModal(operationType) {
            if (!this.selectedIds?.length) {
                this.showNotification(
                    this.$t('error'),
                    this.$t('selectUsersFirst'),
                    true
                );
                return;
            }
            this.salaryOperationType = operationType;
            this.salaryAccrualModalOpen = true;
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'users' });
            }
        },
    }
};
</script>
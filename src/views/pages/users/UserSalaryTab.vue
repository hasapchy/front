<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-md font-semibold">{{ $t('salaries') || 'Зарплаты' }}</h3>
            <div class="flex gap-2" v-if="canCreateSalary && canViewSalary">
                <PrimaryButton 
                    icon="fas fa-plus" 
                    :onclick="openCreateModal"
                    :is-success="true"
                    :disabled="!editingItem || !editingItem.id">
                    {{ $t('addSalary') || 'Добавить зарплату' }}
                </PrimaryButton>
            </div>
        </div>

        <div v-if="!canViewSalary" class="text-gray-500">
            {{ $t('noPermission') || 'Нет прав на просмотр зарплат' }}
        </div>
        <template v-else>
            <div v-if="salariesLoading" class="text-gray-500">{{ $t('loading') }}</div>
            <div v-else-if="!salaries || salaries.length === 0" class="text-gray-500">
                {{ $t('noSalaries') || 'Нет зарплат' }}
            </div>
            <DraggableTable 
                v-if="!salariesLoading && salaries && salaries.length > 0"
                table-key="user.salaries"
                :columns-config="columnsConfig" 
                :table-data="salaries" 
                :item-mapper="itemMapper"
                :onItemClick="canUpdateSalary ? handleSalaryClick : null" />
        </template>

        <SideModalDialog :showForm="modalOpen" :onclose="closeModal">
            <UserSalaryCreatePage 
                v-if="modalOpen && editingItem && editingItem.id"
                :editing-item="editingSalary"
                :user-id="editingItem.id"
                @saved="handleSaved"
                @deleted="handleDeleted" />
        </SideModalDialog>

        <NotificationToast 
            :title="notificationTitle" 
            :subtitle="notificationSubtitle" 
            :show="notification" 
            :is-danger="notificationIsDanger" 
            @close="closeNotification" 
        />
    </div>
</template>

<script>
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import UserSalaryCreatePage from "./UserSalaryCreatePage.vue";
import UsersController from "@/api/UsersController";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import { formatDatabaseDate } from '@/utils/dateUtils';

export default {
    mixins: [notificationMixin, getApiErrorMessage],
    components: {
        PrimaryButton,
        SideModalDialog,
        NotificationToast,
        DraggableTable,
        UserSalaryCreatePage,
    },
    props: {
        editingItem: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            salaries: [],
            salariesLoading: false,
            modalOpen: false,
            editingSalary: null,
            columnsConfig: [
                { name: 'id', label: '№', size: 60 },
                { name: 'amount', label: 'amount', size: 150, html: true },
                { name: 'startDate', label: 'startDate', size: 120 },
                { name: 'endDate', label: 'endDate', size: 120, html: true },
                { name: 'note', label: 'note', size: 200 },
            ],
        };
    },
    computed: {
        canViewSalary() {
            return this.$store.getters.hasPermission('employee_salaries_view');
        },
        canCreateSalary() {
            return this.$store.getters.hasPermission('employee_salaries_create');
        },
        canUpdateSalary() {
            return this.$store.getters.hasPermission('employee_salaries_update');
        },
        canDeleteSalary() {
            return this.$store.getters.hasPermission('employee_salaries_delete');
        },
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId && this.canViewSalary) {
                    this.fetchSalaries();
                } else {
                    this.salaries = [];
                }
            },
            immediate: true,
        },
        canViewSalary: {
            handler(newVal) {
                if (newVal && this.editingItem && this.editingItem.id) {
                    this.fetchSalaries();
                } else if (!newVal) {
                    this.salaries = [];
                }
            }
        }
    },
    methods: {
        formatDatabaseDate(date) {
            return formatDatabaseDate(date);
        },
        async fetchSalaries() {
            if (!this.editingItem || !this.editingItem.id) return;
            
            this.salariesLoading = true;
            try {
                const data = await UsersController.getSalaries(this.editingItem.id);
                this.salaries = data || [];
            } catch (e) {
                console.error('Error fetching salaries:', e);
                this.salaries = [];
            } finally {
                this.salariesLoading = false;
            }
        },
        openCreateModal() {
            this.editingSalary = null;
            this.modalOpen = true;
        },
        openEditModal(salary) {
            this.editingSalary = salary;
            this.modalOpen = true;
        },
        closeModal() {
            this.modalOpen = false;
            this.editingSalary = null;
        },
        async handleSaved() {
            this.closeModal();
            await this.fetchSalaries();
        },
        async handleDeleted() {
            this.closeModal();
            await this.fetchSalaries();
        },
        handleSalaryClick(salary) {
            if (this.canUpdateSalary) {
                this.openEditModal(salary);
            }
        },
        itemMapper(item, column) {
            switch (column) {
                case 'id':
                    return item.id || '-';
                case 'amount':
                    const amount = parseFloat(item.amount || 0);
                    const symbol = item.currency?.symbol || '';
                    return `<span class="font-semibold">${this.$formatNumber(amount, null, true)} ${symbol}</span>`;
                case 'startDate':
                    return item.start_date ? this.formatDatabaseDate(item.start_date) : '-';
                case 'endDate':
                    if (!item.end_date) {
                        return `<span class="text-gray-500">${this.$t('present') || 'по н.в.'}</span>`;
                    }
                    return this.formatDatabaseDate(item.end_date);
                case 'note':
                    return item.note || '-';
                default:
                    return item[column] || '-';
            }
        },
    }
};
</script>


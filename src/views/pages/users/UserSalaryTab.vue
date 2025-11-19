<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-md font-semibold">{{ $t('salaries') || 'Зарплаты' }}</h3>
            <PrimaryButton 
                icon="fas fa-plus" 
                :onclick="openCreateModal"
                :is-success="true"
                :disabled="!editingItem || !editingItem.id">
                {{ $t('addSalary') || 'Добавить зарплату' }}
            </PrimaryButton>
        </div>

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
            :onItemClick="handleSalaryClick" />

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
                { name: 'period', label: 'period', size: 200 },
            ],
        };
    },
    async mounted() {
        if (this.editingItem && this.editingItem.id) {
            await this.fetchSalaries();
        }
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.fetchSalaries();
                } else {
                    this.salaries = [];
                }
            },
            immediate: true,
        }
    },
    methods: {
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
            this.openEditModal(salary);
        },
        itemMapper(item, column) {
            switch (column) {
                case 'id':
                    return item.id || '-';
                case 'amount':
                    const amount = parseFloat(item.amount || 0);
                    const symbol = item.currency?.symbol || item.currency?.code || '';
                    return `<span class="font-semibold">${this.$formatNumber(amount, null, true)} ${symbol}</span>`;
                case 'startDate':
                    return item.start_date ? new Date(item.start_date).toLocaleDateString('ru-RU') : '-';
                case 'endDate':
                    if (!item.end_date) {
                        return `<span class="text-gray-500">${this.$t('present') || 'по н.в.'}</span>`;
                    }
                    return new Date(item.end_date).toLocaleDateString('ru-RU');
                case 'period':
                    const start = item.start_date ? new Date(item.start_date).toLocaleDateString('ru-RU') : '';
                    const end = item.end_date ? new Date(item.end_date).toLocaleDateString('ru-RU') : '';
                    if (start && end) {
                        return `${start} - ${end}`;
                    } else if (start) {
                        return `${start} - ${this.$t('present') || 'по н.в.'}`;
                    }
                    return '-';
                default:
                    return item[column] || '-';
            }
        },
    }
};
</script>


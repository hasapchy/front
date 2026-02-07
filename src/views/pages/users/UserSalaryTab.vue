<template>
    <div class="mt-4">
        <div v-if="!canViewSalary" class="text-gray-500">
            {{ $t('noPermission') }}
        </div>
        <transition v-else name="fade" mode="out-in">
            <div v-if="!salariesLoading" key="table">
                <DraggableTable
                    table-key="user.salaries"
                    :columns-config="columnsConfig"
                    :table-data="salaries || []"
                    :item-mapper="itemMapper"
                    :onItemClick="canUpdateSalary ? handleSalaryClick : null">
                    <template #tableSettingsAdditional>
                        <PrimaryButton
                            v-if="canCreateSalary"
                            icon="fas fa-plus"
                            :onclick="openCreateModal"
                            :is-success="true"
                            :disabled="!editingItem?.id">
                            {{ $t('addSalary') }}
                        </PrimaryButton>
                    </template>
                </DraggableTable>
            </div>
            <div v-else key="loader" class="flex justify-center items-center h-64">
                <SpinnerIcon />
            </div>
        </transition>

        <SideModalDialog :showForm="modalOpen" :onclose="closeModal">
            <UserSalaryCreatePage 
                v-if="modalOpen && editingItem && editingItem.id"
                :editing-item="editingSalary"
                :user-id="editingItem.id"
                @saved="handleSaved"
                @deleted="handleDeleted" />
        </SideModalDialog>

    </div>
</template>

<script>
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SpinnerIcon from "@/views/components/app/SpinnerIcon.vue";
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
        DraggableTable,
        SpinnerIcon,
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
                { name: 'paymentType', label: 'salaryPaymentType', size: 120, html: true },
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
                this.salaries = data?.salaries || [];
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
                case 'paymentType':
                    const paymentType = item.payment_type !== undefined ? Boolean(item.payment_type) : false;
                    const paymentTypeLabel = paymentType 
                        ? this.$t('salaryPaymentTypeCash')
                        : this.$t('salaryPaymentTypeNonCash');
                    return `<span>${paymentTypeLabel}</span>`;
                case 'startDate':
                    return item.start_date ? this.formatDatabaseDate(item.start_date) : '-';
                case 'endDate':
                    if (!item.end_date) {
                        return `<span class="text-gray-500">${this.$t('present')}</span>`;
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


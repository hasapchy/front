<template>
    <div class="mt-4">
        <div v-if="loading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="data && data.items && data.items.length === 0" class="text-gray-500">
            {{ $t('noContracts') }}
        </div>
        <DraggableTable v-if="!loading && data && data.items && data.items.length" table-key="project.contracts.all"
            :columns-config="columnsConfig" :table-data="data.items" :item-mapper="itemMapper"
            @selectionChange="selectedIds = $event" :onItemClick="handleContractClick">
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                <TableControlsBar :show-filters="true" :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()" :on-filters-reset="resetFilters"
                    :show-pagination="true"
                    :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                    :on-page-change="fetchContracts" :on-per-page-change="handlePerPageChange"
                    :resetColumns="resetColumns" :columns="columns" :toggleVisible="toggleVisible" :log="log">
                    <template #left>
                        <PrimaryButton :onclick="showAddContractModal" icon="fas fa-plus"
                            :disabled="!$store.getters.hasPermission('contracts_create')">
                        </PrimaryButton>

                        <FiltersContainer :has-active-filters="hasActiveFilters"
                            :active-filters-count="getActiveFiltersCount()" @reset="resetFilters" @apply="applyFilters">
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('project') }}</label>
                                <select v-model="projectFilter" class="w-full">
                                    <option value="">{{ $t('allProjects') }}</option>
                                    <option v-for="project in projects" :key="project.id" :value="project.id">
                                        {{ project.name }}
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('paymentStatus') }}</label>
                                <select v-model="paymentStatusFilter" class="w-full">
                                    <option value="">{{ $t('allStatuses') }}</option>
                                    <option value="1">{{ $t('paid') }}</option>
                                    <option value="0">{{ $t('notPaid') }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('contractStatus') }}</label>
                                <select v-model="contractStatusFilter" class="w-full">
                                    <option value="">{{ $t('allStatuses') }}</option>
                                    <option value="1">{{ $t('returned') }}</option>
                                    <option value="0">{{ $t('notReturned') }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('cashRegister') }}</label>
                                <select v-model="cashRegisterFilter" class="w-full">
                                    <option value="">{{ $t('allCashRegisters') }}</option>
                                    <option v-for="cashRegister in cashRegisters" :key="cashRegister.id" :value="cashRegister.id">
                                        {{ cashRegister.name }}
                                    </option>
                                </select>
                            </div>
                        </FiltersContainer>
                    </template>
                    <template #right="{ resetColumns, columns, toggleVisible, log }">
                        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
                            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
                            @changePage="fetchContracts" @perPageChange="handlePerPageChange" />
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
                                            <div><i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i>
                                            </div>
                                        </div>
                                    </li>
                                </draggable>
                            </ul>
                        </TableFilterButton>
                    </template>
                    <template #gear>
                    </template>
                </TableControlsBar>
            </template>
        </DraggableTable>

        <SideModalDialog :showForm="contractModalOpen" :onclose="closeContractModal">
            <ProjectContractCreatePage v-if="!contractLoading" :editingItem="editingContractItem"
                @saved="handleContractSaved" @saved-error="handleContractSavedError"
                @close-request="closeContractModal" />
            <div v-else-if="contractLoading" class="p-4 text-center">
                {{ $t('loading') }}...
            </div>
        </SideModalDialog>

        <AlertDialog :dialog="paidConfirmDialog" :title="$t('attention')" :descr="$t('confirmMarkAsPaidIrreversible')"
            :confirm-text="$t('yes')" :leave-text="$t('cancel')" :confirm-loading="paidConfirmLoading"
            :onConfirm="confirmMarkPaid" :onLeave="cancelMarkPaid" />
    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import TableControlsBar from "@/views/components/app/forms/TableControlsBar.vue";
import Pagination from "@/views/components/app/buttons/Pagination.vue";
import TableFilterButton from "@/views/components/app/forms/TableFilterButton.vue";
import FiltersContainer from "@/views/components/app/forms/FiltersContainer.vue";
import ProjectContractCreatePage from "./ProjectContractCreatePage.vue";
import ProjectContractController from "@/api/ProjectContractController";
import BooleanSelectCell from "@/views/components/app/buttons/BooleanSelectCell.vue";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import notificationMixin from "@/mixins/notificationMixin";
import filtersMixin from "@/mixins/filtersMixin";
import { VueDraggableNext } from 'vue-draggable-next';
import { markRaw } from "vue";

export default {
    mixins: [notificationMixin, filtersMixin],
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        TableControlsBar,
        Pagination,
        TableFilterButton,
        FiltersContainer,
        ProjectContractCreatePage,
        AlertDialog,
        draggable: VueDraggableNext,
    },
    data() {
        return {
            loading: false,
            data: null,
            selectedIds: [],
            contractModalOpen: false,
            editingContractItem: null,
            contractLoading: false,
            perPage: 20,
            perPageOptions: [10, 20, 50, 100],
            projectFilter: '',
            paymentStatusFilter: '',
            contractStatusFilter: '',
            cashRegisterFilter: '',
            projects: [],
            cashRegisters: [],
            paidConfirmDialog: false,
            paidConfirmLoading: false,
            pendingPaidChange: null,
            paidOptions: [
                { value: true, label: this.$t('paid'), color: '#5CB85C' },
                { value: false, label: this.$t('notPaid'), color: '#EE4F47' },
            ],
            returnedOptions: [
                { value: true, label: this.$t('returned'), color: '#5CB85C' },
                { value: false, label: this.$t('notReturned'), color: '#EE4F47' },
            ],
            columnsConfig: [
                { name: "id", label: "ID", size: 80 },
                { name: "projectName", label: this.$t("project"), size: 200 },
                { name: "number", label: this.$t("contractNumber"), size: 150 },
                { name: "amount", label: this.$t("amount"), size: 120, html: true },
                { name: "cashRegisterName", label: this.$t("cashRegister"), size: 150 },
                { name: "dateUser", label: this.$t("dateUser"), size: 100 },
                {
                    name: "returned",
                    label: this.$t("status"),
                    size: 140,
                    component: markRaw(BooleanSelectCell),
                    props: (i) => ({
                        value: !!i.returned,
                        options: this.returnedOptions,
                        onChange: (newValue) => this.updateContractField(i.id, 'returned', newValue),
                    }),
                },
                {
                    name: "isPaid",
                    label: this.$t("paid"),
                    size: 160,
                    component: markRaw(BooleanSelectCell),
                    props: (i) => ({
                        value: !!i.isPaid,
                        options: this.paidOptions,
                        disabled: !!i.isPaid,
                        onChange: (newValue) => this.updateContractField(i.id, 'isPaid', newValue),
                    }),
                },
                { name: "note", label: this.$t("note"), size: 200 },
            ],
        };
    },
    computed: {
        hasActiveFilters() {
            return !!this.projectFilter || this.paymentStatusFilter !== '' || this.contractStatusFilter !== '' || this.cashRegisterFilter !== '';
        },
    },
    methods: {
        async saveContractField(contractId, field, value) {
            const item = this.data?.items?.find(i => i.id === contractId);
            if (!item) return;

            const oldValue = item[field];
            item[field] = value;

            try {
                const response = await ProjectContractController.updateItem(contractId, {
                    ...item,
                    [field]: value,
                });
                const updated = response?.item;
                if (updated) {
                    Object.assign(item, updated, {
                        projectName: updated.projectName || updated.project?.name || item.projectName || '-',
                    });
                }
            } catch (error) {
                item[field] = oldValue;
                const message = error?.response?.data?.message || error?.message || 'Ошибка при сохранении';
                this.showNotification('Error', message, true);
            }
        },
        updateContractField(contractId, field, value) {
            const item = this.data?.items?.find(i => i.id === contractId);
            if (!item) return;

            if (field === 'isPaid') {
                if (item.isPaid) return;
                if (!value) return;

                this.pendingPaidChange = { contractId };
                this.paidConfirmDialog = true;
                return;
            }

            this.saveContractField(contractId, field, value);
        },
        async confirmMarkPaid() {
            const contractId = this.pendingPaidChange?.contractId;
            this.pendingPaidChange = null;
            this.paidConfirmLoading = true;

            try {
                if (contractId) {
                    await this.saveContractField(contractId, 'isPaid', true);
                }
            } finally {
                this.paidConfirmLoading = false;
                this.paidConfirmDialog = false;
            }
        },
        cancelMarkPaid() {
            this.pendingPaidChange = null;
            this.paidConfirmDialog = false;
        },
        async fetchContracts(page = 1) {
            this.loading = true;
            try {
                const params = {
                    per_page: this.perPage,
                    page: page
                };

                if (this.projectFilter) {
                    params.project_id = this.projectFilter;
                }

                if (this.paymentStatusFilter === '0' || this.paymentStatusFilter === '1') {
                    params.is_paid = this.paymentStatusFilter;
                }

                if (this.contractStatusFilter === '0' || this.contractStatusFilter === '1') {
                    params.returned = this.contractStatusFilter;
                }

                if (this.cashRegisterFilter) {
                    params.cash_id = this.cashRegisterFilter;
                }

                const response = await ProjectContractController.getAllItems(params);
                const items = (response.items || []).map(contract => ({
                    ...contract,
                    projectName: contract.projectName || contract.project?.name,
                    formatAmount() {
                        return contract.formatAmount();
                    },
                    formatDate() {
                        return contract.formatDate();
                    },
                    formatDateUser() {
                        return `${contract.formatDate()} / ${contract.user?.name || contract.userName}`;
                    }
                }));
                this.data = {
                    items: items,
                    currentPage: response.currentPage || page,
                    lastPage: response.lastPage || 1,
                    total: response.total || 0
                };
            } catch (error) {
                console.error('Error fetching contracts:', error);
                this.data = { items: [], currentPage: 1, lastPage: 1, total: 0 };
                this.showNotification('Error', 'Error loading contracts', true);
            }
            this.loading = false;
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchContracts(1);
        },
        async fetchProjects() {
            try {
                await this.$store.dispatch('loadProjects');
                this.projects = this.$store.getters.activeProjects || [];
            } catch (error) {
                console.error('Error fetching projects:', error);
                this.projects = [];
            }
        },
        async fetchCashRegisters() {
            try {
                await this.$store.dispatch('loadCashRegisters');
                this.cashRegisters = this.$store.getters.cashRegisters || [];
            } catch (error) {
                console.error('Error fetching cash registers:', error);
                this.cashRegisters = [];
            }
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                projectFilter: '',
                paymentStatusFilter: '',
                contractStatusFilter: '',
                cashRegisterFilter: ''
            }, () => {
                this.fetchContracts(1);
            });
        },
        applyFilters() {
            this.fetchContracts(1);
        },
        getActiveFiltersCount() {
            let count = 0;
            if (this.projectFilter) count++;
            if (this.paymentStatusFilter !== '') count++;
            if (this.contractStatusFilter !== '') count++;
            if (this.cashRegisterFilter !== '') count++;
            return count;
        },
        itemMapper(item, column) {
            switch (column) {
                case "projectName":
                    return item.projectName || '-';
                case "number":
                    return item.number;
                case "amount":
                    return item.formatAmount();
                case "cashRegisterName":
                    return item.cashRegisterName || '-';
                case "dateUser":
                    return item.formatDateUser ? item.formatDateUser() : `${item.formatDate()} / -`;
                case "returned":
                    return item.returned ? 1 : 0;
                case "isPaid":
                    return item.isPaid ? 1 : 0;
                case "note":
                    return item.note || '-';
                default:
                    return item[column];
            }
        },
        async handleContractClick(item) {
            try {
                this.contractLoading = true;
                const contractItem = await ProjectContractController.getItem(item.id);
                this.editingContractItem = contractItem;
                this.contractModalOpen = true;
            } catch (error) {
                console.error('Error loading contract:', error);
                const errorMessage = error?.response?.data?.message || error?.message || 'Error loading contract';
                this.showNotification('Ошибка при загрузке контракта', errorMessage, true);
            } finally {
                this.contractLoading = false;
            }
        },
        showAddContractModal() {
            this.editingContractItem = null;
            this.contractModalOpen = true;
        },
        closeContractModal() {
            this.contractModalOpen = false;
            this.editingContractItem = null;
        },
        handleContractSaved() {
            this.closeContractModal();
            this.fetchContracts(this.data?.currentPage || 1);
        },
        handleContractSavedError(error) {
            console.error('Error saving contract:', error);
        },
    },
    async mounted() {
        await this.fetchProjects();
        await this.fetchCashRegisters();
        this.fetchContracts();
    },
};
</script>

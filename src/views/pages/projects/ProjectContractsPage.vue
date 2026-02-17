<template>
    <div class="mt-4">
        <ContractsBalanceWrapper v-if="cashRegisterFilter" :data="data?.items || []" :loading="loading" />
        
        <transition name="fade" mode="out-in">
            <div v-if="data != null && !loading" key="table">
                <DraggableTable table-key="project.contracts.all"
                    :columns-config="columnsConfig" :table-data="data.items || []" :item-mapper="itemMapper"
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
                            {{ $t('addContract') }}
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
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('contractType') }}</label>
                                <select v-model="typeFilter" class="w-full">
                                    <option value="">{{ $t('allTypes') }}</option>
                                    <option :value="0">{{ $t('cashless') }}</option>
                                    <option :value="1">{{ $t('cash') }}</option>
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
                                    <li v-for="(element, index) in columns" :key="element.name" v-show="element.name !== 'select'"
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
            </div>
            <div v-else key="loader" class="min-h-64">
                <TableSkeleton />
            </div>
        </transition>

        <SideModalDialog :showForm="contractModalOpen" :onclose="closeContractModal">
            <ProjectContractCreatePage v-if="!contractLoading" :editingItem="editingContractItem"
                @saved="handleContractSaved" @saved-error="handleContractSavedError"
                @deleted="handleContractDeleted" @deleted-error="handleContractDeletedError"
                @refresh-contract="handleRefreshContract" @close-request="closeContractModal" />
            <div v-else-if="contractLoading" class="min-h-64">
                <TableSkeleton />
            </div>
        </SideModalDialog>
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
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import ContractsBalanceWrapper from "@/views/components/projects/ContractsBalanceWrapper.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import notificationMixin from "@/mixins/notificationMixin";
import getApiErrorMessageMixin from "@/mixins/getApiErrorMessageMixin";
import filtersMixin from "@/mixins/filtersMixin";
import { VueDraggableNext } from 'vue-draggable-next';
import { markRaw } from "vue";

export default {
    mixins: [notificationMixin, getApiErrorMessageMixin, filtersMixin],
    components: {
        DraggableTable,
        SideModalDialog,
        ClientButtonCell,
        PrimaryButton,
        TableControlsBar,
        Pagination,
        TableFilterButton,
        FiltersContainer,
        ProjectContractCreatePage,
        ContractsBalanceWrapper,
        TableSkeleton,
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
            perPage: (() => {
                const stored = localStorage.getItem('perPage');
                const parsed = stored ? parseInt(stored, 10) : NaN;
                return Number.isFinite(parsed) && [10, 20, 50, 100].includes(parsed) ? parsed : 20;
            })(),
            perPageOptions: [10, 20, 50, 100],
            projectFilter: '',
            paymentStatusFilter: '',
            contractStatusFilter: '',
            cashRegisterFilter: '',
            typeFilter: '',
            projects: [],
            cashRegisters: [],
            returnedOptions: [
                { value: true, label: this.$t('returned'), color: '#5CB85C' },
                { value: false, label: this.$t('notReturned'), color: '#EE4F47' },
            ],
            columnsConfig: [
                { name: "id", label: "ID", size: 80 },
                { name: "projectName", label: this.$t("project"), size: 200 },
                {
                    name: "client",
                    label: this.$t("client"),
                    size: 180,
                    component: markRaw(ClientButtonCell),
                    props: (i) => ({ client: i.clientId ? { id: i.clientId, clientName: i.clientName } : null })
                },
                { name: "number", label: this.$t("contractNumber"), size: 150 },
                { name: "type", label: this.$t("contractType"), size: 120 },
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
                        onChange: (newValue) => this.saveContractField(i.id, 'returned', newValue),
                    }),
                },
                {
                    name: "paymentStatusText",
                    label: this.$t("paymentStatus"),
                    size: 140,
                    html: true,
                },
                { name: "note", label: this.$t("note"), size: 200 },
            ],
        };
    },
    computed: {
        hasActiveFilters() {
            return !!this.projectFilter || this.paymentStatusFilter !== '' || this.contractStatusFilter !== '' || this.cashRegisterFilter !== '' || this.typeFilter !== '';
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
                const msg = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), Array.isArray(msg) ? msg.join(', ') : msg, true);
            }
        },
        getContractPaymentStatusClass(item) {
            const status = item.payment_status || item.paymentStatus || 'unpaid';
            if (status === 'paid') return 'text-[#5CB85C] font-medium';
            if (status === 'partially_paid') return 'text-[#FFA500] font-medium';
            return 'text-[#EE4F47] font-medium';
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
                    params.is_paid = this.paymentStatusFilter === '1';
                }

                if (this.contractStatusFilter === '0' || this.contractStatusFilter === '1') {
                    params.returned = this.contractStatusFilter;
                }

                if (this.cashRegisterFilter) {
                    params.cash_id = this.cashRegisterFilter;
                }

                if (this.typeFilter !== '') {
                    params.type = this.typeFilter;
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
                        return `${contract.formatDate()} / ${contract.user?.name || contract.userName || contract.creator_name || '-'}`;
                    }
                }));
                this.data = {
                    items: items,
                    currentPage: response.currentPage || page,
                    lastPage: response.lastPage || 1,
                    total: response.total || 0
                };
            } catch {
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
            } catch {
                this.projects = [];
            }
        },
        async fetchCashRegisters() {
            try {
                await this.$store.dispatch('loadCashRegisters');
                this.cashRegisters = this.$store.getters.cashRegisters || [];
            } catch {
                this.cashRegisters = [];
            }
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                projectFilter: '',
                paymentStatusFilter: '',
                contractStatusFilter: '',
                cashRegisterFilter: '',
                typeFilter: ''
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
            if (this.typeFilter !== '') count++;
            return count;
        },
        formatTotals(totalsByCurrency) {
            const result = Object.entries(totalsByCurrency || {})
                .map(([currencySymbol, amount]) => `${this.$formatNumber(amount || 0, null, true)} ${currencySymbol}`.trim())
                .join(' / ');

            return result || '0';
        },
        itemMapper(item, column) {
            switch (column) {
                case "client":
                    return item.clientName || '-';
                case "projectName":
                    return item.projectName || '-';
                case "number":
                    return item.number;
                case "type":
                    return item.type === 1 ? this.$t('cash') : this.$t('cashless');
                case "amount":
                    return item.formatAmount();
                case "cashRegisterName":
                    return item.cashRegisterName || '-';
                case "dateUser":
                    return item.formatDateUser ? item.formatDateUser() : `${item.formatDate()} / ${item.userName || item.creator_name || '-'}`;
                case "returned":
                    return item.returned ? 1 : 0;
                case "paymentStatusText": {
                    const status = item.payment_status || item.paymentStatus || ((item.paid_amount ?? 0) >= (item.amount ?? 0)
                        ? 'paid'
                        : ((item.paid_amount ?? 0) > 0 ? 'partially_paid' : 'unpaid'));

                    const cls = this.getContractPaymentStatusClass(item);

                    let iconClass = 'fas fa-times-circle';
                    if (status === 'paid') {
                        iconClass = 'fas fa-check-circle';
                    } else if (status === 'partially_paid') {
                        iconClass = 'fas fa-adjust';
                    }

                    const paidAmount = item.paid_amount ?? item.paidAmount ?? 0;
                    const currencySymbol = item.currency_symbol ?? item.currencySymbol ?? '';
                    const showAmount = status === 'partially_paid' && paidAmount > 0;
                    const formattedAmount = showAmount
                        ? `${this.$formatNumber(paidAmount, null, true)} ${currencySymbol}`.trim()
                        : '';

                    const title = item.payment_status_text || item.paymentStatusText || '';

                    const amountHtml = showAmount && formattedAmount
                        ? `<span class="ml-1">${formattedAmount}</span>`
                        : '';

                    return `<span class="${cls}" title="${title}"><i class="${iconClass}"></i>${amountHtml}</span>`;
                }
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
                const msg = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), Array.isArray(msg) ? msg.join(', ') : msg, true);
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
            const msg = this.getApiErrorMessage(error);
            const text = Array.isArray(msg) ? msg.join(', ') : msg;
            this.showNotification(this.$t('error'), text, true);
        },
        handleContractDeleted() {
            this.closeContractModal();
            this.fetchContracts(this.data?.currentPage || 1);
        },
        handleContractDeletedError(error) {
            const msg = this.getApiErrorMessage(error);
            const text = Array.isArray(msg) ? msg.join(', ') : msg;
            this.showNotification(this.$t('error'), text, true);
        },
        async handleRefreshContract() {
            if (this.editingContractItem?.id) {
                const updated = await ProjectContractController.getItem(this.editingContractItem.id);
                this.editingContractItem = updated;
            }
        },
    },
    async mounted() {
        if (!(this.$store.getters.activeProjects?.length)) {
            await this.fetchProjects();
        } else {
            this.projects = this.$store.getters.activeProjects || [];
        }
        if (!(this.$store.getters.cashRegisters?.length)) {
            await this.fetchCashRegisters();
        } else {
            this.cashRegisters = this.$store.getters.cashRegisters || [];
        }
        this.fetchContracts();
    },
};
</script>

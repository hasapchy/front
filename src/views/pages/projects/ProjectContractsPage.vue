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
                <TableControlsBar
                    :show-filters="true"
                    :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()"
                    :on-filters-reset="resetFilters"
                    :show-pagination="true"
                    :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                    :on-page-change="fetchContracts"
                    :on-per-page-change="handlePerPageChange"
                    :resetColumns="resetColumns"
                    :columns="columns"
                    :toggleVisible="toggleVisible"
                    :log="log">
                        <template #left>
                            <PrimaryButton 
                                :onclick="showAddContractModal" 
                                icon="fas fa-plus"
                                :disabled="!$store.getters.hasPermission('contracts_create')">
                            </PrimaryButton>
                            
                            <FiltersContainer
                                :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()"
                                @reset="resetFilters"
                                @apply="applyFilters">
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('project') || 'Проект' }}</label>
                                    <select v-model="projectFilter" class="w-full">
                                        <option value="">{{ $t('allProjects') || 'Все проекты' }}</option>
                                        <option v-for="project in projects" :key="project.id" :value="project.id">
                                            {{ project.name }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('paymentStatus') || 'Статус оплаты' }}</label>
                                    <select v-model="paymentStatusFilter" class="w-full">
                                        <option value="">{{ $t('allStatuses') || 'Все статусы' }}</option>
                                        <option value="1">{{ $t('paid') || 'Оплачено' }}</option>
                                        <option value="0">{{ $t('notPaid') || 'Не оплачено' }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('contractStatus') || 'Статус контракта' }}</label>
                                    <select v-model="contractStatusFilter" class="w-full">
                                        <option value="">{{ $t('allStatuses') || 'Все статусы' }}</option>
                                        <option value="1">{{ $t('returned') || 'Возвращен' }}</option>
                                        <option value="0">{{ $t('notReturned') || 'Не возвращен' }}</option>
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
                                            <div><i
                                                    class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i>
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
import notificationMixin from "@/mixins/notificationMixin";
import { VueDraggableNext } from 'vue-draggable-next';

export default {
    mixins: [notificationMixin],
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        TableControlsBar,
        Pagination,
        TableFilterButton,
        FiltersContainer,
        ProjectContractCreatePage,
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
            projects: [],
            columnsConfig: [
                { name: "id", label: "ID", size: 80 },
                { name: "projectName", label: this.$t("project"), size: 200 },
                { name: "number", label: this.$t("contractNumber"), size: 150 },
                { name: "amount", label: this.$t("amount"), size: 120, html: true },
                { name: "dateUser", label: this.$t("dateUser"), size: 100 },
                { name: "returned", label: this.$t("status"), size: 100, html: true },
                { name: "isPaid", label: this.$t("paid"), size: 120, html: true },
                { name: "note", label: this.$t("note"), size: 200 },
            ],
        };
    },
    computed: {
        hasActiveFilters() {
            return !!this.projectFilter || this.paymentStatusFilter !== '' || this.contractStatusFilter !== '';
        },
    },
    methods: {
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
                
                const response = await ProjectContractController.getAllItems(params);
                const items = (response.items || []).map(contract => ({
                    ...contract,
                    projectName: contract.projectName || contract.project?.name || '-',
                    formatAmount() {
                        return contract.formatAmount();
                    },
                    formatDate() {
                        return contract.formatDate();
                    },
                    formatDateUser() {
                        return `${contract.formatDate()} / ${contract.user?.name || contract.userName || "-"}`;
                    },
                    formatReturnedStatus() {
                        const status = contract.getReturnedStatus();
                        const color = contract.returned ? '#5CB85C' : '#EE4F47';
                        return `<span style="color:${color};font-weight:bold">${status}</span>`;
                    },
                    formatPaidStatus() {
                        const status = contract.getPaidStatus();
                        const color = contract.isPaid ? '#5CB85C' : '#EE4F47';
                        return `<span style="color:${color};font-weight:bold">${status}</span>`;
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
                this.showNotification('Ошибка', 'Ошибка при загрузке контрактов', true);
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
        resetFilters() {
            this.projectFilter = '';
            this.paymentStatusFilter = '';
            this.contractStatusFilter = '';
            this.fetchContracts(1);
        },
        applyFilters() {
            this.fetchContracts(1);
        },
        getActiveFiltersCount() {
            let count = 0;
            if (this.projectFilter) count++;
            if (this.paymentStatusFilter !== '') count++;
            if (this.contractStatusFilter !== '') count++;
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
                case "dateUser":
                    return item.formatDateUser ? item.formatDateUser() : `${item.formatDate()} / -`;
                case "returned":
                    return item.formatReturnedStatus();
                case "isPaid":
                    return item.formatPaidStatus();
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
                const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка при загрузке контракта';
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
            console.error('Ошибка сохранения контракта:', error);
        },
    },
    async mounted() {
        await this.fetchProjects();
        this.fetchContracts();
    },
};
</script>


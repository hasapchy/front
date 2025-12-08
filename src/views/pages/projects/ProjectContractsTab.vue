<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-md font-semibold">{{ $t('contracts') }}</h3>
            <PrimaryButton v-if="$store.getters.hasPermission('projects_create')" icon="fas fa-plus"
                :onclick="showAddContractModal" :is-small="true">
                {{ $t('addContract') }}
            </PrimaryButton>
        </div>

        <div v-if="loading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="contracts.length === 0" class="text-gray-500">
            {{ $t('noContracts') }}
        </div>
        <DraggableTable v-if="!loading && contracts.length" table-key="project.contracts"
            :columns-config="columnsConfig" :table-data="contracts" :item-mapper="itemMapper"
            @selectionChange="selectedIds = $event" :onItemClick="handleContractClick" />

        <SideModalDialog :showForm="contractModalOpen" :onclose="closeContractModal">
            <ProjectContractCreatePage v-if="!contractLoading && editingItem?.id" :editingItem="editingContractItem"
                :projectId="editingItem.id" @saved="handleContractSaved" @saved-error="handleContractSavedError"
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
import ProjectContractCreatePage from "./ProjectContractCreatePage.vue";
import ProjectContractController from "@/api/ProjectContractController";
import notificationMixin from "@/mixins/notificationMixin";

export default {
    mixins: [notificationMixin],
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        ProjectContractCreatePage,
    },
    props: {
        editingItem: { required: true },
    },
    data() {
        return {
            loading: false,
            contracts: [],
            selectedIds: [],
            contractModalOpen: false,
            editingContractItem: null,
            contractLoading: false,
            columnsConfig: [
                { name: "number", label: this.$t("contractNumber"), size: 150 },
                { name: "amount", label: this.$t("amount"), size: 120, html: true },
                { name: "description", label: this.$t("description"), size: 200 },
                { name: "date", label: this.$t("date"), size: 100 },
                { name: "returned", label: this.$t("status"), size: 100, html: true },
                { name: "note", label: this.$t("note"), size: 200 },
                { name: "files", label: this.$t("files"), size: 80, html: true },
            ],
        };
    },
    methods: {
        async fetchContracts() {
            if (!this.editingItem) return;
            this.loading = true;
            try {
                const items = await ProjectContractController.getListItems(this.editingItem.id);
                this.contracts = items.map(contract => ({
                    ...contract,
                    formatAmount() {
                        return contract.formatAmount();
                    },
                    formatDate() {
                        return contract.formatDate();
                    },
                    formatReturnedStatus() {
                        const status = contract.getReturnedStatus();
                        const color = contract.returned ? '#5CB85C' : '#EE4F47';
                        return `<span style="color:${color};font-weight:bold">${status}</span>`;
                    },
                    formatFiles() {
                        const count = contract.files ? contract.files.length : 0;
                        if (count === 0) return '-';
                        return `<span class="text-blue-600"><i class="fas fa-file"></i> ${count}</span>`;
                    }
                }));
            } catch (error) {
                console.error('Error fetching contracts:', error);
                this.contracts = [];
            }
            this.loading = false;
        },
        itemMapper(item, column) {
            switch (column) {
                case "number":
                    return item.number;
                case "amount":
                    return item.formatAmount();
                case "description":
                    return item.note || '-';
                case "date":
                    return item.formatDate();
                case "returned":
                    return item.formatReturnedStatus();
                case "note":
                    return item.note || '-';
                case "files":
                    return item.formatFiles();
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
            // Небольшая задержка для обновления кэша на backend
            setTimeout(() => {
                this.fetchContracts();
            }, 100);
        },
        handleContractSavedError(error) {
            console.error('Ошибка сохранения контракта:', error);
        },
    },
    watch: {
        editingItem: {
            handler() {
                this.fetchContracts();
            },
            immediate: true,
        },
    },
};
</script>

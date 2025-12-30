<template>
    <div class="mt-4">
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
                { name: "id", label: "ID", size: 80 },
                { name: "number", label: this.$t("contractNumber"), size: 150 },
                { name: "amount", label: this.$t("amount"), size: 120, html: true },
                { name: "dateUser", label: this.$t("dateUser"), size: 100 },
                { name: "returned", label: this.$t("status"), size: 100, html: true },
                { name: "isPaid", label: this.$t("paid"), size: 120, html: true },
                { name: "note", label: this.$t("note"), size: 200 },
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

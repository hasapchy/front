<template>
    <div class="mt-4">
        <transition name="fade" mode="out-in">
            <div v-if="!loading" key="content">
                <div v-if="hasContractsTotals" class="mb-4">
                    <div class="flex items-center gap-6 flex-wrap">
                        <span class="flex items-center gap-2">
                            <i class="fas fa-check-circle text-[#5CB85C]"></i>
                            <b class="text-[#5CB85C]">{{ paidTotalDisplay }}</b>
                        </span>
                        <span class="flex items-center gap-2">
                            <i class="fas fa-times-circle text-[#EE4F47]"></i>
                            <b class="text-[#EE4F47]">{{ unpaidTotalDisplay }}</b>
                        </span>
                        <span class="flex items-center gap-2">
                            <i class="fas fa-wallet text-blue-500"></i>
                            <b class="text-blue-600">{{ totalDisplay }}</b>
                        </span>
                    </div>
                </div>
                <DraggableTable table-key="project.contracts"
                    :columns-config="columnsConfig" :table-data="contracts" :item-mapper="itemMapper"
                    @selectionChange="selectedIds = $event" :onItemClick="handleContractClick">
                    <template #tableSettingsAdditional>
                        <PrimaryButton
                            icon="fas fa-plus"
                            :onclick="showAddContractModal"
                            :is-small="true">
                            {{ $t('addContract') }}
                        </PrimaryButton>
                    </template>
                </DraggableTable>
            </div>
            <div v-else key="loader" class="min-h-64">
                <TableSkeleton />
            </div>
        </transition>

        <SideModalDialog :showForm="contractModalOpen" :onclose="closeContractModal">
            <ProjectContractCreatePage v-if="!contractLoading && editingItem?.id" :editingItem="editingContractItem"
                :projectId="editingItem.id" @saved="handleContractSaved" @saved-error="handleContractSavedError"
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
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import ProjectContractCreatePage from "./ProjectContractCreatePage.vue";
import ProjectContractController from "@/api/ProjectContractController";
import notificationMixin from "@/mixins/notificationMixin";
import getApiErrorMessageMixin from "@/mixins/getApiErrorMessageMixin";

export default {
    mixins: [notificationMixin, getApiErrorMessageMixin],
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        TableSkeleton,
        ProjectContractCreatePage,
    },
    props: {
        editingItem: { required: true },
    },
    data() {
        return {
            loading: false,
            contracts: [],
            lastFetchedProjectId: null,
            forceRefresh: false,
            selectedIds: [],
            contractModalOpen: false,
            editingContractItem: null,
            contractLoading: false,
            columnsConfig: [
                { name: "id", label: "ID", size: 80 },
                { name: "number", label: this.$t("contractNumber"), size: 150 },
                { name: "amount", label: this.$t("amount"), size: 120, html: true },
                { name: "cashRegisterName", label: this.$t("cashRegister"), size: 150 },
                { name: "dateUser", label: this.$t("dateUser"), size: 100 },
                { name: "returned", label: this.$t("status"), size: 100, html: true },
                { name: "paymentStatusText", label: this.$t("paymentStatus"), size: 140, html: true },
                { name: "note", label: this.$t("note"), size: 200 },
            ],
        };
    },
    computed: {
        paidTotalDisplay() {
            return this.formatTotals(this.contractTotals.paid);
        },
        unpaidTotalDisplay() {
            return this.formatTotals(this.contractTotals.unpaid);
        },
        totalDisplay() {
            return this.formatTotals(this.contractTotals.total);
        },
        hasContractsTotals() {
            return (this.contracts || []).length > 0;
        },
        contractTotals() {
            const paid = {};
            const unpaid = {};
            const total = {};

            for (const contract of this.contracts || []) {
                const currencySymbol = contract.currencySymbol || 'Нет валюты';
                const amount = parseFloat(contract.amount || 0);

                if (Number.isNaN(amount)) {
                    continue;
                }

                total[currencySymbol] = (total[currencySymbol] || 0) + amount;
                const paidAmount = parseFloat(contract.paidAmount ?? contract.paid_amount ?? 0);
                const isPaid = !Number.isNaN(paidAmount) && paidAmount >= amount;
                if (isPaid) {
                    paid[currencySymbol] = (paid[currencySymbol] || 0) + amount;
                } else {
                    unpaid[currencySymbol] = (unpaid[currencySymbol] || 0) + amount;
                }
            }

            return { paid, unpaid, total };
        },
    },
    methods: {
        formatTotals(totalsByCurrency) {
            const result = Object.entries(totalsByCurrency || {})
                .map(([currencySymbol, amount]) => `${this.$formatNumber(amount || 0, null, true)} ${currencySymbol}`.trim())
                .join(' / ');

            return result || '0';
        },
        async fetchContracts() {
            if (!this.editingItem) return;
            if (this.lastFetchedProjectId === this.editingItem.id && !this.forceRefresh) {
                return;
            }
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
                        return `${contract.formatDate()} / ${contract.user?.name || contract.userName || contract.creator_name || '-'}`;
                    },
                    formatReturnedStatus() {
                        const status = contract.getReturnedStatus();
                        const color = contract.returned ? '#5CB85C' : '#EE4F47';
                        return `<span style="color:${color};font-weight:bold">${status}</span>`;
                    },
                    formatPaidStatus() {
                        const st = contract.paymentStatus || contract.payment_status || ((contract.paidAmount ?? 0) >= (contract.amount ?? 0) ? 'paid' : ((contract.paidAmount ?? 0) > 0 ? 'partially_paid' : 'unpaid'));
                        const color = st === 'paid' ? '#5CB85C' : (st === 'partially_paid' ? '#FFA500' : '#EE4F47');

                        let iconClass = 'fas fa-times-circle';
                        if (st === 'paid') {
                            iconClass = 'fas fa-check-circle';
                        } else if (st === 'partially_paid') {
                            iconClass = 'fas fa-adjust';
                        }

                        const title = contract.getPaidStatus();
                        return `<span style="color:${color};font-weight:bold" title="${title}"><i class="${iconClass}"></i></span>`;
                    }
                }));
                this.lastFetchedProjectId = this.editingItem.id;
                this.forceRefresh = false;
            } catch {
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
                case "cashRegisterName":
                    return item.cashRegisterName || '-';
                case "dateUser":
                    return item.formatDateUser ? item.formatDateUser() : `${item.formatDate()} / ${item.userName || item.creator_name || '-'}`;
                case "returned":
                    return item.formatReturnedStatus();
                case "paymentStatusText":
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
        async handleRefreshContract() {
            if (this.editingContractItem?.id) {
                const updated = await ProjectContractController.getItem(this.editingContractItem.id);
                this.editingContractItem = updated;
            }
        },
        closeContractModal() {
            this.contractModalOpen = false;
            this.editingContractItem = null;
        },
        handleContractSaved() {
            this.closeContractModal();
            this.forceRefresh = true;
            this.fetchContracts();
        },
        handleContractSavedError(error) {
            const msg = this.getApiErrorMessage(error);
            const text = Array.isArray(msg) ? msg.join(', ') : msg;
            this.showNotification(this.$t('error'), text, true);
        },
        handleContractDeleted() {
            this.closeContractModal();
            this.forceRefresh = true;
            this.fetchContracts();
        },
        handleContractDeletedError(error) {
            const msg = this.getApiErrorMessage(error);
            const text = Array.isArray(msg) ? msg.join(', ') : msg;
            this.showNotification(this.$t('error'), text, true);
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

<template>
    <div class="mt-4">
        <h3 class="text-md font-semibold mb-2">{{ $t('balanceHistory') }}</h3>
        <div class="mb-2 flex items-center gap-2">
                          <span>{{ $t('finalBalance') }}:</span>
            <span :class="{
                'text-[#5CB85C] font-bold': balance >= 0,
                'text-[#EE4F47] font-bold': balance < 0
            }">
                {{ balanceFormatted }} TMT
            </span>
            <span class="ml-4">{{ $t('budget') }}: <b>{{ budgetFormatted }} TMT</b></span>
        </div>
        <div v-if="balanceLoading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="balanceHistory.length === 0" class="text-gray-500">
            {{ $t('noHistory') }}
        </div>
        <DraggableTable v-if="!balanceLoading && balanceHistory.length" table-key="project.balance"
            :columns-config="columnsConfig" :table-data="balanceHistory" :item-mapper="itemMapper"
            @selectionChange="selectedIds = $event" :onItemClick="handleBalanceItemClick" />
    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import ProjectController from "@/api/ProjectController";
// import ProjectBalanceHistoryDto from "@/dto/project/ProjectBalanceHistoryDto"; // если используете

export default {
    components: { DraggableTable },
    props: {
        editingItem: { required: true },
    },
    data() {
        return {
            balanceLoading: false,
            balanceHistory: [],
            balance: 0,
            budget: 0,
            columnsConfig: [
                { name: "date", label: this.$t("date"), size: 100 },
                { name: "source", label: this.$t("type") },
                { name: "description", label: this.$t("description"), size: 600 },
                { name: "amount", label: this.$t("amount"), size: 120, html: true },
            ],
        };
    },
    computed: {
        balanceFormatted() {
            return this.balance ? parseFloat(this.balance).toFixed(2) : "0.00";
        },
        budgetFormatted() {
            return this.budget ? parseFloat(this.budget).toFixed(2) : "0.00";
        },
    },
    mounted() {
        this.fetchBalanceHistory();
    },
    methods: {
        async fetchBalanceHistory() {
            if (!this.editingItem) return;
            this.balanceLoading = true;
            try {
                const data = await ProjectController.getBalanceHistory(this.editingItem.id);
                this.balanceHistory = (data.history || []).map(
                    (item) => ({
                        ...item,
                        formatDate() {
                            return item.date ? new Date(item.date).toLocaleString() : "";
                        },
                        formatAmountWithColor() {
                            const val = parseFloat(item.amount);
                            const color = val >= 0 ? "#5CB85C" : "#EE4F47";
                            return `<span style="color:${color};font-weight:bold">${val.toFixed(2)}</span>`;
                        },
                        label() {
                            switch (item.source) {
                                case "transaction": return this.$t('transaction');
                                case "sale": return this.$t('sale');
                                case "order": return this.$t('order');
                                case "receipt": return this.$t('receipt');
                                default: return item.source;
                            }
                        }
                    })
                );
                this.balance = data.balance;
                this.budget = data.budget;
            } catch (e) {
                console.error(this.$t("errorLoadingBalanceHistory"), e);
                this.balanceHistory = [];
                this.balance = 0;
                this.budget = 0;
            }
            this.balanceLoading = false;
        },
        itemMapper(i, c) {
            switch (c) {
                case "date":
                    return i.formatDate();
                case "source":
                    return i.label?.() ?? i.source;
                case "description":
                    return i.description;
                case "amount":
                    return i.formatAmountWithColor?.();
                default:
                    return i[c];
            }
        },
        handleBalanceItemClick(item) {
            // Аналогично ClientBalanceTab.vue, если нужно открывать модалки сущностей
        },
    },
    watch: {
        editingItem: {
            handler() {
                this.fetchBalanceHistory();
            },
            immediate: true,
        },
    },
};
</script>
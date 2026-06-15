<template>
  <div class="flex h-full min-h-0 flex-col gap-4">
    <div
      v-if="account"
      class="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">
            {{ account.displayName }}
          </h2>
          <p class="text-sm text-[var(--text-muted)]">
            {{ $t(`financialAccountType.${account.type}`) }}
          </p>
        </div>
        <div class="flex gap-6 text-sm">
          <div>
            <span class="text-[var(--text-muted)]">{{ $t('balance') }}:</span>
            <span class="ml-2 font-semibold">{{ formatAmount(account.balance) }}</span>
          </div>
          <div>
            <span class="text-[var(--text-muted)]">{{ $t('turnover') }}:</span>
            <span class="ml-2 font-semibold">{{ formatAmount(account.turnover) }}</span>
          </div>
        </div>
      </div>
    </div>

    <CardListViewShell
      v-if="!loading"
      display-view-mode="table"
    >
      <template #table>
        <DraggableTable
          table-key="finance.financial_account_history"
          :columns-config="historyColumns"
          :table-data="flatHistoryRows"
          :item-mapper="historyItemMapper"
        >
          <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
            <TableControlsBar
              :show-pagination="true"
              :pagination-data="paginationData"
              :on-page-change="onPageChange"
              :reset-columns="resetColumns"
              :columns="columns"
              :toggle-visible="toggleVisible"
              :log="log"
            />
          </template>
        </DraggableTable>
      </template>
    </CardListViewShell>
    <TableSkeleton
      v-else
      :columns="5"
    />
  </div>
</template>

<script>
import FinancialAccountController from '@/api/FinancialAccountController';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import { formatCurrencyForDisplay } from '@/utils/numberUtils';
import dayjs from 'dayjs';

export default {
    components: {
        DraggableTable,
        TableControlsBar,
        TableSkeleton,
        CardListViewShell,
    },
    mixins: [companyChangeMixin, getApiErrorMessageMixin, notificationMixin],
    data() {
        return {
            loading: false,
            account: null,
            historyItems: [],
            meta: {},
            page: 1,
            perPage: 20,
            expandedTransactions: {},
            historyColumns: [
                { name: 'dateFormatted', label: 'date', visible: true },
                { name: 'documentLabel', label: 'document', visible: true },
                { name: 'clientName', label: 'counterparty', visible: true },
                { name: 'amountFormatted', label: 'amount', visible: true },
                { name: 'changeFormatted', label: 'change', visible: true },
                { name: 'balanceAfterFormatted', label: 'balanceAfterOperation', visible: true },
            ],
        };
    },
    computed: {
        flatHistoryRows() {
            const rows = [];
            for (const group of this.historyItems) {
                const txKey = group.transaction_id;
                const isExpanded = this.expandedTransactions[txKey] ?? (group.movements?.length > 1);
                const netChange = Number(group.net_change ?? 0);
                rows.push({
                    rowKey: `tx-${txKey}`,
                    transactionId: txKey,
                    isGroup: true,
                    isExpandable: (group.movements?.length ?? 0) > 1,
                    isExpanded,
                    dateFormatted: group.transaction_date ? dayjs(group.transaction_date).format('DD.MM.YYYY HH:mm') : '—',
                    documentLabel: group.document ? `${group.document.type} #${group.document.id}` : '—',
                    clientName: group.client?.name ?? '—',
                    amountFormatted: this.formatMovementsTotal(group.movements),
                    changeFormatted: this.formatSigned(netChange),
                    balanceAfterFormatted: this.formatAmount(group.balance_after),
                    onToggle: () => this.toggleTransaction(txKey),
                });
                if (isExpanded) {
                    for (const movement of group.movements ?? []) {
                        rows.push({
                            rowKey: `mv-${movement.id}`,
                            isChild: true,
                            dateFormatted: '',
                            documentLabel: `↳ ${movement.account_code} ${movement.account_name}`,
                            clientName: movement.direction,
                            amountFormatted: this.formatAmount(movement.amount_def),
                            changeFormatted: this.formatSigned(movement.delta ?? 0),
                            balanceAfterFormatted: this.formatAmount(movement.balance_after),
                        });
                    }
                }
            }
            return rows;
        },
        paginationData() {
            if (!this.meta?.total) return null;
            return {
                current_page: this.meta.current_page,
                per_page: this.meta.per_page,
                total: this.meta.total,
                last_page: this.meta.last_page,
            };
        },
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(id) {
                if (id) {
                    this.fetchAccount(id);
                }
            },
        },
    },
    methods: {
        async fetchAccount(id) {
            this.loading = true;
            try {
                const data = await FinancialAccountController.getItem(id);
                this.account = data.account;
                this.historyItems = data.history.items ?? [];
                this.meta = data.history.meta ?? {};
            } catch (error) {
                this.showError(this.getApiErrorMessage(error));
            } finally {
                this.loading = false;
            }
        },
        async onPageChange(page) {
            this.page = page;
            const id = this.$route.params.id;
            if (!id) return;
            this.loading = true;
            try {
                const data = await FinancialAccountController.getHistory(id, page, this.perPage);
                this.historyItems = data.items ?? [];
                this.meta = data.meta ?? {};
            } catch (error) {
                this.showError(this.getApiErrorMessage(error));
            } finally {
                this.loading = false;
            }
        },
        historyItemMapper(item) {
            return item;
        },
        toggleTransaction(transactionId) {
            this.expandedTransactions = {
                ...this.expandedTransactions,
                [transactionId]: !this.expandedTransactions[transactionId],
            };
        },
        formatAmount(value) {
            return formatCurrencyForDisplay(Number(value ?? 0), '', true);
        },
        formatSigned(value) {
            const num = Number(value ?? 0);
            const prefix = num > 0 ? '+' : '';
            return `${prefix}${this.formatAmount(num)}`;
        },
        formatMovementsTotal(movements) {
            if (!movements?.length) return '—';
            if (movements.length === 1) {
                return this.formatAmount(movements[0].amount_def);
            }
            return `${movements.length} ${this.$t('movements')}`;
        },
        onCompanyChanged() {
            const id = this.$route.params.id;
            if (id) {
                this.fetchAccount(id);
            }
        },
    },
};
</script>

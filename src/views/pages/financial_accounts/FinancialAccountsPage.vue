<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="!loading"
        display-view-mode="table"
      >
        <template #table>
          <DraggableTable
            table-key="finance.financial_accounts"
            :columns-config="columnsConfig"
            :table-data="accounts"
            :item-mapper="itemMapper"
            :on-item-click="onAccountClick"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :show-pagination="false"
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
        :columns="3"
      />
    </transition>
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
            accounts: [],
            columnsConfig: [
                { name: 'displayName', label: 'financialAccount', visible: true },
                { name: 'balanceFormatted', label: 'balance', visible: true },
                { name: 'turnoverFormatted', label: 'turnover', visible: true },
                { name: 'typeLabel', label: 'accountType', visible: true },
            ],
        };
    },
    mounted() {
        this.fetchItems();
    },
    methods: {
        async fetchItems() {
            this.loading = true;
            try {
                this.accounts = await FinancialAccountController.getItems();
            } catch (error) {
                this.showError(this.getApiErrorMessage(error));
            } finally {
                this.loading = false;
            }
        },
        itemMapper(item) {
            return {
                ...item,
                displayName: item.displayName,
                balanceFormatted: formatCurrencyForDisplay(item.balance, '', true),
                turnoverFormatted: formatCurrencyForDisplay(item.turnover, '', true),
                typeLabel: this.$t(`financialAccountType.${item.type}`),
            };
        },
        onAccountClick(item) {
            this.$router.push({ name: 'FinancialAccountView', params: { id: item.id } });
        },
        onCompanyChanged() {
            this.fetchItems();
        },
    },
};
</script>

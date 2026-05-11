<template>
  <div>
    <div class="mb-3 flex gap-2">
      <button
        class="primary-btn"
        :disabled="!$store.getters.hasPermission('warehouse_purchases_create')"
        @click="openCreate"
      >
        {{ $t('create') }}
      </button>
      <button v-if="selectedId" class="primary-btn" @click="loadPurchase(selectedId)">{{ $t('refresh') }}</button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ $t('status') }}</th>
              <th>{{ $t('client') }}</th>
              <th>{{ $t('totalAmount') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.id"
              class="cursor-pointer"
              @click="loadPurchase(item.id)"
            >
              <td>{{ item.id }}</td>
              <td>{{ item.status }}</td>
              <td>{{ item.supplier?.display_name || item.supplier?.first_name || '-' }}</td>
              <td>{{ item.amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="selected">
        <TabBar :tabs="detailTabs" :active-tab="activeTab" :tab-click="(t) => activeTab = t" />
        <div class="mt-3" v-if="activeTab === 'info'">
          <div class="mb-2">{{ $t('status') }}: {{ selected.status }}</div>
          <div class="mb-2">{{ $t('totalAmount') }}: {{ selected.amount }}</div>
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th>{{ $t('product') }}</th>
                <th>{{ $t('quantity') }}</th>
                <th>{{ $t('price') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in (selected.products || [])" :key="p.id">
                <td>{{ p.product_name }}</td>
                <td>{{ p.quantity }}</td>
                <td>{{ p.price }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-3" v-else-if="activeTab === 'transactions'">
          <div class="flex gap-2 mb-2">
            <input v-model.number="payment.amount" type="number" min="0" step="0.00001" class="w-40" />
            <input v-model.number="payment.cash_id" type="number" min="1" class="w-32" />
            <button
              class="primary-btn"
              :disabled="!$store.getters.hasPermission('warehouse_purchases_update')"
              @click="pay"
            >
              {{ $t('payForGoods') }}
            </button>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>{{ $t('date') }}</th>
                <th>{{ $t('amount') }}</th>
                <th>{{ $t('inDebt') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in (selected.transactions || [])" :key="t.id">
                <td>{{ t.id }}</td>
                <td>{{ t.date }}</td>
                <td>{{ t.orig_amount }}</td>
                <td>{{ t.is_debt ? $t('yes') : $t('no') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-3" v-else>
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>{{ $t('date') }}</th>
                <th>{{ $t('status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in (selected.receipts || [])" :key="r.id">
                <td>{{ r.id }}</td>
                <td>{{ r.date }}</td>
                <td>{{ r.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TabBar from "@/views/components/app/forms/TabBar.vue";
import WarehousePurchaseController from "@/api/WarehousePurchaseController";

export default {
  components: { TabBar },
  data() {
    return {
      items: [],
      selected: null,
      selectedId: null,
      activeTab: "info",
      payment: {
        amount: null,
        cash_id: null,
      },
      detailTabs: [
        { name: "info", label: this.$t("infoAndProducts") },
        { name: "transactions", label: this.$t("transactions") },
        { name: "receipts", label: this.$t("receipt") },
      ],
    };
  },
  async mounted() {
    await this.fetchItems();
  },
  methods: {
    async fetchItems() {
      const page = await WarehousePurchaseController.getItems(1, 50, {});
      this.items = page.items || [];
    },
    async loadPurchase(id) {
      this.selected = await WarehousePurchaseController.getItem(id);
      this.selectedId = id;
    },
    async pay() {
      if (!this.selectedId || !this.$store.getters.hasPermission('warehouse_purchases_update')) {
        return;
      }
      await WarehousePurchaseController.pay(this.selectedId, {
        amount: this.payment.amount,
        cash_id: this.payment.cash_id,
      });
      await this.loadPurchase(this.selectedId);
      this.payment.amount = null;
      this.payment.cash_id = null;
    },
    openCreate() {
      if (!this.$store.getters.hasPermission('warehouse_purchases_create')) {
        return;
      }
      this.$router.push("/warehouse_purchases/new");
    },
  },
};
</script>

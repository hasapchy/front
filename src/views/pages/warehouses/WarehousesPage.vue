<template>
  <div>
    <TabBar
      :tabs="tabs"
      :active-tab="currentTab"
      :tab-click="(t) => { changeTab(t) }"
    />
    <div class="mb-4" />
    <div v-if="currentTab === 'stock'">
      <WarehousesStockPage />
    </div>
    <div v-else-if="currentTab === 'posting'">
      <WarehousesReceiptPage />
    </div>
    <div v-else-if="currentTab === 'movement'">
      <WarehousesMovementPage />
    </div>
    <div v-else-if="currentTab === 'writeoff'">
      <WarehousesWriteoffPage />
    </div>
    <div v-else-if="currentTab === 'writeoff_returns'">
      <WarehousesWriteoffPage :returns-only="true" />
    </div>
    <div v-else-if="currentTab === 'inventory'">
      <WarehousesInventoriesPage />
    </div>
    <div v-else-if="currentTab === 'purchases'">
      <WarehousesPurchasesPage />
    </div>
  </div>
</template>

<script>
import TabBar from '@/views/components/app/forms/TabBar.vue';
import WarehousesStockPage from '@/views/pages/warehouses/WarehousesStockPage.vue';
import WarehousesReceiptPage from '@/views/pages/warehouses/WarehousesReceiptPage.vue';
import WarehousesWriteoffPage from '@/views/pages/warehouses/WarehousesWriteoffPage.vue';
import WarehousesMovementPage from '@/views/pages/warehouses/WarehousesMovementPage.vue';
import WarehousesInventoriesPage from '@/views/pages/warehouses/WarehousesInventoriesPage.vue';
import WarehousesPurchasesPage from '@/views/pages/warehouses/WarehousesPurchasesPage.vue';
import companyChangeMixin from '@/mixins/companyChangeMixin';


export default {
    components: {
        TabBar,
        WarehousesStockPage,
        WarehousesReceiptPage,
        WarehousesWriteoffPage,
        WarehousesMovementPage,
        WarehousesInventoriesPage,
        WarehousesPurchasesPage
    },
    mixins: [companyChangeMixin],
    data() {
        return {
            currentTab: 'stock',
        }
    },
    computed: {
        tabs() {
            const allTabs = [
                { name: 'stock', label: this.$t('stock'), permission: 'warehouse_stocks_view', icon: 'fas fa-boxes-stacked' },
                { name: 'purchases', label: this.$t('purchases'), permission: 'warehouse_purchases_view', icon: 'fas fa-cart-plus' },
                { name: 'posting', label: this.$t('receipt'), permission: 'warehouse_receipts_view', icon: 'fas fa-truck-ramp-box' },
                { name: 'writeoff', label: this.$t('writeoff'), permission: 'warehouse_writeoffs_view', icon: 'fas fa-trash-can' },
                { name: 'writeoff_returns', label: this.$t('warehouseReturnsTab'), permission: 'warehouse_writeoffs_view', icon: 'fas fa-rotate-left' },
                { name: 'movement', label: this.$t('movement'), permission: 'warehouse_movements_view', icon: 'fas fa-right-left' },
                { name: 'inventory', label: this.$t('inventory'), permission: 'inventories_view_all', icon: 'fas fa-clipboard-check' },
            ];
            return allTabs.filter((tab) => {
                if (tab.name === 'inventory') {
                    return this.$store.getters.hasPermission('inventories_view_all') || this.$store.getters.hasPermission('inventories_view_own');
                }
                return this.$store.getters.hasPermission(tab.permission);
            });
        }
    },
    watch: {
        tabs: {
            immediate: true,
            handler(newTabs) {
                if (newTabs.length > 0 && !newTabs.some(t => t.name === this.currentTab)) {
                    this.currentTab = newTabs[0].name;
                }
            }
        },
        '$route.path'() {
            this.updateTabFromHash();
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    mounted() {
        this.updateTabFromHash();
        window.addEventListener('hashchange', this.updateTabFromHash);
    },
    beforeUnmount() {
        window.removeEventListener('hashchange', this.updateTabFromHash);
    },
    methods: {
        changeTab(tab) {
            this.currentTab = tab;
            window.location.hash = tab;
        },
        updateTabFromHash() {
            if (this.$route.path.startsWith('/warehouse_purchases')) {
                if (this.tabs.some(t => t.name === 'purchases')) {
                    this.currentTab = 'purchases';
                    return;
                }
            }
            const hash = window.location.hash.replace('#', '');
            if (this.tabs.some(t => t.name === hash)) {
                this.currentTab = hash;
            } else if (this.tabs.length > 0) {
                this.currentTab = this.tabs[0].name;
            }
        }
    }
}
</script>
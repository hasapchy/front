<template>
    <TabBar :tabs="tabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
    <div class="mb-4"></div>
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
</template>

<script>
import TabBar from '@/views/components/app/forms/TabBar.vue';
import WarehousesStockPage from '@/views/pages/warehouses/WarehousesStockPage.vue';
import WarehousesReceiptPage from '@/views/pages/warehouses/WarehousesReceiptPage.vue';
import WarehousesWriteoffPage from '@/views/pages/warehouses/WarehousesWriteoffPage.vue';
import WarehousesMovementPage from '@/views/pages/warehouses/WarehousesMovementPage.vue';
import companyChangeMixin from '@/mixins/companyChangeMixin';


export default {
    mixins: [companyChangeMixin],
    components: {
        TabBar,
        WarehousesStockPage,
        WarehousesReceiptPage,
        WarehousesWriteoffPage,
        WarehousesMovementPage
    },
    data() {
        return {
            currentTab: 'stock',
        }
    },
    computed: {
        tabs() {
            const allTabs = [
                { name: 'stock', label: this.$t('stock'), permission: 'warehouse_stocks_view' },
                { name: 'posting', label: this.$t('receipt'), permission: 'warehouse_receipts_view' },
                { name: 'movement', label: this.$t('movement'), permission: 'warehouse_movements_view' },
                { name: 'writeoff', label: this.$t('writeoff'), permission: 'warehouse_writeoffs_view' },
            ];
            return allTabs.filter(tab => this.$store.getters.hasPermission(tab.permission));
        }
    },
    methods: {
        changeTab(tab) {
            this.currentTab = tab;
            window.location.hash = tab;
        },
        updateTabFromHash() {
            const hash = window.location.hash.replace('#', '');
            if (this.tabs.some(t => t.name === hash)) {
                this.currentTab = hash;
            } else if (this.tabs.length > 0) {
                this.currentTab = this.tabs[0].name;
            }
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
        }
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
    }
}
</script>
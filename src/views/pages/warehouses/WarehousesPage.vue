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


export default {
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
            tabs: [
                { name: 'stock', label: 'Сток' },
                { name: 'posting', label: 'Оприходование' },
                { name: 'movement', label: 'Перемещение' },
                { name: 'writeoff', label: 'Списание' },
            ]
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
            }
        }
    },
    created() {
        this.updateTabFromHash();
        window.addEventListener('hashchange', this.updateTabFromHash);
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    beforeUnmount() {
        window.removeEventListener('hashchange', this.updateTabFromHash);
    }
}
</script>
<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex items-center space-x-4">
            <PrimaryButton 
                v-if="selectedCurrency" 
                :onclick="() => showModal(null)" 
                :disabled="!$store.getters.hasPermission('currency_history_create')"
                icon="fas fa-plus">
            </PrimaryButton>
            <div class="flex items-center space-x-2">
                <select v-model="selectedCurrencyId" @change="onCurrencyChange" class="px-3 py-1 border rounded">
                    <option value="">{{ $t('selectCurrency') }}</option>
                    <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                        {{ currency.symbol }} - {{ currency.name }} ({{ currency.current_rate }})
                    </option>
                </select>
            </div>
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable 
                table-key="settings.currency_history" 
                :columns-config="translatedColumnsConfig" 
                :table-data="data.items"
                :item-mapper="itemMapper" 
                :onItemClick="(i) => { showModal(i) }"
                @selectionChange="selectedIds = $event" 
            />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>
    
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <CurrencyHistoryCreatePage 
            ref="currencyHistoryForm" 
            @saved="handleSaved" 
            @saved-error="handleSavedError" 
            @deleted="handleDeleted"
            @deleted-error="handleDeletedError" 
            @close-request="closeModal" 
            :editingItem="editingItem"
            :currency="selectedCurrency"
        />
    </SideModalDialog>
    
    <NotificationToast 
        :title="notificationTitle" 
        :subtitle="notificationSubtitle" 
        :show="notification"
        :is-danger="notificationIsDanger" 
        @close="closeNotification" 
    />
    
    <AlertDialog 
        :dialog="deleteDialog" 
        :descr="`${$t('confirmDeleteExchangeRate')} (${selectedIds.length})?`" 
        :confirm-text="$t('deleteSelected')"
        :leave-text="$t('cancel')" 
        @confirm="confirmDeleteItems" 
        @leave="deleteDialog = false" 
    />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import CurrencyHistoryController from '@/api/CurrencyHistoryController';
import CurrencyHistoryCreatePage from './CurrencyHistoryCreatePage.vue';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';

export default {
    mixins: [batchActionsMixin, crudEventMixin, notificationMixin, modalMixin, tableTranslationMixin],
    components: { 
        NotificationToast, 
        PrimaryButton, 
        SideModalDialog, 
        Pagination, 
        DraggableTable, 
        CurrencyHistoryCreatePage, 
        BatchButton, 
        AlertDialog 
    },
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            currencies: [],
            selectedCurrencyId: '',
            selectedCurrency: null,
            controller: CurrencyHistoryController,
            savedSuccessText: this.$t('exchangeRateSaved'),
            savedErrorText: this.$t('errorSavingExchangeRate'),
            deletedSuccessText: this.$t('exchangeRateDeleted'),
            deletedErrorText: this.$t('errorDeletingExchangeRate'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'exchangeRate', label: 'exchangeRate', size: 120 },
                { name: 'startDate', label: 'startDate', size: 120 },
                { name: 'endDate', label: 'endDate', size: 120 },
                { name: 'duration', label: 'duration', size: 100 },
                { name: 'status', label: 'status', size: 100, html: true },
            ]
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    async mounted() {
        await this.fetchCurrencies();
        // Автоматически выбираем первую валюту по умолчанию
        if (this.currencies.length > 0) {
            this.selectedCurrencyId = this.currencies[0].id;
            await this.onCurrencyChange();
        }
    },
    methods: {
        async fetchCurrencies() {
            try {
                this.currencies = await CurrencyHistoryController.getCurrenciesWithRates();
            } catch (error) {
                this.showNotification(this.$t('errorLoadingCurrencies'), error.message, true);
            }
        },
        
        async onCurrencyChange() {
            if (!this.selectedCurrencyId) {
                this.selectedCurrency = null;
                this.data = null;
                return;
            }
            
            try {
                this.loading = true;
                const currency = this.currencies.find(c => c.id == this.selectedCurrencyId);
                this.selectedCurrency = currency;
                
                const historyData = await CurrencyHistoryController.getCurrencyHistory(this.selectedCurrencyId, 1, this.perPage);
                
                // Преобразуем в формат для таблицы
                this.data = {
                    items: historyData.history,
                    currentPage: historyData.currentPage,
                    lastPage: historyData.lastPage
                };
            } catch (error) {
                this.showNotification(this.$t('errorLoadingHistory'), error.message, true);
            } finally {
                this.loading = false;
            }
        },
        
        itemMapper(i, c) {
            switch (c) {
                case 'exchangeRate':
                    return i.formatExchangeRate();
                case 'startDate':
                    return i.formatStartDate();
                case 'endDate':
                    return i.formatEndDate();
                case 'duration':
                    return i.getDuration();
                case 'status':
                    return i.isActive() ? 
                        '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">' + this.$t('active') + '</span>' :
                        '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">' + this.$t('inactive') + '</span>';
                default:
                    return i[c];
            }
        },
        
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        
        async fetchItems(page = 1, silent = false) {
            // Для истории курсов пагинация не нужна, так как это история одной валюты
            await this.onCurrencyChange();
        }
    }
}
</script>

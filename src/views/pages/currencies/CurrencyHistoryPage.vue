<template>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable
                table-key="settings.currency_history"
                :columns-config="columnsConfig"
                :table-data="data.items"
                :item-mapper="itemMapper"
                :onItemClick="(i) => { showModal(i) }"
                @selectionChange="selectedIds = $event">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-filters="true"
                        :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()"
                        :on-filters-reset="resetFilters"
                        :show-pagination="true"
                        :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                        :on-page-change="fetchItems"
                        :on-per-page-change="handlePerPageChange"
                        :resetColumns="resetColumns"
                        :columns="columns"
                        :toggleVisible="toggleVisible"
                        :log="log">
                        <template #left>
                            <PrimaryButton 
                                :onclick="() => showModal(null)"
                                icon="fas fa-plus"
                                :disabled="!selectedCurrency || !$store.getters.hasPermission('currency_history_create')">
                            </PrimaryButton>
                            <transition name="fade">
                                <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
                            </transition>
                            
                            <FiltersContainer
                                :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()"
                                @reset="resetFilters"
                                @apply="applyFilters">
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('currency') || 'Валюта' }}</label>
                                    <select v-model="selectedCurrencyId" class="w-full">
                                        <option value="">{{ $t('selectCurrency') }}</option>
                                        <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                                            {{ currency.symbol }} - {{ translateCurrency(currency.name, $t) }} ({{ currency.current_rate }})
                                        </option>
                                    </select>
                                </div>
                            </FiltersContainer>
                        </template>

                        <template #right>
                            <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
                                :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
                                @changePage="fetchItems" @perPageChange="handlePerPageChange" />
                        </template>

                        <template #gear="{ resetColumns, columns, toggleVisible, log }">
                            <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                <ul>
                                    <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns"
                                        @change="log">
                                        <li v-for="(element, index) in columns" :key="element.name"
                                            @click="toggleVisible(index)"
                                            class="flex items-center hover:bg-gray-100 p-2 rounded">
                                            <div class="space-x-2 flex flex-row justify-between w-full select-none">
                                                <div>
                                                    <i class="text-sm mr-2 text-[#337AB7]"
                                                        :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                                    {{ $te(element.label) ? $t(element.label) : element.label }}
                                                </div>
                                                <div><i
                                                        class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i>
                                                </div>
                                            </div>
                                        </li>
                                    </draggable>
                                </ul>
                            </TableFilterButton>
                        </template>
                    </TableControlsBar>
                </template>
            </DraggableTable>
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
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import CurrencyHistoryController from '@/api/CurrencyHistoryController';
import CurrencyHistoryCreatePage from './CurrencyHistoryCreatePage.vue';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import filtersMixin from '@/mixins/filtersMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import { translateCurrency } from '@/utils/translationUtils';


export default {
    mixins: [batchActionsMixin, crudEventMixin, notificationMixin, modalMixin, filtersMixin],
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        Pagination,
        DraggableTable,
        CurrencyHistoryCreatePage,
        BatchButton,
        AlertDialog,
        TableControlsBar,
        TableFilterButton,
        FiltersContainer,
        draggable: VueDraggableNext
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
        if (this.currencies && this.currencies.length > 0) {
            this.selectedCurrencyId = this.currencies[0].id;
            await this.fetchItems(1, false);
        } else {
            this.data = { items: [], currentPage: 1, lastPage: 1 };
        }
    },
    computed: {
        hasActiveFilters() {
            return this.selectedCurrencyId !== '';
        }
    },
    methods: {
        translateCurrency,
        async fetchCurrencies() {
            try {
                const list = await CurrencyHistoryController.getCurrenciesWithRates();
                this.currencies = Array.isArray(list) ? list : [];
            } catch (error) {
                this.currencies = [];
                this.showNotification(this.$t('errorLoadingCurrencies'), error.message, true);
            }
        },

        async onCurrencyChange() {
            await this.fetchItems(1, false);
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
            if (!this.selectedCurrencyId) {
                return;
            }
            if (!silent) {
                this.loading = true;
            }
            try {
                const currency = this.currencies.find(c => c.id == this.selectedCurrencyId);
                this.selectedCurrency = currency;

                const historyData = await CurrencyHistoryController.getItems(this.selectedCurrencyId, page, this.perPage);

                this.data = {
                    items: historyData.history,
                    currentPage: historyData.currentPage,
                    lastPage: historyData.lastPage
                };
            } catch (error) {
                this.showNotification(this.$t('errorLoadingHistory'), error.message, true);
            } finally {
                if (!silent) {
                    this.loading = false;
                }
            }
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                selectedCurrencyId: ''
            });
            this.selectedCurrency = null;
            this.data = null;
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.selectedCurrencyId, defaultValue: '' }
            ]);
        },
    }
}
</script>

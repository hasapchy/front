<template>
    <transition name="fade" mode="out-in">
        <!-- Табличный вид -->
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.company_holidays" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="onItemClick">
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
                                icon="fas fa-plus"
                                :onclick="() => { showModal(null) }"
                                :disabled="!$store.getters.hasPermission('company_holidays_create')">
                            </PrimaryButton>

                            <transition name="fade">
                                <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
                            </transition>

                            <FiltersContainer :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()" @reset="resetFilters">
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('year') || 'Год' }}</label>
                                    <input type="number" v-model="yearFilter" @change="debouncedFetchItems" 
                                        class="w-full" :placeholder="new Date().getFullYear()" />
                                </div>
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('dateFrom') || 'Дата начала' }}</label>
                                    <input type="date" v-model="dateFromFilter" @change="debouncedFetchItems" class="w-full" />
                                </div>
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('dateTo') || 'Дата окончания' }}</label>
                                    <input type="date" v-model="dateToFilter" @change="debouncedFetchItems" class="w-full" />
                                </div>
                            </FiltersContainer>
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

        <!-- Загрузка -->
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <CompanyHolidayCreatePage :key="editingItem ? editingItem.id : 'new-holiday'" ref="companyholidaycreatepageForm" 
            @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
    <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" :confirm-text="$t('delete')"
        :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import CompanyHolidayController from '@/api/CompanyHolidayController';
import CompanyHolidayCreatePage from './CompanyHolidayCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import filtersMixin from '@/mixins/filtersMixin';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';
import debounce from "lodash.debounce";

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, filtersMixin],
    components: {
        PrimaryButton,
        SideModalDialog,
        CompanyHolidayCreatePage,
        Pagination,
        DraggableTable,
        BatchButton,
        AlertDialog,
        TableControlsBar,
        TableFilterButton,
        FiltersContainer,
        SpinnerIcon,
        draggable: VueDraggableNext
    },
    data() {
        return {
            controller: CompanyHolidayController,
            cacheInvalidationType: 'company_holidays',
            itemViewRouteName: 'CompanyHolidayView',
            baseRouteName: 'CompanyHolidays',
            errorGettingItemText: this.$t('errorGettingHoliday') || 'Ошибка получения праздника',
            savedSuccessText: this.$t('holidaySuccessfullyAdded') || 'Праздник успешно добавлен',
            savedErrorText: this.$t('errorSavingHoliday') || 'Ошибка сохранения праздника',
            deletedSuccessText: this.$t('holidaySuccessfullyDeleted') || 'Праздник успешно удален',
            deletedErrorText: this.$t('errorDeletingHoliday') || 'Ошибка удаления праздника',
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'coloredName', label: 'name', html: true },
                { name: 'date', label: 'date' },
                { name: 'isRecurring', label: 'recurring' }
            ],
            yearFilter: '',
            dateFromFilter: '',
            dateToFilter: '',
            debounceTimer: null
        }
    },
    computed: {
        hasActiveFilters() {
            return !!(this.yearFilter || this.dateFromFilter || this.dateToFilter);
        }
    },
    mounted() {
        this.fetchItems();
    },
    beforeUnmount() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'coloredName':
                    const color = i.color || '#FF5733';
                    const name = i.name || '-';
                    return `
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded border border-gray-300" style="background-color: ${color}"></div>
                            <span>${name}</span>
                        </div>
                    `;
                case 'date':
                    return i.date || '-';
                case 'isRecurring':
                    return i.isRecurring ? this.$t('yes') || 'Да' : this.$t('no') || 'Нет';
                default:
                    return i[c];
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.yearFilter, defaultValue: '' },
                { value: this.dateFromFilter, defaultValue: '' },
                { value: this.dateToFilter, defaultValue: '' }
            ]);
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                yearFilter: '',
                dateFromFilter: '',
                dateToFilter: ''
            });
            this.fetchItems(1);
        },
        debouncedFetchItems() {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
                this.fetchItems(1);
            }, 300);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const per_page = this.perPage;
                const filters = {};
                if (this.yearFilter) filters.year = this.yearFilter;
                if (this.dateFromFilter) filters.date_from = this.dateFromFilter;
                if (this.dateToFilter) filters.date_to = this.dateToFilter;
                
                const new_data = await CompanyHolidayController.getItems(page, per_page, filters);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingHolidayList') || 'Ошибка получения списка праздников', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        async handleCompanyChanged(companyId) {
            await this.fetchItems(1);
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'CompanyHolidays' });
            }
        }
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        }
    },
}
</script>


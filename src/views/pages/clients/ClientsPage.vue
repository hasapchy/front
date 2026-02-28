<template>
    <div>
    <transition name="fade" mode="out-in">
        <div v-if="isDataReady && viewMode === 'table'" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="common.clients" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="onItemClick"
                @selectionChange="selectedIds = $event">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-filters="true"
                        :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()"
                        :on-filters-reset="resetFilters"
                        :show-pagination="true"
                        :pagination-data="paginationData"
                        :on-page-change="fetchItems"
                        :on-per-page-change="handlePerPageChange"
                        :export-permission="exportPermission"
                        :on-export="handleExport"
                        :export-loading="exportLoading"
                        :resetColumns="resetColumns"
                        :columns="columns"
                        :toggleVisible="toggleVisible"
                        :log="log">
                        <template #left>
                            <PrimaryButton 
                                :onclick="() => { showModal(null) }"
                                icon="fas fa-plus"
                                :disabled="!$store.getters.hasPermission('clients_create')">
                            </PrimaryButton>
                            <ViewModeToggle :view-mode="viewMode" :show-kanban="false" :show-cards="true" @change="changeViewMode" />
                            <transition name="fade">
                                <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
                            </transition>
                        </template>
                        <template #filters-desktop>
                            <ClientFilters
                                :status-filter="statusFilter"
                                :type-filter="typeFilter"
                                :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()"
                                @update:statusFilter="statusFilter = $event"
                                @update:typeFilter="typeFilter = $event"
                                @reset="resetFilters"
                                @apply="applyFilters" />
                        </template>

                        <template #right>
                            <Pagination v-if="paginationData" :currentPage="paginationData.currentPage" :lastPage="paginationData.lastPage"
                                :per-page="paginationData.perPage" :per-page-options="paginationData.perPageOptions" :show-per-page-selector="true"
                                @changePage="fetchItems" @perPageChange="handlePerPageChange" />
                        </template>
                        <template #gear="{ resetColumns, columns, toggleVisible, log }">
                            <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                <ul>
                                    <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns"
                                        @change="log">
                                        <li v-for="(element, index) in columns" :key="element.name" v-show="element.name !== 'select'"
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
        <div v-else-if="isDataReady && viewMode === 'cards'" key="cards" class="clients-cards-container">
            <TableControlsBar
                :show-filters="true"
                :has-active-filters="hasActiveFilters"
                :active-filters-count="getActiveFiltersCount()"
                :on-filters-reset="resetFilters"
                :show-pagination="true"
                :pagination-data="paginationData"
                :on-page-change="fetchItems"
                :on-per-page-change="handlePerPageChange"
                :export-permission="exportPermission"
                :on-export="handleExport"
                :export-loading="exportLoading">
                <template #left>
                    <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus"
                        :disabled="!$store.getters.hasPermission('clients_create')" />
                    <ViewModeToggle :view-mode="viewMode" :show-kanban="false" :show-cards="true" @change="changeViewMode" />
                    <transition name="fade">
                        <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
                    </transition>
                </template>
                <template #filters-desktop>
                    <ClientFilters
                        :status-filter="statusFilter"
                        :type-filter="typeFilter"
                        :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()"
                        @update:statusFilter="statusFilter = $event"
                        @update:typeFilter="typeFilter = $event"
                        @reset="resetFilters"
                        @apply="applyFilters" />
                </template>
                <template #right>
                    <Pagination v-if="paginationData" :currentPage="paginationData.currentPage" :lastPage="paginationData.lastPage"
                        :per-page="paginationData.perPage" :per-page-options="paginationData.perPageOptions" :show-per-page-selector="true"
                        @changePage="fetchItems" @perPageChange="handlePerPageChange" />
                </template>
                <template #gear>
                    <CardFieldsGearMenu :card-fields="cardFields" :on-reset="resetCardFields" @toggle="toggleCardFieldVisible" />
                </template>
            </TableControlsBar>
            <MapperCardGrid
                class="mt-4"
                :items="data.items"
                :card-config="cardConfigMerged"
                :card-mapper="cardMapper"
                title-field="title"
                title-subtitle-field="titleSubtitle"
                :title-prefix="clientCardTitlePrefix"
                :header-suffix="clientCardHeaderSuffix"
                :selected-ids="selectedIds"
                :show-checkbox="$store.getters.hasPermission('clients_delete')"
                :footer-color-class="clientFooterColorClass"
                @dblclick="onItemClick"
                @select-toggle="toggleSelectRow"
            />
        </div>
        <div v-else key="loader" class="min-h-64">
            <TableSkeleton v-if="viewMode === 'table'" />
            <CardsSkeleton v-else />
        </div>
    </transition>

    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ClientCreatePage v-if="modalDialog" :key="editingItem ? editingItem.id : 'new'" ref="clientForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
    <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" :confirm-text="$t('delete')"
        :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
    </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import ClientController from '@/api/ClientController';
import ClientCreatePage from './ClientCreatePage.vue';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin'
import crudEventMixin from '@/mixins/crudEventMixin';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import { eventBus } from '@/eventBus';
import { VueDraggableNext } from 'vue-draggable-next';

import searchMixin from '@/mixins/searchMixin';
import filtersMixin from '@/mixins/filtersMixin';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import ClientNameCell from '@/views/components/app/buttons/ClientNameCell.vue';
import StatusIconCell from '@/views/components/app/buttons/StatusIconCell.vue';
import ListCell from '@/views/components/app/buttons/ListCell.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import ClientFilters from '@/views/components/app/ClientFilters.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import { markRaw } from 'vue';
import { highlightMatches } from '@/utils/searchUtils';
import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';
import exportTableMixin from '@/mixins/exportTableMixin';

export default {
    mixins: [batchActionsMixin, crudEventMixin, notificationMixin, modalMixin, companyChangeMixin, searchMixin, getApiErrorMessageMixin, filtersMixin, cardFieldsVisibilityMixin, exportTableMixin],
    components: { PrimaryButton, SideModalDialog, Pagination, DraggableTable, TableControlsBar, TableFilterButton, TableSkeleton, ClientCreatePage, BatchButton, AlertDialog, FiltersContainer, ClientFilters, CardFieldsGearMenu, ClientNameCell, StatusIconCell, ListCell, ViewModeToggle, CardsSkeleton, MapperCardGrid, draggable: VueDraggableNext },
    data() {
        return {
            cardFieldsKey: 'common.clients',
            titleField: 'title',
            viewMode: 'table',
            controller: ClientController,
            cacheInvalidationType: 'clients',
            deletePermission: 'clients_delete',
            itemViewRouteName: 'ClientView',
            baseRouteName: 'Clients',
            errorGettingItemText: this.$t('errorGettingClient'),
            statusFilter: '',
            typeFilter: '',
            savedSuccessText: this.$t('clientSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingClient'),
            deletedSuccessText: this.$t('clientSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingClient')
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
        
        eventBus.on('global-search', this.handleSearch);
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        },
        viewMode(newMode) {
            try {
                localStorage.setItem('clients_viewMode', newMode);
            } catch (e) {
                console.warn('Failed to save view mode:', e);
            }
        }
    },

    mounted() {
        try {
            const saved = localStorage.getItem('clients_viewMode');
            if (saved && ['table', 'cards'].includes(saved)) {
                this.viewMode = saved;
            }
        } catch (e) {
            console.warn('Failed to read view mode:', e);
        }
        this.fetchItems();
    },
    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },

    methods: {
        itemMapper(i, c) {
            const search = this.searchQuery;

            switch (c) {
                case 'id':
                    if (search) {
                        return highlightMatches(String(i.id ?? ''), search);
                    }
                    return i.id;
                case 'discount':
                    return i.discountFormatted();
                case 'balance':
                    return i.balanceFormatted();
                case 'dateUser':
                    return i.formatCreatedAt();
                default:
                    return i[c];
            }
        },
        clientCardTitlePrefix(item) {
            const typeMap = {
                individual: 'fas fa-user text-[#3571A4]',
                company: 'fas fa-building text-[#3571A4]',
                employee: 'fas fa-id-badge text-[#3571A4]',
                investor: 'fas fa-hand-holding-usd text-[#3571A4]'
            };
            const type = item.clientType || item.client_type || 'individual';
            const iconClass = typeMap[type] || typeMap.individual;
            return `<i class="${iconClass} mr-1.5 flex-shrink-0" title="${this.$t('clientType') || 'Тип'}"></i>`;
        },
        clientCardHeaderSuffix(item) {
            const parts = [];
            const activeTitle = this.$t('active') || 'Активен';
            const activeIcon = item.status
                ? '<i class="fas fa-circle-check text-green-600" title="' + activeTitle + '"></i>'
                : '<i class="fas fa-circle-xmark text-red-500" title="' + (this.$t('inactive') || 'Неактивен') + '"></i>';
            parts.push(activeIcon);
            if (item.isSupplier) {
                const supplierTitle = this.$t('supplier') || 'Поставщик';
                parts.push('<i class="fas fa-truck text-[#3571A4]" title="' + supplierTitle + '"></i>');
            }
            if (item.isConflict) {
                const problemTitle = this.$t('problemClient') || 'Проблемный клиент';
                parts.push('<i class="fas fa-angry text-[#D53935]" title="' + problemTitle + '"></i>');
            }
            return parts.join('');
        },
        cardMapper(item, fieldName) {
            switch (fieldName) {
                case 'title':
                    return getClientDisplayName(item) || item.fullName?.() || '';
                case 'titleSubtitle':
                    return getClientDisplayPosition(item);
                case 'phones':
                    const phones = item.phones || [];
                    if (phones.length === 0) return '—';
                    const phoneList = phones.slice(0, 2).map(p => p?.phone).filter(Boolean);
                    return phoneList.join(', ') || '—';
                case 'emails':
                    return item.emails?.[0]?.email ?? '—';
                case 'address':
                    return item.address ?? '—';
                case 'note':
                    return item.note ?? '—';
                case 'balance':
                    return item.balanceFormatted() + (item.currencySymbol ? ` ${item.currencySymbol}` : '');
                case 'discount':
                    return item.discountFormatted();
                default:
                    return this.itemMapper(item, fieldName) ?? '—';
            }
        },
        clientFooterColorClass(item, fieldName) {
            if (fieldName === 'balance' && item.balance != null) {
                return item.balance >= 0 ? 'text-green-600' : 'text-red-600';
            }
            return null;
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        getExportParams() {
            return {
                search: this.searchQuery || undefined,
                include_inactive: this.statusFilter === 'inactive',
                status_filter: this.statusFilter || undefined,
                type_filter: this.typeFilter != null ? (Array.isArray(this.typeFilter) ? this.typeFilter : [this.typeFilter]) : undefined,
            };
        },
        async handleCompanyChanged(companyId, previousCompanyId) {
            this.statusFilter = '';
            this.typeFilter = '';
            this.selectedIds = [];
            await this.fetchItems(1, previousCompanyId == null);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const per_page = this.perPage;
                
                const includeInactive = this.statusFilter === 'inactive';
                const new_data = await ClientController.getItems(page, this.searchQuery, includeInactive, this.statusFilter, this.typeFilter, per_page);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingClientList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                statusFilter: '',
                typeFilter: ''
            });
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.statusFilter, defaultValue: '' },
                { value: this.typeFilter, defaultValue: '' }
            ]);
        },
        changeViewMode(mode) {
            if (['table', 'cards'].includes(mode)) {
                this.viewMode = mode;
            }
        },
        toggleSelectRow(id) {
            if (!id) return;
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter(x => x !== id);
            } else {
                this.selectedIds = [...this.selectedIds, id];
            }
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Clients' });
            }
        },
    },
    computed: {
        exportPermission() {
            return 'clients_export';
        },
        isDataReady() {
            return this.data != null && !this.loading;
        },
        paginationData() {
            if (!this.data) return null;
            return {
                currentPage: this.data.currentPage,
                lastPage: this.data.lastPage,
                perPage: this.perPage,
                perPageOptions: this.perPageOptions
            };
        },
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        hasActiveFilters() {
            return this.statusFilter !== '' || this.typeFilter !== '';
        },
        cardConfigBase() {
            return [
                { name: 'title', label: null },
                { name: 'phones', label: 'phoneNumber', icon: 'fas fa-phone text-[#3571A4]' },
                { name: 'emails', label: 'email', icon: 'fas fa-envelope text-[#3571A4]' },
                { name: 'address', label: 'address', icon: 'fas fa-location-dot text-[#3571A4]' },
                { name: 'note', label: 'note', icon: 'fas fa-sticky-note text-[#3571A4]' },
                {
                    name: 'balance',
                    label: 'balance',
                    slot: 'footer',
                    visible: () => this.$store.getters.hasPermission('settings_client_balance_view')
                }
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map(f => {
                if (f.name === 'balance') {
                    return {
                        ...f,
                        visible: () => f.visible && this.$store.getters.hasPermission('settings_client_balance_view')
                    };
                }
                return { ...f, visible: f.visible };
            });
            return [title, ...rest];
        },
        columnsConfig() {
            return [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60, html: true },
                {
                    name: 'firstName',
                    label: 'fullNameCompany',
                    component: markRaw(ClientNameCell),
                    props: (item) => ({ client: item, searchQuery: this.searchQuery })
                },
                {
                    name: 'phones',
                    label: 'phoneNumber',
                    component: markRaw(ListCell),
                    props: (item) => ({
                        items: item.phones || [],
                        getValue: (phone) => phone.phone
                    })
                },
                {
                    name: 'emails',
                    label: 'email',
                    component: markRaw(ListCell),
                    props: (item) => ({
                        items: item.emails || [],
                        getValue: (email) => email.email
                    })
                },
                { name: 'address', label: 'address' },
                { name: 'note', label: 'note' },
                { name: 'discount', label: 'discount', html: true },
                ...(this.$store.getters.hasPermission('settings_client_balance_view') ? [{ name: 'balance', label: 'balance' }] : []),
                {
                    name: 'status',
                    label: 'status',
                    component: markRaw(StatusIconCell),
                    props: (item) => ({
                        status: item.status
                    })
                },
                { name: 'dateUser', label: 'dateUser' },
            ];
        },
    },
}
</script>
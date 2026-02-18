<template>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
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
                        :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                        :on-page-change="fetchItems"
                        :on-per-page-change="handlePerPageChange"
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
                            <transition name="fade">
                                <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
                            </transition>
                        </template>
                        <template #filters-desktop>
                            <FiltersContainer
                                :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()"
                                @reset="resetFilters"
                                @apply="applyFilters">
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('status') || 'Статус' }}</label>
                                    <select v-model="statusFilter" class="w-full">
                                        <option value="">{{ $t('allStatuses') }}</option>
                                        <option value="active">{{ $t('active') }}</option>
                                        <option value="inactive">{{ $t('inactive') }}</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('type') || 'Тип' }}</label>
                                    <select v-model="typeFilter" class="w-full">
                                        <option value="">{{ $t('allTypes') }}</option>
                                        <option value="individual">{{ $t('individual') }}</option>
                                        <option value="company">{{ $t('company') }}</option>
                                        <option value="employee">{{ $t('employee') }}</option>
                                        <option value="investor">{{ $t('investor') }}</option>
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
        <div v-else key="loader" class="min-h-64">
            <TableSkeleton />
        </div>
    </transition>

    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ClientCreatePage v-if="modalDialog" :key="editingItem ? editingItem.id : 'new'" ref="clientForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" :confirm-text="$t('delete')"
            :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
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
import ClientNameCell from '@/views/components/app/buttons/ClientNameCell.vue';
import StatusIconCell from '@/views/components/app/buttons/StatusIconCell.vue';
import ListCell from '@/views/components/app/buttons/ListCell.vue';
import { markRaw } from 'vue';
import { highlightMatches } from '@/utils/searchUtils';

export default {
    mixins: [batchActionsMixin, crudEventMixin, notificationMixin, modalMixin, companyChangeMixin, searchMixin, getApiErrorMessageMixin, filtersMixin],
    components: { PrimaryButton, SideModalDialog, Pagination, DraggableTable, TableControlsBar, TableFilterButton, TableSkeleton, ClientCreatePage, BatchButton, AlertDialog, FiltersContainer, ClientNameCell, StatusIconCell, ListCell, draggable: VueDraggableNext },
    data() {
        return {
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
        }
    },

    mounted() {
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
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async handleCompanyChanged(companyId) {
            this.statusFilter = '';
            this.typeFilter = '';
            this.selectedIds = [];
            
            await this.fetchItems(1, false);
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
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Clients' });
            }
        },
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        hasActiveFilters() {
            return this.statusFilter !== '' || this.typeFilter !== '';
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
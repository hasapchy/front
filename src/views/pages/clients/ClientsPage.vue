<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <PrimaryButton :onclick="() => { showModal(null) }" :disabled="!$store.getters.hasPermission('clients_create')"
                icon="fas fa-plus"></PrimaryButton>
            
            <div class="ml-2">
                <select v-model="statusFilter" @change="() => fetchItems(1)">
                    <option value="">{{ $t('allStatuses') }}</option>
                    <option value="active">{{ $t('active') }}</option>
                    <option value="inactive">{{ $t('inactive') }}</option>
                </select>
            </div>

            <div class="ml-2">
                <select v-model="typeFilter" @change="() => fetchItems(1)">
                    <option value="">{{ $t('allTypes') }}</option>
                    <option value="individual">{{ $t('individual') }}</option>
                    <option value="company">{{ $t('company') }}</option>
                    <option value="employee">{{ $t('employee') }}</option>
                    <option value="investor">{{ $t('investor') }}</option>
                </select>
            </div>

            <div v-if="hasActiveFilters" class="ml-2">
                <PrimaryButton 
                    :onclick="resetFilters"
                    icon="fas fa-filter-circle-xmark"
                    :isLight="true">
                </PrimaryButton>
            </div>
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="common.clients" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => { showModal(i) }"
                @selectionChange="selectedIds = $event" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ClientCreatePage v-if="modalDialog" ref="clientForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" :confirm-text="$t('delete')"
            :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import ClientController from '@/api/ClientController';
import ClientCreatePage from './ClientCreatePage.vue';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin'
import crudEventMixin from '@/mixins/crudEventMixin';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import { eventBus } from '@/eventBus';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';
import { highlightMatches } from '@/utils/searchUtils';
import searchMixin from '@/mixins/searchMixin';

export default {
    mixins: [batchActionsMixin, crudEventMixin, notificationMixin, modalMixin, companyChangeMixin, tableTranslationMixin, searchMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, ClientCreatePage, BatchButton, AlertDialog },
    data() {
        return {
            controller: ClientController,
            cacheInvalidationType: 'clients',
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
                case 'firstName':
                    const parts = [];
                    if (i.firstName) parts.push(i.firstName);
                    if (i.lastName) parts.push(i.lastName);
                    let name = parts.join(' ');
                    if (i.contactPerson) {
                        name += ` (${i.contactPerson})`;
                    }
                    const highlightedName = search ? highlightMatches(name.trim(), search) : name.trim();
                    return i.icons() + highlightedName;
                case 'phones':
                    const phonesHtml = i.phonesHtmlList();
                    return search ? highlightMatches(phonesHtml, search) : phonesHtml;
                case 'emails':
                    const emailsHtml = i.emailsHtmlList();
                    return search ? highlightMatches(emailsHtml, search) : emailsHtml;
                case 'discount':
                    return i.discountFormatted();
                case 'balance':
                    return i.balanceFormatted();
                case 'status':
                    return i.statusIcon();
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
            
            this.$store.dispatch('showNotification', {
              title: 'Компания изменена',
              isDanger: false
            });
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const per_page = this.perPage || 20;
                
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
            this.statusFilter = '';
            this.typeFilter = '';
            this.fetchItems(1);
        }
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
                { name: 'id', label: 'number', size: 60 },
                { name: 'firstName', label: 'fullNameCompany', html: true },
                { name: 'phones', label: 'phoneNumber', html: true },
                { name: 'emails', label: 'email', html: true },
                { name: 'address', label: 'address' },
                { name: 'note', label: 'note' },
                { name: 'discount', label: 'discount' },
                ...(this.$store.getters.hasPermission('settings_client_balance_view') ? [{ name: 'balance', label: 'balance' }] : []),
                { name: 'status', label: 'status', html: true },
                { name: 'dateUser', label: 'dateUser' },
            ];
        },
    },
}
</script>
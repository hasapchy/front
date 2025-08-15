<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton :onclick="() => { showModal(null) }" :disabled="!$store.getters.hasPermission('clients_create')"
            icon="fas fa-plus">{{ $t('addClient') }}</PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="common.clients" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => { showModal(i) }"
                @selectionChange="selectedIds = $event" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ClientCreatePage ref="clientForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import { eventBus } from '@/eventBus';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';

export default {
    mixins: [batchActionsMixin, notificationMixin, modalMixin, tableTranslationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, ClientCreatePage, BatchButton, AlertDialog },
    data() {
        return {
            data: null,
            loading: false,
            controller: ClientController,
            selectedIds: [],
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'firstName', label: 'fullNameCompany', html: true },
                { name: 'phones', label: 'phoneNumber', html: true },
                { name: 'emails', label: 'email', html: true },
                { name: 'address', label: 'address' },
                { name: 'note', label: 'note' },
                { name: 'discount', label: 'discount' },
                { name: 'status', label: 'status', html: true },
                { name: 'dateUser', label: 'dateUser' },
            ],
        }
    },
    created() {
        this.fetchItems();
        this.$store.commit('SET_SETTINGS_OPEN', false);
        
        // Слушаем события поиска через eventBus
        eventBus.on('global-search', this.handleSearch);
    },
    beforeUnmount() {
        // Удаляем слушатель события
        eventBus.off('global-search', this.handleSearch);
    },

    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'firstName':
                    return i.icons() + i.firstName + ' ' + i.lastName + (i.contactPerson ? ' (' + i.contactPerson + ')' : '');
                case 'phones':
                    return i.phonesHtmlList();
                case 'emails':
                    return i.emailsHtmlList();
                case 'discount':
                    return i.discountFormatted();
                case 'status':
                    return i.statusIcon();
                case 'dateUser':
                    return i.formatCreatedAt();

                default:
                    return i[c];
            }
        },
        handleSearch(query) {
            // Обновляем store напрямую
            this.$store.dispatch('setSearchQuery', query);
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const new_data = await ClientController.getItems(page, this.searchQuery);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingClientList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        handleSaved() {
            this.showNotification(this.$t('clientSuccessfullyAdded'), '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleSavedError(m) {
            this.showNotification(this.$t('errorSavingClient'), m, true);
        },
        handleDeleted() {
            this.showNotification(this.$t('clientSuccessfullyDeleted'), '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleDeletedError(m) {
            this.showNotification(this.$t('errorDeletingClient'), m, true);
        },
        handleModalClose() {
            // Проверяем, есть ли изменения в форме
            if (this.$refs.clientForm && this.$refs.clientForm.handleCloseRequest) {
                this.$refs.clientForm.handleCloseRequest();
            } else {
                this.closeModal();
            }
        }
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
    },
}
</script>
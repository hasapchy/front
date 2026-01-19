<template>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.warehouse_writeoffs" :columns-config="columnsConfig"
                :table-data="data.items" :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :resetColumns="resetColumns"
                        :columns="columns"
                        :toggleVisible="toggleVisible"
                        :log="log">
                        <template #left>
                            <PrimaryButton 
                                :onclick="() => showModal(null)"
                                icon="fas fa-plus"
                                :disabled="!$store.getters.hasPermission('warehouse_writeoffs_create')">
                            </PrimaryButton>
                            <transition name="fade">
                                <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
                            </transition>
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
        <WarehousesWriteoffCreatePage v-if="modalDialog" ref="warehouseswriteoffcreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`" :confirm-text="$t('deleteSelected')"
                  :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import WarehouseWriteoffController from '@/api/WarehouseWriteoffController';
import WarehousesWriteoffCreatePage from '@/views/pages/warehouses/WarehousesWriteoffCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import ProductsListCell from '@/views/components/app/buttons/ProductsListCell.vue';
import { markRaw } from 'vue';


export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, ],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, WarehousesWriteoffCreatePage, BatchButton, AlertDialog, TableControlsBar, TableFilterButton, draggable: VueDraggableNext },
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            controller: WarehouseWriteoffController,
            cacheInvalidationType: 'writeoffs',
            editingItem: null,
            savedSuccessText: this.$t('writeoffSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingWriteoff'),
            deletedSuccessText: this.$t('writeoffSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingWriteoff'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'dateUser', label: 'dateUser' },
                { name: 'warehouseName', label: 'warehouse' },
                {
                    name: 'products',
                    label: 'products',
                    component: markRaw(ProductsListCell),
                    props: (item) => ({
                        products: item.products || []
                    })
                },
                { name: 'note', label: 'note' },
            ]
        }
    },
    computed: {
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    mounted() {
        this.fetchItems();
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'dateUser':
                    return `${i.formatCreatedAt()} / ${i.userName}`;
                case 'products':
                    // Возвращаем количество продуктов для сортировки (отображение через компонент ProductsListCell)
                    return (i.products || []).length;
                default:
                    return i[c];
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
               
                const per_page = this.perPage;
                
                const new_data = await WarehouseWriteoffController.getItems(page, per_page);
                this.data = new_data;
            } catch (error) {
                this.showNotification('Ошибка получения списка списаний', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        }
    }
}
</script>
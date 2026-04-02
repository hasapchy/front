<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="data != null && !loading"
        key="table"
      >
        <DraggableTable
          table-key="admin.warehouse_movements"
          :columns-config="columnsConfig"
          :table-data="data.items"
          :item-mapper="itemMapper"
          :on-item-click="(i) => { showModal(i) }"
          @selection-change="selectedIds = $event"
        >
          <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
            <TableControlsBar
              :show-pagination="true"
              :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
              :on-page-change="fetchItems"
              :on-per-page-change="handlePerPageChange"
              :reset-columns="resetColumns"
              :columns="columns"
              :toggle-visible="toggleVisible"
              :log="log"
            >
              <template #left>
                <PrimaryButton 
                  :onclick="() => showModal(null)"
                  icon="fas fa-plus"
                  :disabled="!$store.getters.hasPermission('warehouse_movements_create')"
                />
                <transition name="fade">
                  <BatchButton
                    v-if="selectedIds.length"
                    :selected-ids="selectedIds"
                    :batch-actions="getBatchActions()"
                  />
                </transition>
              </template>
              <template #right>
                <Pagination
                  v-if="data != null"
                  :current-page="data.currentPage"
                  :last-page="data.lastPage"
                  :per-page="perPage"
                  :per-page-options="perPageOptions"
                  :show-per-page-selector="true"
                  @change-page="fetchItems"
                  @per-page-change="handlePerPageChange"
                />
              </template>

              <template #gear="{ resetColumns, columns, toggleVisible, log }">
                <TableFilterButton
                  v-if="columns && columns.length"
                  :on-reset="resetColumns"
                >
                  <ul>
                    <draggable
                      v-if="columns.length"
                      class="dragArea list-group w-full"
                      :list="columns"
                      @change="log"
                    >
                      <li
                        v-for="(element, index) in columns"
                        v-show="element.name !== 'select'"
                        :key="element.name"
                        class="flex items-center hover:bg-gray-100 p-2 rounded"
                        @click="toggleVisible(index)"
                      >
                        <div class="space-x-2 flex flex-row justify-between w-full select-none">
                          <div>
                            <i
                              class="text-sm mr-2 text-[#337AB7]"
                              :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                            />
                            {{ $te(element.label) ? $t(element.label) : element.label }}
                          </div>
                          <div>
                            <i
                              class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"
                            />
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
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </transition>
    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenMovement', 'sideModalNomMovement')"
      :onclose="handleModalClose"
    >
      <WarehousesMovementCreatePage
        v-if="modalDialog"
        ref="warehousesmovementcreatepageForm"
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
      />
    </SideModalDialog>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`"
      :confirm-text="$t('deleteSelected')"
      :leave-text="$t('cancel')"
      @confirm="confirmDeleteItems"
      @leave="deleteDialog = false"
    />
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import WarehouseMovementController from '@/api/WarehouseMovementController';
import WarehousesMovementCreatePage from '@/views/pages/warehouses/WarehousesMovementCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import WarehouseDirectionCell from '@/views/components/app/buttons/WarehouseDirectionCell.vue';
import ProductsListCell from '@/views/components/app/buttons/ProductsListCell.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { markRaw } from 'vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';

export default {
    components: { PrimaryButton, SideModalDialog, Pagination, DraggableTable, WarehousesMovementCreatePage, BatchButton, AlertDialog, WarehouseDirectionCell, TableControlsBar, TableFilterButton, TableSkeleton, draggable: VueDraggableNext },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin,],
    data() {
        return {
            controller: WarehouseMovementController,
            cacheInvalidationType: 'movements',
            editingItem: null,
            savedSuccessText: this.$t('movementSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingMovement'),
            deletedSuccessText: this.$t('movementSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingMovement'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'dateUser', label: 'dateUser' },
                {
                    name: 'direction',
                    label: 'direction',
                    component: markRaw(WarehouseDirectionCell),
                    props: (item) => ({
                        movement: item
                    })
                },
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
                    return `${i.formatDate()} / ${i.creator?.name }`;
                case 'products':
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

                this.data = await WarehouseMovementController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingMovements'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        }
    }
}
</script>
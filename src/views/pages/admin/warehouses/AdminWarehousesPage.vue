<template>
  <transition
    name="fade"
    mode="out-in"
  >
    <div
      v-if="data != null && !loading"
      key="table"
    >
      <DraggableTable
        table-key="admin.warehouses"
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
    :title="sideModalCrudTitle('sideModalGenWarehouse', 'sideModalNomWarehouse')"
    :onclose="handleModalClose"
  >
    <AdminWarehouseCreatePage
      ref="adminwarehousecreatepageForm"
      :warehouse="editingItem"
      @saved="handleSaved"
      @saved-error="handleSavedError"
      @deleted="handleDeleted"
      @deleted-error="handleDeletedError"
      @close-request="closeModal"
    />
  </SideModalDialog>
  <AlertDialog
    :dialog="deleteDialog"
    :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
    :confirm-text="$t('delete')"
    :leave-text="$t('cancel')"
    @confirm="confirmDeleteItems"
    @leave="deleteDialog = false"
  />
</template>
<script>
import WarehouseController from '@/api/WarehouseController';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import AdminWarehouseCreatePage from '@/views/pages/admin/warehouses/AdminWarehouseCreatePage.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';

export default {
    components: {
        PrimaryButton,
        SideModalDialog,
        AdminWarehouseCreatePage,
        Pagination,
        DraggableTable,
        BatchButton,
        AlertDialog,
        TableControlsBar,
        TableFilterButton,
        TableSkeleton,
        draggable: VueDraggableNext
    },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin],
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            cacheInvalidationType: 'warehouses',
            controller: WarehouseController,
            savedSuccessText: this.$t('warehouseSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingWarehouse'),
            deletedSuccessText: this.$t('warehouseSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingWarehouse'),
            columnsConfig: [
                { name: 'name', label: this.$t('name') },
                { name: 'createdAt', label: this.$t('creationDate') }
            ]
        }
    },
    computed: {
    },
    created() {
        this.fetchItems();
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'createdAt':
                    return i.formatCreatedAt();
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
               
                this.data = await WarehouseController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorGettingWarehouseList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        }
    },
}
</script>

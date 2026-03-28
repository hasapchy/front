<template>
  <transition
    name="fade"
    mode="out-in"
  >
    <div
      v-if="data != null && !loading"
      :key="`table-${$i18n.locale}`"
    >
      <DraggableTable
        table-key="admin.order_statuses"
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
                :onclick="() => { showModal(null) }"
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
    :onclose="handleModalClose"
  >
    <OrderStatusCreatePage
      ref="orderstatuscreatepageForm"
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
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import OrderStatusController from '@/api/OrderStatusController';
import OrderStatusCreatePage from './OrderStatusCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import { translateOrderStatus, translateOrderStatusCategory } from '@/utils/translationUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';

export default {
    components: {
        PrimaryButton, SideModalDialog, OrderStatusCreatePage, Pagination, DraggableTable, AlertDialog, BatchButton, TableControlsBar, TableFilterButton, TableSkeleton, draggable: VueDraggableNext
    },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, ],
    data() {
        return {
            controller: OrderStatusController,
            cacheInvalidationType: 'orderStatuses',
            savedSuccessText: this.$t('statusSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingStatus'),
            deletedSuccessText: this.$t('statusSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingStatus'),
            showStatusSelect: false,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: '№', size: 60 },
                { name: 'name', label: 'name' },
                { name: 'categoryName', label: 'category' },
                { name: 'status', label: 'status' },
                { name: 'createdAt', label: 'creationDate' }
            ]
        }
    },
    created() {
        this.fetchItems();
    },
    methods: {
        translateOrderStatus,
        translateOrderStatusCategory,
        getBatchActions() {
            const actions = [];
            
            if (this.$store?.getters?.hasPermission?.('order_statuses_delete')) {
                actions.push({
                    label: "",
                    icon: "fas fa-trash",
                    type: "danger",
                    action: this.deleteItems,
                    disabled: this.loadingBatch,
                });
            }
            
            return actions;
        },
        itemMapper(i, c) {
            switch (c) {
                case 'createdAt':
                    return i.formatCreatedAt ? i.formatCreatedAt() : i.createdAt;
                case 'status':
                    return i.isActive ? this.$t('active') : this.$t('inactive');
                case 'name':
                    return translateOrderStatus(i.name, this.$t);
                case 'categoryName':
                    return i.categoryName ? translateOrderStatusCategory(i.categoryName, this.$t) : '-';
                default:
                    return i[c];
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                this.data = await OrderStatusController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorGettingStatuses'), error.message, true);
            }
            if (!silent) this.loading = false;
        }
    }
}
</script>

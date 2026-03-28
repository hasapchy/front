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
          table-key="admin.transaction_categories"
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
                  :disabled="!$store.getters.hasPermission('transaction_categories_create')"
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
                  @change-page="(page) => fetchItems(page)"
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
      <TransactionCategoryCreatePage
        ref="transactioncategorycreatepageForm"
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
      :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
      :confirm-text="$t('delete')"
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
import TransactionCategoryController from '@/api/TransactionCategoryController';
import TransactionCategoryCreatePage from './TransactionCategoryCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';

export default {
    components: { PrimaryButton, SideModalDialog, TransactionCategoryCreatePage, Pagination, DraggableTable, BatchButton, AlertDialog, TableControlsBar, TableFilterButton, TableSkeleton, draggable: VueDraggableNext },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin],
    data() {
        return {
            controller: TransactionCategoryController,
            cacheInvalidationType: 'transactionCategories',
            deletePermission: 'transaction_categories_delete',
            showStatusSelect: false,
            savedSuccessText: this.$t('transactionCategorySuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingTransactionCategory'),
            deletedSuccessText: this.$t('transactionCategorySuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingTransactionCategory'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: '№', size: 60 },
                { name: 'name', label: this.$t('name') },
                { name: 'type', label: this.$t('type') },
                { name: 'creatorName', label: this.$t('createdBy') },
                { name: 'createdAt', label: this.$t('creationDate') }
            ]
        }
    },
    created() {
        this.fetchItems();
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'type':
                    return `${i.typeClass()} ${i.typeText()}`;
                case 'createdAt':
                    return i.formatCreatedAt();
                case 'name':
                    return translateTransactionCategory(i.name, this.$t) || i.name;
                case 'creatorName':
                    return i.creator?.name ;
                default:
                    return i[c];
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                this.data = await TransactionCategoryController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingTransactionCategories'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        }
    }
}
</script>

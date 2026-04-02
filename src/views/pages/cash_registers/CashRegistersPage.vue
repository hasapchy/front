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
        table-key="admin.cash_registers"
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
                :disabled="!$store.getters.hasPermission('cash_registers_create')" 
                icon="fas fa-plus"
              >
                {{ $t('addCashRegister') }}
              </PrimaryButton>
                            
              <transition name="fade">
                <BatchButton
                  v-if="selectedIds.length"
                  :selected-ids="selectedIds"
                  :batch-actions="getBatchActions()"
                />
              </transition>
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
    :title="sideModalCrudTitle('sideModalGenCashRegister', 'sideModalNomCashRegister')"
    :onclose="handleModalClose"
  >
    <CashRegisterCreatePage
      ref="cashregistercreatepageForm"
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
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import CashRegisterController from '@/api/CashRegisterController';
import CashRegisterCreatePage from '@/views/pages/cash_registers/CashRegisterCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import { getCashRegisterTypeLabel } from '@/utils/cashRegisterUtils';

export default {
    components: {
        PrimaryButton,
        SideModalDialog,
        Pagination,
        DraggableTable,
        CashRegisterCreatePage,
        BatchButton,
        AlertDialog,
        TableSkeleton,
        TableControlsBar,
        TableFilterButton,
        draggable: VueDraggableNext
    },
    mixins: [modalMixin, notificationMixin, batchActionsMixin, crudEventMixin, getApiErrorMessageMixin, companyChangeMixin],
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            controller: CashRegisterController,
            cacheInvalidationType: 'cashRegisters',
            savedSuccessText: this.$t('cashRegisterSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingCashRegister'),
            deletedSuccessText: this.$t('cashRegisterSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingCashRegister'),
        }
    },
    computed: {
        columnsConfig() {
            return [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: this.$t('number'), size: 60 },
                { name: 'name', label: this.$t('name') },
                { name: 'type', label: this.$t('type') },
                ...(this.$store.getters.hasPermission('settings_cash_balance_view') ? [{ name: 'balance', label: this.$t('balance') }] : []),
                { name: 'currency', label: this.$t('currency') },
                { name: 'createdAt', label: this.$t('creationDate') },
                { name: 'dateUser', label: this.$t('dateUser'), html: true },
            ];
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },

    mounted() {
        this.fetchItems();
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'balance':
                    return this.$formatNumber(i.balance || 0, null, true) + ' ' + (i.currencySymbol );
                case 'users':
                    return (i.users ).length + ' ' + this.$t('users');
                case 'currency':
                    return i.currencySymbol ;
                case 'createdAt':
                    return i.formatCreatedAt();
                case 'dateUser':
                    return i.formatCreatedAt();
                case 'name':
                    return typeof i.name === 'string' ? i.name.trim() : '';
                case 'type':
                    return getCashRegisterTypeLabel(i.isCash, this.$t);
                default:
                    return i[c];
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async handleCompanyChanged(companyId, previousCompanyId) {
            this.selectedIds = [];
            await this.fetchItems(1, previousCompanyId == null);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                this.data = await CashRegisterController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorGettingCashRegisterList'), error.message, true);
            }
            if (!silent) this.loading = false;
        }
    },
}
</script>
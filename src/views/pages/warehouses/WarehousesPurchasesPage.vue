<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="purchasesCardsToolbar"
      >
        <template #table>
          <DraggableTable
            table-key="admin.warehouse_purchases"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="openPurchaseFromRow"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :show-pagination="true"
                :pagination-data="paginationData"
                :on-page-change="fetchItems"
                :on-per-page-change="handlePerPageChange"
                :reset-columns="resetColumns"
                :columns="columns"
                :toggle-visible="toggleVisible"
                :log="log"
              >
                <template #left>
                  <PrimaryButton
                    :onclick="openNewPurchase"
                    icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('warehouse_purchases_create')"
                  />
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="false"
                    :show-cards="true"
                    @change="changeViewMode"
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
                          class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded"
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
        </template>
        <template #card-bar-left>
          <PrimaryButton
            :onclick="openNewPurchase"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('warehouse_purchases_create')"
          />
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-gear>
          <CardFieldsGearMenu
            :card-fields="cardFields"
            :on-reset="resetCardFields"
            @toggle="toggleCardFieldVisible"
          />
        </template>
        <template #cards>
          <MapperCardGrid
            class="mt-4"
            :items="data.items"
            :card-config="cardConfigMerged"
            :card-mapper="purchaseCardMapper"
            title-field="title"
            title-subtitle-field="date"
            :title-prefix="purchaseCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="openPurchaseFromRow"
          />
        </template>
      </CardListViewShell>
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton v-else />
      </div>
    </transition>

    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalTitle"
      :onclose="handleModalClose"
    >
      <WarehousesPurchaseCreatePage
        v-if="modalDialog"
        ref="warehousePurchaseCreatePageForm"
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import WarehousesPurchaseCreatePage from '@/views/pages/warehouses/WarehousesPurchaseCreatePage.vue';
import WarehousePurchaseController from '@/api/WarehousePurchaseController';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import listQueryMixin from '@/mixins/listQueryMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

const warehousePurchasesListViewModeMixin = createStoreViewModeMixin({
    listPageKey: 'warehousePurchases',
    modes: ['table', 'cards'],
});

export default {
    components: {
        PrimaryButton,
        SideModalDialog,
        DraggableTable,
        TableControlsBar,
        TableFilterButton,
        TableSkeleton,
        CardsSkeleton,
        ViewModeToggle,
        MapperCardGrid,
        CardListViewShell,
        CardFieldsGearMenu,
        WarehousesPurchaseCreatePage,
        draggable: VueDraggableNext,
    },
    mixins: [modalMixin, notificationMixin, crudEventMixin, getApiErrorMessageMixin, cardFieldsVisibilityMixin, listQueryMixin, companyChangeMixin, warehousePurchasesListViewModeMixin],
    data() {
        return {
            controller: WarehousePurchaseController,
            cacheInvalidationType: 'purchases',
            savedSuccessText: this.$t('createdSuccess'),
            savedErrorText: this.$t('error'),
            deletedSuccessText: this.$t('deletedSuccess'),
            deletedErrorText: this.$t('error'),
            cardFieldsKey: 'admin.warehouse_purchases.cards',
            columnsConfig: [
                { name: 'id', label: 'number', size: 70 },
                { name: 'status', label: 'status' },
                { name: 'supplier', label: 'client' },
                { name: 'warehouse', label: 'warehouse' },
                { name: 'date', label: 'date' },
                { name: 'amount', label: 'totalAmount' },
            ],
        };
    },
    computed: {
        isDataReady() {
            return this.data != null && !this.loading;
        },
        paginationData() {
            if (!this.data) {
                return null;
            }
            return {
                currentPage: this.data.currentPage,
                lastPage: this.data.lastPage,
                perPage: this.perPage,
                perPageOptions: this.perPageOptions,
            };
        },
        purchasesCardsToolbar() {
            return {
                showPagination: true,
                paginationData: this.paginationData,
                onPageChange: this.fetchItems,
                onPerPageChange: this.handlePerPageChange,
            };
        },
        cardConfigBase() {
            return [
                { name: 'title', label: null },
                { name: 'status', label: 'status', icon: 'fas fa-signal text-[#3571A4]' },
                { name: 'supplier', label: 'client', icon: 'fas fa-user text-[#3571A4]' },
                { name: 'warehouse', label: 'warehouse', icon: 'fas fa-warehouse text-[#3571A4]' },
                { name: 'date', label: 'date', icon: 'fas fa-calendar text-[#3571A4]' },
                { name: 'amount', label: 'totalAmount', icon: 'fas fa-coins text-[#3571A4]' },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
        sideModalTitle() {
            return this.editingItem?.id ? `${this.$t('purchases')} #${this.editingItem.id}` : this.$t('purchases');
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    mounted() {
        this.fetchItems();
    },
    methods: {
        purchaseCardTitlePrefix() {
            return '<i class="fas fa-cart-plus text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        supplierName(item) {
            return item?.supplier?.display_name || item?.supplier?.first_name || '-';
        },
        warehouseName(item) {
            return item?.warehouse?.name || '-';
        },
        itemMapper(item, column) {
            switch (column) {
                case 'supplier':
                    return this.supplierName(item);
                case 'warehouse':
                    return this.warehouseName(item);
                default:
                    return item?.[column];
            }
        },
        purchaseCardMapper(item, fieldName) {
            if (!item) {
                return '';
            }
            if (fieldName === 'title') {
                return `#${item.id}`;
            }
            return this.itemMapper(item, fieldName) ?? '';
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
                this.data = await this.controller.getItems(page, this.perPage, {});
            } catch (error) {
                const text = this.apiErrorLinesAsString(error);
                this.showNotification(this.$t('error'), text || this.$t('error'), true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        async openPurchaseFromRow(item) {
            if (!item?.id) {
                return;
            }
            try {
                const full = await WarehousePurchaseController.getItem(item.id);
                this.showModal(full);
            } catch (error) {
                const text = this.apiErrorLinesAsString(error);
                this.showNotification(this.$t('error'), text || this.$t('error'), true);
            }
        },
        openNewPurchase() {
            this.showModal(null);
        },
        handleCompanyChanged(companyId, previousCompanyId) {
            this.fetchItems(1, previousCompanyId == null);
        },
    },
};
</script>

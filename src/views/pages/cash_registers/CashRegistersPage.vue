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
        :cards-toolbar="cardsToolbar"
      >
        <template #table>
          <DraggableTable
            table-key="admin.cash_registers"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="(i) => { showModal(i) }"
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
                    :onclick="() => { showModal(null) }"
                    :disabled="!$store.getters.hasPermission('cash_registers_create')"
                    icon="fas fa-plus"
                    :aria-label="$t('addCashRegister')"
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
                    <TableColumnDateModeSection :items="dateColumnsForSettings(columns)"
                      :resolve-mode="resolveColumnDateMode"
                      @set-mode="(item, mode) => setColumnDateDisplayMode(columns, item.index, mode)" />
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
                                class="text-sm mr-2 text-[var(--color-info)]"
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
            :onclick="() => { showModal(null) }"
            :disabled="!$store.getters.hasPermission('cash_registers_create')"
            icon="fas fa-plus"
            :aria-label="$t('addCashRegister')"
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
            :card-mapper="cashRegisterCardMapper"
            title-field="title"
            title-subtitle-field="createdAt"
            :title-prefix="cashRegisterCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="(i) => { showModal(i) }"
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
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import CashRegisterController from '@/api/CashRegisterController';
import CashRegisterCreatePage from '@/views/pages/cash_registers/CashRegisterCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { getCashRegisterTypeLabel, buildCashRegisterTitlePrefixHtml, buildCashRegisterIconBadgeOnlyHtml } from '@/utils/cashRegisterUtils';
import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin';
import { markRaw } from 'vue';
import UserButtonCell from '@/views/components/app/buttons/UserButtonCell.vue';

const cashRegistersListViewModeMixin = createStoreViewModeMixin({
  listPageKey: 'cashRegisters',
  modes: ['table', 'cards'],
});

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    DraggableTable,
    CashRegisterCreatePage,
    TableSkeleton,
    CardsSkeleton,
    TableControlsBar,
    TableFilterButton,
    TableColumnDateModeSection,
    ViewModeToggle,
    MapperCardGrid,
    CardListViewShell,
    CardFieldsGearMenu,
    draggable: VueDraggableNext,
  },
  mixins: [
    modalMixin,
    notificationMixin,
    crudEventMixin,
    getApiErrorMessageMixin,
    companyChangeMixin,
    cardFieldsVisibilityMixin,
    cashRegistersListViewModeMixin,
    tableColumnDateModeMixin,
  ],
  data() {
    return {
      tableColumnsPersistKey: 'admin.cash_registers',
      cardFieldsKey: 'admin.cash_registers.cards',
      controller: CashRegisterController,
      cacheInvalidationType: 'cashRegisters',
      modalFormRef: 'cashregistercreatepageForm',
      savedSuccessText: this.$t('cashRegisterSuccessfullyAdded'),
      savedErrorText: this.$t('errorSavingCashRegister'),
      deletedSuccessText: this.$t('cashRegisterSuccessfullyDeleted'),
      deletedErrorText: this.$t('errorDeletingCashRegister'),
    };
  },
  computed: {
    isDataReady() {
      return this.data != null && !this.loading;
    },
    columnsConfig() {
      return [
        { name: 'id', label: this.$t('number'), size: 60 },
        { name: 'color', label: this.$t('color'), size: 56, html: true },
        { name: 'name', label: this.$t('name') },
        { name: 'type', label: this.$t('type') },
        ...(this.$store.getters.hasPermission('settings_cash_balance_view')
          ? [{ name: 'balance', label: this.$t('balance') }]
          : []),
        { name: 'sortOrder', label: this.$t('sortOrder') },
        { name: 'currency', label: this.$t('currency') },
        { name: 'createdAt', label: this.$t('creationDate') },
        {
          name: 'creator',
          label: 'Кто создал',
          component: markRaw(UserButtonCell),
          props: (item) => ({ user: item.creator }),
        },
      ];
    },
    paginationData() {
      if (!this.data) return null;
      return {
        currentPage: this.data.currentPage,
        lastPage: this.data.lastPage,
        perPage: this.perPage,
        perPageOptions: this.perPageOptions,
      };
    },
    cardsToolbar() {
      return {
        showPagination: true,
        paginationData: this.paginationData,
        onPageChange: this.fetchItems,
        onPerPageChange: this.handlePerPageChange,
      };
    },
    cardConfigBase() {
      const balanceRow = this.$store.getters.hasPermission('settings_cash_balance_view')
        ? [{ name: 'balance', label: this.$t('balance'), icon: 'fas fa-wallet text-[#3571A4]' }]
        : [];
      return [
        { name: 'title', label: null },
        { name: 'type', label: this.$t('type'), icon: 'fas fa-tag text-[#3571A4]' },
        ...balanceRow,
        { name: 'currency', label: this.$t('currency'), icon: 'fas fa-coins text-[#3571A4]' },
      ];
    },
    cardConfigMerged() {
      const title = { name: 'title', label: null };
      const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
      return [title, ...rest];
    },
  },
  watch: {
    '$store.state.cashRegisterUserColorsRevision'() {
      this.$forceUpdate();
    },
  },
  created() {
    this.$store.commit('SET_SETTINGS_OPEN', true);
  },
  mounted() {
    this.fetchItems();
  },
  methods: {
    cashRegisterCardTitlePrefix(item) {
      return buildCashRegisterTitlePrefixHtml(item);
    },
    cashRegisterCardMapper(item, fieldName) {
      if (!item) return '';
      if (fieldName === 'title') {
        const n = typeof item.name === 'string' ? item.name.trim() : '';
        return n || String(item.id);
      }
      return this.itemMapper(item, fieldName) ?? '';
    },
    itemMapper(i, c) {
      switch (c) {
        case 'balance':
          return this.$formatNumber(i.balance || 0, true) + ' ' + i.currencyCode;
        case 'currency':
          return i.currencyCode;
        case 'sortOrder':
          return i.sortOrder;
        case 'createdAt':
          return i.formatCreatedAt();
        case 'creator':
          return this.getCashRegisterCreatorLabel(i);
        case 'name':
          return typeof i.name === 'string' ? i.name.trim() : '';
        case 'type':
          return getCashRegisterTypeLabel(i.isCash, this.$t);
        case 'color':
          return buildCashRegisterIconBadgeOnlyHtml(i, 'table');
        default:
          return i[c];
      }
    },
    getCashRegisterCreatorLabel(item) {
      const name = typeof item.creator?.name === 'string' ? item.creator.name.trim() : '';
      return name || item.creatorId || '';
    },
    async handleCompanyChanged(companyId, previousCompanyId) {
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
    },
  },
};
</script>

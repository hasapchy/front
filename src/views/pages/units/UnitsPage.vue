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
        :cards-toolbar="unitsCardsToolbar"
      >
              <template #table>
                <DraggableTable
                  table-key="settings.units_catalog"
                  :columns-config="unitColumnsConfig"
                  :table-data="unitTableRows"
                  :item-mapper="unitItemMapper"
                  :on-item-click="(i) => openUnitModal(i)"
                  :external-sort="false"
                >
                  <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                      :show-pagination="false"
                      :reset-columns="resetColumns"
                      :columns="columns"
                      :toggle-visible="toggleVisible"
                      :log="log"
                    >
                      <template #left>
                        <PrimaryButton
                          :onclick="() => openUnitModal(null)"
                          icon="fas fa-plus"
                          :disabled="!$store.getters.hasPermission('units_create')"
                        />
                        <ViewModeToggle
                          :view-mode="displayViewMode"
                          :show-kanban="false"
                          :show-cards="true"
                          @change="changeViewMode"
                        />
                      </template>
                      <template #gear="{ resetColumns: rc, columns: cols, toggleVisible: tv, log: lg }">
                        <TableFilterButton
                          v-if="cols && cols.length"
                          :on-reset="rc"
                        >
                          <TableColumnDateModeSection :items="dateColumnsForSettings(cols)"
                            :resolve-mode="resolveColumnDateMode"
                            @set-mode="(item, mode) => setColumnDateDisplayMode(cols, item.index, mode)" />
                          <ul>
                            <draggable
                              v-if="cols.length"
                              class="dragArea list-group w-full"
                              :list="cols"
                              @change="lg"
                            >
                              <li
                                v-for="(element, index) in cols"
                                v-show="element.name !== 'select'"
                                :key="element.name"
                                class="flex items-center rounded p-2 hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]"
                                @click="tv(index)"
                              >
                                <div class="flex w-full flex-row justify-between space-x-2 select-none">
                                  <div>
                                    <i
                                      class="mr-2 text-sm text-[var(--color-info)]"
                                      :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                                    />
                                    {{ $te(element.label) ? $t(element.label) : element.label }}
                                  </div>
                                  <div>
                                    <i class="fas fa-grip-vertical cursor-grab text-sm text-gray-300" />
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
                  :onclick="() => openUnitModal(null)"
                  icon="fas fa-plus"
                  :disabled="!$store.getters.hasPermission('units_create')"
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
                  :items="unitTableRows"
                  :card-config="cardConfigMerged"
                  :card-mapper="unitCardMapper"
                  title-field="title"
                  :title-prefix="unitCardTitlePrefix"
                  :show-checkbox="false"
                  @dblclick="openUnitModal"
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
      :title="sideModalCrudTitle('sideModalGenUnit', 'sideModalNomUnit')"
      :onclose="handleUnitModalClose"
    >
      <UnitCreatePage
        ref="unitCatalogForm"
        :editing-item="editingItem"
        @saved="handleUnitSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import UnitsController from '@/api/UnitsController';
import UnitCatalogDto from '@/dto/settings/UnitCatalogDto';
import UnitCreatePage from './UnitCreatePage.vue';
import modalMixin from '@/mixins/modalMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin';

const unitsCatalogListViewModeMixin = createStoreViewModeMixin({
  listPageKey: 'settings.units_catalog',
  modes: ['table', 'cards'],
});

export default {
  name: 'UnitsPage',
  components: {
    SideModalDialog,
    PrimaryButton,
    DraggableTable,
    TableControlsBar,
    TableFilterButton,
    TableColumnDateModeSection,
    TableSkeleton,
    CardsSkeleton,
    ViewModeToggle,
    MapperCardGrid,
    CardListViewShell,
    CardFieldsGearMenu,
    UnitCreatePage,
    draggable: VueDraggableNext,
  },
  mixins: [
    modalMixin,
    notificationMixin,
    crudEventMixin,
    getApiErrorMessageMixin,
    cardFieldsVisibilityMixin,
    unitsCatalogListViewModeMixin,
    tableColumnDateModeMixin,
  ],
  data() {
    return {
      tableColumnsPersistKey: 'settings.units_catalog',
      cardFieldsKey: 'settings.units_catalog.cards',
      cacheInvalidationType: 'units',
      savedSuccessText: this.$t('unitSuccessfullySaved'),
      savedErrorText: this.$t('errorSavingUnit'),
      deletedSuccessText: this.$t('unitSuccessfullyDeleted'),
      deletedErrorText: this.$t('errorDeletingUnit'),
      unitColumnsConfig: [
        { name: 'id', label: '№', size: 60 },
        { name: 'name', label: this.$t('name'), html: true, sortField: 'name' },
        { name: 'shortName', label: this.$t('unitDesignation') },
      ],
    };
  },
  computed: {
    isDataReady() {
      return this.data != null && !this.loading;
    },
    unitTableRows() {
      return this.data?.items ?? [];
    },
    unitsCardsToolbar() {
      return {
        showPagination: false,
      };
    },
    cardConfigBase() {
      return [
        { name: 'title', label: null },
        { name: 'shortName', label: 'unitDesignation', icon: 'fas fa-font text-[#3571A4]' },
      ];
    },
    cardConfigMerged() {
      const title = { name: 'title', label: null };
      const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
      return [title, ...rest];
    },
  },
  mounted() {
    this.fetchItems(1, false);
  },
  methods: {
    openUnitModal(item) {
      this.showModal(item ?? null);
    },
    unitCardTitlePrefix() {
      return '<i class="fa-solid fa-ruler-combined text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
    },
    unitCardMapper(item, fieldName) {
      if (!item) {
        return '';
      }
      if (fieldName === 'title') {
        const label = item.name || String(item.id);
        return `${this.$t('name')}${this.$t('symbolEmDash')}${label}`;
      }
      return this.unitItemMapper(item, fieldName) ?? '';
    },
    handleUnitModalClose() {
      const f = this.$refs.unitCatalogForm;
      if (f && typeof f.handleCloseRequest === 'function') {
        f.handleCloseRequest();
      } else {
        this.closeModal();
      }
    },
    escapeHtmlCell(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    },
    unitItemMapper(i, c) {
      if (c === 'name') {
        return this.escapeHtmlCell(i.name ?? '');
      }
      return i[c];
    },
    handleUnitSaved(response) {
      const wasNew = !this.editingItem?.id;
      const created = wasNew && response && response.id;
      this.showNotification(this.$t('unitSuccessfullySaved'), '', false);
      this.invalidateCache('onUpdate');
      void this.reloadUnits();
      if (created) {
        this.editingItem = UnitCatalogDto.fromApi(response);
        this.shouldRestoreScrollOnClose = false;
        return;
      }
      this.shouldRestoreScrollOnClose = false;
      this.closeModal(true);
    },
    async fetchItems(page = 1, silent = false) {
      void page;
      if (!silent) {
        this.loading = true;
      }
      try {
        const units = await UnitsController.listUnits();
        this.data = {
          items: UnitCatalogDto.fromApiArray(units),
          currentPage: 1,
          lastPage: 1,
        };
      } catch (error) {
        this.showNotification(this.$t('errorLoadingUnitsPage'), this.apiErrorLinesAsString(error), true);
        this.data = {
          items: [],
          currentPage: 1,
          lastPage: 1,
        };
      } finally {
        if (!silent) {
          this.loading = false;
        }
      }
    },
    async reloadUnits() {
      await this.fetchItems(1, true);
      await this.$store.dispatch('loadUnits');
    },
    onAfterSaved() {
      return this.$store.dispatch('loadUnits');
    },
    onAfterDeleted() {
      return this.$store.dispatch('loadUnits');
    },
  },
};
</script>

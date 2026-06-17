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
            table-key="admin.transaction_categories"
            :columns-config="columnsConfig"
            :table-data="treeVisibleItems"
            :item-mapper="itemMapper"
            :on-item-click="(i) => { showModal(i) }"
            :on-html-cell-click="handleTreeCellClick"
            :external-sort="true"
            @sort-change="onTreeSortChange"
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
                    :onclick="() => showModal(null)"
                    icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('transaction_categories_create')"
                  />
                  <PrimaryButton
                    :onclick="openTranslationsModal"
                    icon="fas fa-language"
                    :disabled="!$store.getters.hasPermission('transaction_categories_update')"
                  />
                  <PrimaryButton
                    v-if="treeHasAnyExpandable"
                    :onclick="treeIsAllExpanded ? collapseAllTree : expandAllTree"
                    :icon="treeIsAllExpanded ? 'fas fa-compress-alt' : 'fas fa-expand-alt'"
                    :aria-label="treeIsAllExpanded ? $t('collapseAll') : $t('expandAll')"
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
            :onclick="() => showModal(null)"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('transaction_categories_create')"
          />
          <PrimaryButton
            :onclick="openTranslationsModal"
            icon="fas fa-language"
            :disabled="!$store.getters.hasPermission('transaction_categories_update')"
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
            :card-mapper="transactionCategoryCardMapper"
            title-field="title"
            :title-prefix="transactionCategoryCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="showModal"
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
      :title="sideModalCrudTitle('sideModalGenTransactionCategory', 'sideModalNomTransactionCategory')"
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
    <SideModalDialog
      :show-form="translationsModalDialog"
      :title="$t('transactionCategories')"
      :onclose="closeTranslationsModal"
    >
      <TransactionCategoryTranslationsEditor
        @saved="handleTranslationsSaved"
        @close="closeTranslationsModal"
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
import TransactionCategoryController from '@/api/TransactionCategoryController';
import TransactionCategoryCreatePage from './TransactionCategoryCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import { dt } from '@/utils/displayI18n';
import { dtoDateFormatters } from '@/utils/dateUtils';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import treeTableMixin from '@/mixins/treeTableMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin';
import { markRaw } from 'vue';
import UserButtonCell from '@/views/components/app/buttons/UserButtonCell.vue';
import TransactionCategoryTranslationsEditor from './TransactionCategoryTranslationsEditor.vue';

const transactionCategoriesViewModeMixin = createStoreViewModeMixin({
    getter: 'transactionCategoriesViewMode',
    dispatch: 'setTransactionCategoriesViewMode',
    modes: ['table', 'cards'],
});

const escapeTreeCellHtml = (value) => {
    const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
    return String(value ?? '').replace(/[<>&"']/g, (c) => map[c]);
};

export default {
    components: { PrimaryButton, SideModalDialog, TransactionCategoryCreatePage, DraggableTable, TableControlsBar, TableFilterButton, TableColumnDateModeSection, TableSkeleton, ViewModeToggle, MapperCardGrid, CardListViewShell, CardFieldsGearMenu, CardsSkeleton, TransactionCategoryTranslationsEditor, draggable: VueDraggableNext },
    mixins: [modalMixin, notificationMixin, crudEventMixin, getApiErrorMessageMixin, cardFieldsVisibilityMixin, storeDataLoaderMixin, treeTableMixin, transactionCategoriesViewModeMixin, tableColumnDateModeMixin],
    data() {
        return {
            tableColumnsPersistKey: 'admin.transaction_categories',
            cardFieldsKey: 'admin.transaction_categories.cards',
            controller: TransactionCategoryController,
            cacheInvalidationType: 'transactionCategories',
            showStatusSelect: false,
            savedSuccessText: this.$t('transactionCategorySuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingTransactionCategory'),
            deletedSuccessText: this.$t('transactionCategorySuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingTransactionCategory'),
            translationsModalDialog: false,
            columnsConfig: [
                { name: 'id', label: '№', size: 60 },
                { name: 'name', label: this.$t('name'), html: true },
                { name: 'type', label: this.$t('type') },
                {
                    name: 'creatorName',
                    label: this.$t('createdBy'),
                    visible: false,
                    component: markRaw(UserButtonCell),
                    props: (item) => ({ user: item.creator }),
                },
                { name: 'createdAt', label: this.$t('creationDate'), type: 'datetime' }
            ]
        }
    },
    computed: {
        isDataReady() {
            return this.data != null && !this.loading;
        },
        paginationData() {
            if (!this.data) return null;
            return {
                currentPage: this.data.currentPage,
                lastPage: this.data.lastPage,
                perPage: this.perPage,
                perPageOptions: this.perPageOptions
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
            return [
                { name: 'title', label: null },
                { name: 'name', label: 'name', icon: 'fas fa-tag text-[#3571A4]' },
                { name: 'parentName', label: 'parentCategory', icon: 'fas fa-level-up-alt text-[#3571A4]' },
                { name: 'type', label: 'type', icon: 'fas fa-folder text-[#3571A4]', html: true },
                { name: 'creatorName', label: 'createdBy', icon: 'fas fa-user text-[#3571A4]', visible: false },
                { name: 'createdAt', label: 'creationDate', icon: 'fas fa-calendar text-[#3571A4]' },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map(f => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
        treeSourceItems() {
            return this.$store.getters.transactionCategories || [];
        },
    },
    created() {
        this.fetchItems();
        this.fetchAllCategories();
    },
    methods: {
        /**
         * Возвращает значение для сортировки колонок таблицы категорий.
         *
         * @param {object} item
         * @param {string} key
         * @returns {*}
         */
        treeSortValue(item, key) {
            if (!item) return '';
            switch (key) {
                case 'name':
                    return translateTransactionCategory(item.name, this.$t) || item.name || '';
                case 'creatorName':
                    return item.creator?.name || '';
                case 'type':
                    return item.type ? 1 : 0;
                default:
                    return item[key];
            }
        },
        /**
         * Загружает справочник категорий транзакций в Vuex.
         *
         * @param {{forceReload?: boolean}} [options]
         * @returns {Promise<void>}
         */
        fetchAllCategories(options = {}) {
            return this.loadStoreData({
                getterName: 'transactionCategories',
                dispatchName: 'loadTransactionCategories',
                defaultValue: [],
                forceReload: options.forceReload === true,
            });
        },
        /**
         * Перезагружает справочник категорий транзакций после CRUD-операции
         * принудительно, минуя in-memory кеш стора.
         *
         * @returns {Promise<void>}
         */
        onAfterSaved() {
            return this.fetchAllCategories({ forceReload: true });
        },
        /**
         * Перезагружает справочник категорий транзакций после удаления.
         *
         * @returns {Promise<void>}
         */
        onAfterDeleted() {
            return this.fetchAllCategories({ forceReload: true });
        },
        itemMapper(i, c) {
            switch (c) {
                case 'type': {
                    const icon = i.type ? '✅' : '🔺';
                    const text = i.type ? dt('transactionCategoryIncome') : dt('transactionCategoryExpense');
                    return `${icon} ${text}`;
                }
                case 'createdAt':
                    return dtoDateFormatters.formatCreatedAt(i.createdAt);
                case 'name': {
                    const label = translateTransactionCategory(i.name, this.$t) || i.name;
                    return this.treeNameCellHtml(label, i);
                }
                case 'parentName':
                    if (i.parent?.name) {
                        return translateTransactionCategory(i.parent.name, this.$t) || i.parent.name;
                    }
                    return '';
                case 'creatorName':
                    return i.creator?.name ;
                default:
                    return i[c];
            }
        },
        transactionCategoryCardTitlePrefix() {
            return '<i class="fas fa-folder-tree text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        transactionCategoryCardMapper(item, fieldName) {
            if (!item) return '';
            if (fieldName === 'title') {
                const label = translateTransactionCategory(item.name, this.$t) || item.name || String(item.id);
                return `${this.$t('name')}${this.$t('symbolEmDash')}${label}`;
            }
            if (fieldName === 'name') {
                return translateTransactionCategory(item.name, this.$t) || item.name || '';
            }
            return this.itemMapper(item, fieldName) ?? '';
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        /**
         * HTML ячейки названия: корневые категории жирным, без цветовой полосы группы.
         *
         * @param {string} label
         * @param {object} item
         * @returns {string}
         */
        treeNameCellHtml(label, item) {
            const meta = this.treeMetaById.get(item.id) || {
                level: 0,
                hasChildren: false,
                expanded: false,
            };
            const safeLabel = escapeTreeCellHtml(label);
            const indent = (meta.level || 0) * 16;
            const labelClass = meta.level === 0
                ? 'tree-row__label font-semibold'
                : 'tree-row__label';
            const chevron = meta.hasChildren
                ? `<span class="tree-row__chevron" data-source-type="tree-toggle" data-source-id="${item.id}"><i class="fas ${meta.expanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[10px]"></i></span>`
                : '<span class="tree-row__chevron-spacer"></span>';
            return `<span class="tree-cell"><span class="tree-row" style="padding-left:${indent}px;">${chevron}<span class="${labelClass}">${safeLabel}</span></span></span>`;
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
        },
        openTranslationsModal() {
            this.translationsModalDialog = true;
        },
        closeTranslationsModal() {
            this.translationsModalDialog = false;
        },
        handleTranslationsSaved() {
            this.closeTranslationsModal();
        },
    }
}
</script>

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
            table-key="admin.companies"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="(i) => showModal(i)"
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
                    :onclick="() => showModal(null)"
                    icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('companies_create')"
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
            :onclick="() => showModal(null)"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('companies_create')"
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
            :card-mapper="companyCardMapper"
            title-field="title"
            title-subtitle-field="createdAt"
            :title-prefix="companyCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="(i) => showModal(i)"
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
      :title="sideModalCrudTitle('sideModalGenCompany', 'sideModalNomCompany')"
      :onclose="handleModalClose"
    >
      <CompaniesCreatePage
        ref="companiescreatepageForm"
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
import CompaniesController from '@/api/CompaniesController';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import { formatDatabaseDate } from '@/utils/dateUtils';
import CompaniesCreatePage from './CompaniesCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { eventBus } from '@/eventBus';
import { IMAGE_LOAD_ERROR_FALLBACK } from '@/constants/imageFallback';

const companiesListViewModeMixin = createStoreViewModeMixin({
    listPageKey: 'companies',
    modes: ['table', 'cards'],
});

export default {
    components: { PrimaryButton, SideModalDialog, CompaniesCreatePage, DraggableTable, TableControlsBar, TableFilterButton, TableSkeleton, CardsSkeleton, ViewModeToggle, MapperCardGrid, CardListViewShell, CardFieldsGearMenu, draggable: VueDraggableNext },
    mixins: [notificationMixin, modalMixin, crudEventMixin, getApiErrorMessageMixin, cardFieldsVisibilityMixin, companiesListViewModeMixin],
    data() {
        return {
            cardFieldsKey: 'admin.companies.cards',
            titleField: 'title',
            controller: CompaniesController,
            cacheInvalidationType: 'companies',
            savedSuccessText: this.$t('companySaved'),
            savedErrorText: this.$t('errorSavingCompany'),
            deletedSuccessText: this.$t('companyDeleted'),
            deletedErrorText: this.$t('errorDeletingCompany'),
            columnsConfig: [
                { name: 'id', label: 'ID', size: 60 },
                { name: 'name', label: 'name' },
                { name: 'logo', label: 'logo', html: true },
                { name: 'createdAt', label: 'created' },
            ]
        };
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
                { name: 'logo', label: 'logo', icon: 'fas fa-image text-[#3571A4]', html: true },
                { name: 'createdAt', label: 'created', icon: 'fas fa-calendar text-[#3571A4]' },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map(f => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },
    mounted() {
        this.fetchItems();
        eventBus.on('company-updated', this.handleCompanyUpdated);
    },
    beforeUnmount() {
        eventBus.off('company-updated', this.handleCompanyUpdated);
    },
    methods: {
        companyCardTitlePrefix() {
            return '<i class="fas fa-building text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        companyCardMapper(item, fieldName) {
            if (!item) return '';
            if (fieldName === 'title') {
                return item.name || String(item.id);
            }
            return this.itemMapper(item, fieldName) ?? '';
        },
        formatDatabaseDate(date) {
            return formatDatabaseDate(date);
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                this.data = await CompaniesController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingCompanies'), error.message, true);
            }
            if (!silent) this.loading = false;
        },
        handleCompanyUpdated() {
            this.fetchItems();
            this.$store.dispatch('loadUserCompanies');
        },
        itemMapper(item, column) {
            switch (column) {
                case 'logo': {
                    const logoUrl = item.logoUrl ? item.logoUrl() : '/logo.png';
                    return `<img src="${logoUrl}" alt="${item.name}" class="w-8 h-8 object-contain rounded" onerror="this.onerror=null;this.src='${IMAGE_LOAD_ERROR_FALLBACK}'">`;
                }
                case 'createdAt':
                    return this.formatDatabaseDate(item.createdAt);
                default:
                    return item[column];
            }
        }
    },
};
</script>

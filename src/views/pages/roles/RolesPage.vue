<template>
  <div>
    <transition name="fade" mode="out-in">
      <CardListViewShell v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey" :display-view-mode="displayViewMode" :cards-toolbar="cardsToolbar">
        <template #table>
          <DraggableTable table-key="admin.roles" :columns-config="columnsConfig" :table-data="data.items"
            :item-mapper="itemMapper" :on-item-click="onItemClick">
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar :show-pagination="true" :pagination-data="paginationData" :on-page-change="fetchItems"
                :on-per-page-change="handlePerPageChange" :reset-columns="resetColumns" :columns="columns"
                :toggle-visible="toggleVisible" :log="log">
                <template #left>
                  <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('roles_create')" />
                  <ViewModeToggle :view-mode="displayViewMode" :show-kanban="false" :show-cards="true"
                    @change="changeViewMode" />
                </template>
                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                  <TableFilterButton v-if="columns && columns.length" :on-reset="resetColumns">
                    <ul>
                      <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns" @change="log">
                        <li v-for="(element, index) in columns" v-show="element.name !== 'select'" :key="element.name"
                          class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded" @click="toggleVisible(index)">
                          <div class="space-x-2 flex flex-row justify-between w-full select-none">
                            <div>
                              <i class="text-sm mr-2 text-[#337AB7]"
                                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']" />
                              {{ $te(element.label) ? $t(element.label) : element.label }}
                            </div>
                            <div>
                              <i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab" />
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
          <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('roles_create')" />
          <ViewModeToggle :view-mode="displayViewMode" :show-kanban="false" :show-cards="true"
            @change="changeViewMode" />
        </template>
        <template #card-bar-gear>
          <CardFieldsGearMenu :card-fields="cardFields" :on-reset="resetCardFields" @toggle="toggleCardFieldVisible" />
        </template>
        <template #cards>
          <MapperCardGrid class="mt-4" :items="data.items" :card-config="cardConfigMerged" :card-mapper="roleCardMapper"
            title-field="title" :title-prefix="roleCardTitlePrefix" :show-checkbox="false"
            @dblclick="(i) => onItemClick(i)" />
        </template>
      </CardListViewShell>
      <div v-else key="loader" class="min-h-64">
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton v-else />
      </div>
    </transition>
    <SideModalDialog :show-form="modalDialog" :title="sideModalCrudTitle('sideModalGenRole', 'sideModalNomRole')"
      :onclose="handleModalClose">
      <RolesCreatePage :key="editingItem ? editingItem.id : 'new-role'" ref="rolescreatepageForm"
        :editing-item="editingItem" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
        @deleted-error="handleDeletedError" @close-request="closeModal" />
    </SideModalDialog>
  </div>
</template>

<script>
import RolesController from '@/api/RolesController';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import RolesCreatePage from './RolesCreatePage.vue';
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

const rolesListViewModeMixin = createStoreViewModeMixin({
  listPageKey: 'roles',
  modes: ['table', 'cards'],
});

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    RolesCreatePage,
    DraggableTable,
    TableControlsBar,
    TableFilterButton,
    TableSkeleton,
    CardsSkeleton,
    ViewModeToggle,
    MapperCardGrid,
    CardListViewShell,
    CardFieldsGearMenu,
    draggable: VueDraggableNext,
  },
  mixins: [
    notificationMixin,
    modalMixin,
    crudEventMixin,
    getApiErrorMessageMixin,
    companyChangeMixin,
    cardFieldsVisibilityMixin,
    rolesListViewModeMixin,
  ],
  data() {
    return {
      cardFieldsKey: 'admin.roles.cards',
      titleField: 'title',
      controller: RolesController,
      cacheInvalidationType: 'roles',
      showStatusSelect: false,
      itemViewRouteName: 'RoleView',
      baseRouteName: 'roles',
      errorGettingItemText: this.$t('errorLoadingRoles'),
      savedSuccessText: this.$t('roleSaved'),
      savedErrorText: this.$t('errorSavingRole'),
      deletedSuccessText: this.$t('roleDeleted'),
      deletedErrorText: this.$t('errorDeletingRole'),
      columnsConfig: [
        { name: 'id', label: 'ID', size: 60 },
        { name: 'name', label: 'name' },
        { name: 'permissionsCount', label: 'permissions', size: 120 },
        { name: 'createdAt', label: 'created' },
      ],
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
      return [
        { name: 'title', label: null },
        { name: 'permissionsCount', label: 'permissions', icon: 'fas fa-key text-[#3571A4]' },
        { name: 'createdAt', label: 'created', icon: 'fas fa-calendar text-[#3571A4]' },
      ];
    },
    cardConfigMerged() {
      const title = { name: 'title', label: null };
      const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
      return [title, ...rest];
    },
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(value) {
        this.handleRouteItem(value);
      },
    },
  },
  created() {
    this.$store.commit('SET_SETTINGS_OPEN', true);
  },
  mounted() {
    this.fetchItems();
  },
  methods: {
    roleCardTitlePrefix() {
      return '<i class="fas fa-user-shield text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
    },
    roleCardMapper(item, fieldName) {
      if (!item) return '';
      if (fieldName === 'title') {
        return item.name || String(item.id);
      }
      return this.itemMapper(item, fieldName) ?? '';
    },
    async fetchItems(page = 1, silent = false) {
      if (!silent) this.loading = true;
      try {
        this.data = await RolesController.getItems(page, this.perPage);
      } catch (error) {
        this.showNotification(this.$t('errorLoadingRoles'), error.message, true);
      }
      if (!silent) this.loading = false;
    },
    async handleCompanyChanged(companyId, previousCompanyId) {
      if (this.modalDialog) {
        this.closeModal(true);
      }
      this.editingItem = null;
      if (this.$route.params.id) {
        this.$router.replace({ name: 'roles' });
      }
      await this.fetchItems(1, previousCompanyId == null);
    },
    itemMapper(item, column) {
      switch (column) {
        case 'permissionsCount':
          return item.permissions ? item.permissions.length : 0;
        case 'createdAt':
          return new Date(item.createdAt).toLocaleDateString();
        default:
          return item[column];
      }
    },
    async onAfterSaved() {
      setTimeout(() => {
        this.$store.dispatch('refreshUserPermissions').catch(() => undefined);
      }, 500);
    },
    closeModal(skipScrollRestore = false) {
      modalMixin.methods.closeModal.call(this, skipScrollRestore);
      if (this.$route.params.id) {
        this.$router.replace({ name: 'roles' });
      }
    },
  },
};
</script>

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
            table-key="admin.message_templates"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="onItemClick"
            :on-html-cell-click="handleCellClick"
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
                    v-if="canCreateTemplate"
                    :onclick="() => { showModal(null) }"
                    icon="fas fa-plus"
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
            v-if="canCreateTemplate"
            :onclick="() => { showModal(null) }"
            icon="fas fa-plus"
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
            :card-mapper="messageTemplateCardMapper"
            title-field="title"
            :title-prefix="messageTemplateCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="(i) => onItemClick(i)"
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
      :title="sideModalCrudTitle('sideModalGenMessageTemplate', 'sideModalNomMessageTemplate')"
      :onclose="handleModalClose"
    >
      <MessageTemplateCreatePage
        :key="editingItem ? editingItem.id : 'new-template'"
        ref="templateCreatePageForm"
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
import MessageTemplateController from '@/api/MessageTemplateController';
import MessageTemplateCreatePage from './MessageTemplateCreatePage.vue';
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

const messageTemplatesListViewModeMixin = createStoreViewModeMixin({
  listPageKey: 'messageTemplates',
  modes: ['table', 'cards'],
});

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    MessageTemplateCreatePage,
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
    modalMixin,
    notificationMixin,
    crudEventMixin,
    getApiErrorMessageMixin,
    companyChangeMixin,
    cardFieldsVisibilityMixin,
    messageTemplatesListViewModeMixin,
  ],
  data() {
    return {
      cardFieldsKey: 'admin.message_templates.cards',
      titleField: 'title',
      controller: MessageTemplateController,
      cacheInvalidationType: 'messageTemplates',
      itemViewRouteName: 'MessageTemplateView',
      baseRouteName: 'message_templates',
      errorGettingItemText: this.$t('errorGettingTemplate'),
      savedSuccessText: this.$t('templateSuccessfullyAdded'),
      savedErrorText: this.$t('errorSavingTemplate'),
      deletedSuccessText: this.$t('templateSuccessfullyDeleted'),
      deletedErrorText: this.$t('errorDeletingTemplate'),
      showStatusSelect: false,
      columnsConfig: [
        { name: 'id', label: 'number', size: 60 },
        { name: 'type', label: 'type', size: 120 },
        { name: 'name', label: 'name' },
        { name: 'isActive', label: 'isActive', size: 80, html: true },
        { name: 'user', label: 'author', size: 150 },
        { name: 'createdAt', label: 'creationDate' },
      ],
    };
  },
  computed: {
    canCreateTemplate() {
      return this.$store.getters.hasPermission('templates_create');
    },
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
        { name: 'type', label: 'type', icon: 'fas fa-file-alt text-[#3571A4]' },
        { name: 'isActive', label: 'isActive', icon: 'fas fa-toggle-on text-[#3571A4]' },
        { name: 'user', label: 'author', icon: 'fas fa-user text-[#3571A4]' },
        { name: 'createdAt', label: 'creationDate', icon: 'fas fa-calendar text-[#3571A4]' },
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
  mounted() {
    this.fetchItems();
  },
  methods: {
    messageTemplateCardTitlePrefix() {
      return '<i class="fas fa-envelope-open-text text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
    },
    messageTemplateCardMapper(item, fieldName) {
      if (!item) return '';
      if (fieldName === 'title') {
        return item.name || String(item.id);
      }
      if (fieldName === 'isActive') {
        return item.isActive ? '✅' : '❌';
      }
      return this.itemMapperForPlainField(item, fieldName) ?? '';
    },
    itemMapperForPlainField(i, c) {
      switch (c) {
        case 'createdAt':
          return i.formatCreatedAt();
        case 'type':
          return i.getTypeLabel();
        case 'user':
          if (!i.creator) return '';
          return `${i.creator.name} ${i.creator.surname}`.trim();
        default:
          return i[c];
      }
    },
    itemMapper(i, c) {
      switch (c) {
        case 'createdAt':
          return i.formatCreatedAt();
        case 'type':
          return i.getTypeLabel();
        case 'isActive':
          return `<span class="cursor-pointer" data-source-type="toggle" data-source-id="isActive">${i.isActive ? '✅' : '❌'}</span>`;
        case 'user':
          if (!i.creator) return '';
          return `${i.creator.name} ${i.creator.surname}`.trim();
        default:
          return i[c];
      }
    },
    async fetchItems(page = 1, silent = false) {
      if (!silent) {
        this.loading = true;
      }
      try {
        this.data = await MessageTemplateController.getItems(page, '', this.perPage);
      } catch (error) {
        this.showNotification(this.$t('errorGettingTemplateList'), this.getApiErrorMessage(error), true);
      }
      if (!silent) {
        this.loading = false;
      }
    },
    closeModal(skipScrollRestore = false) {
      modalMixin.methods.closeModal.call(this, skipScrollRestore);
      if (this.$route.params.id) {
        this.$router.replace({ name: 'message_templates' });
      }
    },
    async handleCellClick(item, column, data) {
      if (column.name === 'isActive' && data?.sourceType === 'toggle' && data?.sourceId === 'isActive') {
        if (!this.$store.getters.hasPermission('templates_update')) {
          this.showNotification(
            this.$t('error'),
            this.$t('noPermission'),
            true,
          );
          return;
        }
        try {
          const newStatus = !item.isActive;
          await MessageTemplateController.updateItem(item.id, {
            isActive: newStatus,
          });
          this.showNotification(
            this.$t('success'),
            newStatus
              ? this.$t('templateActivated')
              : this.$t('templateDeactivated'),
            false,
          );
          this.invalidateCache?.('onUpdate');
          await this.fetchItems?.();
        } catch (error) {
          const messages = this.getApiErrorMessage(error) || [error.message || 'Ошибка'];
          this.showNotification(
            this.$t('error'),
            Array.isArray(messages) ? messages.join('\n') : messages,
            true,
          );
        }
      }
    },
  },
};
</script>

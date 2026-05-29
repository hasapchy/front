<template>
  <div>
    <p class="mb-4 text-sm text-gray-600 dark:text-[var(--text-secondary)]">
      {{ $t('productionCalendarHelp') }}
    </p>
    <transition name="fade" mode="out-in">
      <div v-if="!loading">
        <DraggableTable
          table-key="admin.company-production-calendar"
          :columns-config="columnsConfig"
          :table-data="items"
          :item-mapper="itemMapper"
          :on-item-click="onItemClick"
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
                  :onclick="() => { modalDialog = true; }"
                  icon="fas fa-plus"
                  :disabled="!$store.getters.hasPermission('production_calendar_create')"
                />
              </template>
            </TableControlsBar>
          </template>
        </DraggableTable>
      </div>
      <TableSkeleton v-else class="min-h-64" />
    </transition>

    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenProductionCalendar', 'sideModalNomProductionCalendar')"
      :onclose="closeModal"
    >
      <CompanyProductionCalendarCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new-calendar-item'"
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
import dayjs from 'dayjs';
import ProductionCalendarController from '@/api/ProductionCalendarController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CompanyProductionCalendarCreatePage from '@/views/pages/company-production-calendar/CompanyProductionCalendarCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    DraggableTable,
    TableControlsBar,
    TableSkeleton,
    CompanyProductionCalendarCreatePage,
  },
  mixins: [notificationMixin, getApiErrorMessageMixin],
  data() {
    return {
      loading: false,
      items: [],
      modalDialog: false,
      editingItem: null,
    };
  },
  computed: {
    columnsConfig() {
      return [
        { name: 'date', label: 'date', size: 180 },
      ];
    },
  },
  watch: {
    '$store.state.currentCompany.id': {
      immediate: true,
      handler() {
        this.fetchItems();
      },
    },
    '$route.params.id': {
      immediate: true,
      async handler(id) {
        if (!id) {
          return;
        }
        await this.openById(id);
      },
    },
  },
  methods: {
    itemMapper(item, column) {
      if (column === 'date') {
        return dayjs(item.date).isValid() ? dayjs(item.date).format('DD.MM.YYYY') : item.date;
      }
      return '';
    },
    async fetchItems() {
      this.loading = true;
      try {
        const list = await ProductionCalendarController.getAll({});
        this.items = Array.isArray(list) ? list.slice().sort((a, b) => a.date.localeCompare(b.date)) : [];
      } catch (error) {
        this.items = [];
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
      } finally {
        this.loading = false;
      }
    },
    closeModal() {
      this.modalDialog = false;
      this.editingItem = null;
      if (this.$route.params.id) {
        this.$router.replace({ name: 'ProductionCalendar' });
      }
    },
    onItemClick(item) {
      const canUpdate = this.$store.getters.hasPermission('production_calendar_update_all');
      const canDelete = this.$store.getters.hasPermission('production_calendar_delete_all');
      if (!canUpdate && !canDelete) {
        return;
      }
      this.editingItem = item;
      this.modalDialog = true;
    },
    async handleSaved() {
      this.closeModal();
      await this.fetchItems();
      this.showNotification(this.$t('success'), this.$t('productionCalendarUpdated'), false);
    },
    handleSavedError(error) {
      this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
    },
    async handleDeleted() {
      try {
        this.closeModal();
        await this.fetchItems();
        this.showNotification(this.$t('success'), this.$t('productionCalendarUpdated'), false);
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
      }
    },
    handleDeletedError(error) {
      this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
    },
    async openById(id) {
      if (!id) {
        return;
      }
      const targetId = Number(id);
      if (!Number.isFinite(targetId)) {
        return;
      }
      if (!this.items.length) {
        await this.fetchItems();
      }
      const item = this.items.find((row) => Number(row.id) === targetId);
      if (item) {
        this.editingItem = item;
        this.modalDialog = true;
      } else {
        this.showNotification(this.$t('error'), this.$t('errorGettingData'), true);
      }
    },
  },
};
</script>

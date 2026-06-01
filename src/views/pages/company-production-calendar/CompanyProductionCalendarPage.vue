<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <div v-if="!loading">
        <DraggableTable
          table-key="admin.production-calendar"
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
                  :onclick="() => showModal(null)"
                  icon="fas fa-plus"
                  :disabled="!$store.getters.hasPermission('production_calendar_create')"
                />
              </template>
            </TableControlsBar>
          </template>
        </DraggableTable>
      </div>
      <TableSkeleton
        v-else
        class="min-h-64"
      />
    </transition>

    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalCrudTitle(
        'sideModalGenProductionCalendar',
        'sideModalNomProductionCalendar',
        undefined,
        productionCalendarItemLabel,
      )"
      :onclose="handleModalClose"
    >
      <CompanyProductionCalendarCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new-production-calendar-day'"
        ref="productionCalendarForm"
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
import modalMixin from '@/mixins/modalMixin';

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    DraggableTable,
    TableControlsBar,
    TableSkeleton,
    CompanyProductionCalendarCreatePage,
  },
  mixins: [modalMixin, notificationMixin, getApiErrorMessageMixin],
  data() {
    return {
      controller: ProductionCalendarController,
      itemViewRouteName: 'ProductionCalendarView',
      baseRouteName: 'ProductionCalendar',
      errorGettingItemText: this.$t('errorGettingData'),
      loading: false,
      items: [],
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
      handler(value) {
        this.handleRouteItem(value);
      },
    },
  },
  methods: {
    productionCalendarItemLabel(item) {
      if (!item?.date) {
        return '';
      }
      return dayjs(item.date).isValid() ? dayjs(item.date).format('DD.MM.YYYY') : String(item.date);
    },
    handleModalClose() {
      const form = this.$refs.productionCalendarForm;
      if (form && typeof form.handleCloseRequest === 'function') {
        form.handleCloseRequest();
      } else {
        this.closeModal();
      }
    },
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
        this.items = Array.isArray(list)
          ? list.slice().sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')))
          : [];
      } catch (error) {
        this.items = [];
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
      } finally {
        this.loading = false;
      }
    },
    closeModal(skipScrollRestore = false) {
      this.modalDialog = false;
      this.editingItem = null;
      if (this.$route.params.id) {
        this.$router.replace({ name: 'ProductionCalendar' });
      }
      if (!skipScrollRestore && this.shouldRestoreScrollOnClose) {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: this.savedScrollPosition,
              behavior: 'instant',
            });
          });
        });
      }
    },
    onItemClick(item) {
      const canUpdate = this.$store.getters.hasPermission('production_calendar_update_all');
      const canDelete = this.$store.getters.hasPermission('production_calendar_delete_all');
      if (!canUpdate && !canDelete) {
        return;
      }
      if (this.$route.name === 'ProductionCalendarView' && this.$route.params.id == item.id) {
        this.showModal(item);
        return;
      }
      if (this.$route.name === 'ProductionCalendar' || this.$route.name === 'ProductionCalendarView') {
        this.showModal(item);
        this.$router.push({ name: 'ProductionCalendarView', params: { id: item.id } }).catch(() => {});
        return;
      }
      this.$router.push({ name: 'ProductionCalendarView', params: { id: item.id } });
    },
    async handleSaved() {
      this.closeModal(true);
      await this.fetchItems();
      this.showNotification(this.$t('success'), this.$t('productionCalendarUpdated'), false);
    },
    handleSavedError(error) {
      this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
    },
    async handleDeleted() {
      this.closeModal(true);
      await this.fetchItems();
      this.showNotification(this.$t('success'), this.$t('productionCalendarUpdated'), false);
    },
    handleDeletedError(error) {
      this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
    },
  },
};
</script>

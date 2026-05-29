<template>
  <div>
    <transition name="fade" mode="out-in">
      <div v-if="!loading">
        <DraggableTable
          table-key="admin.company-holidays"
          :columns-config="columnsConfig"
          :table-data="data.items"
          :item-mapper="itemMapper"
          :on-item-click="onItemClick"
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
                  :disabled="!$store.getters.hasPermission('holidays_create')"
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
      :title="sideModalTitle"
      :onclose="closeModal"
    >
      <CompanyHolidayCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new-holiday'"
        :editing-item="editingItem"
        :company-id="currentCompanyId"
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
import HolidayController from '@/api/HolidayController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog, { sideModalCrudTitle } from '@/views/components/app/dialog/SideModalDialog.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CompanyHolidayCreatePage from '@/views/pages/company-holidays/CompanyHolidayCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    DraggableTable,
    TableControlsBar,
    TableSkeleton,
    CompanyHolidayCreatePage,
  },
  mixins: [notificationMixin, getApiErrorMessageMixin],
  data() {
    return {
      loading: false,
      data: {
        items: [],
        currentPage: 1,
        lastPage: 1,
      },
      perPage: 20,
      perPageOptions: [20, 50, 100],
      modalDialog: false,
      editingItem: null,
      columnsConfig: [
        { name: 'id', label: '#', size: 80 },
        { name: 'name', label: 'name' },
        { name: 'date', label: 'date', size: 150 },
        { name: 'endDate', label: 'endDate', size: 150 },
        { name: 'isRecurring', label: 'recurringHoliday', size: 160 },
      ],
    };
  },
  computed: {
    currentCompanyId() {
      return this.$store.state.currentCompany?.id ?? null;
    },
    sideModalTitle() {
      return sideModalCrudTitle(this.$t.bind(this), {
        item: this.editingItem,
        entityGenitiveKey: 'sideModalGenHoliday',
        entityNominativeKey: 'sideModalNomHoliday',
        getName: (item) => item?.name || '',
      });
    },
    paginationData() {
      return {
        currentPage: this.data.currentPage,
        lastPage: this.data.lastPage,
        perPage: this.perPage,
        perPageOptions: this.perPageOptions,
      };
    },
  },
  watch: {
    currentCompanyId: {
      immediate: true,
      handler() {
        this.fetchItems(1);
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
        return item.date ? dayjs(item.date).format('DD.MM.YYYY') : '';
      }
      if (column === 'endDate') {
        return item.endDate ? dayjs(item.endDate).format('DD.MM.YYYY') : '—';
      }
      if (column === 'isRecurring') {
        return item.isRecurring ? this.$t('yes') : this.$t('no');
      }
      return item[column];
    },
    async fetchItems(page = 1) {
      if (!this.currentCompanyId) {
        this.data = { items: [], currentPage: 1, lastPage: 1 };
        return;
      }
      this.loading = true;
      try {
        this.data = await HolidayController.getItems(page, this.perPage, { companyId: this.currentCompanyId });
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
      } finally {
        this.loading = false;
      }
    },
    handlePerPageChange(nextPerPage) {
      this.perPage = nextPerPage;
      this.fetchItems(1);
    },
    onItemClick(item) {
      if (!this.$store.getters.hasPermission('holidays_update')) {
        return;
      }
      this.showModal(item);
    },
    showModal(item) {
      this.editingItem = item;
      this.modalDialog = true;
    },
    closeModal() {
      this.modalDialog = false;
      this.editingItem = null;
      if (this.$route.params.id) {
        this.$router.replace({ name: 'Holidays' });
      }
    },
    async handleSaved() {
      this.closeModal();
      await this.fetchItems(this.data.currentPage || 1);
      this.showNotification(this.$t('success'), this.$t('saved'), false);
    },
    handleSavedError(error) {
      this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
    },
    async handleDeleted() {
      this.closeModal();
      await this.fetchItems(this.data.currentPage || 1);
      this.showNotification(this.$t('success'), this.$t('deleted'), false);
    },
    handleDeletedError(error) {
      this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
    },
    async openById(id) {
      if (!id) {
        return;
      }
      try {
        const item = await HolidayController.getItem(id);
        this.showModal(item);
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
      }
    },
  },
};
</script>

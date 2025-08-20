<template>
    <div class="flex justify-between items-center mb-2">
        <div class="flex items-center">
            <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus">
                {{ $t('addAdditionalField') }}
            </PrimaryButton>
        </div>
        <Pagination v-if="data" :currentPage="data.currentPage" :lastPage="data.lastPage" @changePage="fetchItems" />
    </div>

    <transition name="fade" mode="out-in">
        <div v-if="data && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.order_additional_fields" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => showModal(i)" @selectionChange="selectedIds = $event" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose" :timelineCollapsed="true" 
        :showTimelineButton="false" @toggle-timeline="() => {}">
        <OrderAdditionalFieldCreatePage ref="additionalFieldForm" @saved="handleSaved" @saved-silent="handleSavedSilent" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>

    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
    <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`" :confirm-text="$t('deleteSelected')"
          :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import Pagination from "@/views/components/app/buttons/Pagination.vue";
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import OrderAfController from "@/api/OrderAfController";
import OrderAdditionalFieldCreatePage from "@/views/pages/orders/OrderAdditionalFieldCreatePage.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import batchActionsMixin from "@/mixins/batchActionsMixin";
import modalMixin from "@/mixins/modalMixin";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";

export default {
    mixins: [getApiErrorMessage, notificationMixin, modalMixin, batchActionsMixin],
    components: { 
        NotificationToast, 
        SideModalDialog, 
        PrimaryButton, 
        Pagination, 
        DraggableTable, 
        OrderAdditionalFieldCreatePage, 
        AlertDialog 
    },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            editingItem: null,
            loadingDelete: false,
            controller: OrderAfController,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: "id", label: "№", size: 20 },
                { name: "name", label: 'name' },
                { name: "type", label: 'type' },
                { name: "categories", label: 'categories' },
                { name: "required", label: 'required' },
                { name: "default", label: 'default' },
                { name: "createdAt", label: 'createdAt' },
            ],
        };
    },
    created() {
        this.fetchItems();
        this.$store.commit("SET_SETTINGS_OPEN", true);
    },
    computed: {
        translatedColumnsConfig() {
            return this.columnsConfig.map(column => ({
                ...column,
                label: column.label === '#' || column.label === '№' ? column.label : this.$t(column.label)
            }));
        }
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case "type":
                    return i.getTypeLabel();
                case "categories":
                    return i.getCategoryNames();
                case "required":
                    return i.required ? this.$t('yes') : this.$t('no');
                case "default":
                    return i.defaultValue || "-";
                case "createdAt":
                    return i.createdAt ? new Date(i.createdAt).toLocaleDateString() : "-";
                default:
                    return i[c];
            }
        },
        handleModalClose() {
            const formRef = this.$refs.additionalFieldForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },

        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                const newData = await OrderAfController.getItemsPaginated(page);
                this.data = newData;
            } catch (error) {
                this.showNotification(this.$t('errorGettingAdditionalFieldsList'), error.message, true);
            }
            if (!silent) this.loading = false;
        },

        handleSaved() {
            this.showNotification(this.$t('additionalFieldSaved'), "", false);
            this.fetchItems(this.data.currentPage, true);
            this.closeModal();
        },

        handleSavedError(err) {
            this.showNotification(this.$t('errorSavingAdditionalField'), err, true);
        },

        handleDeleted() {
            this.showNotification(this.$t('additionalFieldDeleted'), "", false);
            this.fetchItems(this.data.currentPage, true);
            this.closeModal();
        },

        handleDeletedError(err) {
            this.showNotification(this.$t('errorDeletingAdditionalField'), err, true);
        },

        handleSavedSilent() {
            this.showNotification(this.$t('additionalFieldSaved'), "", false);
            this.fetchItems(this.data.currentPage, true);
        },

        async showModal(item) {
            if (item) {
                // Загружаем полные данные элемента для редактирования
                try {
                    this.editingItem = await OrderAfController.getItemById(item.id);
                } catch (error) {
                    console.error('Ошибка при загрузке данных для редактирования:', error);
                    this.editingItem = item; // Fallback на исходные данные
                }
            } else {
                this.editingItem = null;
            }
            this.modalDialog = true;
        },

        closeModal() {
            this.modalDialog = false;
            this.editingItem = null;
        }
    }
};
</script>

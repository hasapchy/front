<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div>
        <label class="required">{{ $t('statusName') }}</label>
        <input
          v-model="name"
          type="text"
        >
      </div>
      <div class="mt-4">
        <label class="required">{{ $t('statusCategory') }}</label>
        <div class="flex items-center space-x-2">
          <select v-model="categoryId">
            <option value="">
              {{ $t('selectStatusCategory') }}
            </option>
            <option
              v-for="cat in allCategories"
              :key="cat.id"
              :value="cat.id"
            >
              {{ translateOrderStatusCategory(cat.name, $t) }}
            </option>
          </select>
          <PrimaryButton
            icon="fas fa-add"
            :is-success="true"
            :onclick="showModal"
            :aria-label="$t('add')"
          />
        </div>
      </div>
      <div class="mt-4">
        <label class="flex items-center space-x-2">
          <input
            v-model="isActive"
            type="checkbox"
          >
          <span>{{ $t('isActive') }}</span>
        </label>
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItem != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!$store.getters.hasPermission('order_statuscategories_delete')"
          :aria-label="$t('delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="(editingItemId != null && !$store.getters.hasPermission('order_statuscategories_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('order_statuscategories_create'))"
          :aria-label="$t('save')"
        />
      </div>
    </teleport>
  </div>
  <AlertDialog
    :dialog="deleteDialog"
    :descr="$t('deleteOrderStatus')"
    :confirm-text="$t('deleteOrderStatus')"
    :leave-text="$t('cancel')"
    @confirm="deleteItem"
    @leave="closeDeleteDialog"
  />
  <AlertDialog
    :dialog="closeConfirmDialog"
    :descr="$t('unsavedChanges')"
    :confirm-text="$t('closeWithoutSaving')"
    :leave-text="$t('stay')"
    @confirm="confirmClose"
    @leave="cancelClose"
  />
  <SideModalDialog
    :show-form="modalDialog"
    :title="nestedOrderStatusCategoryModalTitle"
    :onclose="closeModal"
    :level="2"
  >
    <OrderStatusCategoryCreatePage @saved="onNestedCategorySaved" />
  </SideModalDialog>
</template>

<script>
import OrderStatusController from '@/api/OrderStatusController';
import OrderStatusDto from '@/dto/order/OrderStatusDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import SideModalDialog, { sideModalCrudTitle, sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import OrderStatusCategoryCreatePage from '@/views/pages/orders/OrderStatusCategoryCreatePage.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { translateOrderStatusCategory } from '@/utils/translationUtils';


export default {
    components: { PrimaryButton, AlertDialog, SideModalDialog, OrderStatusCategoryCreatePage },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: OrderStatusDto, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            categoryId: this.editingItem ? this.editingItem.categoryId : '',
            isActive: this.editingItem ? (this.editingItem.isActive !== undefined ? this.editingItem.isActive : true) : true,
            allCategories: [],
            modalDialog: false
        }
    },
    computed: {
        nestedOrderStatusCategoryModalTitle() {
            return sideModalCrudTitle(this.$t.bind(this), {
                item: null,
                entityGenitiveKey: 'sideModalGenOrderStatusCategory',
                entityNominativeKey: 'sideModalNomOrderStatusCategory',
            });
        },
    },
    mounted() {
        this.$nextTick(async () => {
            await this.fetchAllCategories();
            
            this.saveInitialState();
        });
    },
    methods: {
        translateOrderStatusCategory,
        async onNestedCategorySaved() {
            await this.fetchAllCategories();
            this.closeModal();
        },
        getFormState() {
            return {
                name: this.name,
                categoryId: this.categoryId,
                isActive: this.isActive
            };
        },
        async fetchAllCategories() {
            await this.$store.dispatch('loadOrderStatusCategories');
            this.allCategories = this.$store.getters.orderStatusCategories || [];
        },
        prepareSave() {
            return {
                name: this.name,
                categoryId: this.categoryId,
                isActive: this.isActive
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await OrderStatusController.updateItem(this.editingItemId, data);
            } else {
                return await OrderStatusController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await OrderStatusController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete order status');
            }
            return resp;
        },
        onSaveSuccess(response) {
            if (response && response.message) {
                this.clearForm();
            }
        },
        clearForm() {
            this.name = '';
            this.categoryId = '';
            this.isActive = true;
            this.fetchAllCategories();
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.name = newEditingItem.name ;
            this.categoryId = newEditingItem.categoryId ;
            this.isActive = newEditingItem.isActive !== undefined ? newEditingItem.isActive : true;
        },
        showModal() { this.modalDialog = true; },
        closeModal() { this.modalDialog = false; }
    }
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div>
        <label class="required">{{ $t('categoryName') }}</label>
        <input
          v-model="name"
          type="text"
        >
      </div>
      <div class="mt-4">
        <label>{{ $t('colorOptional') }}</label>
        <input
          v-model="color"
          type="color"
        >
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
    :descr="$t('deleteOrderStatusCategory')"
    :confirm-text="$t('delete')"
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
</template>

<script>
import OrderStatusCategoryController from '@/api/OrderStatusCategoryController';
import OrderStatusCategoryDto from '@/dto/order/OrderStatusCategoryDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

export default {
    components: { PrimaryButton, AlertDialog },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: OrderStatusCategoryDto, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            color: this.editingItem ? this.editingItem.color : '',
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    methods: {
        prepareSave() {
            return {
                name: this.name,
                color: this.color
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await OrderStatusCategoryController.updateItem(this.editingItemId, data);
            } else {
                return await OrderStatusCategoryController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await OrderStatusCategoryController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete order status category');
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
            this.color = '';
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        getFormState() {
            return {
                name: this.name,
                color: this.color
            };
        },
        onEditingItemChanged(newEditingItem) {
            this.name = newEditingItem.name ;
            this.color = newEditingItem.color ;
        }
    }
}
</script>

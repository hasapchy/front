<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editOrderStatusCategory') : $t('createOrderStatusCategory') }}</h2>
        <div>
            <label class="required">{{ $t('categoryName') }}</label>
            <input type="text" v-model="name">
        </div>
        <div class="mt-4">
            <label>{{ $t('colorOptional') }}</label>
            <input type="color" v-model="color">
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('order_statuscategories_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('order_statuscategories_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('order_statuscategories_create'))" :aria-label="$t('save')">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteOrderStatusCategory')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
</template>

<script>
import OrderStatusCategoryController from '@/api/OrderStatusCategoryController';
import OrderStatusCategoryDto from '@/dto/order/OrderStatusCategoryDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";

export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: OrderStatusCategoryDto, required: false, default: null }
    },
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
            this.name = newEditingItem.name || '';
            this.color = newEditingItem.color || '';
        }
    }
}
</script>

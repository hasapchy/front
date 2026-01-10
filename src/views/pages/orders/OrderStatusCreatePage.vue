<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editOrderStatus') : $t('createOrderStatus') }}</h2>
        <div>
            <label class="required">{{ $t('statusName') }}</label>
            <input type="text" v-model="name">
        </div>
        <div class="mt-4">
            <label class="required">{{ $t('statusCategory') }}</label>
            <div class="flex items-center space-x-2">
                <select v-model="categoryId">
                    <option value="">{{ $t('selectStatusCategory') }}</option>
                    <option v-for="cat in allCategories" :key="cat.id" :value="cat.id">
                        {{ translateOrderStatusCategory(cat.name, $t) }}
                    </option>
                </select>
                <PrimaryButton icon="fas fa-add" :is-info="true" :onclick="showModal" />
            </div>
        </div>
        <div class="mt-4">
            <label class="flex items-center space-x-2">
                <input type="checkbox" v-model="isActive">
                <span>{{ $t('isActive') || 'Активен' }}</span>
            </label>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('order_statuscategories_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('order_statuscategories_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('order_statuscategories_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteOrderStatus')" :confirm-text="$t('deleteOrderStatus')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal" :level="1">
        <OrderStatusCategoryCreatePage @saved="fetchAllCategories; closeModal()" />
    </SideModalDialog>
</template>

<script>
import OrderStatusController from '@/api/OrderStatusController';
import OrderStatusCategoryController from '@/api/OrderStatusCategoryController';
import OrderStatusDto from '@/dto/order/OrderStatusDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import OrderStatusCategoryCreatePage from '@/views/pages/orders/OrderStatusCategoryCreatePage.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import { translateOrderStatusCategory, translateOrderStatus } from '@/utils/translationUtils';


export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, SideModalDialog, OrderStatusCategoryCreatePage },
    props: {
        editingItem: { type: OrderStatusDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            categoryId: this.editingItem ? this.editingItem.categoryId : '',
            isActive: this.editingItem ? (this.editingItem.isActive !== undefined ? this.editingItem.isActive : true) : true,
            allCategories: [],
            modalDialog: false
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await this.fetchAllCategories();
            
            this.saveInitialState();
        });
    },
    methods: {
        translateOrderStatusCategory,
        translateOrderStatus,
        getFormState() {
            return {
                name: this.name,
                categoryId: this.categoryId,
                isActive: this.isActive
            };
        },
        async fetchAllCategories() {
            this.allCategories = await OrderStatusCategoryController.getListItems();
        },
        prepareSave() {
            return {
                name: this.name,
                category_id: this.categoryId,
                is_active: this.isActive
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
            this.name = newEditingItem.name || '';
            this.categoryId = newEditingItem.categoryId || '';
            this.isActive = newEditingItem.isActive !== undefined ? newEditingItem.isActive : true;
        },
        showModal() { this.modalDialog = true; },
        closeModal() { this.modalDialog = false; }
    }
}
</script>

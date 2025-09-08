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
                    <option value="">{{ $t('selectCategory') }}</option>
                    <option v-for="cat in allCategories" :key="cat.id" :value="cat.id">
                        {{ cat.name }}
                    </option>
                </select>
                <PrimaryButton icon="fas fa-add" :is-info="true" :onclick="showModal" />
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove"
            :disabled="!$store.getters.hasPermission('order_statuscategories_delete')">
            {{ $t('delete') }}
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('order_statuscategories_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('order_statuscategories_create'))">
            {{ $t('save') }}
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


export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, SideModalDialog, OrderStatusCategoryCreatePage },
    props: {
        editingItem: { type: OrderStatusDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            categoryId: this.editingItem ? this.editingItem.categoryId : '',
            editingItemId: this.editingItem ? this.editingItem.id : null,
            allCategories: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
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
        getFormState() {
            return {
                name: this.name,
                categoryId: this.categoryId
            };
        },
        async fetchAllCategories() {
            this.allCategories = await OrderStatusCategoryController.getAllItems();
        },
        async save() {
            this.saveLoading = true;
            try {
                let resp;
                if (this.editingItemId != null) {
                    resp = await OrderStatusController.updateItem(this.editingItemId, {
                        name: this.name,
                        category_id: this.categoryId
                    });
                } else {
                    resp = await OrderStatusController.storeItem({
                        name: this.name,
                        category_id: this.categoryId
                    });
                }
                if (resp.message) {
                    this.$emit('saved');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }
            this.saveLoading = false;
        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (!this.editingItemId) return;
            this.deleteLoading = true;
            try {
                const resp = await OrderStatusController.deleteItem(this.editingItemId);
                if (resp.message) {
                    this.$emit('deleted');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.name = '';
            this.categoryId = '';
            this.editingItemId = null;
            this.fetchAllCategories();
            this.resetFormChanges();
        },
        showDeleteDialog() { this.deleteDialog = true; },
        closeDeleteDialog() { this.deleteDialog = false; },
        showModal() { this.modalDialog = true; },
        closeModal() { this.modalDialog = false; }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.name = newEditingItem.name || '';
                    this.categoryId = newEditingItem.categoryId || '';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.name = '';
                    this.categoryId = '';
                    this.editingItemId = null;
                }
            },
            deep: true,
            immediate: true
        }
    }
}
</script>

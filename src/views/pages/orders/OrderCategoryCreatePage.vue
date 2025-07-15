<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Категория заказа</h2>
        <div>
            <label class="required">Название</label>
            <input type="text" v-model="name">
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление категории заказа'" :confirm-text="'Удалить категорию заказа'"
        :leave-text="'Отмена'" />
</template>

<script>
import OrderCategoryController from '@/api/OrderCategoryController';
import OrderCategoryDto from '@/dto/order/OrderCategoryDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';

export default {
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: OrderCategoryDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            editingItemId: this.editingItem ? this.editingItem.id : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
        }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
        async save() {
            this.saveLoading = true;
            try {
                let resp;
                if (this.editingItemId != null) {
                    resp = await OrderCategoryController.updateItem(this.editingItemId, { name: this.name });
                } else {
                    resp = await OrderCategoryController.storeItem({ name: this.name });
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
                const resp = await OrderCategoryController.deleteItem(this.editingItemId);
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
            this.editingItemId = null;
        },
        showDeleteDialog() { this.deleteDialog = true; },
        closeDeleteDialog() { this.deleteDialog = false; },
        getApiErrorMessage(e) {
            if (e?.response && e.response.data) {
                if (e.response.data.errors) {
                    return Object.values(e.response.data.errors).flat();
                }
                if (e.response.data.message) {
                    return [e.response.data.message];
                }
            }
            if (e?.message) return [e.message];
            return ["Ошибка"];
        }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.name = newEditingItem.name || '';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.name = '';
                    this.editingItemId = null;
                }
            },
            deep: true,
            immediate: true
        }
    }
}
</script>

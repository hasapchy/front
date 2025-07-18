<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Категория статусов</h2>
        <div>
            <label class="required">Название</label>
            <input type="text" v-model="name">
        </div>
        <div class="mt-4">
            <label>Цвет (опционально)</label>
            <input type="color" v-model="color">
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление категории статусов'" :confirm-text="'Удалить'" :leave-text="'Отмена'" />
</template>

<script>
import OrderStatusCategoryController from '@/api/OrderStatusCategoryController';
import OrderStatusCategoryDto from '@/dto/order/OrderStatusCategoryDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';

export default {
    mixins: [getApiErrorMessage],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: OrderStatusCategoryDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            color: this.editingItem ? this.editingItem.color : '',
            editingItemId: this.editingItem ? this.editingItem.id : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
        }
    },
    methods: {
        async save() {
            this.saveLoading = true;
            try {
                let resp;
                if (this.editingItemId != null) {
                    resp = await OrderStatusCategoryController.updateItem(this.editingItemId, {
                        name: this.name,
                        color: this.color
                    });
                } else {
                    resp = await OrderStatusCategoryController.storeItem({
                        name: this.name,
                        color: this.color
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
                const resp = await OrderStatusCategoryController.deleteItem(this.editingItemId);
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
            this.color = '';
            this.editingItemId = null;
        },
        showDeleteDialog() { this.deleteDialog = true; },
        closeDeleteDialog() { this.deleteDialog = false; },
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.name = newEditingItem.name || '';
                    this.color = newEditingItem.color || '';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.name = '';
                    this.color = '';
                    this.editingItemId = null;
                }
            },
            deep: true,
            immediate: true
        }
    }
}
</script>

<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Касса</h2>
        <div>
            <label class="required">Название</label>
            <input type="text" v-model="name">
        </div>
        <div class=" mt-2">
            <label class="block mb-1">Валюта</label>
            <select v-model="currency_id" :disabled="!!editingItemId">
                <option value="">Нет</option>
                <option v-if="currencies.length" v-for="parent in currencies" :value="parent.id">{{ parent.name }}
                </option>
            </select>
        </div>
        <label>Баланс</label>
        <div class="flex items-center rounded-l">
            <input type="number" v-model="balance" :disabled="!!editingItemId">
            <span v-if="selectedCurrency" class="p-2 bg-gray-200 rounded-r ">{{ selectedCurrency?.symbol }}</span>
        </div>
        <div class="mt-4">
            <label>Назначить пользователей</label>
            <div v-if="users != null && users.length != 0" class="flex flex-wrap gap-2">
                <label v-for="user, index in users" :key="user.id"
                    class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                    <input type="checkbox" :value="user.id" v-model="selectedUsers" :id="'user-' + user.id">
                    <span class="text-black">{{ user.name }}</span>
                </label>
            </div>
        </div>
    </div>
    <!-- {{ editingItem.id }} -->
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление кассы'" :confirm-text="'Удалить кассу'" :leave-text="'Отмена'" />
</template>


<script>
import AppController from '@/api/AppController';
import CashRegisterController from '@/api/CashRegisterController';
import UsersController from '@/api/UsersController';
import CashRegisterDto from '@/dto/cash_register/CashRegisterDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
export default {
    mixins: [getApiErrorMessage],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: CashRegisterDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            selectedUsers: this.editingItem ? this.editingItem.users.map(user => user.id.toString()) : [],
            editingItemId: this.editingItem ? this.editingItem.id : null,
            balance: this.editingItem ? this.editingItem.balance : '',
            currency_id: this.editingItem ? this.editingItem.currency_id : '',
            users: [],
            currencies: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
        }
    },
    created() {
        this.fetchUsers();
        this.fetchCurrencies();
    },
    computed: {
        selectedCurrency() {
            return this.currencies.find(currency => currency.id == this.currency_id);
        }
    },
    methods: {
        async fetchUsers() {
            this.users = await UsersController.getAllUsers();
        },
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async save() {
            this.saveLoading = true;
            try {
                if (this.editingItemId != null) {
                    var resp = await CashRegisterController.updateItem(
                        this.editingItemId,
                        {
                            name: this.name,
                            // balance: this.balance,
                            // currency_id: this.currency_id,
                            users: this.selectedUsers,
                        });
                } else {
                    var resp = await CashRegisterController.storeItem({
                        name: this.name,
                        balance: this.balance,
                        currency_id: this.currency_id,
                        users: this.selectedUsers
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
            if (this.editingItemId == null) {
                return;
            }
            this.deleteLoading = true;
            try {
                var resp = await CashRegisterController.deleteItem(
                    this.editingItemId);
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
            this.selectedUsers = [];
            this.balance = '0';
            this.currency_id = '';
            this.editingItemId = null;
            this.fetchCurrencies();
            this.fetchUsers();
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        }

    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.name = newEditingItem.name || '';
                    this.selectedUsers = Array.isArray(newEditingItem.users)
                        ? newEditingItem.users
                        : [];
                    this.balance = newEditingItem.balance || '';
                    this.currency_id = newEditingItem.currency_id || '';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.name = '';
                    this.selectedUsers = [];
                    this.balance = '0';
                    this.currency_id = '';
                    this.editingItemId = null;
                }
            },
            deep: true,
            immediate: true
        }
    }
}

</script>
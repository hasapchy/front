<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editCashRegister') : $t('createCashRegister') }}</h2>
        <div>
            <label class="required">{{ $t('name') }}</label>
            <input type="text" v-model="name">
        </div>
        <div class=" mt-2">
            <label class="block mb-1">{{ $t('currency') }}</label>
            <select v-model="currency_id" :disabled="!!editingItemId">
                <option value="">{{ $t('no') }}</option>
                <template v-if="currencies.length">
                    <option v-for="parent in currencies" :key="parent.id" :value="parent.id">{{ parent.name }}</option>
                </template>
            </select>
        </div>
        <label>{{ $t('balance') }}</label>
        <div class="flex items-center rounded-l">
            <input type="number" v-model="balance" :disabled="!!editingItemId">
            <span v-if="selectedCurrency" class="p-2 bg-gray-200 rounded-r ">{{ selectedCurrency?.symbol }}</span>
        </div>
        <div class="mt-2">
            <label class="flex items-center space-x-2">
                <input type="checkbox" v-model="is_rounding">
                <span>Включить округление транзакций до целых чисел</span>
            </label>
        </div>
        <div class="mt-4">
            <label>{{ $t('assignUsers') }}</label>
            <div v-if="users != null && users.length != 0" class="flex flex-wrap gap-2">
                <label v-for="user in users" :key="user.id"
                    class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                    <input type="checkbox" :value="user.id" v-model="selectedUsers" :id="'user-' + user.id">
                    <span class="text-black">{{ user.name }}</span>
                </label>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-times" :disabled="!$store.getters.hasPermission('cash_registers_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('cash_registers_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('cash_registers_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteCashRegister')" :confirm-text="$t('deleteCashRegister')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>


<script>
import AppController from '@/api/AppController';
import CashRegisterController from '@/api/CashRegisterController';
import UsersController from '@/api/UsersController';
import CashRegisterDto from '@/dto/cash_register/CashRegisterDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: CashRegisterDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            selectedUsers: this.editingItem ? this.editingItem.getUserIds() : [],
            editingItemId: this.editingItem ? this.editingItem.id : null,
            balance: this.editingItem ? this.editingItem.balance : '',
            is_rounding: this.editingItem ? this.editingItem.is_rounding : false,
            currency_id: this.editingItem ? this.editingItem.currency_id : '',
            users: [],
            currencies: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchUsers(),
                this.fetchCurrencies()
            ]);
            
            this.saveInitialState();
        });
    },
    computed: {
        selectedCurrency() {
            return this.currencies.find(currency => currency.id == this.currency_id);
        }
    },
    methods: {
        getFormState() {
            return {
                name: this.name,
                selectedUsers: [...this.selectedUsers],
                balance: this.balance,
                is_rounding: this.is_rounding,
                currency_id: this.currency_id
            };
        },
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
                            is_rounding: this.is_rounding,
                            users: this.selectedUsers,
                        });
                } else {
                    var resp = await CashRegisterController.storeItem({
                        name: this.name,
                        balance: this.balance,
                        is_rounding: this.is_rounding,
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
            this.is_rounding = false;
            this.currency_id = '';
            this.editingItemId = null;
            this.fetchCurrencies();
            this.fetchUsers();
            this.resetFormChanges();
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
                    this.selectedUsers = newEditingItem.getUserIds() || [];
                    this.balance = newEditingItem.balance || '';
                    this.is_rounding = newEditingItem.is_rounding || false;
                    this.currency_id = newEditingItem.currency_id || '';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.name = '';
                    this.selectedUsers = [];
                    this.balance = '0';
                    this.is_rounding = false;
                    this.currency_id = '';
                    this.editingItemId = null;
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        }
    }
}

</script>
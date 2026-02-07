<template>
    <div class="h-full flex flex-col">
        <div class="flex flex-col overflow-auto flex-1 p-4">
            <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editCashRegister') : $t('createCashRegister') }}
            </h2>
            <div>
                <label class="required">{{ $t('name') }}</label>
                <input type="text" v-model="name">
            </div>
            <div class=" mt-2">
                <label class="block mb-1">{{ $t('currency') }}</label>
                <select v-model="currency_id" :disabled="!!editingItemId">
                    <option value="">{{ $t('no') }}</option>
                    <template v-if="currencies.length">
                        <option v-for="parent in currencies" :key="parent.id" :value="parent.id">{{ parent.name }}
                        </option>
                    </template>
                </select>
            </div>
            <div v-if="$store.getters.hasPermission('settings_cash_balance_view')">
                <label>{{ $t('balance') }}</label>
                <div class="flex items-center rounded-l">
                    <input type="number" v-model="balance" :disabled="!!editingItemId">
                    <span v-if="selectedCurrency" class="p-2 bg-gray-200 rounded-r ">{{ selectedCurrency?.symbol
                        }}</span>
                </div>
            </div>
            <div class="mt-2">
                <label class="block mb-1">{{ $t('type') }}</label>
                <select v-model="is_cash" class="w-full">
                    <option :value="true">{{ $t('cashRegisterTypeCash') }}</option>
                    <option :value="false">{{ $t('cashRegisterTypeNonCash') }}</option>
                </select>
            </div>
            <div class="mt-2">
                <label class="block mb-1">{{ $t('icon') }}</label>
                <select v-model="icon" class="w-full">
                    <option value="">{{ $t('no') }}</option>
                    <option v-for="opt in iconOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>
            </div>
            <div class="mt-4">
                <label class="inline-flex items-center gap-1 mb-1">
                    <span>{{ $t('cashRegisterVisibleToEmployees') || 'Виден сотрудникам' }}</span>
                    <FieldHint
                        :text="$t('cashRegisterVisibleToEmployeesHint') || 'Сотрудники, которые видят эту кассу и могут с ней работать. Должен быть выбран хотя бы один пользователь.'"
                        placement="top" />
                </label>
                <UserSearch :selectedUsers="selectedUsers" @update:selectedUsers="selectedUsers = $event"
                    :multiple="true" :filterUsers="userHasCashAccess" />
            </div>
        </div>
        <div class="mt-auto p-4 flex space-x-2 bg-[#edf4fb]">
            <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
                :is-loading="deleteLoading" icon="fas fa-trash"
                :disabled="!$store.getters.hasPermission('cash_registers_delete')">
            </PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="!selectedUsers?.length || (editingItemId != null && !$store.getters.hasPermission('cash_registers_update')) ||
                (editingItemId == null && !$store.getters.hasPermission('cash_registers_create'))">
            </PrimaryButton>
        </div>
        <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
            :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
        <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
            :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
    </div>
</template>


<script>
import AppController from '@/api/AppController';
import CashRegisterController from '@/api/CashRegisterController';
import UsersController from '@/api/UsersController';
import CashRegisterDto from '@/dto/cash_register/CashRegisterDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";

import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, UserSearch, FieldHint },
    props: {
        editingItem: { type: CashRegisterDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            selectedUsers: this.editingItem ? this.editingItem.getUserIds() : [],
            balance: this.editingItem ? this.editingItem.balance : '',
            currency_id: this.editingItem ? this.editingItem.currencyId : '',
            is_cash: this.editingItem ? this.editingItem.isCash : true,
            icon: this.editingItem ? this.editingItem.icon : 'fa-solid fa-cash-register',
            users: [],
            currencies: [],
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
        iconOptions() {
            return [
                { value: 'fa-solid fa-building-columns', label: '🏛️ Банк / организация' },
                { value: 'fa-solid fa-ticket', label: '🎫 Купон / ваучер' },
                { value: 'fa-solid fa-location-dot', label: '📍 Точка / локация' },
                { value: 'fa-solid fa-fire', label: '🔥 Акция / популярное' },
                { value: 'fa-solid fa-thumbs-up', label: '👍 Одобрено' },
                { value: 'fa-solid fa-dollar-sign', label: '💲 Деньги / доход' },
                { value: 'fa-solid fa-cash-register', label: '🧾 Касса / чек' },
                { value: 'fa-solid fa-credit-card', label: '💳 Оплата картой' },
                { value: 'fa-solid fa-briefcase', label: '💼 Бизнес / отдел' },
                { value: 'fa-solid fa-user', label: '👤 Клиент / пользователь' },
                { value: 'fa-solid fa-star', label: '⭐ Избранное' },
            ];
        },
        selectedCurrency() {
            return this.currencies.find(currency => currency.id == this.currency_id);
        },
        assignableUsers() {
            return Array.isArray(this.users) ? this.users.filter(this.userHasCashAccess) : [];
        },
        userOptions() {
            return this.assignableUsers.map(user => {
                const fullName = [user.name, user.surname].filter(Boolean).join(' ').trim() || user.name;
                const position = user.position ? ` (${user.position})` : '';
                return {
                    value: user.id.toString(),
                    label: `${fullName}${position}`
                };
            });
        }
    },
    methods: {
        getFormState() {
            return {
                name: this.name,
                selectedUsers: [...this.selectedUsers],
                balance: this.balance,
                currency_id: this.currency_id,
                is_cash: this.is_cash,
                icon: this.icon
            };
        },
        async fetchUsers() {
            if (this.$store.getters.usersForCurrentCompany?.length) {
                this.users = this.$store.getters.usersForCurrentCompany;
                this.filterSelectedUsers();
                return;
            }
            await this.$store.dispatch('loadUsers');
            this.users = this.$store.getters.usersForCurrentCompany;
            this.filterSelectedUsers();
        },
        async fetchCurrencies() {
            if (this.$store.getters.currencies?.length) {
                this.currencies = this.$store.getters.currencies;
                return;
            }
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies;
        },
        userHasCashAccess(user) {
            return user?.permissions?.some(permission => permission === 'cash_registers_view' || permission === 'cash_registers_view_all' || permission.startsWith('cash_registers_view_')) || false;
        },
        filterSelectedUsers() {
            if (!Array.isArray(this.users) || !this.users.length) return;
            const availableIds = new Set(this.assignableUsers.map(user => user.id.toString()));
            const filtered = this.selectedUsers.filter(id => availableIds.has(id.toString()));
            if (filtered.length !== this.selectedUsers.length) {
                this.selectedUsers = filtered;
            }
        },
        prepareSave() {
            const data = {
                name: this.name,
                users: this.selectedUsers,
                is_cash: this.is_cash,
                icon: this.icon || null
            };

            if (this.editingItemId == null) {
                const balanceNum = parseFloat(this.balance);
                data.balance = !isNaN(balanceNum) ? balanceNum : 0;
                data.currency_id = this.currency_id;
            }

            return data;
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await CashRegisterController.updateItem(this.editingItemId, data);
            } else {
                return await CashRegisterController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await CashRegisterController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete cash register');
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
            this.selectedUsers = [];
            this.balance = '0';
            this.currency_id = '';
            this.fetchCurrencies();
            this.fetchUsers();
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.name = newEditingItem.name || '';
            this.selectedUsers = newEditingItem.getUserIds() || [];
            this.balance = newEditingItem.balance || '';
            this.currency_id = newEditingItem.currencyId || '';
            this.is_cash = newEditingItem.isCash;
            this.icon = newEditingItem.icon || 'fa-solid fa-cash-register';
            this.filterSelectedUsers();
        }
    }
}

</script>
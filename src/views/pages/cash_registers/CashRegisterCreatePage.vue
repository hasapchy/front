<template>
  <div class="h-full flex flex-col">
    <div class="flex flex-col overflow-auto flex-1 p-4">
      <div>
        <label class="inline-flex items-center gap-1 mb-1">
          <span>{{ $t('name') }}</span>
          <FieldHint
            :text="$t('cashRegisterNameHint')"
            placement="top"
          />
        </label>
        <input
          v-model="name"
          type="text"
        >
      </div>
      <div class=" mt-2">
        <label class="block mb-1">{{ $t('currency') }}</label>
        <select
          v-model="currencyId"
          :disabled="!!editingItemId"
        >
          <option value="">
            {{ $t('no') }}
          </option>
          <template v-if="currencies.length">
            <option
              v-for="parent in currencies"
              :key="parent.id"
              :value="parent.id"
            >
              {{ parent.name }}
            </option>
          </template>
        </select>
      </div>
      <div v-if="$store.getters.hasPermission('settings_cash_balance_view')">
        <label>{{ $t('balance') }}</label>
        <div class="flex items-center rounded-l">
          <input
            v-model="balance"
            type="number"
            :disabled="!!editingItemId"
          >
          <span
            v-if="selectedCurrency"
            class="p-2 bg-gray-200 rounded-r "
          >{{ selectedCurrency?.symbol
          }}</span>
        </div>
      </div>
      <div class="mt-2">
        <label class="block mb-1">{{ $t('type') }}</label>
        <select
          v-model="isCash"
          class="w-full"
        >
          <option :value="true">
            {{ $t('cashRegisterTypeCash') }}
          </option>
          <option :value="false">
            {{ $t('cashRegisterTypeNonCash') }}
          </option>
        </select>
      </div>
      <div class="mt-2">
        <label class="inline-flex items-center gap-2">
          <input
            v-model="isWorkingMinus"
            type="checkbox"
          >
          <span>{{ $t('cashRegisterCanWorkInMinus') }}</span>
        </label>
      </div>
      <div class="mt-2">
        <label class="block mb-1">{{ $t('icon') }}</label>
        <select
          v-model="icon"
          class="w-full"
        >
          <option value="">
            {{ $t('no') }}
          </option>
          <option
            v-for="opt in iconOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="mt-4">
        <label class="inline-flex items-center gap-1 mb-1">
          <span>{{ $t('cashRegisterVisibleToEmployees') }}</span>
          <FieldHint
            :text="$t('cashRegisterVisibleToEmployeesHint')"
            placement="top"
          />
        </label>
        <UserSearch
          :selected-users="selectedUsers"
          :multiple="true"
          :filter-users="userHasCashAccess"
          @update:selected-users="selectedUsers = $event"
        />
      </div>
    </div>
    <div class="mt-auto p-4 flex space-x-2 bg-[#edf4fb]">
      <PrimaryButton
        v-if="editingItem != null"
        :onclick="showDeleteDialog"
        :is-danger="true"
        :is-loading="deleteLoading"
        icon="fas fa-trash"
        :disabled="!$store.getters.hasPermission('cash_registers_delete')"
      />
      <PrimaryButton
        icon="fas fa-save"
        :onclick="save"
        :is-loading="saveLoading"
        :disabled="!selectedUsers?.length || (editingItemId != null && !$store.getters.hasPermission('cash_registers_update')) ||
          (editingItemId == null && !$store.getters.hasPermission('cash_registers_create'))"
        :aria-label="$t('save')"
      />
    </div>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('confirmDelete')"
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
  </div>
</template>


<script>
import AppController from '@/api/AppController';
import CashRegisterController from '@/api/CashRegisterController';
import UsersController from '@/api/UsersController';
import CashRegisterDto from '@/dto/cash_register/CashRegisterDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";

import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import { ICON_OPTIONS } from '@/constants/cashIconOptions';

export default {
    components: { PrimaryButton, AlertDialog, UserSearch, FieldHint },
    mixins: [getApiErrorMessage, crudFormMixin],
    props: {
        editingItem: { type: CashRegisterDto, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            selectedUsers: this.editingItem ? this.editingItem.getUserIds() : [],
            balance: this.editingItem ? this.editingItem.balance : '',
            currencyId: this.editingItem ? this.editingItem.currencyId : '',
            isCash: this.editingItem ? this.editingItem.isCash : true,
            isWorkingMinus: this.editingItem ? this.editingItem.isWorkingMinus : false,
            icon: this.editingItem ? this.editingItem.icon : 'fa-solid fa-cash-register',
            users: [],
            currencies: [],
        }
    },
    computed: {
        iconOptions() {
            return ICON_OPTIONS;
        },
        selectedCurrency() {
            return this.currencies.find(currency => currency.id == this.currencyId);
        },
        assignableUsers() {
            return Array.isArray(this.users) ? this.users.filter(this.userHasCashAccess) : [];
        },
        userOptions() {
            return this.assignableUsers.map(user => {
                const fullName = [user.name, user.surname].filter(Boolean).join(' ').trim() || user.name;
                return {
                    value: user.id.toString(),
                    label: fullName
                };
            });
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
    methods: {
        getFormState() {
            return {
                name: this.name,
                selectedUsers: [...this.selectedUsers],
                balance: this.balance,
                currencyId: this.currencyId,
                isCash: this.isCash,
                isWorkingMinus: this.isWorkingMinus,
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
                isCash: this.isCash,
                isWorkingMinus: this.isWorkingMinus,
                icon: this.icon || null
            };

            if (this.editingItemId == null) {
                const balanceNum = parseFloat(this.balance);
                data.balance = !isNaN(balanceNum) ? balanceNum : 0;
                data.currencyId = this.currencyId;
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
            this.currencyId = '';
            this.fetchCurrencies();
            this.fetchUsers();
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.name = newEditingItem.name ;
            this.selectedUsers = newEditingItem.getUserIds() || [];
            this.balance = newEditingItem.balance ;
            this.currencyId = newEditingItem.currencyId ;
            this.isCash = newEditingItem.isCash;
            this.isWorkingMinus = newEditingItem.isWorkingMinus;
            this.icon = newEditingItem.icon || 'fa-solid fa-cash-register';
            this.filterSelectedUsers();
        }
    }
}

</script>
<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
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
              {{ parent.code }}
            </option>
          </template>
        </select>
      </div>
      <div v-if="$store.getters.hasPermission('settings_cash_balance_view')">
        <label>{{ $t('balance') }}</label>
        <div class="flex items-center rounded-l">
          <FormattedDecimalInput
            v-model="balance"
            variant="amount"
            :disabled="!!editingItemId"
          />
          <span
            v-if="selectedCurrency"
            class="p-2 bg-gray-200 rounded-r "
          >{{ selectedCurrency?.code
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
        <label class="block mb-1">{{ $t('sortOrder') }}</label>
        <input
          v-model.number="sortOrder"
          type="number"
          min="0"
        >
      </div>
      <div class="mt-2">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('cashRegisterCanWorkInMinus') }}</span>
          <ToggleSwitch
            v-model="isWorkingMinus"
            :aria-label="$t('cashRegisterCanWorkInMinus')"
          />
        </div>
      </div>
      <div class="mt-2">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('cashRegisterParticipatesInTransfers') }}</span>
          <ToggleSwitch
            v-model="participatesInTransfers"
            :aria-label="$t('cashRegisterParticipatesInTransfers')"
          />
        </div>
      </div>
      <IconSelectField
        v-model="icon"
        class="mt-2"
        preset="cashRegister"
      />
      <div class="mt-2">
        <label class="block mb-1">{{ $t('iconSize') }}</label>
        <select
          v-model="iconSize"
          class="w-full"
        >
          <option value="small">
            {{ $t('iconSizeSmall') }}
          </option>
          <option value="medium">
            {{ $t('iconSizeMedium') }}
          </option>
          <option value="large">
            {{ $t('iconSizeLarge') }}
          </option>
        </select>
      </div>
      <div class="mt-2">
        <label class="block mb-1">{{ $t('color') }}</label>
        <div class="flex items-center gap-2">
          <input
            v-model="color"
            type="color"
            class="w-16 h-10 rounded border border-gray-300 cursor-pointer"
          >
          <input
            v-model="color"
            type="text"
            placeholder="#3571A4"
            maxlength="7"
            class="flex-1"
            pattern="^#[0-9A-Fa-f]{6}$"
          >
        </div>
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
          :locked-user-ids="lockedUserIds"
          @update:selected-users="selectedUsers = $event"
        />
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
    </teleport>
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
import CashRegisterController from '@/api/CashRegisterController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";

import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import ToggleSwitch from '@/views/components/app/forms/ToggleSwitch.vue';
import IconSelectField from '@/views/components/app/forms/IconSelectField.vue';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

export default {
    components: { PrimaryButton, AlertDialog, UserSearch, FieldHint, ToggleSwitch, IconSelectField },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: Object, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            selectedUsers: this.getEditingItemUserIds(this.editingItem),
            balance: this.editingItem ? this.editingItem.balance : '',
            currencyId: this.editingItem ? this.editingItem.currencyId : '',
            isCash: this.editingItem ? this.editingItem.isCash : true,
            isWorkingMinus: this.editingItem ? this.editingItem.isWorkingMinus : false,
            participatesInTransfers: this.editingItem ? this.editingItem.participatesInTransfers : true,
            sortOrder: this.editingItem ? this.editingItem.sortOrder : 0,
            icon: this.editingItem ? this.editingItem.icon : 'fa-solid fa-cash-register',
            iconSize: this.editingItem ? this.editingItem.iconSize : 'medium',
            color: this.editingItem ? (this.editingItem.color || '#3571A4') : '#3571A4',
            users: [],
            currencies: [],
        }
    },
    computed: {
        selectedCurrency() {
            return this.currencies.find(currency => currency.id == this.currencyId);
        },
        assignableUsers() {
            return Array.isArray(this.users) ? this.users.filter(this.userHasCashAccess) : [];
        },
        lockedUserIds() {
            const user = this.$store.getters.user || this.$store.state.user;
            return user && user.isAdmin !== true && Number(user.is_admin) !== 1 ? [user.id] : [];
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
        getEditingItemUserIds(item) {
            if (!item || typeof item !== 'object') {
                return [];
            }
            if (typeof item.getUserIds === 'function') {
                return item.getUserIds();
            }
            if (!Array.isArray(item.users)) {
                return [];
            }
            return item.users
                .map((user) => (typeof user === 'object' ? user?.id : user))
                .filter((id) => id != null);
        },
        getFormState() {
            return {
                name: this.name,
                selectedUsers: [...this.selectedUsers],
                balance: this.balance,
                currencyId: this.currencyId,
                isCash: this.isCash,
                isWorkingMinus: this.isWorkingMinus,
                participatesInTransfers: this.participatesInTransfers,
                sortOrder: this.sortOrder,
                icon: this.icon,
                iconSize: this.iconSize,
                color: this.color
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
            this.ensureCurrentUserSelected();
        },
        ensureCurrentUserSelected() {
            const userId = this.lockedUserIds[0];
            if (!userId) return;
            const selected = Array.isArray(this.selectedUsers) ? this.selectedUsers.map(id => Number(id)) : [];
            if (!selected.includes(Number(userId))) {
                this.selectedUsers = [...selected, Number(userId)];
            }
        },
        prepareSave() {
            this.ensureCurrentUserSelected();
            const data = {
                name: this.name,
                users: this.selectedUsers,
                isCash: this.isCash,
                isWorkingMinus: this.isWorkingMinus,
                participatesInTransfers: this.participatesInTransfers,
                sortOrder: Number(this.sortOrder),
                icon: this.icon,
                iconSize: this.iconSize,
                color: /^#[0-9A-Fa-f]{6}$/i.test(String(this.color || '').trim()) ? String(this.color).trim() : null
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
            this.ensureCurrentUserSelected();
            this.balance = '0';
            this.currencyId = '';
            this.icon = 'fa-solid fa-cash-register';
            this.iconSize = 'medium';
            this.sortOrder = 0;
            this.color = '#3571A4';
            this.fetchCurrencies();
            this.fetchUsers();
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.name = newEditingItem.name ;
            this.selectedUsers = this.getEditingItemUserIds(newEditingItem);
            this.balance = newEditingItem.balance ;
            this.currencyId = newEditingItem.currencyId ;
            this.isCash = newEditingItem.isCash;
            this.isWorkingMinus = newEditingItem.isWorkingMinus;
            this.participatesInTransfers = newEditingItem.participatesInTransfers;
            this.sortOrder = newEditingItem.sortOrder;
            this.icon = newEditingItem.icon;
            this.iconSize = newEditingItem.iconSize;
            this.color = newEditingItem.color;
            this.filterSelectedUsers();
            this.ensureCurrentUserSelected();
        }
    }
}

</script>
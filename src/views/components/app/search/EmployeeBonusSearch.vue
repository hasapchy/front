<template>
  <div class="relative">
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
        <select
          :value="cashId"
          :disabled="disabled"
          required
          @input="$emit('update:cashId', $event.target.value)"
        >
          <option value="">
            {{ $t('selectCashRegister') }}
          </option>
          <option
            v-for="cash in allCashRegisters"
            :key="cash.id"
            :value="cash.id"
          >
            {{ cash.displayName || cash.name }} ({{ cash.currencySymbol  }})
          </option>
        </select>
      </div>
      <div>
        <label class="block mb-1 required">{{ $t('currency') }}</label>
        <select
          :value="currencyId"
          :disabled="disabled"
          required
          @input="$emit('update:currencyId', $event.target.value)"
        >
          <option value="">
            {{ $t('no') }}
          </option>
          <option
            v-for="currency in currencies"
            :key="currency.id"
            :value="currency.id"
          >
            {{ currency.symbol }} - {{ currency.name }}
          </option>
        </select>
      </div>
    </div>

    <label
      class="block mb-1"
      :class="{ 'required': required }"
    >{{ $t('employees') }}</label>
    <UserSearch
      :selected-users="selectedUserIds"
      :multiple="true"
      :disabled="disabled"
      :show-label="false"
      @update:selected-users="selectedUserIds = $event"
    />

    <label
      v-if="employees.length > 0"
      class="block mt-4 mb-1"
    >{{ $t('specifiedEmployees') }}</label>
    <table
      v-if="employees.length > 0"
      class="min-w-full bg-white shadow-md rounded mb-6 w-100"
    >
      <thead class="bg-gray-100 rounded-t-sm">
        <tr>
          <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">
            {{ $t('name') }}
          </th>
          <th class="text-left border border-gray-300 py-2 px-4 font-medium w-32">
            {{ $t('clientBalance') }}
          </th>
          <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">
            {{ $t('amount') }}
          </th>
          <th class="text-left border border-gray-300 py-2 px-4 font-medium w-12">
            ~
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="employee in employees"
          :key="employee.id"
          class="border-b border-gray-300"
        >
          <td class="py-2 px-4 border-x border-gray-300">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0 mr-2">
                <img
                  v-if="getUserPhotoSrc(employee)"
                  :src="getUserPhotoSrc(employee)"
                  :alt="getUserFullName(employee)"
                  class="w-full h-full object-cover"
                  @error="applyAvatarImageFallback"
                >
                <i
                  v-else
                  class="fas fa-user text-gray-500"
                />
              </div>
              <div>
                <div>{{ getUserDisplayName(employee) }}</div>
                <div
                  v-if="getUserPosition(employee)"
                  class="text-xs text-gray-500"
                >
                  {{ getUserPosition(employee) }}
                </div>
              </div>
            </div>
          </td>
          <td class="py-2 px-4 border-x border-gray-300">
            <BalanceSelect
              :model-value="employee.selectedBalanceId"
              :balances="(employeeBalancesMap && employeeBalancesMap[employee.id]) || []"
              :disabled="disabled"
              :placeholder="$t('selectBalance')"
              @update:model-value="onBalanceChange(employee, $event)"
            />
          </td>
          <td class="py-2 px-4 border-x border-gray-300">
            <input 
              type="number" 
              :value="employee.amount" 
              class="w-full p-1 text-right"
              :disabled="disabled"
              min="0.01" 
              step="0.01" 
              @input="onAmountChange(employee, $event)"
            >
          </td>
          <td class="px-4 border-x border-gray-300">
            <button 
              class="text-red-500 text-2xl cursor-pointer z-50"
              :disabled="disabled" 
              @click="removeEmployee(employee.id)"
            >
              ×
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import BalanceSelect from '@/views/components/app/forms/BalanceSelect.vue';
import UsersController from '@/api/UsersController';
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import userPhotoMixin from '@/mixins/userPhotoMixin';
import { getUserDisplayName as displayUserName, getUserPosition as displayUserPosition } from '@/utils/displayUtils';
import { applyAvatarImageFallback } from '@/constants/imageFallback';

export default {
    name: 'EmployeeBonusSearch',
    components: {
        UserSearch,
        BalanceSelect,
    },
    mixins: [storeDataLoaderMixin, userPhotoMixin],
    props: {
        modelValue: {
            type: Array,
            default: () => [],
        },
        cashId: {
            type: [String, Number],
            default: '',
        },
        currencyId: {
            type: [String, Number],
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        required: {
            type: Boolean,
            default: false,
        },
        employeeBalancesMap: {
            type: Object,
            default: () => ({}),
        },
    },
    emits: ['update:modelValue', 'update:cashId', 'update:currencyId'],
    data() {
        return {
            selectedUserIds: [],
            isSyncing: false,
        };
    },
    computed: {
        employees: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit('update:modelValue', value);
            },
        },
        allCashRegisters() {
            return this.$store.getters.cashRegisters || [];
        },
        currencies() {
            return this.$store.getters.currencies || [];
        },
    },
    watch: {
        modelValue: {
            handler(newEmployees) {
                if (!Array.isArray(newEmployees)) return;
                const employeeIds = newEmployees.map(e => Number(e.id));
                const currentIds = this.selectedUserIds.map(id => Number(id));
                const idsEqual = employeeIds.length === currentIds.length && 
                    employeeIds.every(id => currentIds.includes(id));
                if (!idsEqual) {
                    this.isSyncing = true;
                    this.selectedUserIds = employeeIds;
                    this.$nextTick(() => {
                        this.isSyncing = false;
                    });
                }
            },
            immediate: true,
        },
        selectedUserIds(newIds) {
            if (this.isSyncing) return;
            
            const currentIds = this.employees.map(e => Number(e.id));
            const newIdsNum = Array.isArray(newIds) ? newIds.map(Number) : [];
            
            const addedIds = newIdsNum.filter(id => !currentIds.includes(id));
            const removedIds = currentIds.filter(id => !newIdsNum.includes(id));
            
            if (addedIds.length > 0) {
                this.addEmployees(addedIds);
            }
            
            if (removedIds.length > 0) {
                this.$emit('update:modelValue', this.employees.filter(e => !removedIds.includes(Number(e.id))));
            }
        },
        cashId(newCashId) {
            if (newCashId && !this.currencyId) {
                const cash = this.allCashRegisters.find(c => c.id == newCashId);
                if (cash?.currencyId) {
                    this.$emit('update:currencyId', cash.currencyId);
                }
            }
        },
    },
    async mounted() {
        await this.loadMultipleStoreData([
            { getterName: 'cashRegisters', dispatchName: 'loadCashRegisters' },
            { getterName: 'currencies', dispatchName: 'loadCurrencies' },
        ]);

        if (!this.cashId && this.allCashRegisters.length > 0) {
            this.$emit('update:cashId', this.$store.getters.defaultCashId || this.allCashRegisters[0].id);
        }
        
        if (!this.currencyId && this.currencies.length > 0) {
            const defaultCurrency = this.currencies.find(c => c.isDefault) || this.currencies[0];
            this.$emit('update:currencyId', defaultCurrency.id);
        }
    },
    methods: {
        applyAvatarImageFallback,
        async addEmployees(userIds) {
            const allUsers = this.$store.getters.usersForCurrentCompany || [];
            const currentEmployees = [...this.employees];
            const existingIds = new Set(currentEmployees.map(e => Number(e.id)));
            
            for (const userId of userIds) {
                if (existingIds.has(Number(userId))) continue;
                
                let user = allUsers.find(u => Number(u.id) === Number(userId));
                if (!user) {
                    try {
                        user = await UsersController.getItem(userId);
                    } catch (error) {
                        console.error(`Ошибка при загрузке пользователя ${userId}:`, error);
                        continue;
                    }
                }
                
                currentEmployees.push({
                    id: user.id,
                    name: user.name,
                    surname: user.surname,
                    position: user.position,
                    photo: user.photo,
                    amount: 0,
                });
            }
            
            this.$emit('update:modelValue', currentEmployees);
        },
        removeEmployee(userId) {
            this.$emit('update:modelValue', this.employees.filter(e => Number(e.id) !== Number(userId)));
            this.selectedUserIds = this.selectedUserIds.filter(id => Number(id) !== Number(userId));
        },
        onAmountChange(employee, event) {
            const amount = Math.max(0, parseFloat(event.target.value) || 0);
            const updated = this.employees.map(emp => 
                Number(emp.id) === Number(employee.id) ? { ...emp, amount } : emp
            );
            this.$emit('update:modelValue', updated);
        },
        onBalanceChange(employee, balanceId) {
            const updated = this.employees.map(emp => 
                Number(emp.id) === Number(employee.id) ? { ...emp, selectedBalanceId: balanceId || null } : emp
            );
            this.$emit('update:modelValue', updated);
        },
        formatBalance(balance) {
            return this.$formatNumber ? this.$formatNumber(balance, null, true) : parseFloat(balance || 0).toFixed(2);
        },
        getUserFullName(user) {
            if (!user) return '';
            const name = displayUserName(user);
            const position = displayUserPosition(user);
            return position ? `${name} (${position})` : name;
        },
        getUserDisplayName(user) {
            return displayUserName(user);
        },
        getUserPosition(user) {
            return displayUserPosition(user);
        },
    },
};
</script>

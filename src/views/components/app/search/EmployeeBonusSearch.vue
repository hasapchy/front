<template>
    <div class="relative">
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
                <select :value="cashId" @input="$emit('update:cashId', $event.target.value)" :disabled="disabled" required>
                    <option value="">{{ $t('selectCashRegister') }}</option>
                    <option v-for="cash in allCashRegisters" :key="cash.id" :value="cash.id">
                        {{ cash.name }} ({{ cash.currencySymbol || '' }})
                    </option>
                </select>
            </div>
            <div>
                <label class="block mb-1 required">{{ $t('currency') }}</label>
                <select :value="currencyId" @input="$emit('update:currencyId', $event.target.value)" :disabled="disabled" required>
                    <option value="">{{ $t('no') }}</option>
                    <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                        {{ currency.symbol }} - {{ currency.name }}
                    </option>
                </select>
            </div>
        </div>

        <label class="block mb-1" :class="{ 'required': required }">{{ $t('employees') }}</label>
        <UserSearch
            :selectedUsers="selectedUserIds"
            @update:selectedUsers="selectedUserIds = $event"
            :multiple="true"
            :disabled="disabled"
            :showLabel="false"
        />

        <label v-if="employees.length > 0" class="block mt-4 mb-1">{{ $t('specifiedEmployees') }}</label>
        <table v-if="employees.length > 0" class="min-w-full bg-white shadow-md rounded mb-6 w-100">
            <thead class="bg-gray-100 rounded-t-sm">
                <tr>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">{{ $t('name') }}</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">{{ $t('amount') }}</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-12">~</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="employee in employees" :key="employee.id" class="border-b border-gray-300">
                    <td class="py-2 px-4 border-x border-gray-300">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0 mr-2">
                                <img v-if="getUserPhotoSrc(employee)" :src="getUserPhotoSrc(employee)" :alt="getUserFullName(employee)" class="w-full h-full object-cover">
                                <i v-else class="fas fa-user text-gray-500"></i>
                            </div>
                            {{ getUserFullName(employee) }}
                        </div>
                    </td>
                    <td class="py-2 px-4 border-x border-gray-300">
                        <input 
                            type="number" 
                            :value="employee.amount" 
                            @input="onAmountChange(employee, $event)"
                            class="w-full p-1 text-right"
                            :disabled="disabled" 
                            min="0.01" 
                            step="0.01"
                        />
                    </td>
                    <td class="px-4 border-x border-gray-300">
                        <button 
                            @click="removeEmployee(employee.id)"
                            class="text-red-500 text-2xl cursor-pointer z-99" 
                            :disabled="disabled">
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
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import userPhotoMixin from '@/mixins/userPhotoMixin';

export default {
    name: 'EmployeeBonusSearch',
    mixins: [storeDataLoaderMixin, userPhotoMixin],
    components: {
        UserSearch,
    },
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
        async addEmployees(userIds) {
            const allUsers = this.$store.getters.usersForCurrentCompany || [];
            const currentEmployees = [...this.employees];
            const existingIds = new Set(currentEmployees.map(e => Number(e.id)));
            
            for (const userId of userIds) {
                if (existingIds.has(Number(userId))) continue;
                
                let user = allUsers.find(u => Number(u.id) === Number(userId));
                if (!user) {
                    try {
                        const UsersController = (await import('@/api/UsersController')).default;
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
        getUserFullName(user) {
            if (!user) return '';
            if (typeof user.fullName === 'function') {
                return user.fullName();
            }
            const name = user.name || '';
            const surname = user.surname || '';
            const position = user.position || '';
            const fullName = [name, surname].filter(Boolean).join(' ').trim();
            return position ? `${fullName} (${position})` : fullName;
        },
    },
};
</script>

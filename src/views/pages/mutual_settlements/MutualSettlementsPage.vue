<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <div class="ml-2">
                <select v-model="clientId" @change="() => loadClientBalances()">
                    <option value="">{{ $t('allClients') }}</option>
                    <template v-if="allClients.length">
                        <option v-for="client in allClients" :key="client.id" :value="client.id">
                            {{ client.first_name }} {{ client.last_name }}
                        </option>
                    </template>
                </select>
            </div>

            <!-- Кнопка сброса фильтров -->
            <div v-if="clientId !== ''" class="ml-2">
                <PrimaryButton 
                    :onclick="resetFilters"
                    icon="fas fa-filter-circle-xmark"
                    :isLight="true">
                </PrimaryButton>
            </div>
        </div>
    </div>

        <!-- Статистика балансов -->
        <MutualSettlementsBalanceWrapper 
            :data="clientBalances" 
            :loading="clientBalancesLoading" />

        <!-- Таблица клиентов -->
        <div v-if="!clientBalancesLoading && clientBalances.length > 0" class="mt-6">
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Клиент
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Баланс
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="client in clientBalances" :key="client.id" class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">
                                    {{ client.first_name }} {{ client.last_name }}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="{
                                    'text-green-600': client.debt_amount > 0,
                                    'text-red-600': client.credit_amount > 0,
                                    'text-gray-500': client.debt_amount === 0 && client.credit_amount === 0
                                }" class="text-sm font-semibold">
                                    <span v-if="client.debt_amount > 0">+{{ $formatNumber(client.debt_amount, 2, true) }} {{ client.currency_symbol }}</span>
                                    <span v-else-if="client.credit_amount > 0">-{{ $formatNumber(client.credit_amount, 2, true) }} {{ client.currency_symbol }}</span>
                                    <span v-else>0.00 {{ client.currency_symbol }}</span>
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div v-else-if="!clientBalancesLoading && clientBalances.length === 0" class="mt-6 text-center text-gray-500 py-8">
            Нет клиентов для отображения
        </div>
    
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import ClientController from '@/api/ClientController';
import notificationMixin from '@/mixins/notificationMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import MutualSettlementsBalanceWrapper from './MutualSettlementsBalanceWrapper.vue';

export default {
    mixins: [notificationMixin, companyChangeMixin],
    components: { NotificationToast, PrimaryButton, MutualSettlementsBalanceWrapper },
    data() {
        return {
            allClients: [],
            clientBalances: [],
            clientBalancesLoading: false,
            clientId: '',
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    mounted() {
        this.loadClients();
        this.loadClientBalances();
    },

    methods: {
        async loadClients() {
            try {
                const response = await ClientController.getAllItems();
                this.allClients = response;
            } catch (error) {
                console.error('Ошибка загрузки клиентов:', error);
            }
        },

        async loadClientBalances() {
            this.clientBalancesLoading = true;
            try {
                // Получаем всех клиентов с их балансами
                const clients = await ClientController.getAllItems();
                
                // Фильтруем по выбранному клиенту если нужно
                let filteredClients = clients;
                if (this.clientId) {
                    filteredClients = clients.filter(client => client.id == this.clientId);
                }
                
                // Для каждого клиента рассчитываем дебет и кредит
                this.clientBalances = filteredClients.map(client => {
                    // Пока используем простую логику - баланс клиента
                    const balance = parseFloat(client.balance) || 0;
                    
                    return {
                        id: client.id,
                        first_name: client.first_name,
                        last_name: client.last_name,
                        currency_symbol: 'TMT', // Можно получить из настроек
                        debt_amount: balance > 0 ? balance : 0, // Нам должны
                        credit_amount: balance < 0 ? Math.abs(balance) : 0, // Мы должны
                    };
                });
            } catch (error) {
                console.error('Ошибка загрузки балансов клиентов:', error);
            } finally {
                this.clientBalancesLoading = false;
            }
        },

        resetFilters() {
            this.clientId = '';
            this.loadClientBalances();
        },

        async handleCompanyChanged(companyId) {
            // Очищаем фильтры
            this.clientId = '';
            
            // Очищаем данные
            this.allClients = [];
            this.clientBalances = [];
            
            // Принудительно перезагружаем данные
            await this.loadClients();
            await this.loadClientBalances();
            
            // Уведомляем пользователя о смене компании
            this.$store.dispatch('showNotification', {
                title: 'Компания изменена',
                isDanger: false
            });
        },
    },
}
</script>

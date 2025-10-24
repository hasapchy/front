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

        <!-- Балансы клиентов -->
        <MutualSettlementsBalanceWrapper 
            :data="clientBalances" 
            :loading="clientBalancesLoading" />
    
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
            this.clientId = '';
            await this.loadClients();
            await this.loadClientBalances();
        },
    },
}
</script>

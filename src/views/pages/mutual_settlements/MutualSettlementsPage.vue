<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <div class="ml-2">
                <select v-model="clientId" @change="() => loadClientBalances()">
                    <option value="">{{ $t('allClients') }}</option>
                    <template v-if="allClients.length">
                        <option v-for="client in allClients" :key="client.id" :value="client.id">
                            {{ ((client.firstName || client.first_name || '') + ' ' + (client.lastName || client.last_name || '')).trim() || 'Клиент без имени' }}
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
        <transition name="fade" mode="out-in">
            <div v-if="clientBalances != null && !clientBalancesLoading" :key="`table-${$i18n.locale}`">
                <DraggableTable table-key="mutual_settlements.clients" :columns-config="translatedColumnsConfig" 
                    :table-data="clientBalances" :item-mapper="itemMapper" :onItemClick="handleRowClick" />
            </div>
            <div v-else key="loader" class="flex justify-center items-center h-64">
                <i class="fas fa-spinner fa-spin text-2xl"></i><br>
            </div>
        </transition>
    
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ClientCreatePage v-if="modalDialog" ref="clientForm" @saved="handleSaved" @saved-error="handleSavedError" 
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
    
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import ClientController from '@/api/ClientController';
import ClientCreatePage from '@/views/pages/clients/ClientCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';
import MutualSettlementsBalanceWrapper from './MutualSettlementsBalanceWrapper.vue';

export default {
    mixins: [notificationMixin, modalMixin, companyChangeMixin, tableTranslationMixin],
    components: { NotificationToast, SideModalDialog, PrimaryButton, DraggableTable, ClientCreatePage, MutualSettlementsBalanceWrapper },
    data() {
        return {
            allClients: [],
            clientBalances: [],
            clientBalancesLoading: false,
            clientId: '',
            editingItem: null,
            columnsConfig: [
                { name: 'id', label: 'number', size: 60 },
                { name: 'clientName', label: 'customer', html: true },
                { name: 'balance', label: 'balance', html: true },
            ]
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
                this.clientBalances = filteredClients
                    .map(client => {
                        // Пока используем простую логику - баланс клиента
                        const balance = parseFloat(client.balance) || 0;
                        
                        return {
                            id: client.id,
                            firstName: client.firstName || client.first_name,
                            lastName: client.lastName || client.last_name,
                            first_name: client.firstName || client.first_name,
                            last_name: client.lastName || client.last_name,
                            contactPerson: client.contactPerson || client.contact_person,
                            contact_person: client.contactPerson || client.contact_person,
                            currency_symbol: 'TMT', // Можно получить из настроек
                            debt_amount: balance > 0 ? balance : 0, // Нам должны
                            credit_amount: balance < 0 ? Math.abs(balance) : 0, // Мы должны
                            balance_value: balance, // Числовое значение для сортировки
                        };
                    })
                    .filter(client => client.debt_amount !== 0 || client.credit_amount !== 0); // Показываем только с ненулевым балансом
            } catch (error) {
                console.error('Ошибка загрузки балансов клиентов:', error);
            } finally {
                this.clientBalancesLoading = false;
            }
        },

        async handleRowClick(item) {
            // Загружаем полные данные клиента для редактирования
            try {
                console.log('[MutualSettlementsPage] handleRowClick item:', item);
                const client = await ClientController.getItem(item.id);
                console.log('[MutualSettlementsPage] loaded client:', client);
                console.log('[MutualSettlementsPage] client.constructor.name:', client.constructor.name);
                console.log('[MutualSettlementsPage] client firstName:', client.firstName);
                console.log('[MutualSettlementsPage] client lastName:', client.lastName);
                console.log('[MutualSettlementsPage] client type:', typeof client);
                this.editingItem = client;
                this.modalDialog = true;
            } catch (error) {
                console.error('Ошибка загрузки клиента:', error);
                this.showNotification('Ошибка', 'Не удалось загрузить данные клиента', true);
            }
        },
        
        itemMapper(i, c) {
            switch (c) {
                case 'clientName':
                    // Поддерживаем оба формата: camelCase и snake_case
                    const firstName = i.firstName || i.first_name || '';
                    const lastName = i.lastName || i.last_name || '';
                    const contactPerson = i.contactPerson || i.contact_person || '';
                    let name = `${firstName} ${lastName}`.trim();
                    if (contactPerson) {
                        name += ` (${contactPerson})`;
                    }
                    return name || 'Клиент без имени';
                case 'balance':
                    if (i.debt_amount > 0) {
                        return `<span class="text-green-600 font-semibold">${this.$formatNumber(i.debt_amount, 2, true)} ${i.currency_symbol}</span> <span class="text-xs text-gray-500">(Нам должны)</span>`;
                    } else if (i.credit_amount > 0) {
                        return `<span class="text-red-600 font-semibold">${this.$formatNumber(i.credit_amount, 2, true)} ${i.currency_symbol}</span> <span class="text-xs text-gray-500">(Мы должны)</span>`;
                    } else {
                        return `<span class="text-gray-500">0.00 ${i.currency_symbol}</span>`;
                    }
                default:
                    return i[c];
            }
        },
        
        async handleSaved() {
            this.closeModal();
            await this.loadClients();
            await this.loadClientBalances();
            this.showNotification('Успешно', 'Клиент сохранен', false);
        },
        
        handleSavedError(error) {
            this.showNotification('Ошибка', error, true);
        },
        
        async handleDeleted() {
            this.closeModal();
            await this.loadClients();
            await this.loadClientBalances();
            this.showNotification('Успешно', 'Клиент удален', false);
        },
        
        handleDeletedError(error) {
            this.showNotification('Ошибка', error, true);
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

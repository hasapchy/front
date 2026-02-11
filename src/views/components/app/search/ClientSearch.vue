<template>
    <div>
        <div v-if="selectedClient == null" class="relative">
            <label v-if="showLabel" :class="['block', 'mb-1', { 'required': required }]">{{ $t('client') }}</label>
            <input type="text" v-model="clientSearch" :placeholder="$t('enterClientNameOrNumber')"
                class="w-full p-2 border rounded" @focus="handleFocus" @blur="handleBlur" :disabled="disabled" />
            <transition name="appear">
                <ul v-show="showDropdown"
                    class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1 z-10">
                    <li v-if="clientSearchLoading" class="p-2 text-gray-500">{{ $t('loading') }}</li>
                    <template v-else-if="clientSearch.length === 0">
                        <li v-for="client in lastClients" :key="client.id" @mousedown.prevent="selectClient(client)"
                            class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                            <div class="flex justify-between">
                                <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                                <div class="text-[#337AB7]">{{ client.phones?.[0]?.phone || client.primaryPhone }}</div>
                            </div>
                        </li>
                    </template>
                    <li v-else-if="clientSearch.length < 3" class="p-2 text-gray-500">{{ $t('minimum3Characters') }}
                    </li>
                    <li v-else-if="clientResults.length === 0" class="p-2 text-gray-500">{{ $t('notFound') }}</li>
                    <li v-for="client in clientResults" :key="client.id" @mousedown.prevent="() => selectClient(client)"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between">
                            <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                            <div class="text-[#337AB7]">{{ client.primaryPhone || client.phones?.[0]?.phone }}</div>
                        </div>
                    </li>
                    <li v-if="$store.getters.hasPermission('clients_create')" class="p-2 border-t border-gray-300 bg-gray-50 sticky bottom-0">
                        <PrimaryButton :is-info="true" :is-full="true" icon="fas fa-plus"
                            @mousedown.prevent="openCreateClientModal">
                            {{ $t('createClient') }}{{ clientSearch ? ` "${clientSearch}"` : '' }}
                        </PrimaryButton>
                    </li>
                </ul>
            </transition>
        </div>
        <div v-else class="mt-2">
            <div class="p-2 pt-0 border-2 border-gray-400/60 rounded-md">
                <div class="flex justify-between items-center">
                    <div>
                        <label :class="{ 'required': required }">{{ $t('client') }}</label>
                        <p><span class="text-xs">{{ $t('name') }}:</span> <span class="font-semibold text-sm">{{
                            clientFullName
                                }}</span></p>
                        <p><span class="text-xs">{{ $t('phone') }}:</span> <span class="font-semibold text-sm">{{
                            clientPhones[0]?.phone || '' }}</span></p>
                        <div v-if="$store.getters.hasPermission('settings_client_balance_view')" class="flex flex-wrap items-center gap-x-2 gap-y-1 balance-dropdown-wrap">
                            <span class="text-xs">
                                {{ $t('balance') }}:
                                <span v-if="shouldShowBalanceSelect" class="relative inline-block">
                                    <button type="button"
                                        @mousedown.prevent="showBalanceDropdown = !showBalanceDropdown"
                                        :class="['font-semibold', 'text-sm', 'cursor-pointer', 'flex', 'items-center', 'gap-1', 'pr-1', 'border-0', 'bg-transparent', 'hover:opacity-80', balanceColorClass(displayBalance)]">
                                        {{ clientBalance }} {{ displayCurrencySymbol }}
                                        <i class="fas fa-chevron-down text-[10px] opacity-70"></i>
                                    </button>
                                    <transition name="appear">
                                        <ul v-show="showBalanceDropdown"
                                            class="absolute left-0 top-full mt-1 min-w-[120px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 max-h-40 overflow-y-auto">
                                            <li v-for="balance in selectedClient.balances" :key="balance.id"
                                                @mousedown.prevent="selectBalance(balance)"
                                                class="px-3 py-2 cursor-pointer text-sm hover:bg-gray-50">
                                                <span :class="balanceColorClass(balance.balance)">{{ formatBalance(balance.balance) }}</span>
                                                {{ balance.currency?.symbol || '' }}
                                                <span v-if="balance.isDefault" class="text-amber-500">★</span>
                                            </li>
                                        </ul>
                                    </transition>
                                </span>
                                <span v-else :class="['font-semibold', 'text-sm', balanceColorClass(displayBalance)]">{{ clientBalance }} {{ displayCurrencySymbol }}</span>
                                <span v-if="displayBalance > 0">({{ $t('clientOwesUs') }})</span>
                                <span v-else-if="displayBalance < 0">({{ $t('weOweClient') }})</span>
                                <span v-else>({{ $t('mutualSettlement') }})</span>
                            </span>
                        </div>
                    </div>
                    <button v-if="allowDeselect" v-on:click="deselectClient"
                        class="text-red-500 text-2xl cursor-pointer" :disabled="disabled">×</button>
                </div>
            </div>
        </div>
        <SideModalDialog :showForm="modalCreateClient" :onclose="() => modalCreateClient = false" :level="1">
            <ClientCreatePage :editingItem="null" :defaultFirstName="defaultClientName" @saved="onClientCreated"
                @saved-error="onClientCreatedError" />
        </SideModalDialog>
    </div>
</template>

<script>
import ClientController from '@/api/ClientController';
import debounce from 'lodash.debounce';
import { defineAsyncComponent } from 'vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { formatNumber } from '@/utils/numberUtils';

export default {
    mixins: [notificationMixin, getApiErrorMessageMixin],
    components: {
        ClientCreatePage: defineAsyncComponent(() => import('@/views/pages/clients/ClientCreatePage.vue')),
        SideModalDialog,
        PrimaryButton,
    },
    props: {
        onlySuppliers: {
            type: Boolean,
            default: false,
        },
        clientTypeFilter: {
            type: Array,
            default: null,
        },
        selectedClient: {
            type: [Object, Number],
            default: null,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        required: {
            type: Boolean,
            default: false,
        },
        showLabel: {
            type: Boolean,
            default: true,
        },
        allowDeselect: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            clientSearch: '',
            clientSearchLoading: false,
            clientResults: [],
            lastClients: [],
            showDropdown: false,
            modalCreateClient: false,
            defaultClientName: '',
            selectedBalanceId: null,
            showBalanceDropdown: false,
        };
    },
    computed: {
        clientFullName() {
            if (!this.selectedClient) return '';
            if (typeof this.selectedClient.fullName === 'function') {
                return this.selectedClient.fullName();
            }
            const client = this.selectedClient;
            const clientType = client.clientType || client.client_type;
            const firstName = client.firstName || client.first_name || '';
            const lastName = client.lastName || client.last_name || '';
            const patronymic = client.patronymic || '';
            const position = client.position || '';
            const contactPerson = client.contactPerson || client.contact_person || '';

            if (clientType === 'company') {
                const baseName = [firstName, lastName].filter(Boolean).join(' ').trim();
                if (!baseName && !contactPerson) return '';
                if (!baseName) return contactPerson;

                let result = baseName;
                if (position) {
                    result += ` (${position})`;
                }
                if (contactPerson && contactPerson !== baseName) {
                    result += ` (${contactPerson})`;
                }
                return result;
            } else {
                const baseName = [firstName, lastName].filter(Boolean).join(' ').trim();
                if (!baseName) return '';
                if (position) {
                    return `${baseName} (${position})`;
                }
                return baseName;
            }
        },
        clientBalance() {
            return formatNumber(this.displayBalance, null, true);
        },
        clientPhones() {
            if (!this.selectedClient) return [];
            if (this.selectedClient.primaryPhone) {
                return [{ phone: this.selectedClient.primaryPhone }];
            }
            const phones = this.selectedClient.phones || [];
            return Array.isArray(phones) ? phones : [];
        },
        defaultCurrencySymbol() {
            if (!this.$store || !this.$store.state) return '';
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.symbol : '';
        },
        displayCurrencySymbol() {
            if (!this.selectedClient || !this.selectedClient.balances || this.selectedClient.balances.length === 0) {
                return this.defaultCurrencySymbol;
            }
            
            if (this.selectedBalanceId) {
                const selectedBalance = this.selectedClient.balances.find(b => b.id === this.selectedBalanceId);
                if (selectedBalance && selectedBalance.currency) {
                    return selectedBalance.currency.symbol || this.defaultCurrencySymbol;
                }
            }
            
            const defaultBalance = this.selectedClient.balances.find(b => b.isDefault);
            if (defaultBalance && defaultBalance.currency) {
                return defaultBalance.currency.symbol || this.defaultCurrencySymbol;
            }
            
            return this.selectedClient.balances[0]?.currency?.symbol || this.defaultCurrencySymbol;
        },
        displayBalance() {
            if (!this.selectedClient) {
                console.log('[ClientSearch] displayBalance: no selectedClient');
                return 0;
            }
            
            console.log('[ClientSearch] displayBalance:', {
                selectedClient: this.selectedClient,
                hasBalances: !!this.selectedClient.balances,
                balancesLength: this.selectedClient.balances?.length || 0,
                balances: this.selectedClient.balances,
                selectedBalanceId: this.selectedBalanceId,
                oldBalance: this.selectedClient.balance
            });
            
            if (this.selectedClient.balances && this.selectedClient.balances.length > 0) {
                if (this.selectedBalanceId) {
                    const selectedBalance = this.selectedClient.balances.find(b => b.id === this.selectedBalanceId);
                    if (selectedBalance) {
                        console.log('[ClientSearch] displayBalance: using selectedBalance', selectedBalance);
                        return selectedBalance.balance || 0;
                    }
                }
                
                const defaultBalance = this.selectedClient.balances.find(b => b.isDefault);
                if (defaultBalance) {
                    console.log('[ClientSearch] displayBalance: using defaultBalance', defaultBalance);
                    return defaultBalance.balance || 0;
                }
                
                const firstBalance = this.selectedClient.balances[0]?.balance || 0;
                console.log('[ClientSearch] displayBalance: using firstBalance', firstBalance);
                return firstBalance;
            }
            
            const oldBalance = this.selectedClient.balance || 0;
            console.log('[ClientSearch] displayBalance: using old balance', oldBalance);
            return oldBalance;
        },
        shouldShowBalanceSelect() {
            const hasPermission = this.$store.getters.hasPermission('settings_client_balance_view');
            const hasBalances = this.selectedClient?.balances && this.selectedClient.balances.length > 1;
            
            console.log('[ClientSearch] shouldShowBalanceSelect:', {
                hasPermission,
                hasBalances,
                selectedClient: this.selectedClient,
                balances: this.selectedClient?.balances,
                balancesLength: this.selectedClient?.balances?.length || 0
            });
            
            return hasPermission && hasBalances;
        }
    },
    async created() {
        console.log('[ClientSearch] created:', {
            selectedClient: this.selectedClient
        });
        
        await this.fetchLastClients();

        if (this.selectedClient && this.selectedClient.id) {
            try {
                const hasFullData = typeof this.selectedClient.fullName === 'function' && 
                    (this.selectedClient.phones && Array.isArray(this.selectedClient.phones) || this.selectedClient.primaryPhone) &&
                    this.selectedClient.balances && Array.isArray(this.selectedClient.balances);
                
                if (hasFullData) {
                    console.log('[ClientSearch] selectedClient already has full data including balances');
                    return;
                }
                
                console.log('[ClientSearch] fetching client data for id:', this.selectedClient.id, {
                    hasBalances: !!this.selectedClient.balances,
                    balancesLength: this.selectedClient.balances?.length || 0
                });
                const updatedClient = await ClientController.getItem(this.selectedClient.id);
                console.log('[ClientSearch] fetched client:', {
                    updatedClient,
                    hasBalances: !!updatedClient?.balances,
                    balancesLength: updatedClient?.balances?.length || 0,
                    balances: updatedClient?.balances
                });
                this.$emit('update:selectedClient', updatedClient);
            } catch (error) {
                console.error('Ошибка при обновлении данных клиента:', error);
            }
        }
    },
    mounted() {
        console.log('[ClientSearch] mounted:', {
            selectedClient: this.selectedClient,
            selectedBalanceId: this.selectedBalanceId,
            hasPermission: this.$store.getters.hasPermission('settings_client_balance_view')
        });
        document.addEventListener('click', this.handleBalanceDropdownClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleBalanceDropdownClickOutside);
    },
    emits: ['update:selectedClient', 'balance-changed'],
    methods: {
        async fetchLastClients() {
            try {
                let allClients = this.$store.getters.clients;

                if (!allClients || allClients.length === 0) {
                    await this.$store.dispatch('loadClients');
                    allClients = this.$store.getters.clients;
                }

                this.updateLastClientsFromStore(allClients);
            } catch (error) {
                console.error('Ошибка при загрузке последних клиентов:', error);
                this.lastClients = [];
            }
        },
        updateLastClientsFromStore(allClients = null) {
            const clients = allClients || this.$store.getters.clients;

            if (clients && clients.length > 0) {
                this.lastClients = clients
                    .filter((client) => client.status === true)
                    .filter((client) => (this.onlySuppliers ? client.isSupplier : true))
                    .filter((client) => {
                        if (this.clientTypeFilter && Array.isArray(this.clientTypeFilter) && this.clientTypeFilter.length > 0) {
                            const clientType = client.clientType || client.client_type;
                            return this.clientTypeFilter.includes(clientType);
                        }
                        return true;
                    })
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 10);
            } else {
                this.lastClients = [];
            }
        },
        searchClients: debounce(async function () {
            if (this.clientSearch.length >= 3) {
                if (this.searchAbortController) {
                    this.searchAbortController.abort();
                }
                this.searchAbortController = new AbortController();
                const signal = this.searchAbortController.signal;
                this.clientSearchLoading = true;
                try {
                    const typeFilter = this.clientTypeFilter && Array.isArray(this.clientTypeFilter) && this.clientTypeFilter.length > 0
                        ? this.clientTypeFilter
                        : null;

                    const results = await ClientController.searchItems(this.clientSearch, typeFilter, signal);

                    if (signal.aborted) return;

                    let filtered = this.onlySuppliers
                        ? results.filter((client) => client.isSupplier)
                        : results;

                    this.clientResults = filtered;

                } catch (error) {
                    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') return;
                    console.error('Ошибка при поиске клиентов:', error);
                    this.clientResults = [];
                } finally {
                    if (!signal.aborted) this.clientSearchLoading = false;
                }
            } else {
                this.clientResults = [];
            }
        }, 250),
        async selectClient(client) {
            this.showDropdown = false;
            this.clientSearch = '';
            this.clientResults = [];
            
            console.log('[ClientSearch] selectClient:', {
                client,
                hasBalances: !!client?.balances,
                balancesLength: client?.balances?.length || 0
            });
            
            if (!client?.balances || !Array.isArray(client.balances) || client.balances.length === 0) {
                console.log('[ClientSearch] Client has no balances, fetching full client data for id:', client?.id);
                try {
                    const fullClient = await ClientController.getItem(client.id);
                    console.log('[ClientSearch] Fetched full client:', {
                        fullClient,
                        hasBalances: !!fullClient?.balances,
                        balancesLength: fullClient?.balances?.length || 0,
                        balances: fullClient?.balances
                    });
                    this.$emit('update:selectedClient', fullClient);
                } catch (error) {
                    console.error('[ClientSearch] Error fetching full client data:', error);
                    this.$emit('update:selectedClient', client);
                }
            } else {
                this.$emit('update:selectedClient', client);
            }
        },
        deselectClient() {
            this.$emit('update:selectedClient', null);
        },
        openCreateClientModal() {
            this.defaultClientName = this.clientSearch;
            this.modalCreateClient = true;
        },
        async onClientCreated(newClient) {
            this.modalCreateClient = false;
            const clientId = newClient?.id || newClient?.item?.id;
            if (clientId) {
                try {
                    const client = await ClientController.getItem(clientId);
                    await this.selectClient(client);
                } catch (error) {
                    console.error('Ошибка при загрузке созданного клиента:', error);
                }
            }
        },
        onClientCreatedError(error) {
            const errorMessages = this.getApiErrorMessage(error);
            const errorText = Array.isArray(errorMessages) ? errorMessages.join(', ') : errorMessages;
            this.showNotification(this.$t('errorCreatingClient'), errorText, true);
        },
        async handleFocus() {
            this.showDropdown = true;
            if (this.lastClients.length === 0) {
                await this.fetchLastClients();
            }
            if (this.lastClients.length === 0) {
                try {
                    const paginated = await ClientController.getItems(1, null, false, null, null, 20);
                    if (paginated && paginated.items) {
                        this.lastClients = paginated.items
                            .filter((client) => client.status === true)
                            .filter((client) => (this.onlySuppliers ? client.isSupplier : true))
                            .filter((client) => {
                                if (this.clientTypeFilter && Array.isArray(this.clientTypeFilter) && this.clientTypeFilter.length > 0) {
                                    const clientType = client.clientType || client.client_type;
                                    return this.clientTypeFilter.includes(clientType);
                                }
                                return true;
                            })
                            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                            .slice(0, 10);
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке последних клиентов:', error);
                }
            }
        },
        handleBlur() {
            requestAnimationFrame(() => {
                this.showDropdown = false;
            });
        },
        formatBalance(balance) {
            return formatNumber(balance, null, true);
        },
        balanceColorClass(value) {
            const v = value == null ? 0 : Number(value);
            return v === 0 ? 'text-[#337AB7]' : v > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]';
        },
        onBalanceChange() {
            console.log('[ClientSearch] Balance changed:', {
                selectedBalanceId: this.selectedBalanceId,
                selectedClient: this.selectedClient,
                balances: this.selectedClient?.balances
            });
            this.$emit('balance-changed', this.selectedBalanceId);
        },
        selectBalance(balance) {
            this.selectedBalanceId = balance.id;
            this.showBalanceDropdown = false;
            this.onBalanceChange();
        },
        handleBalanceDropdownClickOutside(event) {
            if (!event.target.closest('.balance-dropdown-wrap')) {
                this.showBalanceDropdown = false;
            }
        },
    },
    watch: {
        selectedClient: {
            handler(newVal) {
                console.log('[ClientSearch] selectedClient changed:', {
                    newVal,
                    hasBalances: !!newVal?.balances,
                    balancesLength: newVal?.balances?.length || 0,
                    balances: newVal?.balances
                });
                
                if (newVal && newVal.balances && newVal.balances.length > 0) {
                    const defaultBalance = newVal.balances.find(b => b.isDefault);
                    this.selectedBalanceId = defaultBalance ? defaultBalance.id : (newVal.balances[0]?.id || null);
                    console.log('[ClientSearch] selectedBalanceId set to:', this.selectedBalanceId, {
                        defaultBalance: defaultBalance?.id,
                        firstBalance: newVal.balances[0]?.id
                    });
                } else {
                    this.selectedBalanceId = null;
                    console.log('[ClientSearch] selectedBalanceId set to null (no balances)');
                }
            },
            deep: true,
            immediate: true,
        },
        clientSearch: {
            handler: 'searchClients',
            immediate: true,
        },
        '$store.state.clients': {
            handler(newClients) {
                if (newClients && newClients.length > 0) {
                    this.updateLastClientsFromStore(newClients);
                    if (this.selectedClient?.id) {
                        const updated = newClients.find(c => c.id === this.selectedClient.id);
                        if (updated) {
                            this.$emit('update:selectedClient', updated);
                        }
                    }
                }
            },
            immediate: true,
            deep: true,
        },
    },
};
</script>

<template>
    <div v-if="selectedClient == null" class="relative">
        <label v-if="showLabel" :class="['block', 'mb-1', { 'required': required }]">{{ $t('client') }}</label>
        <input type="text" v-model="clientSearch" :placeholder="$t('enterClientNameOrNumber')"
            class="w-full p-2 border rounded" @focus="showDropdown = true" @blur="handleBlur" :disabled="disabled" />
        <transition name="appear">
            <ul v-show="showDropdown"
                class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                <li v-if="clientSearchLoading" class="p-2 text-gray-500">{{ $t('loading') }}</li>
                <template v-else-if="clientSearch.length === 0">
                    <li v-for="client in lastClients" :key="client.id" @mousedown.prevent="selectClient(client)"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between">
                            <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                            <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                        </div>
                    </li>
                </template>
                <li v-else-if="clientSearch.length < 3" class="p-2 text-gray-500">{{ $t('minimum3Characters') }}</li>
                <li v-else-if="clientResults.length === 0" class="p-2 text-gray-500">{{ $t('notFound') }}</li>
                <li v-for="client in clientResults" :key="client.id" @mousedown.prevent="() => selectClient(client)"
                    class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                    <div class="flex justify-between">
                        <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                        <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                    </div>
                    <span v-if="$store.getters.hasPermission('settings_client_balance_view')"
                        :class="client.balance == 0 ? 'text-[#337AB7]' : client.balance > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]'">
                        {{ client.balanceFormatted() }}
                        <span v-if="client.balance > 0">({{ $t('clientOwesUs') }})</span>
                        <span v-else-if="client.balance < 0">({{ $t('weOweClient') }})</span>
                        <span v-else>({{ $t('mutualSettlement') }})</span>
                    </span>
                </li>
                <li class="p-2 border-t border-gray-300 bg-gray-50 sticky bottom-0">
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
                    <p v-if="$store.getters.hasPermission('settings_client_balance_view')"><span class="text-xs">{{ $t('balance') }}:</span>
                        <span class="font-semibold text-sm"
                            :class="selectedClient.balance == 0 ? 'text-[#337AB7]' : selectedClient.balance > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]'">
                            {{ clientBalance }} {{ defaultCurrencySymbol }}
                            <span v-if="selectedClient.balance > 0">({{ $t('clientOwesUs') }})</span>
                            <span v-else-if="selectedClient.balance < 0">({{ $t('weOweClient') }})</span>
                            <span v-else>({{ $t('mutualSettlement') }})</span>
                        </span>
                    </p>
                </div>
                <button v-if="allowDeselect" v-on:click="deselectClient" class="text-red-500 text-2xl cursor-pointer"
                    :disabled="disabled">×</button>
            </div>
        </div>
    </div>
    <SideModalDialog :showForm="modalCreateClient" :onclose="() => modalCreateClient = false" :level="1">
        <ClientCreatePage :editingItem="null" :defaultFirstName="defaultClientName" @saved="onClientCreated"
            @saved-error="onClientCreatedError" />
    </SideModalDialog>
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
            if (!this.selectedClient) return 0;
            if (typeof this.selectedClient.balanceFormatted === 'function') {
                return this.selectedClient.balanceFormatted();
            }
            const balance = this.selectedClient.balance || 0;
            return formatNumber(balance, null, true);
        },
        clientPhones() {
            if (!this.selectedClient) return [];
            const phones = this.selectedClient.phones || [];
            return Array.isArray(phones) ? phones : [];
        },
        defaultCurrencySymbol() {
            if (!this.$store || !this.$store.state) return '';
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.symbol : '';
        }
    },
    async created() {
        await this.fetchLastClients();

        if (this.selectedClient && this.selectedClient.id) {
            try {
                if (typeof this.selectedClient.fullName === 'function' && this.selectedClient.phones && Array.isArray(this.selectedClient.phones)) {
                    return;
                }
                const updatedClient = await ClientController.getItem(this.selectedClient.id);
                this.$emit('update:selectedClient', updatedClient);
            } catch (error) {
                console.error('Ошибка при обновлении данных клиента:', error);
            }
        }
    },
    emits: ['update:selectedClient'],
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
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 10);
            } else {
                this.lastClients = [];
            }
        },
        searchClients: debounce(async function () {
            if (this.clientSearch.length >= 3) {
                this.clientSearchLoading = true;
                try {
                    const results = await ClientController.searchItems(this.clientSearch);

                    this.clientResults = this.onlySuppliers
                        ? results.filter((client) => client.isSupplier)
                        : results;

                } catch (error) {
                    console.error('Ошибка при поиске клиентов:', error);
                    this.clientResults = [];
                } finally {
                    this.clientSearchLoading = false;
                }
            } else {
                this.clientResults = [];
            }
        }, 250),
        async selectClient(client) {
            this.showDropdown = false;
            this.clientSearch = '';
            this.clientResults = [];
            this.$emit('update:selectedClient', client);
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
        handleBlur() {
            requestAnimationFrame(() => {
                this.showDropdown = false;
            });
        },
    },
    watch: {
        selectedClient: {
            handler(newVal) {
            },
            deep: true,
        },
        clientSearch: {
            handler: 'searchClients',
            immediate: true,
        },
        '$store.state.clients': {
            handler(newClients) {
                if (newClients && newClients.length > 0) {
                    if (!this.selectedClient) {
                        this.updateLastClientsFromStore();
                    } else if (this.selectedClient?.id) {
                        // Автоматически обновляем selectedClient из Store если он есть
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

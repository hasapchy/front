<template>
    <div v-if="selectedClient == null" class="relative">
        <label v-if="showLabel" class="block mb-1 required">{{ $t('client') }}</label>
        <input type="text" v-model="clientSearch" :placeholder="$t('enterClientNameOrNumber')"
             class="w-full p-2 border rounded" @focus="showDropdown = true" @blur="handleBlur"
             :disabled="disabled" />
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
                                                 <span
                            :class="client.balance == 0 ? 'text-[#337AB7]' : client.balance > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]'">
                            {{ client.balanceFormatted() }}
                            <span v-if="client.balance > 0">({{ $t('clientOwesUs') }})</span>
                            <span v-else-if="client.balance < 0">({{ $t('weOweClient') }})</span>
                            <span v-else>({{ $t('mutualSettlement') }})</span>
                        </span>
                     </li>
                     <li class="p-2 border-t border-gray-300 bg-gray-50 sticky bottom-0">
                         <PrimaryButton 
                             :is-info="true" 
                             :is-full="true"
                             icon="fas fa-plus"
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
                        <label class="required">{{ $t('client') }}</label>
                        <p><span class="text-xs">{{ $t('name') }}:</span> <span class="font-semibold text-sm">{{ clientFullName }}</span></p>
                        <p><span class="text-xs">{{ $t('phone') }}:</span> <span class="font-semibold text-sm">{{ clientPhones[0]?.phone || $t('noPhone') }}</span></p>
                        <p><span class="text-xs">{{ $t('balance') }}:</span>
                            <span class="font-semibold text-sm"
                                :class="selectedClient.balance == 0 ? 'text-[#337AB7]' : selectedClient.balance > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]'">
                                {{ clientBalance }} {{ defaultCurrencySymbol }}
                                <span v-if="selectedClient.balance > 0">({{ $t('clientOwesUs') }})</span>
                                <span v-else-if="selectedClient.balance < 0">({{ $t('weOweClient') }})</span>
                                <span v-else>({{ $t('mutualSettlement') }})</span>
                            </span>
                        </p>
                    </div>
                    <button v-on:click="deselectClient" class="text-red-500 text-2xl cursor-pointer"
                        :disabled="disabled">×</button>
                </div>
            </div>
        </div>
    <SideModalDialog :showForm="modalCreateClient" :onclose="() => modalCreateClient = false" :level="1">
        <ClientCreatePage :editingItem="null" :defaultFirstName="defaultClientName" @saved="onClientCreated" @saved-error="onClientCreatedError" />
    </SideModalDialog>
</template>

<script>
import ClientController from '@/api/ClientController';
import debounce from 'lodash.debounce';
import { defineAsyncComponent } from 'vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import ClientDto from '@/dto/client/ClientDto';
import notificationMixin from '@/mixins/notificationMixin';

export default {
    mixins: [notificationMixin],
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
            const contactPerson = this.selectedClient.contactPerson || this.selectedClient.contact_person;
            const firstName = this.selectedClient.firstName || this.selectedClient.first_name || '';
            const lastName = this.selectedClient.lastName || this.selectedClient.last_name || '';
            return contactPerson
                ? `${firstName} ${lastName} (${contactPerson})`
                : `${firstName} ${lastName}`;
        },
        clientBalance() {
            if (!this.selectedClient) return 0;
            if (typeof this.selectedClient.balanceFormatted === 'function') {
                return this.selectedClient.balanceFormatted();
            }
            const balance = this.selectedClient.balance || this.selectedClient.balance_amount || 0;
            return parseFloat(balance).toFixed(2);
        },
        clientPhones() {
            if (!this.selectedClient) return [];
            const phones = this.selectedClient.phones || [];
            return Array.isArray(phones) ? phones : [];
        },
        defaultCurrencySymbol() {
            if (!this.$store || !this.$store.state) return '';
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.is_default);
            return defaultCurrency ? defaultCurrency.symbol : '';
        }
    },
    async created() {
        // Загружаем последних клиентов напрямую из API
        this.fetchLastClients();
        
        // Если клиент уже выбран (при редактировании), обновляем его данные
        if (this.selectedClient && this.selectedClient.id) {
            try {
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
                // Загружаем всех клиентов напрямую из API
                const allClients = await ClientController.getAllItems();
                
                // Фильтруем и сортируем
                this.lastClients = allClients
                    .filter((client) => client.status === true) // только активные
                    .filter((client) => (this.onlySuppliers ? client.isSupplier : true))
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 10);
            } catch (error) {
                console.error('Ошибка при загрузке последних клиентов:', error);
                this.lastClients = [];
            }
        },
        searchClients: debounce(async function () {
            if (this.clientSearch.length >= 3) {
                this.clientSearchLoading = true;
                try {
                    // Используем прямой API запрос для поиска
                    const results = await ClientController.search(this.clientSearch);
                    
                    // Фильтруем по поставщикам если нужно
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
            
            try {
                const updatedClient = await ClientController.getItem(client.id);
                this.$emit('update:selectedClient', updatedClient);
            } catch (error) {
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
            if (newClient) {
                try {
                    const clientDto = ClientDto.fromApi(newClient);
                    const updatedClient = await ClientController.getItem(clientDto.id);
                    this.selectClient(updatedClient);
                } catch (error) {
                    // Ошибка при создании ClientDto
                }
            }
        },
        onClientCreatedError(error) {
            this.showNotification(this.$t('errorCreatingClient'), error, true);
        },
        handleBlur() {
             requestAnimationFrame(() => {
                 this.showDropdown = false;
             });
         },
    },
    watch: {
        clientSearch: {
            handler: 'searchClients',
            immediate: true,
        },
    },
};
</script>

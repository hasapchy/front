<template>
    <div>
        <div v-if="selectedClient == null" class="relative">
            <label class="block mb-1 required">{{ $t('client') }}</label>
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
                        <p><span class="font-semibold text-sm">{{ $t('name') }}:</span> {{ clientFullName }}</p>
                        <p><span class="font-semibold text-sm">{{ $t('phone') }}:</span> {{ clientPhones[0]?.phone || $t('noPhone') }}</p>
                        <p><span class="font-semibold text-sm">{{ $t('balance') }}:</span>
                            <span
                                :class="selectedClient.balance == 0 ? 'text-[#337AB7]' : selectedClient.balance > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]'">
                                {{ clientBalance }}
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
            // Fallback для обычных объектов
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
            // Fallback для обычных объектов
            const balance = this.selectedClient.balance || this.selectedClient.balance_amount || 0;
            return parseFloat(balance).toFixed(2);
        },
        clientPhones() {
            if (!this.selectedClient) return [];
            return this.selectedClient.phones || [];
        }
    },
    created() {
        this.fetchLastClients();
    },
    emits: ['update:selectedClient'],
    methods: {
        async fetchLastClients() {
            const paginated = await ClientController.getItems(1);
            this.lastClients = paginated.items
                .filter((client) => (this.onlySuppliers ? client.isSupplier : true))
                .slice(0, 10);
        },
                 searchClients: debounce(async function () {
             if (this.clientSearch.length >= 3) {
                 this.clientSearchLoading = true;
                 try {
                     const results = await ClientController.search(this.clientSearch);
                     this.clientResults = this.onlySuppliers
                         ? results.filter((client) => client.isSupplier)
                         : results;
                 } catch (error) {
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
                console.warn('Не удалось обновить данные клиента:', error);
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
                    console.error('Ошибка при создании ClientDto:', error);
                }
            }
        },
        onClientCreatedError(error) {
            console.error('Ошибка при создании клиента:', error);
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

<style scoped>
.appear-enter-active,
.appear-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.appear-enter-from,
.appear-leave-to {
    transform: scaleY(0);
    opacity: 0;
    transform-origin: top;
}

.appear-enter-to,
.appear-leave-from {
    transform: scaleY(1);
    opacity: 1;
    transform-origin: top;
}
</style>
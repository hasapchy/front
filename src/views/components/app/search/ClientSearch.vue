<template>
    <div>
        <div v-if="selectedClient == null" class="relative">
            <label class="block mb-1" :class="{ 'required': required }">Клиент</label>
            <input type="text" v-model="clientSearch" placeholder="Введите имя или номер клиента"
                class="w-full p-2 border rounded" @focus="showDropdown = true" @blur="showDropdown = false"
                :disabled="disabled" />
            <transition name="appear">
                <ul v-show="showDropdown"
                    class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                    <li v-if="clientSearchLoading" class="p-2 text-gray-500">Загрузка...</li>
                    <template v-else-if="clientSearch.length === 0">
                        <li v-for="client in lastClients" :key="client.id" @mousedown.prevent="selectClient(client)"
                            class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                            <div class="flex justify-between">
                                <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                                <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                            </div>
                        </li>
                    </template>
                    <li v-else-if="clientSearch.length < 4" class="p-2 text-gray-500">Минимум 4 символа</li>
                    <li v-else-if="clientResults.length === 0" class="p-2 text-gray-500">Не найдено
                        <button class="text-blue-600 underline ml-2 cursor-pointer"
                            @mousedown.prevent="openCreateClientModal">
                            Создать клиента "{{ clientSearch }}"
                        </button>
                    </li>
                    <li v-for="client in clientResults" :key="client.id" @mousedown.prevent="() => selectClient(client)"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between">
                            <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                            <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                        </div>
                        <span
                            :class="client.balance == 0 ? 'text-[#337AB7]' : client.balance > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]'">
                            {{ client.balanceFormatted() }}
                            <span v-if="client.balanceNumeric() > 0">(Клиент должен нам)</span>
                            <span v-else-if="client.balanceNumeric() < 0">(Мы должны клиенту)</span>
                            <span v-else>(Взаимный расчет)</span>
                        </span>
                    </li>
                </ul>
            </transition>
        </div>
        <div v-else class="mt-2">
            <div class="p-2 pt-0 border-2 border-gray-400/60 rounded-md">
                <div class="flex justify-between items-center">
                    <div>
                        <label>Клиент</label>
                        <p><span class="font-semibold text-sm">Имя:</span> {{ selectedClient.fullName() }}</p>
                        <p><span class="font-semibold text-sm">Номер:</span> {{ selectedClient.phones[0].phone }}</p>
                        <p><span class="font-semibold text-sm">Баланс:</span>
                            <span
                                :class="selectedClient.balanceNumeric() == 0 ? 'text-[#337AB7]' : selectedClient.balanceNumeric() > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]'">
                                {{ selectedClient.balanceFormatted() }}
                                <span v-if="selectedClient.balanceNumeric() > 0">(Клиент должен нам)</span>
                                <span v-else-if="selectedClient.balanceNumeric() < 0">(Мы должны клиенту)</span>
                                <span v-else>(Взаимный расчет)</span>
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
        <ClientCreatePage :editingItem="null" :defaultFirstName="defaultClientName" @saved="onClientCreated"
            @saved-error="() => modalCreateClient = false" />
    </SideModalDialog>
</template>

<script>
import ClientController from '@/api/ClientController';
import debounce from 'lodash.debounce';
import ClientCreatePage from '@/views/pages/clients/ClientCreatePage.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import ClientDto from '@/dto/client/ClientDto';

export default {
    components: {
        ClientCreatePage,
        SideModalDialog,
    },
    props: {
        onlySuppliers: {
            type: Boolean,
            default: false,
        },
        selectedClient: {
            type: Object,
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
                const results = await ClientController.search(this.clientSearch);
                this.clientSearchLoading = false;
                this.clientResults = this.onlySuppliers
                    ? results.filter((client) => client.isSupplier)
                    : results;
            } else {
                this.clientResults = [];
            }
        }, 250),
        selectClient(client) {
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
        onClientCreated(newClient) {
            this.modalCreateClient = false;
            if (newClient) {
                this.selectClient(ClientDto.fromApi(newClient));
            }
        }
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
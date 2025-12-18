<template>
    <div>
        <div v-if="selectedClient == null" class="relative">
            <label class="block mb-1 required">{{ $t('client') }}</label>
            <input type="text" v-model="clientSearch" :placeholder="$t('enterClientNameOrNumber')"
                class="w-full p-2 border rounded" @focus="handleFocus" @blur="handleBlur"
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
                                <div class="text-[#337AB7]">{{ client.phones?.[0]?.phone || client.primaryPhone }}</div>
                            </div>
                        </li>
                    </template>
                    <li v-else-if="clientSearch.length < 3" class="p-2 text-gray-500">{{ $t('minimum3Characters') }}</li>
                    <li v-else-if="clientResults.length === 0" class="p-2 text-gray-500">{{ $t('notFound') }}</li>
                    <li v-for="client in clientResults" :key="client.id" @mousedown.prevent="() => selectClient(client)"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between">
                            <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                            <div class="text-[#337AB7]">{{ client.primaryPhone || client.phones?.[0]?.phone }}</div>
                        </div>
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
                        <p><span class="font-semibold text-sm">{{ $t('phone') }}:</span> <span class="font-semibold text-sm">{{
                            clientPhones[0]?.phone || '' }}</span></p>
                    </div>
                    <button v-on:click="deselectClient" class="text-red-500 text-2xl cursor-pointer"
                        :disabled="disabled">×</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import BasementClientController from '@/api/basement/BasementClientController';
import debounce from 'lodash.debounce';

export default {
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
        clientPhones() {
            if (!this.selectedClient) return [];
            if (this.selectedClient.primaryPhone) {
                return [{ phone: this.selectedClient.primaryPhone }];
            }
            const phones = this.selectedClient.phones || [];
            return Array.isArray(phones) ? phones : [];
        }
    },
    async created() {
        await this.fetchLastClients();

        if (this.selectedClient && this.selectedClient.id) {
            try {
                if (typeof this.selectedClient.fullName === 'function' && (this.selectedClient.phones && Array.isArray(this.selectedClient.phones) || this.selectedClient.primaryPhone)) {
                    return;
                }
                const updatedClient = await BasementClientController.getItem(this.selectedClient.id);
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
                const paginated = await BasementClientController.getItems(1, null, false, 20);
                this.lastClients = paginated.items
                    .filter((client) => client.status === true)
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
                    const results = await BasementClientController.search(this.clientSearch);
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
            this.$emit('update:selectedClient', client);
        },
        deselectClient() {
            this.$emit('update:selectedClient', null);
        },
        async handleFocus() {
            this.showDropdown = true;
            if (this.lastClients.length === 0) {
                await this.fetchLastClients();
            }
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

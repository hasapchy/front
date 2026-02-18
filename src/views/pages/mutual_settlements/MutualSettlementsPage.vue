<template>
    <MutualSettlementsBalanceWrapper :data="clientBalances" :loading="clientBalancesLoading" :currency-symbol="selectedCurrencySymbol" />

    <transition name="fade" mode="out-in">
        <div v-if="clientBalances != null && !clientBalancesLoading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="mutual_settlements.clients" :columns-config="columnsConfig"
                :table-data="clientBalances" :item-mapper="itemMapper" :onItemClick="handleRowClick">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar :show-filters="true" :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()" :on-filters-reset="resetFilters"
                        :show-pagination="false" :resetColumns="resetColumns" :columns="columns"
                        :toggleVisible="toggleVisible" :log="log">
                        <template #left>
                            <FiltersContainer :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()" @reset="resetFilters" @apply="applyFilters">
                                <div v-if="currencies.length">
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('currency') }}</label>
                                    <select :value="effectiveCurrencyId" class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                        @input="onCurrencyFilterInput">
                                        <option v-for="c in currencies" :key="c.id" :value="c.id">{{ c.symbol }} ({{ c.name }})</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('type') || 'Тип' }}</label>
                                    <CheckboxFilter class="w-full" :model-value="clientTypeFilter"
                                        :options="clientTypeOptions" placeholder="all"
                                        @update:modelValue="handleClientTypeChange($event)" />
                                </div>
                            </FiltersContainer>
                        </template>

                        <template #gear="{ resetColumns, columns, toggleVisible, log }">
                            <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                <ul>
                                    <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns"
                                        @change="log">
                                        <li v-for="(element, index) in columns" :key="element.name" v-show="element.name !== 'select'"
                                            @click="toggleVisible(index)"
                                            class="flex items-center hover:bg-gray-100 p-2 rounded">
                                            <div class="space-x-2 flex flex-row justify-between w-full select-none">
                                                <div>
                                                    <i class="text-sm mr-2 text-[#337AB7]"
                                                        :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                                    {{ $te(element.label) ? $t(element.label) : element.label }}
                                                </div>
                                                <div><i
                                                        class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i>
                                                </div>
                                            </div>
                                        </li>
                                    </draggable>
                                </ul>
                            </TableFilterButton>
                        </template>
                    </TableControlsBar>
                </template>
            </DraggableTable>
        </div>
        <div v-else key="loader" class="min-h-64">
            <TableSkeleton />
        </div>
    </transition>

    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ClientCreatePage v-if="modalDialog" ref="clientForm" @saved="handleSaved" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
            :editingItem="editingItem" />
    </SideModalDialog>

</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import CheckboxFilter from '@/views/components/app/forms/CheckboxFilter.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import ClientController from '@/api/ClientController';
import ClientCreatePage from '@/views/pages/clients/ClientCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import MutualSettlementsBalanceWrapper from './MutualSettlementsBalanceWrapper.vue';
import { eventBus } from '@/eventBus';
import searchMixin from '@/mixins/searchMixin';
import filtersMixin from '@/mixins/filtersMixin';
import { highlightMatches } from '@/utils/searchUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';

export default {
    mixins: [notificationMixin, modalMixin, companyChangeMixin, searchMixin, crudEventMixin, getApiErrorMessageMixin, filtersMixin],
    components: { SideModalDialog, PrimaryButton, DraggableTable, ClientCreatePage, MutualSettlementsBalanceWrapper, FiltersContainer, CheckboxFilter, TableControlsBar, TableFilterButton, TableSkeleton, draggable: VueDraggableNext },
    data() {
        return {
            allClients: [],
            allClientsRaw: [],
            clientBalances: [],
            clientBalancesLoading: false,
            editingItem: null,
            currencyFilterId: null,
            columnsConfig: [
                { name: 'id', label: 'number', size: 60 },
                { name: 'clientName', label: 'customer', html: true },
                { name: 'clientType', label: 'clientType' },
                { name: 'balance', label: 'balance', html: true },
            ]
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);

        eventBus.on('global-search', this.handleSearch);
    },

    mounted() {
        const savedId = this.$store.state.clientBalancesCurrencyId;
        if (savedId != null) this.currencyFilterId = savedId;
        this.loadClientBalances();
    },

    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },

    watch: {
        searchQuery() {
            if (this.allClientsRaw?.length) {
                this.applyFilters();
            }
        }
    },

    methods: {
        getClientType(client) {
            return client.clientType || client.client_type || 'individual';
        },

        async loadClientBalances() {
            this.clientBalancesLoading = true;
            try {
                const clients = await ClientController.getListItems(true);
                this.allClientsRaw = clients;
                this.allClients = clients;

                this.applyLocalFilters();
            } catch (error) {
                console.error('Ошибка загрузки балансов клиентов:', error);
            } finally {
                this.clientBalancesLoading = false;
            }
        },

        applyFilters() {
            this.$store.dispatch('setClientBalancesCurrencyId', this.effectiveCurrencyId);
            this.applyLocalFilters();
        },

        applyLocalFilters() {
            if (!this.allClientsRaw?.length) {
                this.clientBalances = [];
                return;
            }

            let filteredClients = this.allClientsRaw;
            if (this.clientTypeFilter.length) {
                filteredClients = filteredClients.filter(client => {
                    return this.clientTypeFilter.includes(this.getClientType(client));
                });
            }

            const searchQuery = this.$store.state.searchQuery || '';
            if (searchQuery && searchQuery.trim()) {
                const searchLower = searchQuery.toLowerCase().trim();
                filteredClients = filteredClients.filter(client => {
                    const firstName = (client.firstName || client.first_name || '').toLowerCase();
                    const lastName = (client.lastName || client.last_name || '').toLowerCase();
                    const fullName = `${firstName} ${lastName}`.trim();

                    const phones = client.phones || [];
                    const hasMatchingPhone = phones.some(phone => {
                        let phoneStr = '';
                        if (typeof phone === 'string') {
                            phoneStr = phone;
                        } else if (phone && typeof phone === 'object') {
                            phoneStr = phone.phone || phone.phone_number || '';
                        }
                        return phoneStr.toLowerCase().includes(searchLower);
                    });
                    return firstName.includes(searchLower) ||
                        lastName.includes(searchLower) ||
                        fullName.includes(searchLower) ||
                        hasMatchingPhone;
                });
            }

            const effectiveCurrencyId = this.effectiveCurrencyId;
            const defaultId = this.defaultCurrencyId;

            this.clientBalances = filteredClients
                .map(client => {
                    const balances = client.balances || [];
                    const balanceByCurrency = balances.find(b => (b.currencyId ?? b.currency_id) === effectiveCurrencyId);
                    let balance = 0;
                    let currencySymbol = this.selectedCurrencySymbol || '';
                    if (balanceByCurrency) {
                        balance = parseFloat(balanceByCurrency.balance) || 0;
                        currencySymbol = balanceByCurrency.currency?.symbol || currencySymbol;
                    } else if (balances.length === 0 && effectiveCurrencyId === defaultId) {
                        balance = parseFloat(client.balance) || 0;
                        currencySymbol = client.currencySymbol || client.currency_symbol || currencySymbol;
                    }

                    return {
                        id: client.id,
                        clientType: this.getClientType(client),
                        firstName: client.firstName || client.first_name,
                        lastName: client.lastName || client.last_name,
                        first_name: client.firstName || client.first_name,
                        last_name: client.lastName || client.last_name,
                        contactPerson: client.contactPerson || client.contact_person,
                        contact_person: client.contactPerson || client.contact_person,
                        currency_symbol: currencySymbol,
                        debt_amount: balance > 0 ? balance : 0,
                        credit_amount: balance < 0 ? Math.abs(balance) : 0,
                        balance_value: balance,
                    };
                })
                .filter(client => client.debt_amount !== 0 || client.credit_amount !== 0);
        },


        async handleRowClick(item) {
            try {
                const client = await ClientController.getItem(item.id);
                this.editingItem = client;
                this.modalDialog = true;
            } catch (error) {
                console.error('Ошибка загрузки клиента:', error);
                this.showNotification('Ошибка', 'Не удалось загрузить данные клиента', true);
            }
        },

        itemMapper(i, c) {
            const search = this.searchQuery;
            switch (c) {
                case 'clientName':
                    const firstName = i.firstName || i.first_name || '';
                    const lastName = i.lastName || i.last_name || '';
                    const contactPerson = i.contactPerson || i.contact_person || '';
                    let name = `${firstName} ${lastName}`.trim();
                    if (contactPerson) {
                        name += ` (${contactPerson})`;
                    }
                    const displayName = name || 'Клиент без имени';
                    return search ? highlightMatches(displayName, search) : displayName;
                case 'clientType':
                    switch (i.clientType) {
                        case 'company': return this.$t('company');
                        case 'employee': return this.$t('employee');
                        case 'investor': return this.$t('investor');
                        default: return this.$t('individual');
                    }
                case 'balance':
                    if (i.debt_amount > 0) {
                        return `<span class="text-green-600 font-semibold">${this.$formatNumber(i.debt_amount, null, true)} ${i.currency_symbol}</span> <span class="text-xs text-gray-500">(Нам должны)</span>`;
                    } else if (i.credit_amount > 0) {
                        return `<span class="text-red-600 font-semibold">${this.$formatNumber(i.credit_amount, null, true)} ${i.currency_symbol}</span> <span class="text-xs text-gray-500">(Мы должны)</span>`;
                    } else {
                        return `<span class="text-gray-500">0.00 ${i.currency_symbol}</span>`;
                    }
                default:
                    return i[c];
            }
        },

        async onAfterSaved() {
            await this.loadClientBalances();
        },

        async onAfterDeleted() {
            await this.loadClientBalances();
        },

        resetFilters() {
            this.currencyFilterId = null;
            this.$store.dispatch('setClientBalancesCurrencyId', null);
            this.$store.dispatch('setClientTypeFilter', []);
            this.$store.dispatch('setSearchQuery', '');
            this.loadClientBalances();
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.clientTypeFilter, defaultValue: [], isArray: true },
                { value: this.searchQuery?.trim(), defaultValue: '' },
                { value: this.currencyFilterId, defaultValue: this.defaultCurrencyId }
            ]);
        },
        handleClientTypeChange(value) {
            const selected = Array.isArray(value) ? value : [];
            this.$store.dispatch('setClientTypeFilter', selected);
        },
        onCurrencyFilterInput(e) {
            const raw = e.target.value;
            const id = raw === '' ? null : Number(raw);
            this.currencyFilterId = (id === this.defaultCurrencyId) ? null : id;
        },

        async handleCompanyChanged(companyId) {
            this.currencyFilterId = null;
            this.$store.dispatch('setClientBalancesCurrencyId', null);
            this.$store.dispatch('setClientTypeFilter', []);
            this.$store.dispatch('setSearchQuery', '');

            this.allClients = [];
            this.allClientsRaw = [];
            this.clientBalances = [];

            await this.loadClientBalances();
        },
    },
    computed: {
        searchQuery() {
            const query = this.$store.state.searchQuery;
            if (!query) return '';
            const trimmed = String(query).trim();
            return trimmed;
        },
        clientTypeFilter() {
            const filter = this.$store.getters.clientTypeFilter;
            return Array.isArray(filter) ? filter : [];
        },
        clientTypeOptions() {
            return [
                { value: 'individual', label: this.$t('individual') },
                { value: 'company', label: this.$t('company') },
                { value: 'employee', label: this.$t('employee') },
                { value: 'investor', label: this.$t('investor') },
            ];
        },
        hasActiveFilters() {
            const currencyChanged = this.currencyFilterId != null && this.currencyFilterId !== this.defaultCurrencyId;
            return this.clientTypeFilter.length > 0 || !!this.searchQuery?.trim() || currencyChanged;
        },
        currencies() {
            return this.$store.state.currencies || [];
        },
        defaultCurrencyId() {
            const list = this.$store.state.currencies || [];
            const c = list.find(x => (x.isDefault || x.is_default) === true);
            return c ? c.id : (list[0]?.id ?? null);
        },
        effectiveCurrencyId() {
            return this.currencyFilterId != null ? this.currencyFilterId : this.defaultCurrencyId;
        },
        selectedCurrencySymbol() {
            if (!this.effectiveCurrencyId) return '';
            return this.$store.getters.getCurrencySymbol(this.effectiveCurrencyId) || '';
        }
    },
}
</script>

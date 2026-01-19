<template>
    <MutualSettlementsBalanceWrapper :data="clientBalances" :loading="clientBalancesLoading" />

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
                                        <li v-for="(element, index) in columns" :key="element.name"
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
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>

    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ClientCreatePage v-if="modalDialog" ref="clientForm" @saved="handleSaved" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
            :editingItem="editingItem" />
    </SideModalDialog>

    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
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

export default {
    mixins: [notificationMixin, modalMixin, companyChangeMixin, searchMixin, crudEventMixin, getApiErrorMessageMixin, filtersMixin],
    components: { NotificationToast, SideModalDialog, PrimaryButton, DraggableTable, ClientCreatePage, MutualSettlementsBalanceWrapper, FiltersContainer, CheckboxFilter, TableControlsBar, TableFilterButton, draggable: VueDraggableNext },
    data() {
        return {
            allClients: [],
            allClientsRaw: [],
            clientBalances: [],
            clientBalancesLoading: false,
            editingItem: null,
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


            this.clientBalances = filteredClients
                .map(client => {
                    const balance = parseFloat(client.balance) || 0;
                    const currencySymbol = client.currencySymbol || client.currency_symbol || 'TMT';

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
            this.$store.dispatch('setClientTypeFilter', []);
            this.$store.dispatch('setSearchQuery', '');
            this.loadClientBalances();
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.clientTypeFilter, defaultValue: [], isArray: true },
                { value: this.searchQuery?.trim(), defaultValue: '' }
            ]);
        },
        handleClientTypeChange(value) {
            const selected = Array.isArray(value) ? value : [];
            this.$store.dispatch('setClientTypeFilter', selected);
        },

        async handleCompanyChanged(companyId) {
            this.$store.dispatch('setClientTypeFilter', []);
            this.$store.dispatch('setSearchQuery', '');

            this.allClients = [];
            this.allClientsRaw = [];
            this.clientBalances = [];

            await this.loadClientBalances();

            this.$store.dispatch('showNotification', {
                title: 'Компания изменена',
                isDanger: false
            });
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
            return this.clientTypeFilter.length > 0 || !!this.searchQuery?.trim();
        }
    },
}
</script>

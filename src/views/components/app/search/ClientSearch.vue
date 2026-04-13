<template>
  <div>
    <div
      v-if="selectedClient == null"
      class="relative"
    >
      <label
        v-if="showLabel"
        :class="['block', 'mb-1', { 'required': required }]"
      >{{ $t('client') }}</label>
      <input
        v-model="clientSearch"
        type="text"
        :placeholder="$t('enterClientNameOrNumber')"
        class="w-full rounded border border-[var(--input-border)] bg-[var(--input-bg)] p-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        :disabled="disabled || clientSelectionDisabled"
        @focus="handleFocus"
        @blur="handleBlur"
      >
      <transition name="appear">
        <ul
          v-show="showDropdown"
          class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded border border-[var(--input-border)] bg-[var(--surface-elevated)] shadow-lg dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
        >
          <li
            v-if="clientSearchLoading"
            class="p-2 text-[var(--text-secondary)]"
          >
            {{ $t('loading') }}
          </li>
          <template v-else-if="clientSearch.length === 0">
            <li
              v-for="client in lastClients"
              :key="client.id"
              class="cursor-pointer border-b border-[var(--border-subtle)] p-2 hover:bg-[var(--surface-muted)]"
              @mousedown.prevent="selectClient(client)"
            >
              <div class="flex justify-between items-start gap-2">
                <div class="flex min-w-0 flex-1 items-start gap-2">
                  <span
                    class="inline-flex shrink-0 items-center gap-1 [&_i]:!m-0 [&_i]:!flex [&_i]:h-6 [&_i]:w-6 [&_i]:shrink-0 [&_i]:items-center [&_i]:justify-center [&_i]:overflow-hidden [&_i]:rounded-full [&_i]:bg-[var(--surface-muted)] [&_i]:text-sm [&_i]:leading-none [&_i]:[--fa-display:flex] [&_i]:ring-1 [&_i]:ring-[var(--border-subtle)] [&_img]:inline-block [&_img]:h-5 [&_img]:w-5 [&_img]:rounded-full [&_img]:object-cover"
                    v-html="client.icons()"
                  />
                  <div class="min-w-0">
                    <div class="font-medium text-[var(--text-primary)]">
                      {{ getClientDisplayName(client) }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="!inlineSelected"
                  class="flex-shrink-0 text-[#337AB7] dark:text-[var(--label-accent)]"
                >
                  {{ client.phones?.[0]?.phone || client.primaryPhone }}
                </div>
              </div>
            </li>
          </template>
          <li
            v-else-if="clientSearch.length < 3"
            class="p-2 text-[var(--text-secondary)]"
          >
            {{ $t('minimum3Characters') }}
          </li>
          <li
            v-else-if="clientResults.length === 0"
            class="p-2 text-[var(--text-secondary)]"
          >
            {{ $t('notFound') }}
          </li>
          <li
            v-for="client in clientResults"
            :key="client.id"
            class="cursor-pointer border-b border-[var(--border-subtle)] p-2 hover:bg-[var(--surface-muted)]"
            @mousedown.prevent="() => selectClient(client)"
          >
            <div class="flex justify-between items-start gap-2">
              <div class="flex min-w-0 flex-1 items-start gap-2">
                <span
                  class="inline-flex shrink-0 items-center gap-1 [&_i]:!m-0 [&_i]:!flex [&_i]:h-6 [&_i]:w-6 [&_i]:shrink-0 [&_i]:items-center [&_i]:justify-center [&_i]:overflow-hidden [&_i]:rounded-full [&_i]:bg-[var(--surface-muted)] [&_i]:text-sm [&_i]:leading-none [&_i]:[--fa-display:flex] [&_i]:ring-1 [&_i]:ring-[var(--border-subtle)] [&_img]:inline-block [&_img]:h-5 [&_img]:w-5 [&_img]:rounded-full [&_img]:object-cover"
                  v-html="client.icons()"
                />
                <div class="min-w-0">
                  <div class="font-medium text-[var(--text-primary)]">
                    {{ getClientDisplayName(client) }}
                  </div>
                </div>
              </div>
              <div
                v-if="!inlineSelected"
                class="flex-shrink-0 text-[#337AB7] dark:text-[var(--label-accent)]"
              >
                {{ client.primaryPhone || client.phones?.[0]?.phone }}
              </div>
            </div>
          </li>
          <li
            v-if="$store.getters.hasPermission('clients_create')"
            class="sticky bottom-0 border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] p-2"
          >
            <PrimaryButton
              :is-info="true"
              :is-full="true"
              icon="fas fa-plus"
              @mousedown.prevent="openCreateClientModal"
            >
              {{ $t('createClient') }}{{ clientSearch ? ` "${clientSearch}"` : '' }}
            </PrimaryButton>
          </li>
        </ul>
      </transition>
    </div>

    <!-- Компактный вид для фильтров: ФИО в том же input, без карточки -->
    <div
      v-else-if="inlineSelected"
      class="relative"
    >
      <label
        v-if="showLabel"
        :class="['block', 'mb-1', { 'required': required }]"
      >{{ $t('client') }}</label>
      <div class="flex items-center gap-2">
        <input
          type="text"
          readonly
          class="min-w-0 w-full flex-1 rounded border border-[var(--input-border)] bg-[var(--input-bg)] p-2 text-[var(--text-primary)]"
          :value="clientDisplayName"
        >
        <button
          v-if="allowDeselect"
          type="button"
          class="text-red-500 text-2xl cursor-pointer shrink-0 leading-none"
          :disabled="disabled || clientSelectionDisabled"
          @click="deselectClient"
        >
          ×
        </button>
      </div>
    </div>

    <div
      v-else
      class="mt-2"
    >
      <div class="rounded-md border-2 border-[var(--input-border)] p-2 pt-0">
        <div class="flex justify-between items-center">
          <div>
            <label :class="{ 'required': required }">{{ $t('client') }}</label>
            <div class="font-semibold text-sm">
              {{ clientDisplayName }}
            </div>
            <p class="mt-1">
              <span class="text-xs">{{ $t('phone') }}:</span> <span class="font-semibold text-sm">{{
                clientPhones[0]?.phone  }}</span>
            </p>
            <div
              v-if="$store.getters.hasPermission('settings_client_balance_view')"
              class="flex flex-wrap items-center gap-x-2 gap-y-1 balance-dropdown-wrap"
            >
              <span class="text-xs">
                {{ $t('balance') }}:
                <span
                  v-if="shouldShowBalanceSelect"
                  class="relative inline-block"
                >
                  <button
                    type="button"
                    :class="['font-semibold', 'text-sm', 'cursor-pointer', 'flex', 'items-center', 'gap-1', 'pr-1', 'border-0', 'bg-transparent', 'hover:opacity-80', balanceColorClass(displayBalance)]"
                    @mousedown.prevent="showBalanceDropdown = !showBalanceDropdown"
                  >
                    {{ clientBalance }} {{ displayCurrencySymbol }}
                    <i
                      v-if="displayBalanceTypeIconClass"
                      :class="displayBalanceTypeIconClass"
                      class="text-xs"
                    />
                    <i class="fas fa-chevron-down text-[10px] opacity-70" />
                  </button>
                  <transition name="appear">
                    <ul
                      v-show="showBalanceDropdown"
                      class="absolute left-0 top-full z-20 mt-1 max-h-40 min-w-[120px] w-max max-w-[min(100vw-1.5rem,20rem)] overflow-y-auto rounded-lg border border-[var(--input-border)] bg-[var(--surface-elevated)] py-1 shadow-lg dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
                    >
                      <li
                        v-for="balance in selectedClient.balances"
                        :key="balance.id"
                        class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                        @mousedown.prevent="selectBalance(balance)"
                      >
                        <span class="flex min-w-0 flex-1 flex-wrap items-center gap-x-1">
                          <span :class="balanceColorClass(balance.balance)">{{ formatBalance(balance.balance) }}</span>
                          <span>{{ balance.currency?.symbol }}</span>
                        </span>
                        <span class="inline-flex shrink-0 items-center gap-0.5">
                          <i
                            v-if="balance.isDefault"
                            class="fas fa-star shrink-0 text-[10px] text-amber-500"
                            :title="$t('default')"
                          />
                          <i
                            v-if="balanceTypeIconClass(balance)"
                            :class="balanceTypeIconClass(balance)"
                            class="text-xs"
                          />
                        </span>
                      </li>
                    </ul>
                  </transition>
                </span>
                <span
                  v-else
                  :class="['font-semibold', 'text-sm', balanceColorClass(displayBalance)]"
                >
                  {{ clientBalance }} {{ displayCurrencySymbol }}
                  <i
                    v-if="displayBalanceTypeIconClass"
                    :class="displayBalanceTypeIconClass"
                    class="text-xs ml-1"
                  />
                </span>
                <span v-if="displayBalance > 0">({{ $t('clientOwesUs') }})</span>
                <span v-else-if="displayBalance < 0">({{ $t('weOweClient') }})</span>
                <span v-else>({{ $t('mutualSettlement') }})</span>
              </span>
            </div>
          </div>
          <button
            v-if="allowDeselect"
            class="text-red-500 text-2xl cursor-pointer"
            :disabled="disabled || clientSelectionDisabled"
            @click="deselectClient"
          >
            ×
          </button>
        </div>
      </div>
    </div>
    <SideModalDialog
      :show-form="modalCreateClient"
      :title="clientCreateModalTitle"
      :onclose="() => modalCreateClient = false"
      :level="3"
    >
      <ClientCreatePage
        :editing-item="null"
        :default-first-name="defaultClientName"
        @saved="onClientCreated"
        @saved-error="onClientCreatedError"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import ClientController from '@/api/ClientController';
import debounce from 'lodash.debounce';
import { getClientDisplayName as getClientName } from '@/utils/displayUtils';
import SideModalDialog, { sideModalCrudTitle } from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { formatNumber } from '@/utils/numberUtils';

const ClientCreatePage = defineAsyncComponent(() =>
    import('@/views/pages/clients/ClientCreatePage.vue')
);

export default {
    mixins: [notificationMixin, getApiErrorMessageMixin],
    components: {
        ClientCreatePage,
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
        clientSelectionDisabled: {
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
        /** Одна строка с input (фильтры), без блока карточки и без телефонов в списке */
        inlineSelected: {
            type: Boolean,
            default: false,
        },
        balanceId: {
            type: [Number, String, null],
            default: null,
        },
        skipFetchSelectedClientOnCreate: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['update:selectedClient', 'balance-changed'],
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
        clientCreateModalTitle() {
            return sideModalCrudTitle(this.$t.bind(this), {
                item: null,
                entityGenitiveKey: 'sideModalGenClient',
                entityNominativeKey: 'sideModalNomClient',
            });
        },
        clientDisplayName() {
            return getClientName(this.selectedClient);
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
            
            if (this.selectedBalanceId != null && this.selectedBalanceId !== '') {
                const selectedBalance = this.selectedClient.balances.find(
                    (b) => Number(b.id) === Number(this.selectedBalanceId)
                );
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
                return 0;
            }
            if (this.selectedClient.balances && this.selectedClient.balances.length > 0) {
                if (this.selectedBalanceId != null && this.selectedBalanceId !== '') {
                    const selectedBalance = this.selectedClient.balances.find(
                        (b) => Number(b.id) === Number(this.selectedBalanceId)
                    );
                    if (selectedBalance) {
                        return selectedBalance.balance || 0;
                    }
                }
                const defaultBalance = this.selectedClient.balances.find(b => b.isDefault);
                if (defaultBalance) {
                    return defaultBalance.balance || 0;
                }
                return this.selectedClient.balances[0]?.balance || 0;
            }
            return this.selectedClient.balance || 0;
        },
        selectedBalanceForDisplay() {
            if (!this.selectedClient?.balances?.length) {
                return null;
            }
            if (this.selectedBalanceId) {
                const selected = this.selectedClient.balances.find((b) => Number(b.id) === Number(this.selectedBalanceId));
                if (selected) {
                    return selected;
                }
            }
            return this.selectedClient.balances.find((b) => b.isDefault) || this.selectedClient.balances[0] || null;
        },
        displayBalanceTypeIconClass() {
            return this.balanceTypeIconClass(this.selectedBalanceForDisplay);
        },
        shouldShowBalanceSelect() {
            const hasPermission = this.$store.getters.hasPermission('settings_client_balance_view');
            const hasBalances = this.selectedClient?.balances && this.selectedClient.balances.length > 1;
            return hasPermission && hasBalances;
        }
    },
    async created() {
        await this.fetchLastClients();
        if (this.skipFetchSelectedClientOnCreate) {
            return;
        }
        const selectedClientId = Number(this.selectedClient?.id ?? this.selectedClient) || null;
        if (selectedClientId) {
            try {
                this.$emit(
                    'update:selectedClient',
                    await ClientController.getItem(selectedClientId)
                );
            } catch (error) {
                console.error('Ошибка при обновлении данных клиента:', error);
            }
        }
    },
    mounted() {
        document.addEventListener('click', this.handleBalanceDropdownClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleBalanceDropdownClickOutside);
    },
    methods: {
        getClientDisplayName(client) {
            return getClientName(client);
        },
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
                            const clientType = client.clientType;
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
            try {
                this.$emit(
                    'update:selectedClient',
                    await ClientController.getItem(client.id)
                );
            } catch (error) {
                console.error('Error selecting client:', error);
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
                                    const clientType = client.clientType;
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
        balanceTypeIconClass(balance) {
            if (!balance) {
                return '';
            }
            return Number(balance.type) === 1 ? 'fas fa-receipt text-emerald-600' : 'fas fa-cash-register text-indigo-600';
        },
        onBalanceChange() {
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
        applyBalanceSelection() {
            const rows = this.selectedClient?.balances;
            let next = null;
            if (rows?.length === 1) {
                next = Number(rows[0].id);
            } else if (rows?.length > 1) {
                const b = Number(this.balanceId);
                if (Number.isFinite(b) && rows.some((r) => Number(r.id) === b)) {
                    next = b;
                }
            }
            const same = (next == null && this.selectedBalanceId == null)
                || (next != null && this.selectedBalanceId != null && Number(next) === Number(this.selectedBalanceId));
            if (same) {
                return;
            }
            this.selectedBalanceId = next;
            this.$emit('balance-changed', next);
        },
    },
    watch: {
        selectedClient: {
            handler: 'applyBalanceSelection',
            deep: true,
            immediate: true,
        },
        balanceId: 'applyBalanceSelection',
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

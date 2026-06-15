<template>
  <div>
    <div
      v-if="selectedClient == null"
      class="relative"
    >
      <label
        v-if="showLabel"
        :class="['block', 'mb-1', { 'required': required }]"
      >{{ $t(labelKey) }}</label>
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
                  <ClientIconsCell
                    :client="client"
                    class="shrink-0"
                  />
                  <div class="min-w-0">
                    <div class="font-medium text-[var(--text-primary)]">
                      {{ getClientDisplayName(client) }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="!inlineSelected"
                  class="flex-shrink-0 text-[var(--color-info)] dark:text-[var(--label-accent)]"
                >
                  {{ formatClientPhone(client.phones?.[0]?.phone || client.primaryPhone) }}
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
                <ClientIconsCell
                  :client="client"
                  class="shrink-0"
                />
                <div class="min-w-0">
                  <div class="font-medium text-[var(--text-primary)]">
                    {{ getClientDisplayName(client) }}
                  </div>
                </div>
              </div>
              <div
                v-if="!inlineSelected"
                class="flex-shrink-0 text-[var(--color-info)] dark:text-[var(--label-accent)]"
              >
                {{ formatClientPhone(client.primaryPhone || client.phones?.[0]?.phone) }}
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
      >{{ $t(labelKey) }}</label>
      <div class="flex items-center gap-2">
        <input
          type="text"
          readonly
          class="min-w-0 w-full flex-1 rounded border border-[var(--input-border)] bg-[var(--input-bg)] p-2 text-[var(--text-primary)]"
          :class="canOpenClientEdit ? 'cursor-pointer text-[var(--label-accent)] hover:underline' : ''"
          :title="canOpenClientEdit ? $t('editClient') : undefined"
          :value="clientDisplayName"
          @dblclick="openEditClientModal"
        >
        <button
          v-if="allowDeselect"
          type="button"
          class="text-[var(--color-danger)] text-2xl cursor-pointer shrink-0 leading-none"
          :disabled="disabled || clientSelectionDisabled"
          @click="deselectClient"
        >
          ×
        </button>
      </div>
    </div>

    <div v-else>
      <label
        v-if="showLabel"
        :class="['block', 'mb-1', { required }]"
      >{{ $t(labelKey) }}</label>
      <div class="app-field-picker__selected">
        <div class="app-field-picker__selected-inner">
          <div class="app-field-picker__selected-body">
            <p
              class="app-field-picker__selected-line"
              :class="canOpenClientEdit ? 'w-fit max-w-full cursor-pointer text-[var(--label-accent)] no-underline hover:underline' : ''"
              :title="canOpenClientEdit ? $t('editClient') : undefined"
              @dblclick="openEditClientModal"
            >
              {{ clientDisplayName }}
            </p>
            <p
              class="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-[var(--text-primary)]"
            >
              <span>{{ $t('phone') }}:</span>
              <a
                v-if="selectedClientPhoneTelHref"
                :href="selectedClientPhoneTelHref"
                class="font-semibold text-sm text-[var(--label-accent)] no-underline hover:underline"
              >{{ selectedClientPhoneDisplay }}</a>
            </p>
            <div
              v-if="canViewClientBalanceInForm"
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
                    {{ clientBalance }} {{ displayCurrencyCode }}
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
                          <span>{{ balance.currency?.code }}</span>
                        </span>
                        <span class="inline-flex shrink-0 items-center gap-0.5">
                          <i
                            v-if="balance.isDefault"
                            class="fas fa-star shrink-0 text-[10px] text-[var(--color-warning)]"
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
                  {{ clientBalance }} {{ displayCurrencyCode }}
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
            type="button"
            class="app-field-picker__deselect"
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
    <SideModalDialog
      :show-form="modalEditClient"
      :title="clientEditModalTitle"
      :onclose="closeEditClientModal"
      :level="3"
    >
      <ClientCreatePage
        v-if="modalEditClient && clientEditingItem"
        :editing-item="clientEditingItem"
        @saved="onClientEdited"
        @saved-error="onClientEditedError"
        @deleted="onClientDeleted"
        @deleted-error="closeEditClientModal"
        @close-request="closeEditClientModal"
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
import { formatNumberForDisplay } from '@/utils/numberUtils';
import { clientBalancePaymentTypeIconClass, resolveInitialClientBalanceId } from '@/utils/clientBalanceCashUtils';
import { formatPhoneForDisplay, toTelHref } from '@/utils/phoneEmailFormUtils';
import ClientIconsCell from '@/views/components/app/buttons/ClientIconsCell.vue';

const ClientCreatePage = defineAsyncComponent(() =>
    import('@/views/pages/clients/ClientCreatePage.vue')
);

export default {
    mixins: [notificationMixin, getApiErrorMessageMixin],
    components: {
        ClientCreatePage,
        SideModalDialog,
        PrimaryButton,
        ClientIconsCell,
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
        labelKey: {
            type: String,
            default: 'client',
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
        autoSelectSingleBalance: {
            type: Boolean,
            default: true,
        },
        preferCurrencyId: {
            type: [Number, String, null],
            default: null,
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
            modalEditClient: false,
            clientEditingItem: null,
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
        clientEditModalTitle() {
            if (!this.modalEditClient) {
                return '';
            }
            return sideModalCrudTitle(this.$t.bind(this), {
                item: this.clientEditingItem,
                entityGenitiveKey: 'sideModalGenClient',
                entityNominativeKey: 'sideModalNomClient',
                getName: getClientName,
            });
        },
        canOpenClientEdit() {
            if (this.disabled || this.clientSelectionDisabled || !this.selectedClient?.id) {
                return false;
            }
            return this.$store.getters.hasPermission('clients_update');
        },
        clientDisplayName() {
            return getClientName(this.selectedClient);
        },
        clientBalance() {
            return formatNumberForDisplay(this.displayBalance, true);
        },
        clientPhones() {
            if (!this.selectedClient) return [];
            if (this.selectedClient.primaryPhone) {
                return [{ phone: this.selectedClient.primaryPhone }];
            }
            const phones = this.selectedClient.phones || [];
            return Array.isArray(phones) ? phones : [];
        },
        selectedClientPhoneRaw() {
            return this.clientPhones[0]?.phone || '';
        },
        selectedClientPhoneDisplay() {
            return formatPhoneForDisplay(this.selectedClientPhoneRaw);
        },
        selectedClientPhoneTelHref() {
            return toTelHref(this.selectedClientPhoneRaw);
        },
        defaultCurrencyCode() {
            if (!this.$store || !this.$store.state) return '';
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.code : '';
        },
        displayCurrencyCode() {
            return this.selectedBalanceForDisplay?.currency?.code || this.defaultCurrencyCode;
        },
        resolvedBalanceId() {
            const rows = this.selectedClient?.balances;
            if (!rows?.length) {
                return null;
            }
            const explicitId = (this.balanceId != null && this.balanceId !== '')
                ? this.balanceId
                : this.selectedBalanceId;
            return resolveInitialClientBalanceId(rows, {
                explicitBalanceId: explicitId,
                preferCurrencyId: this.preferCurrencyId,
            });
        },
        displayBalance() {
            if (!this.selectedClient) {
                return 0;
            }
            const rows = this.selectedClient.balances;
            if (!rows?.length) {
                return this.selectedClient.balance || 0;
            }
            const row = this.balanceRowByUiId() ?? this.balanceRowByResolvedId();
            if (row) {
                return row.balance || 0;
            }
            const defaultBalance = rows.find((b) => b.isDefault);
            if (defaultBalance) {
                return defaultBalance.balance || 0;
            }
            return rows[0]?.balance || 0;
        },
        selectedBalanceForDisplay() {
            const row = this.balanceRowByUiId() ?? this.balanceRowByResolvedId();
            if (row) {
                return row;
            }
            const rows = this.selectedClient?.balances;
            if (!rows?.length) {
                return null;
            }
            return rows.find((b) => b.isDefault) || rows[0] || null;
        },
        displayBalanceTypeIconClass() {
            return this.balanceTypeIconClass(this.selectedBalanceForDisplay);
        },
        canViewClientBalanceInForm() {
            return this.$store.getters.hasPermission('settings_client_balance_view')
                || this.$store.getters.hasPermission('settings_client_balance_view_own');
        },
        shouldShowBalanceSelect() {
            const hasBalances = this.selectedClient?.balances && this.selectedClient.balances.length > 1;
            return this.canViewClientBalanceInForm && hasBalances;
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
                const full = await ClientController.getItem(selectedClientId);
                await this.$store.dispatch('upsertClient', full);
                this.$emit('update:selectedClient', full);
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
        formatClientPhone(phone) {
            return formatPhoneForDisplay(phone) || '—';
        },
        balanceRowByUiId() {
            const rows = this.selectedClient?.balances;
            if (!rows?.length) {
                return null;
            }
            const id = (this.balanceId != null && this.balanceId !== '')
                ? this.balanceId
                : this.selectedBalanceId;
            if (id == null || id === '') {
                return null;
            }
            return rows.find((b) => Number(b.id) === Number(id)) || null;
        },
        balanceRowByResolvedId() {
            const rows = this.selectedClient?.balances;
            const resolvedId = this.resolvedBalanceId;
            if (!rows?.length || resolvedId == null) {
                return null;
            }
            return rows.find((b) => Number(b.id) === Number(resolvedId)) || null;
        },
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
        }, 1200),
        async selectClient(client) {
            this.showDropdown = false;
            this.clientSearch = '';
            this.clientResults = [];
            try {
                const full = await ClientController.getItem(client.id);
                await this.$store.dispatch('upsertClient', full);
                this.$emit('update:selectedClient', full);
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
        async openEditClientModal() {
            if (!this.canOpenClientEdit) {
                return;
            }
            const clientId = Number(this.selectedClient?.id);
            if (!clientId) {
                return;
            }
            try {
                this.clientEditingItem = await ClientController.getItem(clientId);
                this.modalEditClient = true;
            } catch (error) {
                console.error('Ошибка при загрузке клиента для редактирования:', error);
            }
        },
        closeEditClientModal() {
            this.modalEditClient = false;
            this.clientEditingItem = null;
        },
        async onClientEdited(updatedClient) {
            this.closeEditClientModal();
            const clientId = updatedClient?.id || updatedClient?.item?.id || this.selectedClient?.id;
            if (!clientId) {
                return;
            }
            try {
                const full = await ClientController.getItem(clientId);
                await this.$store.dispatch('upsertClient', full);
                this.$emit('update:selectedClient', full);
            } catch (error) {
                console.error('Ошибка при обновлении выбранного клиента:', error);
            }
        },
        onClientEditedError(error) {
            const errorMessages = this.getApiErrorMessage(error);
            const errorText = Array.isArray(errorMessages) ? errorMessages.join(', ') : errorMessages;
            this.showNotification(this.$t('errorSavingClient'), errorText, true);
        },
        onClientDeleted() {
            this.closeEditClientModal();
            this.deselectClient();
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
            return formatNumberForDisplay(balance, true);
        },
        balanceColorClass(value) {
            const v = value == null ? 0 : Number(value);
            return v === 0 ? 'text-[var(--color-info)]' : v > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]';
        },
        balanceTypeIconClass(balance) {
            if (!balance) {
                return '';
            }
            return clientBalancePaymentTypeIconClass(balance.type);
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
            if (this.autoSelectSingleBalance && rows?.length) {
                next = resolveInitialClientBalanceId(rows, {
                    explicitBalanceId: this.balanceId,
                    preferCurrencyId: this.preferCurrencyId,
                });
            } else if (this.balanceId != null && this.balanceId !== '') {
                const b = Number(this.balanceId);
                if (Number.isFinite(b) && rows?.some((r) => Number(r.id) === b)) {
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
            handler(newVal, oldVal) {
                if (Number(newVal?.id) !== Number(oldVal?.id)) {
                    this.selectedBalanceId = null;
                }
                this.applyBalanceSelection();
            },
            deep: true,
            immediate: true,
        },
        balanceId: 'applyBalanceSelection',
        preferCurrencyId: 'applyBalanceSelection',
        clientSearch: {
            handler: 'searchClients',
            immediate: true,
        },
        '$store.state.clients': {
            handler(newClients) {
                if (newClients && newClients.length > 0) {
                    this.updateLastClientsFromStore(newClients);
                    if (!this.selectedClient?.id) {
                        return;
                    }
                    const updated = newClients.find(
                        (c) => Number(c.id) === Number(this.selectedClient.id),
                    );
                    const prevLen = this.selectedClient?.balances?.length ?? 0;
                    const nextLen = updated?.balances?.length ?? 0;
                    if (updated && nextLen > prevLen) {
                        this.$emit('update:selectedClient', updated);
                    }
                }
            },
            immediate: true,
            deep: true,
        },
    },
};
</script>

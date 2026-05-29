<template>
    <div class="flex h-full min-h-0 flex-col">
        <div class="flex min-h-0 flex-1 flex-col overflow-auto p-4">
            <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
            <div>
                <div v-show="currentTab === 'info'">
                    <div class="mt-2">
                        <label class="block mb-1 required">{{ $t('contractFormat') }}</label>
                        <select v-model="status" :disabled="isContractActive">
                            <template v-if="isContractActive">
                                <option value="active">
                                    {{ $t('contractStatusActive') }}
                                </option>
                            </template>
                            <template v-else>
                                <option value="draft">
                                    {{ $t('contractStatusDraft') }}
                                </option>
                                <option value="active">
                                    {{ $t('contractStatusActive') }}
                                </option>
                            </template>
                        </select>
                    </div>
                    <div v-if="!projectId">
                        <ProjectSearch :selected-project="selectedProject" :project-id="selectedProjectId"
                            :client-id="contractClientId" :active-projects-only="true" :required="fieldsRequired"
                            :allow-deselect="false" @update:selected-project="onSelectedProjectUpdate" />
                    </div>
                    <div v-if="contractClientId && clientForSearch" class="mt-2">
                        <ClientSearch v-model:selected-client="clientForSearch" :balance-id="clientBalanceId"
                            :show-label="true" :required="false" :client-selection-disabled="true"
                            :allow-deselect="false" :skip-fetch-selected-client-on-create="true"
                            @balance-changed="onBalanceChanged" />
                    </div>
                    <div v-if="type === 0">
                        <label :class="{ required: fieldsRequired }">{{ $t('contractNumber') }}</label>
                        <input v-model="number" type="text" :placeholder="$t('enterContractNumber')"
                            :required="fieldsRequired">
                    </div>
                    <div>
                        <label :class="{ required: fieldsRequired }">{{ $t('date') }}</label>
                        <input v-model="date" type="date" :required="fieldsRequired">
                    </div>
                    <div class="flex items-center space-x-2 mt-2">
                        <div class="w-full">
                            <label :class="['block', 'mb-1', { required: fieldsRequired }]">{{ $t('contractType')
                                }}</label>
                            <select v-model="type" :disabled="clientBalanceSelected" :required="fieldsRequired">
                                <option :value="0">
                                    {{ $t('cashless') }}
                                </option>
                                <option :value="1">
                                    {{ $t('cash') }}
                                </option>
                            </select>
                        </div>
                        <div class="w-full">
                            <CashRegisterSelect v-model="cashId" :cash-registers="cashRegistersForForm"
                                :disabled="cashSelectDisabled" :required="fieldsRequired" />
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-full">
                            <label :class="{ required: fieldsRequired }">{{ $t('amount') }}</label>
                            <FormattedDecimalInput v-model="amount" variant="amount" amount-rounding-scope="contract"
                                min="0" :placeholder="$t('enterAmount')" :required="fieldsRequired" />
                        </div>
                        <div class="w-full">
                            <label :class="{ required: fieldsRequired }">{{ $t('currency') }}</label>
                            <select v-model="currencyId" :disabled="clientBalanceSelected">
                                <option value="">
                                    {{ $t('selectCurrency') }}
                                </option>
                                <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                                    {{ currency.symbol }} - {{ translateCurrency(currency.name, $t) }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label>{{ $t('note') }}</label>
                        <textarea v-model="note" :placeholder="$t('enterNote')" rows="3" />
                    </div>
                </div>
                <div v-show="currentTab === 'transactions'">
                    <template v-if="transactionsTabVisited">
                        <div v-if="isContractDraft" class="p-4 text-gray-500">
                            {{ $t('contractDraftTransactionsHint') }}
                        </div>
                        <ContractTransactionsTab v-else-if="editingItemId && isContractActive"
                            :contract-id="editingItemId" :client="contractClient" :project-id="effectiveProjectId"
                            :cash-id="cashId" :document-balance-id="clientBalanceId"
                            :contract-amount="parseFloat(amount) || 0"
                            :contract-paid-amount="paidTotalAmount"
                            :client-balances="contractTransactionTabBalances" @updated="$emit('refresh-contract')" />
                        <div v-else class="p-4 text-gray-500">
                            {{ $t('saveContractFirst') }}
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <teleport v-bind="sideModalFooterTeleportBind">
            <div class="flex w-full flex-wrap items-center justify-between gap-4 md:flex-nowrap">
                <div class="flex items-center gap-2">
                    <PrimaryButton v-if="editingItem != null && $store.getters.hasPermission('projects_delete')"
                        :onclick="showDeleteDialog" :is-danger="true" :is-loading="deleteLoading" icon="fas fa-trash" />
                    <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading"
                        :aria-label="$t('save')" />
                </div>
                <div v-if="editingItemId && isContractActive"
                    class="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-gray-800 dark:text-[var(--text-primary)] md:flex-nowrap">
                    <div>{{ $t('toPay') }}: <span class="font-bold">{{ formatCurrency(parseFloat(amount) || 0,
                        currencySymbol,
                            contractAmountDecimals, true) }}</span></div>
                    <div>{{ $t('paid') }}: <span class="font-bold">{{ formatCurrency(paidTotalAmount, currencySymbol,
                            contractAmountDecimals, true) }}</span></div>
                    <div>
                        {{ $t('total') }}: <span class="font-bold" :class="remainingAmountClass">{{
                            formatCurrency(remainingAmount, currencySymbol, contractAmountDecimals, true) }}</span>
                    </div>
                </div>
            </div>
        </teleport>
        <AlertDialog :dialog="deleteDialog" :descr="$t('deleteContract')" :confirm-text="$t('delete')"
            :leave-text="$t('cancel')" @confirm="deleteItem" @leave="closeDeleteDialog" />
        <AlertDialog :dialog="closeConfirmDialog" :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')"
            :leave-text="$t('stay')" @confirm="confirmClose" @leave="cancelClose" />
    </div>
</template>

<script>
import ProjectContractController from '@/api/ProjectContractController';
import ClientController from '@/api/ClientController';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProjectSearch from '@/views/components/app/search/ProjectSearch.vue';
import CashRegisterSelect from '@/views/components/app/forms/CashRegisterSelect.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import ContractTransactionsTab from '@/views/pages/projects/ContractTransactionsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import { formatCurrency, getAmountInputDecimalsForScope } from '@/utils/numberUtils';
import notificationMixin from "@/mixins/notificationMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { dateFormMixin } from '@/utils/dateUtils';
import storeDataLoaderMixin from "@/mixins/storeDataLoaderMixin";
import { translateCurrency } from '@/utils/translationUtils';
import {
    buildBalanceDefaultsPatch,
    findBalanceById,
    filterCashRegistersByClientBalance,
    applyBalanceDefaultsPatchToVm,
    loadClientBalancesForForm,
} from '@/utils/clientBalanceCashUtils';
import { balancesForDocumentPayment } from '@/utils/documentPaymentBalanceUtils';
import clientBalanceCashMixin from '@/mixins/clientBalanceCashMixin';
import projectSelectionMixin from '@/mixins/projectSelectionMixin';

export default {
    components: { PrimaryButton, AlertDialog, TabBar, ContractTransactionsTab, ClientSearch, ProjectSearch, CashRegisterSelect },
    mixins: [getApiErrorMessage, notificationMixin, crudFormMixin, dateFormMixin, storeDataLoaderMixin, sideModalFooterPortal, projectSelectionMixin, clientBalanceCashMixin],
    clientBalanceCashFields: {
        selectedBalanceId: 'clientBalanceId',
        allCashRegisters: 'cashRegisters',
    },
    props: {
        editingItem: {
            type: Object,
            default: null
        },
        projectId: {
            type: [String, Number],
            required: false,
            default: null
        },
        projectClientId: {
            type: [String, Number],
            default: null
        }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request', 'refresh-contract'],
    data() {
        const initialType = this.editingItem ? (this.editingItem.type !== undefined ? this.editingItem.type : 0) : 0;
        return {
            currentTab: 'info',
            transactionsTabVisited: false,
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'transactions', label: 'transactions' }
            ],
            number: this.editingItem ? this.editingItem.number : '',
            type: initialType,
            amount: this.editingItem ? this.editingItem.amount : '',
            currencyId: this.editingItem ? this.editingItem.currencyId : '',
            cashId: this.editingItem ? (this.editingItem.cashId) : '',
            clientBalanceId: this.editingItem?.clientBalanceId ?? null,
            date: this.editingItem?.date ? this.getDateOnly(this.editingItem.date) : this.getCurrentLocalDateTime().substring(0, 10),
            note: this.editingItem ? this.editingItem.note : '',
            status: this.editingItem?.status ?? 'draft',
            currencies: [],
            cashRegisters: [],
            clientBalances: [],
            projects: [],
            selectedProjectId: this.projectId || (this.editingItem ? this.editingItem.projectId : null),
            selectedProject: null,
            clientForSearch: null,
        };
    },
    computed: {
        contractAmountDecimals() {
            return getAmountInputDecimalsForScope('contract');
        },
        fieldsRequired() {
            return this.status === 'active';
        },
        isContractDraft() {
            return this.status === 'draft';
        },
        isContractActive() {
            return this.status === 'active';
        },
        currentContractClientId() {
            if (this.projectClientId != null && this.projectClientId !== '') {
                return Number(this.projectClientId);
            }
            if (this.editingItem?.clientId != null && this.editingItem.clientId !== '') {
                return Number(this.editingItem.clientId);
            }
            if (this.editingItem?.project?.client?.id != null && this.editingItem.project.client.id !== '') {
                return Number(this.editingItem.project.client.id);
            }
            return null;
        },
        effectiveProjectId() {
            return this.projectId || this.selectedProjectId || (this.editingItem?.projectId ?? null);
        },
        selectableProjects() {
            if (!this.editingItemId) {
                return this.projects;
            }
            const requiredClientId = this.currentContractClientId;
            const requiredCurrencyId = this.currencyId != null && this.currencyId !== '' ? Number(this.currencyId) : null;

            return this.projects.filter((project) => {
                const sameClient = requiredClientId == null || Number(project.clientId) === requiredClientId;
                if (!sameClient) {
                    return false;
                }
                if (requiredCurrencyId == null) {
                    return true;
                }
                return Number(project.currencyId) === requiredCurrencyId;
            });
        },
        contractClientId() {
            if (this.projectClientId != null && this.projectClientId !== '') {
                return this.projectClientId;
            }
            if (this.selectedProject?.clientId != null && this.selectedProject.clientId !== '') {
                return Number(this.selectedProject.clientId);
            }
            if (this.editingItem?.project?.client?.id) {
                return Number(this.editingItem.project.client.id);
            }
            if (this.editingItem?.clientId) {
                return Number(this.editingItem.clientId);
            }
            const pid = this.effectiveProjectId;
            if (!pid || !this.projects.length) {
                return null;
            }
            const p = this.projects.find((pr) => Number(pr.id) === Number(pid));
            return p?.clientId != null ? Number(p.clientId) : null;
        },
        contractClient() {
            if (this.clientForSearch) {
                return this.clientForSearch;
            }
            if (this.editingItem?.project?.client) {
                return this.editingItem.project.client;
            }
            const cid = this.contractClientId;
            if (cid) {
                return { id: cid, balances: this.clientBalances };
            }
            return null;
        },
        contractTransactionTabBalances() {
            return balancesForDocumentPayment(this.clientBalances, this.clientBalanceId);
        },
        paidTotalAmount() {
            return this.editingItem?.paidAmount ?? 0;
        },
        remainingAmount() {
            return (parseFloat(this.amount) || 0) - this.paidTotalAmount;
        },
        remainingAmountClass() {
            const remaining = this.remainingAmount;
            if (remaining > 0) return 'text-red-500 dark:text-red-400';
            if (remaining < 0) return 'text-green-500 dark:text-green-400';
            return 'text-gray-800 dark:text-[var(--text-primary)]';
        },
        translatedTabs() {
            const tabsToShow = this.editingItem ? this.tabs : this.tabs.filter(tab => tab.name !== 'transactions');
            return tabsToShow.map(tab => ({ ...tab, label: this.$t(tab.label) }));
        },
        currencySymbol() {
            const currency = this.currencies.find(c => c.id == this.currencyId);
            return currency?.symbol ?? '';
        },
        cashRegistersForForm() {
            if (this.clientBalanceSelected && this.selectedBalanceRecord) {
                return filterCashRegistersByClientBalance(this.selectedBalanceRecord, this.cashRegisters);
            }
            if (this.type === undefined || this.type === null) {
                return this.cashRegisters;
            }
            const contractTypeIsCash = this.type === 1;
            return this.cashRegisters.filter((cashRegister) => cashRegister.isCash === contractTypeIsCash);
        },
    },
    watch: {
        contractClientId: {
            async handler(newId) {
                await this.loadClientBalances(newId);
            },
            immediate: true,
        },
        selectedProjectId() {
            this.clientBalanceId = null;
            if (this.editingItemId && this.selectedProjectId) {
                const canUseProject = this.selectableProjects.some((project) => Number(project.id) === Number(this.selectedProjectId));
                if (!canUseProject) {
                    this.selectedProjectId = this.editingItem?.projectId || null;
                }
            }
        },
        type(newType) {
            if (newType === 1) {
                this.number = '';
            }
            if (this.selectedBalanceRecord && Number(this.selectedBalanceRecord.type) !== Number(newType)) {
                this.clientBalanceId = null;
            }
            if (this.cashId) {
                const selectedCashRegister = this.cashRegisters.find(cr => cr.id == this.cashId);
                if (selectedCashRegister) {
                    const contractTypeIsCash = newType === 1;
                    if (selectedCashRegister.isCash !== contractTypeIsCash) {
                        this.cashId = '';
                    }
                } else {
                    this.cashId = '';
                }
            }
        },
        cashId(newCashId) {
            if (newCashId && !this.clientBalanceSelected) {
                const cash = this.cashRegisters.find(c => c.id == newCashId);
                const cashCurrencyId = cash?.currencyId;
                if (cashCurrencyId) {
                    this.currencyId = cashCurrencyId;
                }
            }
        },
        cashRegisters: {
            handler(newVal) {
                if (newVal?.length && this.clientBalanceId) {
                    this.applyBalanceDefaults(this.clientBalanceId);
                }
            },
        },
    },
    async mounted() {
        await this.fetchCurrencies();
        await this.fetchCashRegisters();
        if (!this.projectId) {
            await this.fetchProjects();
        }
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    methods: {
        formatCurrency,
        translateCurrency,
        changeTab(tabName) {
            this.currentTab = tabName;
            if (tabName === 'transactions' && !this.transactionsTabVisited) {
                this.transactionsTabVisited = true;
            }
        },
        applyBalanceDefaults(balanceId) {
            if (this.editingItemId) {
                return null;
            }
            const balance = findBalanceById(this.transactionBalancesList, balanceId);
            if (!balance) {
                return null;
            }
            const curId = balance.currencyId ?? balance.currency?.id;
            if (curId != null) {
                this.currencyId = curId;
            }
            if (Number(balance.type) !== Number(this.type)) {
                this.type = Number(balance.type) === 0 ? 0 : 1;
            }
            const patch = buildBalanceDefaultsPatch({
                balanceId,
                balances: this.transactionBalancesList,
                allCashRegisters: this.cashRegisters,
                currentCashId: this.cashId,
                includePaymentType: false,
            });
            applyBalanceDefaultsPatchToVm(this, patch, this._clientBalanceCashFields);
            return patch;
        },
        onBalanceChanged(balanceId) {
            const value = balanceId == null || balanceId === '' ? null : balanceId;
            this.clientBalanceId = value;
            if (value) {
                this.applyBalanceDefaults(value);
            } else {
                this.cashId = '';
            }
        },
        async syncClientForSearch() {
            const id = this.contractClientId;
            if (!id) {
                this.clientForSearch = null;
                return;
            }
            let base = null;
            if (this.editingItem?.project?.client && Number(this.editingItem.project.client.id) === Number(id)) {
                base = { ...this.editingItem.project.client };
            } else {
                const p = this.projects.find(pr => Number(pr.id) === Number(this.effectiveProjectId));
                if (p?.client && Number(p.client.id) === Number(id)) {
                    base = { ...p.client };
                }
            }
            if (!base) {
                try {
                    base = await ClientController.getItem(id);
                } catch {
                    base = { id };
                }
            }
            this.clientForSearch = { ...base, balances: [...(this.clientBalances || [])] };
        },
        async loadClientBalances(clientId) {
            this.clientBalances = [];
            if (!clientId) {
                if (!this.editingItemId) {
                    this.clientBalanceId = null;
                }
                this.clientForSearch = null;
                return;
            }
            let baseClient = null;
            if (this.editingItem?.project?.client && Number(this.editingItem.project.client.id) === Number(clientId)) {
                baseClient = this.editingItem.project.client;
            } else {
                const p = this.projects.find((pr) => Number(pr.id) === Number(this.effectiveProjectId));
                if (p?.client && Number(p.client.id) === Number(clientId)) {
                    baseClient = p.client;
                }
            }
            this.clientBalances = await loadClientBalancesForForm(clientId, baseClient);
            if (!this.editingItemId && this.clientBalances.length > 0 && !this.clientBalanceId) {
                const def = this.clientBalances.find((b) => b.isDefault) || this.clientBalances[0];
                this.clientBalanceId = def?.id ?? null;
                if (this.clientBalanceId) {
                    this.applyBalanceDefaults(this.clientBalanceId);
                }
            } else if (this.clientBalanceId) {
                const exists = this.clientBalances.some((b) => Number(b.id) === Number(this.clientBalanceId));
                if (!exists) {
                    this.clientBalanceId = null;
                } else {
                    this.applyBalanceDefaults(this.clientBalanceId);
                }
            }
            await this.syncClientForSearch();
        },
        getDateOnly(date) {
            return this.getFormattedDate(date).substring(0, 10);
        },
        clearForm() {
            this.transactionsTabVisited = false;
            this.currentTab = 'info';
            this.number = '';
            this.type = 0;
            this.amount = '';
            this.currencyId = '';
            this.cashId = '';
            this.clientBalanceId = null;
            this.clientBalances = [];
            this.clientForSearch = null;
            this.date = this.getCurrentLocalDateTime().substring(0, 10);
            this.note = '';
            this.status = 'draft';
            this.selectedProjectId = this.projectId || null;
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                let formattedDate = this.getCurrentLocalDateTime().substring(0, 10);
                if (newEditingItem.date) {
                    formattedDate = this.getDateOnly(newEditingItem.date);
                }
                this.number = newEditingItem.number;
                this.type = newEditingItem.type !== undefined ? newEditingItem.type : 0;
                this.amount = newEditingItem.amount;
                this.currencyId = newEditingItem.currencyId;
                this.clientBalanceId = newEditingItem.clientBalanceId ?? null;

                const contractTypeIsCash = (newEditingItem.type !== undefined ? newEditingItem.type : 0) === 1;
                if (newEditingItem.cashId && this.cashRegisters.length > 0) {
                    const selectedCashRegister = this.cashRegisters.find(cr => cr.id == newEditingItem.cashId);
                    if (selectedCashRegister && selectedCashRegister.isCash !== contractTypeIsCash) {
                        this.cashId = '';
                    } else {
                        this.cashId = newEditingItem.cashId;
                    }
                } else {
                    this.cashId = newEditingItem.cashId;
                }

                this.date = formattedDate;
                this.note = newEditingItem.note;
                this.status = newEditingItem.status ?? 'draft';
                this.selectedProjectId = newEditingItem.projectId || null;
            }
        },
        getFormState() {
            return {
                status: this.status,
                number: this.number,
                type: this.type,
                amount: this.amount,
                currencyId: this.currencyId,
                cashId: this.cashId,
                clientBalanceId: this.clientBalanceId,
                date: this.date,
                note: this.note
            };
        },
        async fetchCurrencies() {
            await this.loadStoreData({
                getterName: 'currencies',
                dispatchName: 'loadCurrencies',
                localProperty: 'currencies',
                defaultValue: []
            });
        },
        async fetchProjects() {
            await this.loadStoreData({
                getterName: 'activeProjects',
                dispatchName: 'loadProjects',
                localProperty: 'projects',
                defaultValue: []
            });
        },
        async fetchCashRegisters() {
            await this.loadStoreData({
                getterName: 'cashRegisters',
                dispatchName: 'loadCashRegisters',
                localProperty: 'cashRegisters',
                defaultValue: []
            });
        },
        prepareSave() {
            const formData = {
                projectId: this.projectId || this.selectedProjectId || this.editingItem?.projectId,
                clientId: this.contractClientId,
                number: this.number,
                type: this.type,
                amount: this.amount,
                currencyId: this.currencyId,
                cashId: this.cashId,
                clientBalanceId: this.clientBalanceId,
                date: this.date,
                note: this.note,
                status: this.status,
            };

            const selectedCurrency = this.currencies.find(c => c.id == formData.currencyId);
            if (selectedCurrency) {
                formData.currencyName = this.translateCurrency(selectedCurrency.name, this.$t);
                formData.currencySymbol = selectedCurrency.symbol;
            }

            return formData;
        },
        async performSave(data) {
            if (this.editingItemId) {
                return await ProjectContractController.updateItem(this.editingItemId, data);
            } else {
                const finalProjectId = this.projectId || this.selectedProjectId;
                return await ProjectContractController.storeItem(finalProjectId, data);
            }
        },
        async performDelete() {
            const response = await ProjectContractController.deleteItem(this.editingItemId);
            if (!response.message) {
                throw new Error('Failed to delete contract');
            }
            return response;
        },
        onSaveSuccess(response) {
            this.$emit('saved', response.item);
            this.showNotification('Успех', response.message || 'Контракт успешно сохранен', false);
            if (!this.editingItemId) {
                this.clearForm();
            }
        },
        onDeleteSuccess() {
            this.showNotification('Успех', 'Контракт успешно удален', false);
        },
        handleCloseRequest() {
            this.$emit('close-request');
        }
    }
};
</script>

<template>
    <div class="h-full flex flex-col">
        <div class="flex flex-col overflow-auto flex-1 p-4 pb-24">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editContract') : $t('addContract') }}</h2>
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
        <div>
            <div v-show="currentTab === 'info'">
            <div v-if="!projectId">
                <label class="required">{{ $t('project') }}</label>
                <select v-model="selectedProjectId" :disabled="!!editingItem" required>
                    <option :value="null"></option>
                    <option v-for="project in projects" :key="project.id" :value="project.id">
                        {{ project.name }}
                    </option>
                </select>
            </div>
            <div v-if="type === 0">
                <label class="required">{{ $t('contractNumber') }}</label>
                <input type="text" v-model="number" :placeholder="$t('enterContractNumber')" required>
            </div>
            <div>
                <label class="required">{{ $t('date') }}</label>
                <input type="date" v-model="date" required>
            </div>
            <div>
                <label class="required">{{ $t('contractType') }}</label>
                <select v-model="type" required>
                    <option :value="0">{{ $t('cashless') }}</option>
                    <option :value="1">{{ $t('cash') }}</option>
                </select>
            </div>
            <div>
                <label class="required">{{ $t('cashRegister') }}</label>
                <select v-model="cashId" required>
                    <option value="">{{ $t('selectCashRegister') }}</option>
                    <option v-for="cashRegister in filteredCashRegisters" :key="cashRegister.id" :value="cashRegister.id">
                        {{ cashRegister.name }} ({{ cashRegister.currencySymbol || '' }})
                    </option>
                </select>
            </div>
            <div class="flex items-center space-x-2">
                <div class="w-full">
                    <label class="required">{{ $t('amount') }}</label>
                    <input type="number" v-model="amount" step="0.01" min="0" :placeholder="$t('enterAmount')" required>
                </div>
                <div class="w-full">
                    <label class="required">{{ $t('currency') }}</label>
                    <select v-model="currencyId">
                        <option value="">{{ $t('selectCurrency') }}</option>
                        <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                            {{ currency.symbol }} - {{ translateCurrency(currency.name, $t) }}
                        </option>
                    </select>
                </div>
            </div>
            <div>
                <label>{{ $t('note') }}</label>
                <textarea v-model="note" :placeholder="$t('enterNote')" rows="3"></textarea>
            </div>
            </div>
            <div v-show="currentTab === 'transactions'">
                <template v-if="transactionsTabVisited">
                    <ContractTransactionsTab v-if="editingItemId" :contract-id="editingItemId" :client="contractClient"
                        :project-id="effectiveProjectId" :cash-id="cashId" @updated="$emit('refresh-contract')" />
                    <div v-else class="p-4 text-gray-500">
                        {{ $t('saveContractFirst') }}
                    </div>
                </template>
            </div>
        </div>
        </div>
        <div class="fixed bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap border-t border-gray-200 z-10">
        <div class="flex items-center gap-2">
            <PrimaryButton v-if="editingItem != null && $store.getters.hasPermission('projects_delete')"
                :onclick="showDeleteDialog" :is-danger="true" :is-loading="deleteLoading" icon="fas fa-trash">
            </PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :aria-label="$t('save')">
            </PrimaryButton>
        </div>
        <div v-if="editingItemId" class="text-sm text-gray-700 flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium">
            <div>{{ $t('toPay') }}: <span class="font-bold">{{ formatCurrency(parseFloat(amount) || 0, currencySymbol, 2, true) }}</span></div>
            <div>{{ $t('paid') }}: <span class="font-bold">{{ formatCurrency(paidTotalAmount, currencySymbol, 2, true) }}</span></div>
            <div>{{ $t('total') }}: <span class="font-bold" :class="remainingAmountClass">{{ formatCurrency(remainingAmount, currencySymbol, 2, true) }}</span></div>
        </div>
        </div>
        <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('deleteContract')"
            :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
        <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
            :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
    </div>
</template>

<script>
import ProjectContractController from '@/api/ProjectContractController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import ContractTransactionsTab from '@/views/pages/projects/ContractTransactionsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import { formatCurrency } from '@/utils/numberUtils';
import formChangesMixin from "@/mixins/formChangesMixin";
import notificationMixin from "@/mixins/notificationMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import dateFormMixin from "@/mixins/dateFormMixin";
import storeDataLoaderMixin from "@/mixins/storeDataLoaderMixin";
import { translateCurrency } from '@/utils/translationUtils';

export default {
    mixins: [getApiErrorMessage, formChangesMixin, notificationMixin, crudFormMixin, dateFormMixin, storeDataLoaderMixin],
    components: { PrimaryButton, AlertDialog, TabBar, ContractTransactionsTab },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request', 'refresh-contract'],
    props: {
        editingItem: {
            type: Object,
            default: null
        },
        projectId: {
            type: [String, Number],
            required: false,
            default: null
        }
    },
    computed: {
        effectiveProjectId() {
            return this.projectId || this.selectedProjectId || (this.editingItem?.projectId ?? null);
        },
        contractClient() {
            return this.editingItem?.project?.client ?? null;
        },
        paidTotalAmount() {
            return this.editingItem?.paidAmount ?? this.editingItem?.paid_amount ?? 0;
        },
        remainingAmount() {
            return (parseFloat(this.amount) || 0) - this.paidTotalAmount;
        },
        remainingAmountClass() {
            const remaining = this.remainingAmount;
            if (remaining > 0) return 'text-red-500';
            if (remaining < 0) return 'text-green-500';
            return 'text-gray-700';
        },
        translatedTabs() {
            const tabsToShow = this.editingItem ? this.tabs : this.tabs.filter(tab => tab.name !== 'transactions');
            return tabsToShow.map(tab => ({ ...tab, label: this.$t(tab.label) }));
        },
        currencySymbol() {
            const currency = this.currencies.find(c => c.id == this.currencyId);
            return currency?.symbol ?? '';
        },
        filteredCashRegisters() {
            if (this.type === undefined || this.type === null) {
                return this.cashRegisters;
            }
            const contractTypeIsCash = this.type === 1;
            return this.cashRegisters.filter(cashRegister => {
                return cashRegister.isCash === contractTypeIsCash;
            });
        }
    },
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
            cashId: this.editingItem ? (this.editingItem.cashId || '') : '',
            date: this.editingItem?.date ? this.getDateOnly(this.editingItem.date) : this.getCurrentLocalDateTime().substring(0, 10),
            note: this.editingItem ? this.editingItem.note : '',
            currencies: [],
            cashRegisters: [],
            projects: [],
            selectedProjectId: this.projectId || (this.editingItem ? this.editingItem.projectId : null),
        };
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
    watch: {
        type(newType) {
            if (newType === 1) {
                this.number = '';
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
            if (newCashId) {
                const cash = this.cashRegisters.find(c => c.id == newCashId);
                const cashCurrencyId = cash?.currencyId ?? cash?.currency_id;
                if (cashCurrencyId) {
                    this.currencyId = cashCurrencyId;
                }
            }
        }
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
            this.date = this.getCurrentLocalDateTime().substring(0, 10);
            this.note = '';
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
                this.number = newEditingItem.number || '';
                this.type = newEditingItem.type !== undefined ? newEditingItem.type : 0;
                this.amount = newEditingItem.amount || '';
                this.currencyId = newEditingItem.currencyId || '';
                
                const contractTypeIsCash = (newEditingItem.type !== undefined ? newEditingItem.type : 0) === 1;
                if (newEditingItem.cashId && this.cashRegisters.length > 0) {
                    const selectedCashRegister = this.cashRegisters.find(cr => cr.id == newEditingItem.cashId);
                    if (selectedCashRegister && selectedCashRegister.isCash !== contractTypeIsCash) {
                        this.cashId = '';
                    } else {
                        this.cashId = newEditingItem.cashId || '';
                    }
                } else {
                    this.cashId = newEditingItem.cashId || '';
                }
                
                this.date = formattedDate;
                this.note = newEditingItem.note || '';
                this.selectedProjectId = newEditingItem.projectId || null;
            }
        },
        getFormState() {
            return {
                number: this.number,
                type: this.type,
                amount: this.amount,
                currencyId: this.currencyId,
                cashId: this.cashId,
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
                projectId: (this.editingItemId && this.editingItem) ? this.editingItem.projectId : (this.projectId || this.selectedProjectId),
                number: this.number,
                type: this.type,
                amount: this.amount,
                currencyId: this.currencyId,
                cashId: this.cashId,
                date: this.date,
                note: this.note
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

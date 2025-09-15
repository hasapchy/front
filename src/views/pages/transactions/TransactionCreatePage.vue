<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editTransaction') : $t('createTransaction') }}</h2>
        <ClientSearch v-model:selectedClient="selectedClient" :disabled="!!editingItemId" />
        <div>
            <label>{{ $t('date') }}</label>
            <input type="datetime-local" v-model="date"
                :disabled="editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 16) : null" />
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('type') }}</label>
            <select v-model="type" :disabled="!!editingItemId" required>
                <option value="">{{ $t('selectType') }}</option>
                <option value="income">✅ {{ $t('income') }}</option>
                <option value="outcome">🔺 {{ $t('outcome') }}</option>
            </select>
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
                          <select v-model="cashId" :disabled="!!editingItemId" required>
                  <option value="">{{ $t('no') }}</option>
                <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id">
                    {{ parent.name }} ({{ parent.currency_symbol || parent.currency_code || '' }})
                </option>
            </select>
        </div>
        <div class="flex items-center space-x-2">
            <div class="w-full mt-2">
                <label class="required">{{ $t('amountBeforeConversion') }}</label>
                <input type="number" v-model="origAmount" required min="0.01">
            </div>
            <div class="w-full mt-2">
                <label class="block mb-1 required">{{ $t('currency') }}</label>
                <select v-model="currencyIdComputed" required :disabled="!!editingItemId">
                    <option value="">{{ $t('no') }}</option>
                    <template v-if="currencies.length">
                        <option v-for="parent in currencies" :key="parent.id" :value="parent.id">
                            {{ parent.symbol }} - {{ parent.name }}
                        </option>
                    </template>
                </select>
            </div>
        </div>
        <div v-if="cashCurrencyId != currencyId && editingItemId" class="flex items-center space-x-2">
            <div class="w-full mt-2">
                <label>{{ $t('amountAfterConversion') }}</label>
                <input type="number" v-model="cashAmount" :readonly="true" :disabled="true">
            </div>
            <div class="w-full mt-2">
                <label class="block mb-1">{{ $t('cashCurrency') }}</label>
                <select v-model="cashCurrencyId" :disabled="true" readonly>
                    <option value="">{{ $t('no') }}</option>
                    <template v-if="currencies.length">
                        <option v-for="parent in currencies" :key="parent.id" :value="parent.id">
                            {{ parent.symbol }} -
                            {{ parent.name }}
                        </option>
                    </template>
                </select>
            </div>
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('category') }}</label>
            <select v-model="categoryId">
                <option value="">{{ $t('no') }}</option>
                <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                    {{ cat.typeClass() }} {{ cat.name }}
                </option>
            </select>
        </div>
        <div class="mt-2">
            <label class="block mb-1">{{ $t('project') }}</label>
            <select v-model="projectId">
                <option value="">{{ $t('no') }}</option>
                <template v-if="allProjects.length">
                    <option v-for="parent in allProjects" :key="parent.id" :value="parent.id">{{ parent.name }}</option>
                </template>
            </select>
        </div>
        <div class="mt-2">
            <label>{{ $t('note') }}</label>
            <input type="text" v-model="note" />
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('transactions_delete')">
        </PrimaryButton>
        <PrimaryButton v-if="editingItem != null" :onclick="copyTransaction" icon="fas fa-copy"
            :disabled="!$store.getters.hasPermission('transactions_create')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('transactions_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('transactions_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteTransaction')" :confirm-text="$t('deleteTransaction')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>


<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ProjectController from '@/api/ProjectController';
import TransactionDto from '@/dto/transaction/TransactionDto';
import ClientDto from '@/dto/client/ClientDto';
import AppController from '@/api/AppController';
import CashRegisterController from '@/api/CashRegisterController';
import TransactionController from '@/api/TransactionController';
import ClientController from '@/api/ClientController';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";


export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request", 'copy-transaction'],
    components: { PrimaryButton, AlertDialog, ClientSearch },
    props: {
        editingItem: { type: TransactionDto, required: false, default: null },
        initialClient: { type: ClientDto, default: null },
        initialProjectId: { type: [String, Number, null], default: null },
        orderId: { type: [String, Number], required: false },
        defaultCashId: { type: Number, default: null, required: false }
    },
    data() {
        return {
            type: this.editingItem ? this.editingItem.typeName() : "income",
            cashId: this.editingItem ? (this.editingItem.cashId || this.defaultCashId || '') : '',
            cashAmount: this.editingItem ? this.editingItem.cashAmount : null,
            cashCurrencyId: this.editingItem ? this.editingItem.cashCurrencyId : null,
            origAmount: this.editingItem ? this.editingItem.origAmount : 0,
            currencyId: this.editingItem ? this.editingItem.origCurrencyId : '',
            categoryId: this.editingItem ? this.editingItem.categoryId : 4, // По умолчанию id = 4 для типа income
            projectId: this.editingItem ? this.editingItem.projectId : '',
            date: this.editingItem ? this.editingItem.date.substring(0, 16) : new Date().toISOString().substring(0, 16),
            note: this.editingItem ? this.editingItem.note : '',
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            currencies: [],
            allCategories: [],
            allProjects: [],
            allCashRegisters: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,

        }
    },
    computed: {
        currencyIdComputed: {
            get() {
                return this.currencyId;
            },
            set(val) {
                this.currencyId = val;
            }
        },
        filteredCategories() {
            const wanted = this.type === 'income' ? 1 : 0;
            return this.allCategories.filter(cat => cat.type === wanted);
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllCategories(),
                this.fetchAllProjects(),
                this.fetchAllCashRegisters()
            ]);
            
            if (!this.editingItem) {
                if (this.initialClient) {
                    this.selectedClient = this.initialClient;
                }
                if (this.initialProjectId) {
                    this.projectId = this.initialProjectId;
                }
            }
            
            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                selectedClient: this.selectedClient?.id || null,
                type: this.type,
                origAmount: this.origAmount,
                date: this.date,
                note: this.note,
                categoryId: this.categoryId,
                cashId: this.cashId,
                currencyId: this.currencyIdComputed,
                projectId: this.projectId
            };
        },
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async fetchAllCategories() {
            this.allCategories = await AppController.getTransactionCategories();
        },
        async fetchAllProjects() {
            // Получаем только проекты, к которым у пользователя есть доступ
            this.allProjects = await ProjectController.getAllItems();
        },
        async fetchAllCashRegisters() {
            this.allCashRegisters = await CashRegisterController.getAllItems();
            if (this.allCashRegisters.length && !this.cashId && !this.defaultCashId) {
                this.cashId = this.allCashRegisters[0].id;
            }
        },
        async save() {
            this.saveLoading = true;

            try {
                if (this.editingItemId != null) {
                    var resp = await TransactionController.updateItem(
                        this.editingItemId,
                        {
                            category_id: this.categoryId,
                            project_id: this.projectId,
                            date: this.date,
                            client_id: this.selectedClient?.id,
                            orig_amount: this.origAmount,
                            currency_id: this.currencyIdComputed,
                            note: this.note
                        });
                } else {
                    var resp = await TransactionController.storeItem({
                        type: this.type == "income" ? 1 : this.type == "outcome" ? 0 : null,
                        cash_id: this.cashId,
                        orig_amount: this.origAmount,
                        currency_id: this.currencyIdComputed,
                        category_id: this.categoryId,
                        note: this.note,
                        project_id: this.projectId,
                        date: this.date,
                        client_id: this.selectedClient?.id,
                        order_id: this.orderId
                    });
                }
                if (resp.message) {
                    if (this.selectedClient) {
                        await this.updateClientBalance();
                    }
                    this.$emit('saved', resp)
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }
            this.saveLoading = false;

        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (this.editingItemId == null) {
                return;
            }
            this.deleteLoading = true;
            try {
                var resp = await TransactionController.deleteItem(this.editingItemId);
                if (resp.message || resp.success || resp) {
                    if (this.selectedClient) {
                        await this.updateClientBalance();
                    }
                    this.$emit('deleted');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.type = "income";
            this.cashId = this.allCashRegisters.length ? this.allCashRegisters[0].id : '';
            this.origAmount = 0;
            this.note = '';
            this.categoryId = 4; // Устанавливаем id = 4 для типа income по умолчанию
            this.projectId = this.initialProjectId || '';
            this.date = new Date().toISOString().substring(0, 16);
            this.selectedClient = this.initialClient || null;
            this.editingItemId = null;
            this.resetFormChanges(); // Сбрасываем состояние изменений
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        async updateClientBalance() {
            if (this.selectedClient && this.selectedClient.id) {
                try {
                    const updatedClient = await ClientController.getItem(this.selectedClient.id);
                    this.selectedClient = updatedClient;
                } catch (error) {
                    console.error('Ошибка при обновлении баланса клиента:', error);
                }
            }
        },
        copyTransaction() {
            // Создаем новый экземпляр TransactionDto из текущей транзакции
            const copiedTransaction = new TransactionDto(
                null, // id - убираем ID, чтобы создать новую запись
                this.editingItem.type,
                this.editingItem.isTransfer,
                this.editingItem.isSale,
                this.editingItem.isReceipt,
                this.editingItem.cashId,
                this.editingItem.cashName,
                this.editingItem.cashAmount,
                this.editingItem.cashCurrencyId,
                this.editingItem.cashCurrencyName,
                this.editingItem.cashCurrencyCode,
                this.editingItem.cashCurrencySymbol,
                this.editingItem.origAmount,
                this.editingItem.origCurrencyId,
                this.editingItem.origCurrencyName,
                this.editingItem.origCurrencyCode,
                this.editingItem.origCurrencySymbol,
                this.editingItem.userId,
                this.editingItem.userName,
                this.editingItem.categoryId,
                this.editingItem.categoryName,
                this.editingItem.categoryType,
                this.editingItem.projectId,
                this.editingItem.projectName,
                this.editingItem.clientId,
                this.editingItem.client,
                this.editingItem.note,
                this.editingItem.date,
                this.editingItem.createdAt,
                this.editingItem.updatedAt,
                this.editingItem.orders
            );
            
            // Эмитим событие для открытия нового модального окна с копированными данными
            this.$emit('copy-transaction', copiedTransaction);
        }
    },
    watch: {
        defaultCashId: {
            handler(i) {
                this.cashId = this.defaultCashId;
            },
            immediate: true
        },
        initialProjectId: {
            handler(newProjectId) {
                if (!this.editingItemId && newProjectId) {
                    this.projectId = newProjectId;
                }
            },
            immediate: true
        },
        initialClient: {
            handler(newClient) {
                if (!this.editingItemId && newClient) {
                    this.selectedClient = newClient;
                }
            },
            immediate: true
        },
        cashId(newCashId) {
            // При создании новой транзакции автоматически выбираем валюту кассы
            if (!this.editingItemId && newCashId) {
                const cash = this.allCashRegisters.find(c => c.id === newCashId);
                if (cash?.currency_id) {
                    this.currencyId = cash.currency_id;
                }
            }
        },
        type(newType) {
            if (!this.editingItemId) {
                if (newType === "income") {
                    this.categoryId = 4; // Устанавливаем id = 4 для типа income
                } else if (newType === "outcome") {
                    this.categoryId = 16;
                } else {
                    this.categoryId = "";
                }
            }
        },
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.type = newEditingItem.typeName() || "income";
                    this.cashId = newEditingItem.cashId || this.defaultCashId || '';
                    this.cashAmount = newEditingItem.cashAmount || null;
                    this.cashCurrencyId = newEditingItem.cashCurrencyId || null;
                    this.note = newEditingItem.note || '';
                    this.origAmount = newEditingItem.origAmount || 0;
                    this.currencyId = newEditingItem.origCurrencyId || '';
                    this.categoryId = newEditingItem.categoryId || '';
                    this.projectId = newEditingItem.projectId || '';
                    this.date = newEditingItem.date || new Date().toISOString().substring(0, 16);
                    this.selectedClient = newEditingItem.client || null;
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    // При создании новой транзакции устанавливаем значения по умолчанию
                    this.type = "income";
                    this.cashId = this.defaultCashId || (this.allCashRegisters.length ? this.allCashRegisters[0].id : '');
                    const selectedCash = this.allCashRegisters.find(cash => cash.id == this.cashId);
                    this.cashAmount = null;
                    this.cashCurrencyId = null;
                    this.origAmount = 0;
                    this.currencyId = selectedCash?.currency_id || '';
                    this.categoryId = 4; // Устанавливаем id = 4 для типа income по умолчанию
                    this.projectId = this.initialProjectId || '';
                    this.date = new Date().toISOString().substring(0, 16);
                    this.selectedClient = this.initialClient || null;
                    this.editingItemId = null;
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        },
    }
}
</script>
<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editTransaction') : $t('createTransaction') }}</h2>
        <div v-if="isDebt" class="mb-2">
            <label class="required">{{ $t('client') }}</label>
        </div>
        <ClientSearch v-model:selectedClient="selectedClient" :showLabel="false" />
        <div>
            <label>{{ $t('date') }}</label>
            <input type="datetime-local" v-model="date"
                :disabled="editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 16) : null" />
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('type') }}</label>
            <select v-model="type" :disabled="!!editingItemId || !!orderId" required>
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
        <div class="mt-2">
            <label class="inline-flex items-center">
                <input 
                    type="checkbox" 
                    v-model="isDebt" 
                    @change="handleDebtChange"
                    :disabled="!!editingItemId || !!orderId || forceDebt"
                />
                <span class="ml-2">{{ $t('credit') }}</span>
            </label>
        </div>
        <div class="flex items-center space-x-2">
            <div class="w-full mt-2">
                <label class="required">{{ $t('amountBeforeConversion') }}</label>
                <input type="number" v-model="origAmount" required :min="minAmount || 0.01" 
                       :title="minAmount ? `${$t('minimumAmount')}: ${minAmount}` : ''">
            </div>
            <div class="w-full mt-2">
                <label class="block mb-1 required">{{ $t('currency') }}</label>
                <select v-model="currencyIdComputed" required :disabled="!!editingItemId || !$store.getters.hasPermission('settings_currencies_view')">
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
            <select v-model="categoryId" :disabled="adjustmentMode">
                <option value="">{{ $t('no') }}</option>
                <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                    {{ cat.type ? '✅' : '🔺' }} {{ cat.name }}
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
        <div class="mt-2">
            <SourceSearch 
                v-model:selectedSource="selectedSource" 
                v-model:sourceType="sourceType"
                :showLabel="true"
                :disabled="!!editingItemId && !!orderId"
            />
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
import TransactionCategoryController from '@/api/TransactionCategoryController';
import ClientController from '@/api/ClientController';
import OrderController from '@/api/OrderController';
import SaleController from '@/api/SaleController';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import OrderStatusController from '@/api/OrderStatusController';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import SourceSearch from '@/views/components/app/search/SourceSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";


export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request", 'copy-transaction'],
    components: { PrimaryButton, AlertDialog, ClientSearch, SourceSearch },
    props: {
        editingItem: { type: TransactionDto, required: false, default: null },
        initialClient: { type: ClientDto, default: null },
        initialProjectId: { type: [String, Number, null], default: null },
        orderId: { type: [String, Number], required: false },
        defaultCashId: { type: Number, default: null, required: false },
        // Новые флаги управления режимом долга и обязательностью примечания
        forceDebt: { type: Boolean, default: false },
        requireNote: { type: Boolean, default: false },
        // Режим корректировки баланса - автоматически выбирает категорию "Корректировка остатка"
        adjustmentMode: { type: Boolean, default: false },
        // Для корректировки: 0 - уменьшить баланс (расход), 1 - увеличить баланс (приход)
        adjustmentType: { type: Number, default: 0 },
        // Предзаполненная сумма для оплаты заказа
        prefillAmount: { type: [Number, String], default: null },
        // Минимальная сумма оплаты
        minAmount: { type: [Number, String], default: null },
        // Флаг модалки оплаты заказа
        isPaymentModal: { type: Boolean, default: false }
    },
    data() {
        return {
            // Для заказов всегда тип "income" и не долговая
            type: this.orderId ? "income" : (this.editingItem ? this.editingItem.typeName() : "income"),
            cashId: this.editingItem ? (this.editingItem.cashId || this.defaultCashId || '') : (this.defaultCashId || ''),
            cashAmount: this.editingItem ? this.editingItem.cashAmount : null,
            cashCurrencyId: this.editingItem ? this.editingItem.cashCurrencyId : null,
            origAmount: this.editingItem ? this.editingItem.origAmount : (this.prefillAmount != null && this.prefillAmount !== '' ? parseFloat(this.prefillAmount) || 0 : 0),
            currencyId: this.editingItem ? this.editingItem.origCurrencyId : '',
            categoryId: this.editingItem ? this.editingItem.categoryId : 4, // По умолчанию id = 4 для типа income
            projectId: this.editingItem ? this.editingItem.projectId : (this.initialProjectId || ''),
            date: (() => {
                if (this.editingItem && this.editingItem.date) {
                    // Если date является строкой
                    if (typeof this.editingItem.date === 'string') {
                        return this.editingItem.date.substring(0, 16);
                    }
                    // Если date является объектом Date
                    if (this.editingItem.date instanceof Date) {
                        return this.editingItem.date.toISOString().substring(0, 16);
                    }
                    // Если date является объектом с методом toISOString
                    if (this.editingItem.date.toISOString && typeof this.editingItem.date.toISOString === 'function') {
                        return this.editingItem.date.toISOString().substring(0, 16);
                    }
                }
                return new Date().toISOString().substring(0, 16);
            })(),
            note: this.editingItem ? this.editingItem.note : '',
            // Для заказов всегда false (не долговая)
            isDebt: this.orderId ? false : (this.editingItem ? this.editingItem.isDebt : (this.forceDebt ? true : false)),
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? (this.editingItem.client || this.initialClient) : this.initialClient,
            selectedSource: null,
            sourceType: '',
            currencies: [],
            allCategories: [],
            allCashRegisters: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            orderInfo: null,

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
            const wanted = this.type === 'income' ? 1 : 0; // 1 для income, 0 для outcome
            const filtered = this.allCategories.filter(cat => cat.type === wanted);
            return filtered;
        },
        allProjects() {
            // ✅ Берем напрямую из Store - автоматически обновляется при изменениях
            const activeProjects = this.$store.getters.activeProjects || [];
            
            // Если редактируем транзакцию и у неё есть проект, который завершен (его нет в activeProjects),
            // добавляем его в список опций
            if (this.editingItem && this.editingItem.projectId && this.editingItem.projectName) {
                const hasProject = activeProjects.some(p => p.id === this.editingItem.projectId);
                if (!hasProject) {
                    // Проект завершен, добавляем его вручную
                    return [
                        ...activeProjects,
                        { id: this.editingItem.projectId, name: this.editingItem.projectName }
                    ];
                }
            }
            
            return activeProjects;
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllCategories(),
                this.fetchAllCashRegisters(),
                this.loadOrderInfo()
            ]);
            
            // ✅ Загружаем проекты в Store если их там нет
            await this.$store.dispatch('loadProjects');

            if (!this.editingItem) {
                // Если есть defaultCashId (например, из заказа), устанавливаем валюту из этой кассы
                if (this.defaultCashId && this.allCashRegisters.length > 0) {
                    const defaultCash = this.allCashRegisters.find(c => c.id == this.defaultCashId);
                    if (defaultCash && defaultCash.currency_id && !this.currencyId) {
                        this.currencyId = defaultCash.currency_id;
                    }
                }
                
                if (this.allCashRegisters.length > 0 && !this.cashId) {
                    this.cashId = this.allCashRegisters[0].id;
                    this.currencyId = this.allCashRegisters[0].currency_id;
                } else if (!this.currencyId) {
                    // Если касса не выбрана, используем дефолтную валюту из Store
                    const defaultCurrency = (this.currencies || []).find(c => c.is_default);
                    if (defaultCurrency) {
                        this.currencyId = defaultCurrency.id;
                    }
                }
                
                // Устанавливаем предзаполненную сумму если она есть
                if (this.prefillAmount != null && this.prefillAmount !== '') {
                    const amount = parseFloat(this.prefillAmount);
                    if (!isNaN(amount) && amount > 0) {
                        this.origAmount = amount;
                    }
                }
            }
            
            this.saveInitialState();
        });
    },
    methods: {
        // Обработчик изменения чекбокса "Долг" - только для отслеживания изменений
        handleDebtChange() {
            // Просто отмечаем изменение формы - сохранение произойдет при нажатии "Сохранить"
            // Никаких API вызовов не делаем
        },
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
                projectId: this.projectId,
                isDebt: this.isDebt,
                sourceType: this.getSourceTypeForBackend(),
                sourceId: this.selectedSource?.id || null
            };
        },
        getSourceTypeForBackend() {
            if (!this.sourceType || !this.selectedSource) return null;
            
            const typeMap = {
                'order': 'App\\Models\\Order',
                'sale': 'App\\Models\\Sale',
                'warehouse_receipt': 'App\\Models\\WhReceipt'
            };
            
            return typeMap[this.sourceType] || null;
        },
        async fetchCurrencies() {
            // Используем данные из store
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies;
        },
        async fetchAllCategories() {
            try {
                // Используем данные из store
                await this.$store.dispatch('loadTransactionCategories');
                this.allCategories = this.$store.getters.transactionCategories;
            } catch (error) {
                this.allCategories = [];
            }
        },
        async fetchAllCashRegisters() {
            // Используем данные из store
            await this.$store.dispatch('loadCashRegisters');
            this.allCashRegisters = this.$store.getters.cashRegisters;
            if (this.allCashRegisters.length && !this.cashId && !this.defaultCashId) {
                this.cashId = this.allCashRegisters[0].id;
            }
        },
        async save() {
            // Валидация: если "в кредит", то клиент обязателен
            if ((this.isDebt || this.forceDebt) && !this.selectedClient?.id) {
                this.$emit('saved-error', 'При транзакции "в кредит" должен быть выбран клиент');
                this.saveLoading = false;
                return;
            }
            // Валидация: если требуется примечание
            if (this.requireNote && (!this.note || String(this.note).trim() === '')) {
                this.$emit('saved-error', 'Заполните примечание');
                this.saveLoading = false;
                return;
            }

            // Валидация минимальной суммы для оплаты заказа
            if (this.minAmount && this.origAmount < this.minAmount) {
                this.$emit('saved-error', `Минимальная сумма оплаты: ${this.minAmount}`);
                this.saveLoading = false;
                return;
            }

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
                            note: this.note,
                            is_debt: (this.forceDebt ? true : this.isDebt),
                            source_type: this.getSourceTypeForBackend(),
                            source_id: this.selectedSource?.id || null
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
                        order_id: this.orderId,
                        is_debt: (this.forceDebt ? true : this.isDebt),
                        is_adjustment: this.adjustmentMode,
                        source_type: this.getSourceTypeForBackend() || (this.orderId ? 'App\\Models\\Order' : null),
                        source_id: this.selectedSource?.id || this.orderId || null
                    });
                }
                if (resp.message) {
                    // Проверяем, нужно ли закрыть заказ (только для модалки доплаты)
                    if (this.isPaymentModal) {
                        await this.checkAndCloseOrder();
                    }
                    
                    this.$emit('saved', resp)
                    this.clearForm();
                }
            } catch (error) {
                // Обработка ошибки недостаточной суммы оплаты
                if (error.response && error.response.data && error.response.data.error === 'INSUFFICIENT_PAYMENT_AMOUNT') {
                    const errorData = error.response.data;
                    this.$emit('saved-error', `Минимальная сумма оплаты: ${errorData.minimum_amount}. Указано: ${errorData.provided_amount}`);
                } else {
                    this.$emit('saved-error', this.getApiErrorMessage(error));
                }
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
            this.isDebt = false;
            this.categoryId = 4; // Устанавливаем id = 4 для типа income по умолчанию
            this.projectId = this.initialProjectId || '';
            this.date = new Date().toISOString().substring(0, 16);
            this.selectedClient = this.initialClient || null;
            this.selectedSource = null;
            this.sourceType = '';
            this.editingItemId = null;
            this.resetFormChanges(); // Сбрасываем состояние изменений
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        copyTransaction() {
            // Создаем новый экземпляр TransactionDto из текущей транзакции
            const copiedTransaction = new TransactionDto(
                null, // id - убираем ID, чтобы создать новую запись
                this.editingItem.type,
                this.editingItem.isTransfer,
                this.editingItem.isSale,
                this.editingItem.isReceipt,
                this.editingItem.isDebt,
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
                this.editingItem.orders,
                this.editingItem.sourceType || null,
                this.editingItem.sourceId || null
            );
            
            // Эмитим событие для открытия нового модального окна с копированными данными
            this.$emit('copy-transaction', copiedTransaction);
        },
        
        // Загружаем информацию о заказе если это модалка доплаты
        async loadOrderInfo() {
            if (this.isPaymentModal && this.orderId) {
                try {
                    this.orderInfo = await OrderController.getItem(this.orderId);
                } catch (error) {
                    // Ошибка загрузки информации о заказе
                }
            }
        },
        
        // Загружаем источник при редактировании
        async loadSourceForEdit(sourceType, sourceId) {
            try {
                // Определяем тип источника
                if (sourceType.includes('Order')) {
                    this.sourceType = 'order';
                    const order = await OrderController.getItem(sourceId);
                    this.selectedSource = order;
                } else if (sourceType.includes('Sale')) {
                    this.sourceType = 'sale';
                    const sale = await SaleController.getItem(sourceId);
                    this.selectedSource = sale;
                } else if (sourceType.includes('WhReceipt')) {
                    this.sourceType = 'warehouse_receipt';
                    const receipt = await WarehouseReceiptController.getItem(sourceId);
                    this.selectedSource = receipt;
                }
            } catch (error) {
                console.error('Ошибка при загрузке источника:', error);
                this.selectedSource = null;
                this.sourceType = '';
            }
        },
        // Проверяем, нужно ли закрыть заказ после создания транзакции
        async checkAndCloseOrder() {
            if (!this.isPaymentModal || !this.orderId || !this.orderInfo) {
                return;
            }
            
            try {
                // Получаем общую сумму оплат по заказу через существующий API
                const paidTotalData = await TransactionController.getTotalByOrderId(this.orderId);
                const totalPaid = parseFloat(paidTotalData.total) || 0;
                const orderTotal = parseFloat(this.orderInfo.totalPrice) || 0;
                
                // Если оплачено достаточно, закрываем заказ
                if (totalPaid >= orderTotal) {
                    // Находим статус "закрытый" (обычно это статус с category_id = 4)
                    const statuses = await OrderStatusController.getAllItems();
                    
                    const closedStatus = statuses.find(status => status.categoryId === 4);
                    
                    if (closedStatus) {
                        const result = await OrderController.batchUpdateStatus({
                            ids: [this.orderId],
                            status_id: closedStatus.id
                        });
                        
                        this.showNotification(
                            this.$t('success'), 
                            this.$t('orderClosedAutomatically'), 
                            false
                        );
                    }
                }
            } catch (error) {
                // Ошибка при проверке закрытия заказа
            }
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
                // Применяем initialProjectId если:
                // 1. Это создание новой транзакции ИЛИ
                // 2. Это редактирование, но у транзакции нет проекта
                if (newProjectId && (!this.editingItemId || !this.projectId)) {
                    this.projectId = newProjectId;
                }
            },
            immediate: true
        },
        initialClient: {
            handler(newClient) {
                // Применяем initialClient если:
                // 1. Это создание новой транзакции ИЛИ
                // 2. Это редактирование, но у транзакции нет клиента
                if (newClient && (!this.editingItemId || !this.selectedClient)) {
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
                } else {
                    // Если у кассы нет валюты — подставляем дефолтную валюту из Store
                    const defaultCurrency = (this.currencies || []).find(c => c.is_default);
                    if (defaultCurrency) {
                        this.currencyId = defaultCurrency.id;
                    }
                }
            }
        },
        type(newType) {
            if (!this.editingItemId) {
                // Если режим корректировки, не меняем категорию автоматически
                if (this.adjustmentMode) return;
                
                if (newType === "income") {
                    this.categoryId = 4; // Устанавливаем id = 4 для типа income
                } else if (newType === "outcome") {
                    this.categoryId = 14;
                } else {
                    this.categoryId = "";
                }
            }
        },
        // Отслеживаем изменение режима корректировки
        adjustmentMode: {
            handler(newVal) {
                if (newVal && !this.editingItemId && this.allCategories.length) {
                    // Устанавливаем тип транзакции в зависимости от adjustmentType
                    this.type = this.adjustmentType === 1 ? 'income' : 'outcome';
                    
                    // Находим и устанавливаем категорию "Корректировка остатка" нужного типа
                    const category = this.allCategories.find(cat => 
                        cat.name === 'Корректировка остатка' && cat.type === this.adjustmentType
                    );
                    if (category) {
                        this.categoryId = category.id;
                    }
                }
            }
        },
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    // При редактировании используем реальные значения из транзакции
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
                    this.selectedClient = newEditingItem.client || this.initialClient || null;
                    this.editingItemId = newEditingItem.id || null;
                    this.isDebt = newEditingItem.isDebt || false;
                    // Загружаем источник если он есть
                    if (newEditingItem.sourceType && newEditingItem.sourceId) {
                        this.loadSourceForEdit(newEditingItem.sourceType, newEditingItem.sourceId);
                    } else {
                        this.selectedSource = null;
                        this.sourceType = '';
                    }
                } else {
                    // При создании новой транзакции устанавливаем значения по умолчанию
                    // Для заказов всегда тип "income" и не долговая
                    this.type = this.orderId ? "income" : "income";
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
                    this.selectedSource = null;
                    this.sourceType = '';
                    this.editingItemId = null;
                    // Для заказов всегда false (не долговая)
                    this.isDebt = this.orderId ? false : false;
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        },
        prefillAmount: {
            handler(newAmount) {
                // Обновляем сумму только если это новая транзакция (не редактирование)
                if (!this.editingItemId && newAmount != null && newAmount !== '') {
                    const amount = parseFloat(newAmount);
                    if (!isNaN(amount) && amount > 0) {
                        this.origAmount = amount;
                    }
                }
            },
            immediate: true
        },
        // Отслеживаем изменения в store
        '$store.state.cashRegisters'(newVal) {
            this.allCashRegisters = newVal;
        },
        // ✅ allProjects теперь computed property, не нужен watcher
        '$store.state.currencies'(newVal) {
            this.currencies = newVal;
            // Если валюта не выбрана и касса не выбрана/не определяет валюту — берём дефолтную валюту из Store
            if (!this.currencyId) {
                const defaultCurrency = (this.currencies || []).find(c => c.is_default);
                if (defaultCurrency && (!this.cashId || !this.allCashRegisters.find(c => c.id == this.cashId)?.currency_id)) {
                    this.currencyId = defaultCurrency.id;
                }
            }
        },
        '$store.state.transactionCategories'(newVal) {
            this.allCategories = newVal;
        },
        '$store.state.clients': {
            handler(newClients) {
                // Автоматически обновляем selectedClient из Store когда кэш обновляется
                if (this.selectedClient?.id && newClients.length) {
                    const updated = newClients.find(c => c.id === this.selectedClient.id);
                    if (updated) {
                        this.selectedClient = updated;
                    }
                }
            },
            immediate: true,
            deep: true
        },
        // Принудительное включение долга при forceDebt
        forceDebt: {
            handler(val) {
                if (val) this.isDebt = true;
            },
            immediate: true
        }
    }
}
</script>
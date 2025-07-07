<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Транзакция</h2>
        <ClientSearch v-model:selectedClient="selectedClient" :disabled="!!editingItemId" />
        <div>
            <label>Дата</label>
            <input type="datetime-local" v-model="date">
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">Тип</label>
            <select v-model="type" :disabled="!!editingItemId" required>
                <option value="">Выберите тип</option>
                <option value="income">✅ Приход</option>
                <option value="outcome">🔺 Расход</option>
            </select>
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">Касса</label>
            <select v-model="cashId" :disabled="!!editingItemId" required>
                <option value="">Нет</option>
                <option v-if="allCashRegisters.length" v-for="parent in allCashRegisters" :value="parent.id">
                    {{ parent.name }} ({{ parent.currencySymbol }})
                </option>
            </select>
        </div>
        <div class="flex items-center space-x-2">
            <div class="w-full mt-2">
                <label class="required">Сумма</label>
                <input type="number" v-model="origAmount" :disabled="!!editingItemId" required min="0.01">
            </div>
            <div class="w-full mt-2">
                <label class="block mb-1 required">Валюта</label>
                <select v-model="currencyIdComputed" :disabled="!!editingItemId" required>
                    <option value="">Нет</option>
                    <option v-if="currencies.length" v-for="parent in currencies" :value="parent.id">{{ parent.symbol }}
                        -
                        {{ parent.name }}
                    </option>
                </select>
            </div>
        </div>
        <div v-if="cashCurrencyId != currencyId && editingItemId" class="flex items-center space-x-2">
            <div class="w-full mt-2">
                <label>Сконвертированная сумма</label>
                <input type="number" v-model="cashAmount" :disabled="!!editingItemId">
            </div>
            <div class="w-full mt-2">
                <label class="block mb-1">Валюта кассы</label>
                <select v-model="cashCurrencyId" :disabled="!!editingItemId">
                    <option value="">Нет</option>
                    <option v-if="currencies.length" v-for="parent in currencies" :value="parent.id">{{ parent.symbol }}
                        -
                        {{ parent.name }}
                    </option>
                </select>
            </div>
        </div>
        <div class="mt-2">
            <label class="block mb-1">Категория</label>
            <select v-model="categoryId">
                <option value="">Нет</option>
                <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                    {{ cat.typeClass() }} {{ cat.name }}
                </option>
            </select>
        </div>
        <div class="mt-2">
            <label class="block mb-1">Проект</label>
            <select v-model="projectId">
                <option value="">Нет</option>
                <option v-if="allProjects.length" v-for="parent in allProjects" :value="parent.id">{{ parent.name }}
                </option>
            </select>
        </div>
        <div class="mt-2">
            <label>Заметка</label>
            <input type="text" v-model="note" />
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление транзакции'" :confirm-text="'Удалить транзакцию'" :leave-text="'Отмена'" />
</template>


<script>
import ClientController from '@/api/ClientController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import debounce from 'lodash.debounce';
import ProjectController from '@/api/ProjectController';
import TransactionDto from '@/dto/transaction/TransactionDto';
import ClientDto from '@/dto/client/ClientDto';
import AppController from '@/api/AppController';
import CashRegisterController from '@/api/CashRegisterController';
import TransactionController from '@/api/TransactionController';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';


export default {
    components: {
        PrimaryButton,
        AlertDialog,
        ClientSearch,
    },
    props: {
        editingItem: {
            type: TransactionDto,
            required: false,
            default: null
        },
        initialClient: {
            type: ClientDto,
            default: null
        },
        initialProjectId: {
            type: [String, Number, null],
            default: null
        },
        orderId: {
            type: [String, Number],
            required: false
        },
        defaultCashId: {
            type: Number,
            default: null,
            required: false
        }
    },
    data() {
        return {
            type: this.editingItem ? this.editingItem.typeName() : "income",
            cashId: this.editingItem ? (this.editingItem.cashId || this.defaultCashId || '') : '',
            cashAmount: this.editingItem ? this.editingItem.cashAmount : null,
            cashCurrencyId: this.editingItem ? this.editingItem.cashCurrencyId : null,
            origAmount: this.editingItem ? this.editingItem.origAmount : 0,
            currencyId: this.editingItem ? this.editingItem.origCurrencyId : '',
            categoryId: this.editingItem ? this.editingItem.categoryId : '',
            projectId: this.editingItem ? this.editingItem.projectId : '',
            date: this.editingItem ? this.editingItem.date : new Date().toISOString().substring(0, 16),
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
                // при редактировании — оставить выбранную
                if (this.editingItemId) return this.currencyId;
                // иначе — валюта кассы
                const cash = this.allCashRegisters.find(c => c.id === this.cashId);
                return cash?.currency_id || '';
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
    created() {
        this.fetchCurrencies();
        this.fetchAllCategories();
        this.fetchAllProjects();
        this.fetchAllCashRegisters();
        if (!this.editingItem) {
            if (this.initialClient) {
                this.selectedClient = this.initialClient;
            }
            if (this.initialProjectId) {
                this.projectId = this.initialProjectId;
            }
        }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async fetchAllCategories() {
            this.allCategories = await AppController.getTransactionCategories();
        },
        async fetchAllProjects() {
            this.allProjects = await ProjectController.getAllItems();
        },
        async fetchAllCashRegisters() {
            this.allCashRegisters = await CashRegisterController.getAllItems();
            this.allCashRegisters = this.allCashRegisters.map(cash => {
                const currency = this.currencies.find(c => c.id === cash.currency_id);
                return { ...cash, currencySymbol: currency.symbol };
            });
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
                            client_id: this.selectedClient?.id
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
                    this.$emit('saved', resp)
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', error);
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
                console.log('Ответ сервера при удалении:', resp);
                if (resp.message || resp.success || resp) {
                    this.$emit('deleted');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', error);
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.type = "income";
            this.cashId = this.allCashRegisters.length ? this.allCashRegisters[0].id : '';
            this.origAmount = 0;
            this.note = '';
            this.categoryId = '';
            this.projectId = '';
            this.date = new Date().toISOString().substring(0, 16);
            this.selectedClient = null;
            this.editingItemId = null;
        },

        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        }

    },
    watch: {
        defaultCashId: {
            handler(i) {
                this.cashId = this.defaultCashId;
            },
            immediate: true
        },
        cashId: {
            handler(i) {
                if (!this.editingItemId) {
                    const cash = this.allCashRegisters.find(c => c.id === i);
                    this.currencyId = cash?.currency_id || '';
                }
            },
            immediate: true
        },
        type(newType) {
            if (!this.editingItemId) {
                if (newType === "income") {
                    this.categoryId = 5;
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
                    this.name = newEditingItem.name || '';
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
                    this.type = "income";
                    this.name = '';
                    this.cashId = this.defaultCashId || (this.allCashRegisters.length ? this.allCashRegisters[0].id : '');
                    const selectedCash = this.allCashRegisters.find(cash => cash.id == this.cashId);
                    this.cashAmount = null;
                    this.cashCurrencyId = null;
                    this.origAmount = 0;
                    this.currencyId = selectedCash?.currency_id || '';
                    this.categoryId = 5;
                    this.projectId = '';
                    this.date = new Date().toISOString().substring(0, 16);
                    this.selectedClient = null;
                    this.editingItemId = null;
                }
            },
            deep: true,
            immediate: true
        },

    }
}

</script>
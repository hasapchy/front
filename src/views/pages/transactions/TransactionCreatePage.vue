<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Транзакция</h2>
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
                <input type="number" v-model="origAmount" :disabled="!!editingItemId" required  min="0.01"> 
            </div>
            <div class="w-full mt-2">
                <label class="block mb-1 required">Валюта</label>
                <select v-model="currencyId" :disabled="!!editingItemId" required>
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
                <option v-if="allCategories.length" v-for="parent in allCategories" :value="parent.id">{{
                    parent.typeClass()
                    }} {{ parent.name }}
                </option>
            </select>
        </div>
        <div>
            <label>Дата</label>
            <input type="datetime-local" v-model="date">
        </div>
        <!-- Начало блока поиска клиентов -->

        <div v-if="selectedClient == null" class="relative">
            <label class="block mb-1">Поиск клиента</label>
            <input type="text" v-model="clientSearch" placeholder="Введите имя или номер клиента"
                class="w-full p-2 border rounded" @focus="showDropdown = true" @blur="showDropdown = false">
            <transition name="appear">
                <ul v-show="showDropdown"
                    class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                    <li v-if="clientSearchLoading" class="p-2 text-gray-500">Загрузка...</li>
                    <!-- <li v-else-if="clientSearch.length === 0" class="p-2 text-gray-500">Ожидание запроса...</li> -->
                    <template v-else-if="clientSearch.length === 0">
                        <li v-for="client in lastClients" :key="client.id" @mousedown.prevent="selectClient(client)"
                            class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                            <div class="flex justify-between">
                                <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                                <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                            </div>
                        </li>
                    </template>
                    <li v-else-if="clientSearch.length < 4" class="p-2 text-gray-500">Минимум 4 символа</li>
                    <li v-else-if="clientResults.length === 0" class="p-2 text-gray-500">Не найдено</li>
                    <li v-for="client in clientResults" :key="client.id"
                        @mousedown.prevent="() => { selectClient(client) }"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between">
                            <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                            <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                        </div>
                        <span
                            :class="client.balance == 0 ? 'text-[#337AB7]' : client.balance > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]'">
                            {{ client.balanceFormatted() }}
                            <!-- {{ client.currencySymbol }} -->
                            <span v-if="client.balanceNumeric() > 0">(Клиент должен нам)</span>
                            <span v-else-if="client.balanceNumeric() < 0">(Мы должны клиенту)</span>
                            <span v-else>(Взаимный расчет)</span>
                        </span>
                    </li>
                </ul>
            </transition>
        </div>
        <div v-else class=" mt-2">
            <div class="p-2 pt-0 mt-2 border-2 border-gray-400/60 rounded-md">
                <div class="flex justify-between items-center">
                    <div>
                        <label>Клиент</label>
                        <p><span class="font-semibold text-sm">Имя:</span> {{ selectedClient.fullName() }}</p>
                        <p><span class="font-semibold text-sm">Номер:</span> {{ selectedClient.phones[0].phone }}</p>
                        <p><span class="font-semibold text-sm">Баланс:</span>
                            <span
                                :class="selectedClient.balanceNumeric() == 0 ? 'text-[#337AB7]' : selectedClient.balanceNumeric() > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]'">
                                {{ selectedClient.balanceFormatted() }}
                                <!-- {{ selectedClient.currencySymbol }} -->
                                <span v-if="selectedClient.balanceNumeric() > 0">(Клиент должен нам)</span>
                                <span v-else-if="selectedClient.balanceNumeric() < 0">(Мы должны клиенту)</span>
                                <span v-else>(Взаимный расчет)</span>
                            </span>
                        </p>
                    </div>
                    <button v-on:click="deselectClient" class="text-red-500 text-2xl cursor-pointer">&times;</button>
                </div>
            </div>
        </div>
        <!-- Конец блока поиска клиентов -->
        <div class="mt-2">
            <label class="block mb-1">Проект</label>
            <select v-model="projectId">
                <option value="">Нет</option>
                <option v-if="allProjects.length" v-for="parent in allProjects" :value="parent.id">{{ parent.name }}
                </option>
            </select>
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
import AppController from '@/api/AppController';
import CashRegisterController from '@/api/CashRegisterController';
import TransactionController from '@/api/TransactionController';


export default {
    components: {
        PrimaryButton,
        AlertDialog
    },
    props: {
        editingItem: {
            type: TransactionDto,
            required: false,
            default: null
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
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            currencies: [],
            allCategories: [],
            allProjects: [],
            allCashRegisters: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            // Поиск клиентов
            clientSearch: '',
            clientSearchLoading: false,
            clientResults: [],
            lastClients: [],
            showDropdown: false
        }
    },
    created() {
        this.fetchCurrencies();
        this.fetchAllCategories();
        this.fetchAllProjects();
        this.fetchAllCashRegisters();
        this.fetchLastClients();
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
        async fetchLastClients() {
            const paginated = await ClientController.getItems(1);
            this.lastClients = paginated.items.slice(0, 10);
        },
        // Поиск клиентов
        searchClients: debounce(async function () {
            if (this.clientSearch.length >= 4) {
                this.clientSearchLoading = true;
                const results = await ClientController.search(this.clientSearch);
                this.clientSearchLoading = false;
                this.clientResults = results;
            } else {
                this.clientResults = [];
            }
        }, 250),
        selectClient(client) {
            this.showDropdown = false;
            this.clientSearch = '';
            this.clientResults = [];
            this.selectedClient = client;
            console.log('Selected client:', client);
        },
        deselectClient() {
            this.selectedClient = null;
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
                        currency_id: this.currencyId,
                        category_id: this.categoryId,
                        project_id: this.projectId,
                        date: this.date,
                        client_id: this.selectedClient?.id
                    });
                }
                if (resp.message) {
                    this.$emit('saved');
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
            this.currencyId = '';
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
        // Поиск клиентов
        clientSearch: {
            handler: 'searchClients',
            immediate: true
        },
        defaultCashId: {
            handler(i) {
                this.cashId = this.defaultCashId;
            },
            immediate: true
        },
        cashId: {
            handler(i) {
                this.allCashRegisters.forEach(cash => {
                    if (cash.id == this.cashId && cash.currency_id) {
                        this.currencyId = cash.currency_id;
                    }
                });
            },
            immediate: true
        },
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.type = newEditingItem.typeName() || "income";
                    this.name = newEditingItem.name || '';
                    this.cashId = newEditingItem.cashId || this.defaultCashId || '';
                    this.cashAmount = newEditingItem.cashAmount || null;
                    this.cashCurrencyId = newEditingItem.cashCurrencyId || null;
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
                    this.categoryId = '';
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

<!-- Стили для поиска клиентов: -->
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
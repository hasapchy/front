<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">Добавить транзакцию</PrimaryButton>
            <div class="mx-4">
                <!-- <label class="block mb-1">Касса</label> -->
                <select v-model="cashRegisterId" @change="fetchItems">
                    <option value="">Все кассы</option>
                    <template v-if="allCashRegisters.length">
                        <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id">
                            {{ parent.name }} ({{ parent.currency_symbol }})
                        </option>
                    </template>
                </select>

            </div>
            <div class="">
                <select v-model="dateFilter" @change="fetchItems" class="w-full p-2 pl-10 border rounded">
                    <option value="all_time">За все время</option>
                    <option value="today">Сегодня</option>
                    <option value="yesterday">Вчера</option>
                    <option value="this_week">Эта неделя</option>
                    <option value="this_month">Этот месяц</option>
                    <option value="last_week">Прошлая неделя</option>
                    <option value="last_month">Прошлый месяц</option>
                    <option value="custom">Выбрать даты</option>
                </select>
            </div>
            <div v-if="dateFilter === 'custom'" class="flex space-x-2 items-center ml-4">
                <input type="date" v-model="startDate" @change="fetchItems" class="w-full p-2 border rounded" />
                <input type="date" v-model="endDate" @change="fetchItems" class="w-full p-2 border rounded" />
            </div>
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <TransactionsBalance ref="balanceRef" :cash-register-id="cashRegisterId || null" :start-date="startDate"
        :end-date="endDate" :date-filter="dateFilter" />
    <!-- Table with placeholder -->
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.transactions" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => { showModal(i) }" />
            <!--@delete-rows="handleDeleteRows"  :filter-query="searchQuery" -->
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <!-- Modal form for creating/editing -->
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <TransactionCreatePage @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" :editingItem="editingItem" :default-cash-id="cashRegisterId || null" />
    </SideModalDialog>
    <!-- Notification component -->
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TransactionController from '@/api/TransactionController';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import CashRegisterController from '@/api/CashRegisterController';
import TransactionsBalance from '@/views/pages/transactions/TransactionsBalance.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import { markRaw } from 'vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';

export default {
    mixins: [modalMixin, notificationMixin],
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        Pagination,
        DraggableTable,
        TransactionCreatePage,
        TransactionsBalance,
        ClientButtonCell,
    },
    data() {
        return {
            data: null,
            loading: false,
            editingItem: null,
            allCashRegisters: [],
            cashRegisterId: '',
            dateFilter: 'all_time',
            startDate: null,
            endDate: null,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: '№', size: 30 },
                { name: 'type', label: 'Тип', html: true },
                { name: 'cashName', label: 'Касса' },
                { name: 'cashAmount', label: 'Сумма', html: true },
                { name: 'origAmount', label: 'Указанная сумма' },
                { name: 'categoryName', label: 'Категория' },
                { name: 'note', label: 'Примечание' },
                { name: 'projectName', label: 'Проект' },
                {
                    name: 'client',
                    label: 'Клиент',
                    component: markRaw(ClientButtonCell),
                    props: (item) => ({
                        client: item.client,

                    })
                },
                { name: 'dateUser', label: 'Дата' },
            ],
        }
    },
    created() {
        this.fetchItems();
        this.fetchAllCashRegisters();
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    methods: {
        updateBalace() {
            this.$refs.balanceRef.fetchItems();
        },
        async fetchAllCashRegisters() {
            this.allCashRegisters = await CashRegisterController.getAllItems();
        },
        itemMapper(i, c) {
            switch (c) {
                case 'type':
                    return i.typeCell();
                case 'cashAmount':
                    return i.cashAmountData();
                case 'origAmount':
                    return i.origAmountData();
                case 'client':
                    if (!i.client) return '';
                    const name = i.client.fullName();
                    const firstPhone = i.client.phones?.[0]?.phone;
                    return firstPhone
                        ? `${name} (${firstPhone})`
                        : name;
                case 'dateUser':
                    return `${i.formatDate()} / ${i.userName}`;
                default:
                    return i[c];
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                let new_data;
                if (this.dateFilter === 'custom') {
                    new_data = await TransactionController.getItems(
                        page,
                        this.cashRegisterId,
                        this.dateFilter,
                        this.startDate,
                        this.endDate
                    );
                } else {
                    new_data = await TransactionController.getItems(
                        page,
                        this.cashRegisterId,
                        this.dateFilter
                    );
                }
                this.data = new_data;
            } catch (error) {
                this.showNotification('Ошибка получения списка транзакций', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        showModal(item = null) {
            this.editingItem = null;
            if (item?.isTransfer === 1) {
                this.showNotification('Нельзя редактировать транзакцию', 'Транзакция является трансфером', true);
                return;
            }
            this.modalDialog = true;
            this.editingItem = item;
        },
        handleSaved() {
            this.showNotification('Транзакция успешно добавлена', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.updateBalace();
            this.closeModal();
        },
        handleSavedError(m) {
            this.showNotification('Ошибка сохранения транзакции', m, true);
        },
        handleDeleted() {
            this.showNotification('Транзакция успешно удалена', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.updateBalace();
            this.closeModal();
        },
        handleDeletedError(m) {
            this.showNotification('Ошибка удаления транзакции', m, true);
        }
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        }
    },
}
</script>
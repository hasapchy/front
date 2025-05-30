<template>
    <!-- Cash registers balance -->
    <!-- Add + Pagination -->
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">Добавить транзакцию</PrimaryButton>
            <div class="mx-4">
                <!-- <label class="block mb-1">Касса</label> -->
                <select v-model="cashRegisterId" @change="fetchItems">
                    <option value="">Все кассы</option>
                    <option v-if="allCashRegisters.length" v-for="parent in allCashRegisters" :value="parent.id">
                        {{ parent.name }} ({{ parent.currency_code }})
                    </option>
                </select>

                <!-- @if ($dateFilter == 'custom')
                <div class="flex space-x-2 items-center ml-4">
                    <input type="date" wire:model.change="startDate" class="w-full p-2 border rounded">
                    <input type="date" wire:model.change="endDate" class="w-full p-2 border rounded">
                </div>
                @endif -->
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
                    <!-- <option value="custom">Выбрать даты</option> -->
                </select>
            </div>
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <TransactionsBalance ref="balanceRef" :cash-register-id="cashRegisterId || null" />
    <!-- Table with placeholder -->
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.transactions" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => { showModal(i) }" @delete-rows="handleDeleteRows"/>
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

export default {
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        Pagination,
        DraggableTable,
        TransactionCreatePage,
        TransactionsBalance
    },
    data() {
        return {
            data: null,
            loading: false,
            notification: false,
            notificationTitle: '',
            notificationSubtitle: '',
            notificationIsDanger: false,
            modalDialog: false,
            editingItem: null,
            allCashRegisters: [],
            // filters
            cashRegisterId: '',
            dateFilter: 'all_time',
            // table config
            columnsConfig: [
                { name: 'id', label: '№', width: 'w-15' },
                { name: 'type', label: 'Тип', html: true },
                { name: 'cashName', label: 'Касса' },
                { name: 'cashAmount', label: 'Сумма', html: true },
                { name: 'origAmount', label: 'Указанная сумма' },
                { name: 'categoryName', label: 'Категория' },
                { name: 'note', label: 'Примечание' },
                { name: 'projectName', label: 'Проект' },
                { name: 'clientId', label: 'Клиент' },
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
        // table mapper
        itemMapper(i, c) {
            switch (c) {
                case 'type':
                    return i.typeCell();
                case 'cashAmount':
                    return i.cashAmountData();
                case 'origAmount':
                    return i.origAmountData();
                case 'clientId':
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
                console.log('datefilter', this.dateFilter);
                const new_data = await TransactionController.getItems(page, this.cashRegisterId, this.dateFilter);
                this.data = new_data;
                this.dateFilter = this.dateFilter;
            } catch (error) {
                this.showNotification('Ошибка получения списка транзакций', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        async handleDeleteRows(selectedRows) {
            if (!selectedRows.length) return;

            this.loading = true;
            try {
                for (const row of selectedRows) {
                    if (row.id) {
                        await TransactionController.deleteItem(row.id);
                    }
                }
                await this.fetchItems(this.data?.currentPage || 1, true);
                this.showNotification('Выбранные продажи успешно удалены', '', false);
            } catch (error) {
                this.showNotification('Ошибка при удалении продаж', error.message, true);
            }
            this.loading = false;
        },
        showNotification(title, subtitle, isDanger = false) {
            this.notificationTitle = title;
            this.notificationSubtitle = subtitle;
            this.notificationIsDanger = isDanger;
            this.notification = true;
            setTimeout(() => {
                this.notification = false;
            }, 3000);
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
        closeModal() {
            this.modalDialog = false;
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
    },
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}
</style>

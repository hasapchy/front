<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">Добавить клиента</PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="common.clients" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <ClientCreatePage @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import ClientController from '@/api/ClientController';
import ClientCreatePage from './ClientCreatePage.vue';

export default {
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        Pagination,
        DraggableTable,
        ClientCreatePage
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
            columnsConfig: [
                { name: 'id', label: '#', width: 'w-15' },
                { name: 'firstName', label: 'ФИО/Компания', html: true },
                { name: 'phones', label: 'Номер телефона', html: true },
                { name: 'emails', label: 'Email', html: true },
                { name: 'address', label: 'Адрес' },
                { name: 'note', label: 'Заметка' },
                { name: 'discount', label: 'Скидка' },
                { name: 'status', label: 'Статус', html: true },
                { name: 'dateUser', label: 'Дата / Пользователь' },

            ],
        }
    },
    created() {
        this.fetchItems();
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'firstName':
                    return i.icons() + i.firstName + ' ' + i.lastName + (i.contactPerson ? ' (' + i.contactPerson + ')' : '');
                case 'phones':
                    return i.phonesHtmlList();
                case 'emails':
                    return i.emailsHtmlList();
                case 'discount':
                    return i.discountFormatted();
                case 'status':
                    return i.statusIcon();
                case 'dateUser':
                    return i.formatCreatedAt();

                default:
                    return i[c];
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const new_data = await ClientController.getItems(page);
                this.data = new_data;
            } catch (error) {
                this.showNotification('Ошибка получения списка клиентов', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        showNotification(title, subtitle, isDanger = false) {
            this.notificationTitle = title;
            this.notificationSubtitle = subtitle;
            this.notificationIsDanger = isDanger;
            this.notification = true;
            setTimeout(() => {
                this.notification = false;
            }, 10000);
        },
        showModal(item = null) {
            this.modalDialog = true;
            this.editingItem = item;
        },
        closeModal() {
            this.modalDialog = false;
        },
        handleSaved() {
            this.showNotification('Клиент успешно добавлен', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleSavedError(m) {
            this.showNotification('Ошибка сохранения клиента', m, true);
        },
        handleDeleted() {
            this.showNotification('Клиент успешн удален', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleDeletedError(m) {
            this.showNotification('Ошибка удаления клиента', m, true);
        }
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        }
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
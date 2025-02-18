<template>
    <h2>Кнопки</h2>
    <PrimaryButton :onclick="toggleLoading" :is-loading="loading">Кнопка с загрузкой</PrimaryButton>
    <div class="inline-block mr-1"></div>
    <PrimaryButton :onclick="toggleLoading" :is-loading="loading" :icon="'fas fa-plus'"></PrimaryButton>
    <h2>Диалоги</h2>
    <PrimaryButton :onclick="showModal">Модальное окно</PrimaryButton>
    <div class="inline-block mr-1"></div>
    <PrimaryButton :onclick="showDeleteDialog" :isDanger="true">Диалог удаления</PrimaryButton>
    <div class="inline-block mr-1"></div>
    <PrimaryButton :onclick="showDeleteDialog" :isLight="true">Диалог удаления</PrimaryButton>
    <div class="inline-block mr-1"></div>
    <AlertDialog :dialog="deleteDialog" @confirm="closeDeleteDialog" @leave="closeDeleteDialog"></AlertDialog>
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <PrimaryButton :onclick="showNotificationScs" :isLight="true">Успешно</PrimaryButton>
        <div class="inline-block mr-1"></div>
        <PrimaryButton :onclick="showNotificationErr" :isLight="true">Ошибка</PrimaryButton>
    </SideModalDialog>
    <NotificationToast :title="'Успешно'" :subtitle="'Данные успешно сохранены'" :show="notificationScs">
    </NotificationToast>
    <NotificationToast :title="'Ошибка'" :subtitle="'Ошибка сохранения данных'" :show="notificationErr"
        :is-danger="true"></NotificationToast>
</template>

<script>
// Кнопки
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
// Диалоги
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';

export default {
    components: {
        AlertDialog,
        PrimaryButton,
        SideModalDialog,
        NotificationToast
    },
    data() {
        return {
            deleteDialog: false,
            modalDialog: false,
            notificationScs: false,
            notificationErr: false,
            loading: false
        }
    },
    methods: {
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        showModal() {
            this.modalDialog = true;
        },
        closeModal() {
            this.modalDialog = false;
        },
        toggleLoading() {
            this.loading = true;
            setTimeout(() => {
                this.loading = false;
            }, 1000);
        },
        showNotificationScs() {
            this.notificationScs = true;
            setTimeout(() => {
                this.notificationScs = false;
            }, 1000);
        },
        showNotificationErr() {
            this.notificationErr = true;
            setTimeout(() => {
                this.notificationErr = false;
            }, 1000);
        }
    }
}
</script>
<template>
    <h2>Кнопки</h2>
    <PrimaryButton :onclick="toggleLoading" :is-loading="loading">Кнопка с загрузкой</PrimaryButton>
    <div class="inline-block mr-1"></div>
    <PrimaryButton :onclick="toggleLoading" :is-loading="loading" :icon="'fas fa-plus'" :aria-label="$t('add')"></PrimaryButton>
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
</template>

<script>
// Кнопки
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
// Диалоги
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';

export default {
    mixins: [modalMixin, notificationMixin],
    components: {
        AlertDialog,
        PrimaryButton,
        SideModalDialog
    },
    data() {
        return {
            deleteDialog: false,
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
        toggleLoading() {
            this.loading = true;
            setTimeout(() => {
                this.loading = false;
            }, 1000);
        },
        showNotificationScs() {
            this.$store.dispatch('showNotification', { title: 'Успешно', subtitle: 'Данные успешно сохранены', duration: 3000 });
        },
        showNotificationErr() {
            this.$store.dispatch('showNotification', { title: 'Ошибка', subtitle: 'Ошибка сохранения данных', isDanger: true, duration: 3000 });
        }
    }
}
</script>
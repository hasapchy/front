<template>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.message_templates" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="onItemClick" :onHtmlCellClick="handleCellClick">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-pagination="true"
                        :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                        :on-page-change="fetchItems"
                        :on-per-page-change="handlePerPageChange"
                        :resetColumns="resetColumns"
                        :columns="columns"
                        :toggleVisible="toggleVisible"
                        :log="log">
                        <template #left>
                            <PrimaryButton 
                                v-if="canCreateTemplate"
                                :onclick="() => { showModal(null) }" 
                                icon="fas fa-plus">
                            </PrimaryButton>
                            <transition name="fade">
                                <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
                            </transition>
                        </template>
                        <template #gear="{ resetColumns, columns, toggleVisible, log }">
                            <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                <ul>
                                    <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns"
                                        @change="log">
                                        <li v-for="(element, index) in columns" :key="element.name"
                                            @click="toggleVisible(index)"
                                            class="flex items-center hover:bg-gray-100 p-2 rounded">
                                            <div class="space-x-2 flex flex-row justify-between w-full select-none">
                                                <div>
                                                    <i class="text-sm mr-2 text-[#337AB7]"
                                                        :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                                    {{ $te(element.label) ? $t(element.label) : element.label }}
                                                </div>
                                                <div><i
                                                        class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i>
                                                </div>
                                            </div>
                                        </li>
                                    </draggable>
                                </ul>
                            </TableFilterButton>
                        </template>
                    </TableControlsBar>
                </template>
            </DraggableTable>
        </div>
        <div v-else key="loader" class="min-h-64">
            <TableSkeleton />
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <MessageTemplateCreatePage 
            :key="editingItem ? editingItem.id : 'new-template'" 
            ref="templateCreatePageForm" 
            @saved="handleSaved" 
            @saved-error="handleSavedError" 
            @deleted="handleDeleted"
            @deleted-error="handleDeletedError" 
            @close-request="closeModal" 
            :editingItem="editingItem" />
    </SideModalDialog>
    <AlertDialog 
        :dialog="deleteDialog" 
        :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" 
        :confirm-text="$t('delete')"
        :leave-text="$t('cancel')" 
        @confirm="confirmDeleteItems" 
        @leave="deleteDialog = false" />
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import MessageTemplateController from '@/api/MessageTemplateController';
import MessageTemplateCreatePage from './MessageTemplateCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin],
    components: {
        PrimaryButton,
        SideModalDialog,
        MessageTemplateCreatePage,
        Pagination,
        DraggableTable,
        BatchButton,
        AlertDialog,
        TableControlsBar,
        TableFilterButton,
        TableSkeleton,
        draggable: VueDraggableNext
    },
    data() {
        return {
            controller: MessageTemplateController,
            cacheInvalidationType: 'messageTemplates',
            itemViewRouteName: 'MessageTemplateView',
            baseRouteName: 'message_templates',
            errorGettingItemText: this.$t('errorGettingTemplate'),
            savedSuccessText: this.$t('templateSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingTemplate'),
            deletedSuccessText: this.$t('templateSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingTemplate'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'type', label: 'type', size: 120 },
                { name: 'name', label: 'name' },
                { name: 'isActive', label: 'isActive', size: 80, html: true },
                { name: 'user', label: 'author', size: 150 },
                { name: 'createdAt', label: 'creationDate' }
            ]
        }
    },
    computed: {
        canCreateTemplate() {
            return this.$store.getters.hasPermission('templates_create');
        }
    },
    mounted() {
        this.fetchItems();
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        }
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'createdAt':
                    return i.formatCreatedAt();
                case 'type':
                    return i.getTypeLabel();
                case 'isActive':
                    return `<span class="cursor-pointer" data-source-type="toggle" data-source-id="isActive">${i.isActive ? '✅' : '❌'}</span>`;
                case 'user':
                    if (!i.user) return '-';
                    const userName = i.user.name || '';
                    const userSurname = i.user.surname || '';
                    const fullName = `${userName} ${userSurname}`.trim();
                    return fullName || '-';
                default:
                    return i[c];
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const per_page = this.perPage;
                const new_data = await MessageTemplateController.getItems(page, '', per_page);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingTemplateList'), this.getApiErrorMessage(error), true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'message_templates' });
            }
        },
        async confirmDeleteItems() {
            this.deleteDialog = false;
            if (!this.idsToDelete.length) return;

            this.loadingBatch = true;
            try {
                await MessageTemplateController.batchDelete(this.idsToDelete);
                const deletedCount = this.idsToDelete.length;
                this.showNotification(`Удалено ${deletedCount} элементов`, '', false);
                this.invalidateCache?.('onDelete');
                this.selectedIds = [];
                await this.fetchItems?.();
            } catch (error) {
                const messages = this.getApiErrorMessage(error) || [error.message || "Ошибка"];
                this.showNotification("Ошибки при удалении", Array.isArray(messages) ? messages.join("\n") : messages, true);
            }
            this.loadingBatch = false;
            this.idsToDelete = [];
        },
        getBatchActions() {
            const actions = [];
            
            if (this.$store.getters.hasPermission('templates_delete_all')) {
                actions.push({
                    label: "",
                    icon: "fas fa-trash",
                    type: "danger",
                    action: this.deleteItems,
                    disabled: this.loadingBatch,
                });
            }
            
            return actions;
        },
        async handleCellClick(item, column, data) {
            // Обработка клика по ячейке isActive для переключения статуса
            if (column.name === 'isActive' && data?.sourceType === 'toggle' && data?.sourceId === 'isActive') {
                if (!this.$store.getters.hasPermission('templates_update')) {
                    this.showNotification(
                        this.$t('error') || 'Ошибка',
                        this.$t('noPermission') || 'У вас нет прав на изменение статуса',
                        true
                    );
                    return;
                }
                
                try {
                    const newStatus = !item.isActive;
                    await MessageTemplateController.updateItem(item.id, {
                        is_active: newStatus
                    });
                    
                    this.showNotification(
                        this.$t('success') || 'Успешно',
                        newStatus 
                            ? (this.$t('templateActivated') || 'Шаблон активирован')
                            : (this.$t('templateDeactivated') || 'Шаблон деактивирован'),
                        false
                    );
                    
                    this.invalidateCache?.('onUpdate');
                    await this.fetchItems?.();
                } catch (error) {
                    const messages = this.getApiErrorMessage(error) || [error.message || "Ошибка"];
                    this.showNotification(
                        this.$t('error') || 'Ошибка',
                        Array.isArray(messages) ? messages.join("\n") : messages,
                        true
                    );
                }
            }
        }
    },
}
</script>


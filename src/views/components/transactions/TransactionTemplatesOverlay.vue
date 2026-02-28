<template>
    <div class="flex flex-col h-full">
        <div v-if="!showForm" class="flex flex-col flex-1 overflow-auto p-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold">{{ $t('transactionTemplates') || 'Шаблоны транзакций' }}</h3>
            </div>
            <TableControlsBar
                v-if="!loading && templateViewMode === 'cards' && templates.length > 0"
                :show-pagination="false">
                <template #left>
                    <PrimaryButton v-if="canCreate" :onclick="openCreate" icon="fas fa-plus">
                    </PrimaryButton>
                    <ViewModeToggle
                        :view-mode="templateViewMode"
                        :show-kanban="false"
                        :show-cards="true"
                        @change="templateViewMode = $event"
                    />
                </template>
            </TableControlsBar>
            <div v-if="loading" class="flex flex-1 items-center justify-center py-12">
                <SpinnerIcon size-class="text-3xl text-gray-400" />
            </div>
            <template v-else-if="templates.length === 0">
                <div class="text-gray-500 py-4">{{ $t('noData') }}</div>
            </template>
            <DraggableTable
                v-else-if="templateViewMode === 'table'"
                table-key="transaction_templates_overlay"
                :columns-config="templateTableColumns"
                :table-data="paginatedTemplates"
                :item-mapper="templateItemMapper"
                :on-item-click="openEdit">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-filters="false"
                        :show-pagination="true"
                        :pagination-data="templatePaginationData"
                        :on-page-change="handleTemplatePageChange"
                        :on-per-page-change="handleTemplatePerPageChange"
                        :resetColumns="resetColumns"
                        :columns="columns"
                        :toggleVisible="toggleVisible"
                        :log="log">
                        <template #left>
                            <PrimaryButton v-if="canCreate" :onclick="openCreate" icon="fas fa-plus">
                            </PrimaryButton>
                            <ViewModeToggle
                                :view-mode="templateViewMode"
                                :show-kanban="false"
                                :show-cards="true"
                                @change="templateViewMode = $event"
                            />
                        </template>
                        <template #gear>
                            <TableFilterButton v-if="columns?.length" :onReset="resetColumns">
                                <ul>
                                    <draggable class="dragArea list-group w-full" :list="columns" @change="log">
                                        <li v-for="(element, index) in columns" :key="element.name" v-show="element.name !== 'select'"
                                            @click="toggleVisible(index)"
                                            class="flex items-center hover:bg-gray-100 p-2 rounded">
                                            <div class="space-x-2 flex flex-row justify-between w-full select-none">
                                                <div>
                                                    <i class="text-sm mr-2 text-[#337AB7]"
                                                        :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                                    {{ $te(element.label) ? $t(element.label) : element.label }}
                                                </div>
                                                <div><i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i></div>
                                            </div>
                                        </li>
                                    </draggable>
                                </ul>
                            </TableFilterButton>
                        </template>
                    </TableControlsBar>
                </template>
            </DraggableTable>
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Card
                    v-for="t in templates"
                    :key="t.id"
                    :show-checkbox="false"
                    @dblclick="selectTemplate(t)"
                >
                    <div class="flex items-start justify-between gap-2 mb-3">
                        <div class="flex items-start min-w-0 flex-1" @click="selectTemplate(t)">
                            <div class="shrink-0 mr-3 flex flex-col items-center">
                                <div class="flex items-center justify-center w-10 h-10 rounded-lg"
                                    :class="(t.type === 1 || t.type === true) ? 'bg-green-50 text-[#5CB85C]' : 'bg-red-50 text-[#EE4F47]'"
                                    :title="(t.type === 1 || t.type === true) ? $t('income') : $t('outcome')">
                                    <i v-if="t.icon" :class="t.icon" class="text-lg"></i>
                                    <i v-else :class="(t.type === 1 || t.type === true) ? 'fas fa-circle-down' : 'fas fa-circle-up'" class="text-lg"></i>
                                </div>
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="text-sm font-bold text-gray-800 truncate">{{ t.name }}</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                            <button v-if="canRecurring" type="button" class="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                                @click.stop="openRecurringModal(t)" :aria-label="$t('recurring')">
                                <i class="fas fa-redo text-sm"></i>
                            </button>
                            <button v-if="canUpdate" type="button" class="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                                @click.stop="openEdit(t)" :aria-label="$t('edit')">
                                <i class="fas fa-pen text-sm"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1 text-xs text-gray-600 mt-auto pt-2 border-t border-gray-100">
                        <i class="fas fa-user text-gray-400 shrink-0"></i>
                        <span class="truncate">{{ t.creatorName || '—' }}</span>
                    </div>
                </Card>
            </div>
        </div>
        <div v-else class="flex flex-col flex-1 overflow-hidden">
            <div class="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 class="text-base font-semibold">{{ editingTemplate ? ($t('editTransactionTemplate') || 'Редактировать шаблон') : ($t('createTransactionTemplate') || 'Создать шаблон') }}</h3>
            </div>
            <TransactionTemplateCreatePage class="flex-1 min-h-0"
                ref="templateFormRef"
                :editingItem="editingTemplate"
                :showHeader="false"
                @saved="onTemplateSaved"
                @saved-error="onTemplateSavedError"
                @deleted="onTemplateDeleted"
                @deleted-error="onTemplateDeletedError"
                @close-request="closeForm"
            />
        </div>
        <SideModalDialog :showForm="showRecurringModal" :onclose="closeRecurringModal">
            <RecurringScheduleForm v-if="templateForRecurring" :template-id="templateForRecurring.id"
                :template-name="templateForRecurring.name" @saved="onRecurringSaved" />
        </SideModalDialog>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';
import Card from '@/views/components/app/cards/Card.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import TransactionTemplateCreatePage from '@/views/pages/transactions/TransactionTemplateCreatePage.vue';
import RecurringScheduleForm from '@/views/components/transactions/RecurringScheduleForm.vue';
import TransactionTemplateController from '@/api/TransactionTemplateController';
import TransactionTemplateDto from '@/dto/transaction/TransactionTemplateDto';
import { formatDatabaseDate } from '@/utils/dateUtils';
import { VueDraggableNext } from 'vue-draggable-next';

export default {
    name: 'TransactionTemplatesOverlay',
    components: {
        PrimaryButton,
        ViewModeToggle,
        DraggableTable,
        TableControlsBar,
        TableFilterButton,
        SpinnerIcon,
        Card,
        SideModalDialog,
        TransactionTemplateCreatePage,
        RecurringScheduleForm,
        draggable: VueDraggableNext
    },
    props: {
        visible: { type: Boolean, default: false },
        cashId: { type: [Number, String], default: null },
        transactionType: { type: String, default: null }
    },
    emits: ['close', 'select'],
    data() {
        return {
            templates: [],
            loading: false,
            showForm: false,
            editingTemplate: null,
            templateViewMode: (localStorage.getItem('transaction_templates_viewMode') === 'cards') ? 'cards' : 'table',
            templatePage: 1,
            templatePerPage: 10,
            templatePerPageOptions: [10, 20, 50],
            showRecurringModal: false,
            templateForRecurring: null
        };
    },
    watch: {
        visible(val) {
            if (val) this.fetchTemplates();
        },
        templateViewMode(mode) {
            localStorage.setItem('transaction_templates_viewMode', mode);
        },
        templates() {
            const lastPage = Math.max(1, Math.ceil(this.templates.length / this.templatePerPage));
            if (this.templatePage > lastPage) {
                this.templatePage = lastPage;
            }
        }
    },
    computed: {
        canCreate() {
            return this.$store.getters.hasPermission('transaction_templates_create');
        },
        canUpdate() {
            return this.$store.getters.hasPermission('transaction_templates_update_own') ||
                this.$store.getters.hasPermission('transaction_templates_update_all');
        },
        canRecurring() {
            return this.$store.getters.hasPermission('rec_schedules_create');
        },
        templateTableColumns() {
            return [
                { name: 'id', label: 'id' },
                { name: 'type', label: 'type', html: true },
                { name: 'name', label: 'name', html: true },
                { name: 'creatorName', label: 'creator' },
                { name: 'createdAt', label: 'creationDate' }
            ];
        },
        templatePaginationData() {
            const total = this.templates.length;
            const lastPage = Math.max(1, Math.ceil(total / this.templatePerPage));
            return {
                currentPage: this.templatePage,
                lastPage,
                perPage: this.templatePerPage,
                perPageOptions: this.templatePerPageOptions,
                showPerPageSelector: true
            };
        },
        paginatedTemplates() {
            const start = (this.templatePage - 1) * this.templatePerPage;
            return this.templates.slice(start, start + this.templatePerPage);
        }
    },
    mounted() {
        if (this.visible) this.fetchTemplates();
    },
    methods: {
        async fetchTemplates() {
            this.loading = true;
            try {
                const list = await TransactionTemplateController.getAll({});
                this.templates = Array.isArray(list) ? list : [];
            } catch (e) {
                this.templates = [];
            }
            this.loading = false;
        },
        handleTemplatePageChange(page) {
            this.templatePage = page;
        },
        handleTemplatePerPageChange(perPage) {
            this.templatePerPage = perPage;
            this.templatePage = 1;
        },
        openCreate() {
            this.editingTemplate = null;
            this.showForm = true;
        },
        openEdit(template) {
            this.editingTemplate = template;
            this.showForm = true;
        },
        closeForm() {
            this.showForm = false;
            this.editingTemplate = null;
            this.fetchTemplates();
        },
        onTemplateSaved() {
            this.closeForm();
        },
        onTemplateSavedError(err) {
            this.$store.dispatch('showNotification', {
                title: this.$t('error'),
                subtitle: Array.isArray(err) ? err[0] : (err?.message ?? String(err)),
                isDanger: true
            });
        },
        onTemplateDeleted() {
            this.closeForm();
        },
        onTemplateDeletedError(err) {
            this.$store.dispatch('showNotification', {
                title: this.$t('error'),
                subtitle: Array.isArray(err) ? err[0] : (err?.message ?? String(err)),
                isDanger: true
            });
        },
        openRecurringModal(template) {
            this.templateForRecurring = { id: template.id, name: template.name };
            this.showRecurringModal = true;
        },
        closeRecurringModal() {
            this.showRecurringModal = false;
            this.templateForRecurring = null;
        },
        onRecurringSaved() {
            this.closeRecurringModal();
            this.$store.dispatch('showNotification', {
                title: this.$t('success') || 'Успешно',
                subtitle: this.$t('recurringCreated') || 'Повтор по шаблону создан',
                isDanger: false
            });
        },
        selectTemplate(template) {
            this.$emit('select', template.id);
        },
        templateItemMapper(item, columnName) {
            switch (columnName) {
                case 'id':
                    return item.id ?? '—';
                case 'type': {
                    const isIncome = item.type === 1 || item.type === true;
                    const icon = isIncome ? 'fas fa-circle-down text-[#5CB85C]' : 'fas fa-circle-up text-[#EE4F47]';
                    const title = isIncome ? (this.$t('income') || 'Приход') : (this.$t('outcome') || 'Расход');
                    return `<i class="${icon} mr-1" title="${title.replace(/"/g, '&quot;')}"></i><span>${title}</span>`;
                }
                case 'name': {
                    const name = (item.name ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
                    const icon = item.icon ? `<i class="${item.icon} text-gray-600 mr-2"></i>` : '';
                    return `${icon}<span>${name}</span>`;
                }
                case 'creatorName':
                    return item.creatorName || '—';
                case 'createdAt': {
                    const raw = item.created_at ?? item.createdAt;
                    return raw ? formatDatabaseDate(raw) : '—';
                }
                default:
                    return item[columnName] ?? '';
            }
        }
    }
};
</script>

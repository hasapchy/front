<template>
    <div class="flex flex-col h-full">
        <div v-if="!showForm" class="flex flex-col flex-1 overflow-auto p-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold">{{ $t('transactionTemplates') || 'Шаблоны транзакций' }}</h3>
                <div class="flex items-center gap-2">
                    <PrimaryButton v-if="canCreate" :onclick="openCreate" icon="fas fa-plus" class="text-sm">
                        {{ $t('create') || 'Создать' }}
                    </PrimaryButton>
                    <button type="button" class="p-1 rounded hover:bg-gray-200" @click="$emit('close')" :aria-label="$t('close')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div v-if="loading" class="py-8 text-center text-gray-500">{{ $t('loading') || 'Загрузка...' }}</div>
            <ul v-else-if="templates.length === 0" class="text-gray-500 py-4">
                {{ $t('noTemplates') || 'Нет шаблонов' }}
            </ul>
            <ul v-else class="space-y-2">
                <li v-for="t in templates" :key="t.id"
                    class="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50">
                    <div class="flex items-center flex-1 min-w-0 cursor-pointer" @click="selectTemplate(t)">
                        <i v-if="t.icon" :class="t.icon" class="mr-3 text-lg text-gray-600 shrink-0"></i>
                        <div class="min-w-0 flex-1">
                            <div class="font-medium truncate">{{ t.name }}</div>
                            <div class="text-sm text-gray-500 truncate">{{ t.creatorName || '—' }}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0 ml-2">
                        <button v-if="canUpdate" type="button" class="p-2 rounded hover:bg-blue-100 text-blue-600"
                            @click.stop="openEdit(t)" :aria-label="$t('edit')">
                            <i class="fas fa-pen text-sm"></i>
                        </button>
                    </div>
                </li>
            </ul>
        </div>
        <div v-else class="flex flex-col flex-1 overflow-hidden">
            <div class="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 class="text-base font-semibold">{{ editingTemplate ? ($t('editTransactionTemplate') || 'Редактировать шаблон') : ($t('createTransactionTemplate') || 'Создать шаблон') }}</h3>
                <button type="button" class="p-1 rounded hover:bg-gray-200" @click="closeForm" :aria-label="$t('close')">
                    <i class="fas fa-times"></i>
                </button>
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
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import TransactionTemplateCreatePage from '@/views/pages/transactions/TransactionTemplateCreatePage.vue';
import TransactionTemplateController from '@/api/TransactionTemplateController';
import TransactionTemplateDto from '@/dto/transaction/TransactionTemplateDto';

export default {
    name: 'TransactionTemplatesOverlay',
    components: { PrimaryButton, TransactionTemplateCreatePage },
    props: {
        cashId: { type: [Number, String], default: null },
        transactionType: { type: String, default: null }
    },
    emits: ['close', 'select'],
    data() {
        return {
            templates: [],
            loading: false,
            showForm: false,
            editingTemplate: null
        };
    },
    computed: {
        canCreate() {
            return this.$store.getters.hasPermission('transaction_templates_create');
        },
        canUpdate() {
            return this.$store.getters.hasPermission('transaction_templates_update_own') ||
                this.$store.getters.hasPermission('transaction_templates_update_all');
        }
    },
    mounted() {
        this.fetchTemplates();
    },
    methods: {
        async fetchTemplates() {
            this.loading = true;
            try {
                const params = {};
                if (this.cashId != null && this.cashId !== '') params.cash_id = this.cashId;
                if (this.transactionType === 'income' || this.transactionType === 'outcome') {
                    params.type = this.transactionType === 'income' ? 1 : 0;
                }
                const list = await TransactionTemplateController.getAll(params);
                this.templates = Array.isArray(list) ? list : [];
            } catch (e) {
                this.templates = [];
            }
            this.loading = false;
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
                title: this.$t('error') || 'Ошибка',
                subtitle: Array.isArray(err) ? err[0] : (err?.message || String(err)),
                isDanger: true
            });
        },
        onTemplateDeleted() {
            this.closeForm();
        },
        onTemplateDeletedError(err) {
            this.$store.dispatch('showNotification', {
                title: this.$t('error') || 'Ошибка',
                subtitle: Array.isArray(err) ? err[0] : (err?.message || String(err)),
                isDanger: true
            });
        },
        selectTemplate(template) {
            this.$emit('select', template.id);
        }
    }
};
</script>

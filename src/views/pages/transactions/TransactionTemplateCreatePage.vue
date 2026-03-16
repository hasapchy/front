<template>
    <div class="h-full flex flex-col">
        <div class="flex flex-col overflow-auto flex-1 p-4">
            <h2 v-if="showHeader" class="text-lg font-bold mb-4">
                {{ editingItem ? ($t('editTransactionTemplate') || 'Редактировать шаблон') : ($t('createTransactionTemplate') || 'Создать шаблон') }}
            </h2>
            <TabBar
                v-if="showTabs"
                :key="`tabs-${$i18n.locale}`"
                :tabs="translatedTabs"
                :active-tab="currentTab"
                :tab-click="(t) => { changeTab(t); }"
                class="mb-4"
            />
            <div v-if="currentTab === 'info'">
                <div class="flex items-center gap-2">
                    <div class="flex-1">
                        <label class="block mb-1 required">{{ $t('name') }}</label>
                        <input type="text" v-model="name" class="w-full">
                    </div>
                    <div class="flex-1">
                        <label class="block mb-1 required">{{ $t('icon') }}</label>
                        <select v-model="icon" class="w-full">
                            <option value="">{{ $t('no') }}</option>
                            <option v-for="opt in iconOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                    </div>
                </div>
                <div class="mt-2">
                    <ClientSearch v-model:selectedClient="selectedClient" :showLabel="true" :required="false" />
                </div>
                <div class="mt-2">
                    <label class="block mb-1">{{ $t('date') }}</label>
                    <input type="date" v-model="date" class="w-full">
                </div>
                <div class="mt-2">
                    <label class="block mb-1 required">{{ $t('type') }}</label>
                    <select v-model="type" class="w-full" required>
                        <option value="1">{{ $t('income') }}</option>
                        <option value="0">{{ $t('expense') }}</option>
                    </select>
                </div>
                <div class="mt-2">
                    <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
                    <select v-model="cashId" class="w-full" required>
                        <option value="">{{ $t('no') }}</option>
                        <option v-for="c in allCashRegisters" :key="c.id" :value="c.id">{{ c.name }} ({{ c.currencySymbol || '' }})</option>
                    </select>
                </div>
                <div class="flex items-center gap-2 mt-2">
                    <div class="w-full">
                        <label class="block mb-1">{{ $t('amountBeforeConversion') }}</label>
                        <input type="number" v-model.number="amount" class="w-full" min="0" step="0.01">
                    </div>
                    <div class="w-full">
                        <label class="block mb-1">{{ $t('currency') }}</label>
                        <select v-model="currencyId" class="w-full">
                            <option value="">{{ $t('no') }}</option>
                            <option v-for="c in currencies" :key="c.id" :value="c.id">{{ c.symbol }} - {{ c.name }}</option>
                        </select>
                    </div>
                </div>
                <div class="mt-2">
                    <label class="block mb-1">{{ $t('category') }}</label>
                    <select v-model="categoryId" class="w-full">
                        <option value="">{{ $t('no') }}</option>
                        <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                            {{ cat.type ? '✅' : '🔺' }} {{ translateTransactionCategory(cat.name, $t) }}
                        </option>
                    </select>
                </div>
                <div class="mt-2">
                    <label class="block mb-1">{{ $t('project') }}</label>
                    <select v-model="projectId" class="w-full">
                        <option value="">{{ $t('no') }}</option>
                        <option v-for="p in allProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </div>
                <div class="mt-2">
                    <label class="block mb-1">{{ $t('note') }}</label>
                    <input type="text" v-model="note" class="w-full">
                </div>
            </div>
            <div v-else-if="currentTab === 'recurring'">
                <div v-if="!canRecurring" class="text-sm text-gray-500">
                    {{ $t('noAccess') || 'Нет прав для настройки повтора' }}
                </div>
                <div v-else-if="!editingItemId" class="text-sm text-gray-500">
                    {{ $t('saveTemplateBeforeRecurring') || 'Сначала сохраните шаблон, затем настройте повтор' }}
                </div>
                <div v-else class="mt-2">
                    <RecurringScheduleForm
                        :template-id="editingItemId"
                        :template-name="name"
                        :show-header="false"
                        :show-actions="false"
                        :compact="true"
                    />
                </div>
            </div>
        </div>
        <div class="shrink-0 mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
            <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
                :is-loading="deleteLoading" icon="fas fa-trash"
                :disabled="!canDelete">
            </PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading"
                :disabled="!name || !icon || !cashId || (editingItemId != null && !canUpdate) || (editingItemId == null && !canCreate)"
                :aria-label="$t('save')">
            </PrimaryButton>
        </div>
        <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
            :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
        <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
            :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
    </div>
</template>

<script>
import TransactionTemplateController from '@/api/TransactionTemplateController';
import TransactionTemplateDto from '@/dto/transaction/TransactionTemplateDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import RecurringScheduleForm from '@/views/components/transactions/RecurringScheduleForm.vue';
import { ICON_OPTIONS } from '@/constants/cashIconOptions';
import getApiErrorMessage from '@/mixins/errorMessageMixin';
import formChangesMixin from '@/mixins/formChangesMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import { getCurrentLocalDateTime } from '@/utils/dateUtils';

export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin, storeDataLoaderMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    components: { PrimaryButton, AlertDialog, ClientSearch, TabBar, RecurringScheduleForm },
    props: {
        editingItem: { type: TransactionTemplateDto, required: false, default: null },
        showHeader: { type: Boolean, default: true }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            icon: this.editingItem ? this.editingItem.icon : (ICON_OPTIONS[0]?.value || ''),
            cashId: this.editingItem ? this.editingItem.cashId : '',
            type: this.editingItem ? String(this.editingItem.type) : '1',
            amount: this.editingItem != null && this.editingItem.amount != null ? this.editingItem.amount : null,
            currencyId: this.editingItem ? this.editingItem.currencyId : '',
            categoryId: this.editingItem ? this.editingItem.categoryId : '',
            projectId: this.editingItem ? this.editingItem.projectId : '',
            selectedClient: this.editingItem ? this.editingItem.client : null,
            date: this.editingItem && this.editingItem.date ? this.formatDateForInput(this.editingItem.date) : this.todayDate(),
            note: this.editingItem ? this.editingItem.note : '',
            allCashRegisters: [],
            currencies: [],
            allCategories: [],
            allProjects: [],
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'recurring', label: 'recurringSchedules' }
            ]
        };
    },
    computed: {
        iconOptions() {
            return ICON_OPTIONS;
        },
        filteredCategories() {
            const typeNum = parseInt(this.type, 10);
            if (this.allCategories.length === 0) return [];
            return this.allCategories.filter(cat => cat.type === typeNum);
        },
        canCreate() {
            return this.$store.getters.hasPermission('transaction_templates_create');
        },
        canUpdate() {
            return this.$store.getters.hasPermission('transaction_templates_update_own') ||
                this.$store.getters.hasPermission('transaction_templates_update_all');
        },
        canDelete() {
            return this.$store.getters.hasPermission('transaction_templates_delete_own') ||
                this.$store.getters.hasPermission('transaction_templates_delete_all');
        },
        canRecurring() {
            return this.$store.getters.hasPermission('rec_schedules_create');
        },
        translatedTabs() {
            return this.tabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },
        showTabs() {
            return this.translatedTabs.length > 1;
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCashRegisters(),
                this.fetchCurrencies(),
                this.fetchCategories(),
                this.loadProjects()
            ]);
            if (!this.cashId && this.allCashRegisters.length) {
                this.cashId = this.allCashRegisters[0].id;
            }
            if (!this.currencyId && this.currencies.length) {
                const def = this.currencies.find(c => c.isDefault);
                this.currencyId = def ? def.id : this.currencies[0].id;
            }
            if (!this.categoryId && this.filteredCategories.length) {
                this.categoryId = this.filteredCategories[0].id;
            }
            this.saveInitialState();
        });
    },
    methods: {
        translateTransactionCategory,
        changeTab(tabName) {
            this.currentTab = tabName;
        },
        formatDateForInput(val) {
            if (!val) return '';
            const d = new Date(val);
            return d.toISOString().slice(0, 10);
        },
        todayDate() {
            return getCurrentLocalDateTime().slice(0, 10);
        },
        async fetchCashRegisters() {
            await this.loadStoreData({
                getterName: 'cashRegisters',
                dispatchName: 'loadCashRegisters',
                localProperty: 'allCashRegisters',
                defaultValue: []
            });
        },
        async fetchCurrencies() {
            await this.loadStoreData({
                getterName: 'currencies',
                dispatchName: 'loadCurrencies',
                localProperty: 'currencies',
                defaultValue: []
            });
        },
        async fetchCategories() {
            await this.loadStoreData({
                getterName: 'transactionCategories',
                dispatchName: 'loadTransactionCategories',
                localProperty: 'allCategories',
                defaultValue: []
            });
        },
        async loadProjects() {
            if (!this.$store.getters.projects?.length) {
                await this.$store.dispatch('loadProjects');
            }
            this.allProjects = this.$store.getters.activeProjects || this.$store.getters.projects || [];
        },
        getFormState() {
            return {
                name: this.name,
                icon: this.icon,
                cashId: this.cashId,
                type: this.type,
                amount: this.amount,
                currencyId: this.currencyId,
                categoryId: this.categoryId,
                projectId: this.projectId,
                selectedClient: this.selectedClient,
                date: this.date,
                note: this.note
            };
        },
        prepareSave() {
            const payload = {
                name: this.name,
                icon: this.icon,
                cash_id: this.cashId,
                type: parseInt(this.type, 10),
                amount: this.amount != null && this.amount !== '' ? parseFloat(this.amount) : null,
                currency_id: this.currencyId || null,
                category_id: this.categoryId || null,
                project_id: this.projectId || null,
                client_id: this.selectedClient?.id || null,
                date: this.date || this.todayDate(),
                note: this.note || null
            };
            return payload;
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await TransactionTemplateController.updateItem(this.editingItemId, data);
            }
            return await TransactionTemplateController.storeItem(data);
        },
        async performDelete() {
            const resp = await TransactionTemplateController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete template');
            }
            return resp;
        },
        onSaveSuccess(response) {
            if (response && response.message) {
                this.clearForm();
            }
        },
        clearForm() {
            this.name = '';
            this.icon = ICON_OPTIONS[0]?.value || '';
            this.cashId = this.allCashRegisters[0]?.id || '';
            this.type = '1';
            this.amount = null;
            this.currencyId = this.currencies.find(c => c.isDefault)?.id || this.currencies[0]?.id || '';
            this.categoryId = '';
            this.projectId = '';
            this.selectedClient = null;
            this.date = this.todayDate();
            this.note = '';
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (!newEditingItem) return;
            this.name = newEditingItem.name || '';
            this.icon = newEditingItem.icon || ICON_OPTIONS[0]?.value || '';
            this.cashId = newEditingItem.cashId || '';
            this.type = String(newEditingItem.type ?? 1);
            this.amount = newEditingItem.amount != null ? newEditingItem.amount : null;
            this.currencyId = newEditingItem.currencyId || '';
            this.categoryId = newEditingItem.categoryId || '';
            this.projectId = newEditingItem.projectId || '';
            this.selectedClient = newEditingItem.client || null;
            this.date = newEditingItem.date ? this.formatDateForInput(newEditingItem.date) : this.todayDate();
            this.note = newEditingItem.note || '';
        }
    }
};
</script>

<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editIncome') : $t('addIncome') }}</h2>
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
        
        <div v-show="currentTab === 'info'">
            <div class="mt-2">
                <label class="block mb-1 required">{{ $t('project') }}</label>
                <select v-model="selectedProjectId" required>
                    <option value="">{{ $t('no') }}</option>
                    <template v-if="allProjects.length">
                        <option v-for="project in allProjects" :key="project.id" :value="project.id">
                            {{ project.name }}
                        </option>
                    </template>
                </select>
            </div>

            <div class="mt-2">
                <label class="block mb-1 required">{{ $t('date') }}</label>
                <input type="datetime-local" v-model="date"
                    :disabled="editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                    :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 16) : null" />
            </div>

            <div class="flex items-center space-x-2">
                <div class="w-full mt-2">
                    <label class="required">{{ $t('amount') }}</label>
                    <input type="number" v-model="amount" required min="0.01" step="0.01">
                </div>
                <div class="w-full mt-2">
                    <label class="block mb-1 required">{{ $t('currency') }}</label>
                    <select v-model="currencyId" required>
                        <option value="">{{ $t('no') }}</option>
                        <template v-if="currencies.length">
                            <option v-for="parent in currencies" :key="parent.id" :value="parent.id">
                                {{ parent.symbol }} - {{ parent.name }}
                            </option>
                        </template>
                    </select>
                </div>
            </div>

            <div class="mt-2">
                <label>{{ $t('note') }}</label>
                <textarea v-model="note" rows="3" class="w-full p-2 border rounded"></textarea>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-times"
            :disabled="!$store.getters.hasPermission('transactions_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('transactions_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('transactions_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteIncome')" :confirm-text="$t('deleteIncome')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import ProjectTransactionDto from '@/dto/project/ProjectTransactionDto';
import AppController from '@/api/AppController';
import ProjectController from '@/api/ProjectController';
import ProjectTransactionController from '@/api/ProjectTransactionController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, TabBar },
    props: {
        editingItem: { type: ProjectTransactionDto, required: false, default: null },
        projectId: { type: [String, Number], required: false, default: null },
    },
    data() {
        return {
            selectedProjectId: this.editingItem ? this.editingItem.projectId : (this.projectId || ''),
            amount: this.editingItem ? this.editingItem.amount : 0,
            currencyId: this.editingItem ? this.editingItem.currencyId : '',
            note: this.editingItem ? this.editingItem.note : '',
            date: this.editingItem ? this.editingItem.date : new Date().toISOString().substring(0, 16),
            editingItemId: this.editingItem ? this.editingItem.id : null,
            currencies: [],
            allProjects: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'info' },
            ],
        }
    },
    computed: {
        translatedTabs() {
            return this.tabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        }
    },
    mounted() {
            this.$nextTick(async () => {
                await Promise.all([
                    this.fetchCurrencies(),
                    this.fetchAllProjects()
                ]);
                this.saveInitialState();
            });
        },
    methods: {
        formatDateForInput(dateString) {
            if (!dateString) return null;
            
            // Если дата уже в правильном формате, возвращаем как есть
            if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                return dateString;
            }
            
            // Конвертируем ISO дату в формат для datetime-local
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;
            
            // Возвращаем дату в формате YYYY-MM-DDTHH:MM
            return date.toISOString().substring(0, 16);
        },
        changeTab(tabName) {
            this.currentTab = tabName;
        },
        getFormState() {
            return {
                selectedProjectId: this.selectedProjectId,
                amount: this.amount,
                date: this.date,
                note: this.note,
                currencyId: this.currencyId
            };
        },
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async fetchAllProjects() {
            this.allProjects = await ProjectController.getAllItems();
        },
        async save() {
            this.saveLoading = true;

            try {
                if (this.editingItemId != null) {
                    var resp = await ProjectTransactionController.updateItem(
                        this.editingItemId,
                        {
                            project_id: this.selectedProjectId,
                            amount: this.amount,
                            currency_id: this.currencyId,
                            note: this.note,
                            date: this.date
                        });
                } else {
                    var resp = await ProjectTransactionController.storeItem({
                        project_id: this.selectedProjectId,
                        amount: this.amount,
                        currency_id: this.currencyId,
                        note: this.note,
                        date: this.date
                    });
                }
                if (resp.message) {
                    this.$emit('saved', resp)
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
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
                var resp = await ProjectTransactionController.deleteItem(this.editingItemId);
                if (resp.message || resp.success || resp) {
                    this.$emit('deleted');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.selectedProjectId = '';
            this.amount = 0;
            this.note = '';
            this.currencyId = '';
            this.date = new Date().toISOString().substring(0, 16);
            this.editingItemId = null;
            this.resetFormChanges();
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.selectedProjectId = newEditingItem.projectId || '';
                    this.amount = newEditingItem.amount || 0;
                    this.note = newEditingItem.note || '';
                    this.currencyId = newEditingItem.currencyId || '';
                    this.date = this.formatDateForInput(newEditingItem.date) || new Date().toISOString().substring(0, 16);
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.selectedProjectId = this.projectId || '';
                    this.amount = 0;
                    this.note = '';
                    this.currencyId = '';
                    this.date = new Date().toISOString().substring(0, 16);
                    this.editingItemId = null;
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        },
        projectId: {
            handler(newProjectId) {
                if (newProjectId && !this.editingItem) {
                    this.selectedProjectId = newProjectId;
                }
            },
            immediate: true
        },
    }
}
</script>

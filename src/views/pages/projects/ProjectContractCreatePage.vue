<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editContract') : $t('addContract') }}</h2>

        <div>
            <div v-if="!projectId">
                <label class="required">{{ $t('project') }}</label>
                <select v-model="selectedProjectId" :disabled="!!editingItem" required>
                    <option :value="null"></option>
                    <option v-for="project in projects" :key="project.id" :value="project.id">
                        {{ project.name }}
                    </option>
                </select>
            </div>
            <div>
                <label class="required">{{ $t('contractNumber') }}</label>
                <input type="text" v-model="number" :placeholder="$t('enterContractNumber')" required>
            </div>
            <div class="flex items-center space-x-2">
                <div class="w-full">
                    <label class="required">{{ $t('amount') }}</label>
                    <input type="number" v-model="amount" step="0.01" min="0" :placeholder="$t('enterAmount')" required>
                </div>
                <div class="w-full">
                    <label class="required">{{ $t('currency') }}</label>
                    <select v-model="currencyId">
                        <option value="">{{ $t('selectCurrency') }}</option>
                        <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                            {{ currency.symbol }} - {{ translateCurrency(currency.name, $t) }}
                        </option>
                    </select>
                </div>
            </div>
            <div>
                <label class="required">{{ $t('date') }}</label>
                <input type="datetime-local" v-model="date" required>
            </div>
            <div>
                <label>
                    <input type="checkbox" v-model="returned">
                    <span>{{ $t('contractReturned') }}</span>
                </label>
            </div>
            <div>
                <label>
                    <input type="checkbox" v-model="isPaid">
                    <span>{{ $t('paid') }}</span>
                </label>
            </div>
            <div>
                <label>{{ $t('note') }}</label>
                <textarea v-model="note" :placeholder="$t('enterNote')" rows="3"></textarea>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null && $store.getters.hasPermission('projects_delete')"
            :onclick="showDeleteDialog" :is-danger="true" :is-loading="deleteLoading" icon="fas fa-trash">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('deleteContract')"
        :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import ProjectContractController from '@/api/ProjectContractController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import notificationMixin from "@/mixins/notificationMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import dateFormMixin from "@/mixins/dateFormMixin";
import storeDataLoaderMixin from "@/mixins/storeDataLoaderMixin";
import { translateCurrency } from '@/utils/translationUtils';

export default {
    mixins: [getApiErrorMessage, formChangesMixin, notificationMixin, crudFormMixin, dateFormMixin, storeDataLoaderMixin],
    components: { /* FileUploader, */ PrimaryButton, AlertDialog },
    emits: ['saved', 'saved-error', 'close-request'],
    props: {
        editingItem: {
            type: Object,
            default: null
        },
        projectId: {
            type: [String, Number],
            required: false,
            default: null
        }
    },
    data() {
        return {
            number: this.editingItem ? this.editingItem.number : '',
            amount: this.editingItem ? this.editingItem.amount : '',
            currencyId: this.editingItem ? this.editingItem.currencyId : '',
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
            returned: this.editingItem ? this.editingItem.returned : false,
            isPaid: this.editingItem ? this.editingItem.isPaid : false,
            note: this.editingItem ? this.editingItem.note : '',
            currencies: [],
            projects: [],
            selectedProjectId: this.projectId || (this.editingItem ? this.editingItem.projectId : null),
        };
    },
    async mounted() {
        await this.fetchCurrencies();
        if (!this.projectId) {
            await this.fetchProjects();
        }
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    methods: {
        translateCurrency,
        clearForm() {
            this.number = '';
            this.amount = '';
            this.currencyId = '';
            this.date = new Date().toISOString().substring(0, 16);
            this.returned = false;
            this.isPaid = false;
            this.note = '';
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                let formattedDate = this.getCurrentLocalDateTime();
                if (newEditingItem.date) {
                    formattedDate = this.getFormattedDate(newEditingItem.date);
                }
                this.number = newEditingItem.number || '';
                this.amount = newEditingItem.amount || '';
                this.currencyId = newEditingItem.currencyId || '';
                this.date = formattedDate;
                this.returned = newEditingItem.returned || false;
                this.isPaid = newEditingItem.isPaid || false;
                this.note = newEditingItem.note || '';
                this.selectedProjectId = newEditingItem.projectId || null;
            }
        },
        getFormState() {
            return {
                number: this.number,
                amount: this.amount,
                currencyId: this.currencyId,
                date: this.date,
                returned: this.returned,
                isPaid: this.isPaid,
                note: this.note
            };
        },
        async fetchCurrencies() {
            await this.loadStoreData({
                getterName: 'currencies',
                dispatchName: 'loadCurrencies',
                localProperty: 'currencies',
                defaultValue: []
            });
        },
        async fetchProjects() {
            await this.loadStoreData({
                getterName: 'activeProjects',
                dispatchName: 'loadActiveProjects',
                localProperty: 'projects',
                defaultValue: []
            });
        },
        prepareSave() {
            const formData = {
                projectId: this.editingItemId ? this.editingItem.projectId : (this.projectId || this.selectedProjectId),
                number: this.number,
                amount: this.amount,
                currencyId: this.currencyId,
                date: this.date,
                returned: this.returned,
                isPaid: this.isPaid,
                note: this.note
            };

            const selectedCurrency = this.currencies.find(c => c.id == formData.currencyId);
            if (selectedCurrency) {
                formData.currencyName = this.translateCurrency(selectedCurrency.name, this.$t);
                formData.currencySymbol = selectedCurrency.symbol;
            }

            return formData;
        },
        async performSave(data) {
            if (this.editingItemId) {
                return await ProjectContractController.updateItem(this.editingItemId, data);
            } else {
                const finalProjectId = this.projectId || this.selectedProjectId;
                return await ProjectContractController.storeItem(finalProjectId, data);
            }
        },
        async performDelete() {
            const response = await ProjectContractController.deleteItem(this.editingItemId);
            if (!response.message) {
                throw new Error('Failed to delete contract');
            }
            return response;
        },
        onSaveSuccess(response) {
            this.$emit('saved', response.item);
            this.showNotification('Успех', response.message || 'Контракт успешно сохранен', false);
            if (!this.editingItemId) {
                this.clearForm();
            }
        },
        onDeleteSuccess(response) {
            this.showNotification('Успех', response.message || 'Контракт успешно удален', false);
            this.$emit('saved');
        },
        handleCloseRequest() {
            this.$emit('close-request');
        }
    }
};
</script>

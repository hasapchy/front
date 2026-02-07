<template>
    <div class="h-full flex flex-col">
        <div class="flex flex-col overflow-auto flex-1 p-4">
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
            <div v-if="type === 1">
                <label>{{ $t('name') }}</label>
                <input type="text" v-model="name" :placeholder="$t('name')">
            </div>
            <div>
                <label class="required">{{ $t('date') }}</label>
                <input type="date" v-model="date" required>
            </div>
            <div>
                <label class="required">{{ $t('contractType') }}</label>
                <select v-model="type" required>
                    <option :value="0">{{ $t('cashless') }}</option>
                    <option :value="1">{{ $t('cash') }}</option>
                </select>
            </div>
            <div>
                <label class="required">{{ $t('cashRegister') }}</label>
                <select v-model="cashId" required>
                    <option value="">{{ $t('selectCashRegister') }}</option>
                    <option v-for="cashRegister in filteredCashRegisters" :key="cashRegister.id" :value="cashRegister.id">
                        {{ cashRegister.name }} ({{ cashRegister.currencySymbol || '' }})
                    </option>
                </select>
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
                <label>{{ $t('note') }}</label>
                <textarea v-model="note" :placeholder="$t('enterNote')" rows="3"></textarea>
            </div>
        </div>
        </div>
        <div class="mt-auto p-4 flex space-x-2 bg-[#edf4fb]">
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
    </div>
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
    computed: {
        filteredCashRegisters() {
            if (this.type === undefined || this.type === null) {
                return this.cashRegisters;
            }
            const contractTypeIsCash = this.type === 1;
            return this.cashRegisters.filter(cashRegister => {
                return cashRegister.isCash === contractTypeIsCash;
            });
        }
    },
    data() {
        const initialType = this.editingItem ? (this.editingItem.type !== undefined ? this.editingItem.type : 0) : 0;
        return {
            number: this.editingItem ? this.editingItem.number : '',
            type: initialType,
            name: initialType === 1 && this.editingItem ? (this.editingItem.name || '') : '',
            amount: this.editingItem ? this.editingItem.amount : '',
            currencyId: this.editingItem ? this.editingItem.currencyId : '',
            cashId: this.editingItem ? (this.editingItem.cashId || '') : '',
            date: this.editingItem?.date ? this.getDateOnly(this.editingItem.date) : this.getCurrentLocalDateTime().substring(0, 10),
            returned: this.editingItem ? this.editingItem.returned : false,
            note: this.editingItem ? this.editingItem.note : '',
            currencies: [],
            cashRegisters: [],
            projects: [],
            selectedProjectId: this.projectId || (this.editingItem ? this.editingItem.projectId : null),
        };
    },
    async mounted() {
        await this.fetchCurrencies();
        await this.fetchCashRegisters();
        if (!this.projectId) {
            await this.fetchProjects();
        }
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    watch: {
        type(newType) {
            if (newType === 0) {
                this.name = '';
            }
            if (this.cashId) {
                const selectedCashRegister = this.cashRegisters.find(cr => cr.id == this.cashId);
                if (selectedCashRegister) {
                    const contractTypeIsCash = newType === 1;
                    if (selectedCashRegister.isCash !== contractTypeIsCash) {
                        this.cashId = '';
                    }
                } else {
                    this.cashId = '';
                }
            }
        },
        cashId(newCashId) {
            if (newCashId) {
                const cash = this.cashRegisters.find(c => c.id == newCashId);
                const cashCurrencyId = cash?.currencyId ?? cash?.currency_id;
                if (cashCurrencyId) {
                    this.currencyId = cashCurrencyId;
                }
            }
        }
    },
    methods: {
        translateCurrency,
        getDateOnly(date) {
            return this.getFormattedDate(date).substring(0, 10);
        },
        clearForm() {
            this.number = '';
            this.type = 0;
            this.name = '';
            this.amount = '';
            this.currencyId = '';
            this.cashId = '';
            this.date = this.getCurrentLocalDateTime().substring(0, 10);
            this.returned = false;
            this.note = '';
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                let formattedDate = this.getCurrentLocalDateTime().substring(0, 10);
                if (newEditingItem.date) {
                    formattedDate = this.getDateOnly(newEditingItem.date);
                }
                this.number = newEditingItem.number || '';
                this.type = newEditingItem.type !== undefined ? newEditingItem.type : 0;
                this.name = this.type === 1 ? (newEditingItem.name || '') : '';
                this.amount = newEditingItem.amount || '';
                this.currencyId = newEditingItem.currencyId || '';
                
                const contractTypeIsCash = (newEditingItem.type !== undefined ? newEditingItem.type : 0) === 1;
                if (newEditingItem.cashId && this.cashRegisters.length > 0) {
                    const selectedCashRegister = this.cashRegisters.find(cr => cr.id == newEditingItem.cashId);
                    if (selectedCashRegister && selectedCashRegister.isCash !== contractTypeIsCash) {
                        this.cashId = '';
                    } else {
                        this.cashId = newEditingItem.cashId || '';
                    }
                } else {
                    this.cashId = newEditingItem.cashId || '';
                }
                
                this.date = formattedDate;
                this.returned = newEditingItem.returned || false;
                this.note = newEditingItem.note || '';
                this.selectedProjectId = newEditingItem.projectId || null;
            }
        },
        getFormState() {
            const state = {
                number: this.number,
                type: this.type,
                amount: this.amount,
                currencyId: this.currencyId,
                cashId: this.cashId,
                date: this.date,
                returned: this.returned,
                note: this.note
            };
            if (this.type === 1) {
                state.name = this.name;
            }
            return state;
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
                dispatchName: 'loadProjects',
                localProperty: 'projects',
                defaultValue: []
            });
        },
        async fetchCashRegisters() {
            await this.loadStoreData({
                getterName: 'cashRegisters',
                dispatchName: 'loadCashRegisters',
                localProperty: 'cashRegisters',
                defaultValue: []
            });
        },
        prepareSave() {
            const formData = {
                projectId: (this.editingItemId && this.editingItem) ? this.editingItem.projectId : (this.projectId || this.selectedProjectId),
                number: this.number,
                type: this.type,
                amount: this.amount,
                currencyId: this.currencyId,
                cashId: this.cashId,
                date: this.date,
                returned: this.returned,
                note: this.note
            };
            if (this.type === 1) {
                formData.name = this.name;
            }

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

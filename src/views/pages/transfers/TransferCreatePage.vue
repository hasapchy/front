<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editTransfer') : $t('createTransfer') }}</h2>
        <div class="mt-2">
            <label class="block mb-1">{{ $t('senderCashRegister') }}</label>
            <select v-model="cashIdFrom" :disabled="!!editingItemId">
                <option value="">{{ $t('selectCashRegister') }}</option>
                <template v-if="allCashRegisters.length">
                    <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id"
                        :disabled="parent.id === cashIdTo">
                        {{ parent.name }} ({{ parent.currency_symbol || parent.currency_code || '' }})
                    </option>
                </template>
            </select>
        </div>
        <div class="mt-2">
            <label class="block mb-1">{{ $t('receiverCashRegister') }}</label>
            <select v-model="cashIdTo" :disabled="!!editingItemId">
                <option value="">{{ $t('selectCashRegister') }}</option>
                <template v-if="allCashRegisters.length">
                    <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id"
                        :disabled="parent.id === cashIdFrom">
                        {{ parent.name }} ({{ parent.currency_symbol || parent.currency_code || '' }})
                    </option>
                </template>
            </select>
        </div>
        <div class="mt-2">
            <label>{{ $t('amount') }}</label>
            <input type="number" v-model="origAmount" :disabled="!!editingItemId">
        </div>
        <div class="mt-2">
            <label>{{ $t('note') }}</label>
            <input type="text" v-model="note" :disabled="!!editingItemId">
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('transfers_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('transfers_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('transfers_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteTransfer')" :confirm-text="$t('deleteTransfer')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>


<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import AppController from '@/api/AppController';
import CashRegisterController from '@/api/CashRegisterController';
import TransferDto from '@/dto/transfer/TransferDto';
import TransferController from '@/api/TransferController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";


export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: TransferDto, required: false, default: null }
    },
    data() {
        return {
            type: this.editingItem ? this.editingItem.typeName() : "income",
            cashIdFrom: this.editingItem ? this.editingItem.cashFromId : '',
            cashIdTo: this.editingItem ? this.editingItem.cashToId : '',
            origAmount: this.editingItem ? this.editingItem.amount : 0,
            note: this.editingItem ? this.editingItem.note : '',
            cashAmount: this.editingItem ? this.editingItem.cashAmount : null,
            cashCurrencyId: this.editingItem ? this.editingItem.cashCurrencyId : null,
            currencyId: this.editingItem ? this.editingItem.origCurrencyId : '',
            date: this.editingItem ? this.editingItem.date : new Date().toISOString().substring(0, 16),
            editingItemId: this.editingItem ? this.editingItem.id : null,
            currencies: [],
            allCashRegisters: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllCashRegisters()
            ]);
            
            if (!this.editingItem) {
                if (this.allCashRegisters.length > 0) {
                    if (!this.cashIdFrom) {
                        this.cashIdFrom = this.allCashRegisters[0].id;
                    }
                    if (!this.cashIdTo && this.allCashRegisters.length > 1) {
                        this.cashIdTo = this.allCashRegisters[1].id;
                    }
                }
            }
            
            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                cashIdFrom: this.cashIdFrom,
                cashIdTo: this.cashIdTo,
                origAmount: this.origAmount,
                date: this.date,
                note: this.note,
                currencyId: this.currencyId
            };
        },
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async fetchAllCashRegisters() {
            this.allCashRegisters = await CashRegisterController.getAllItems();
        },
        async save() {
            this.saveLoading = true;
            try {
                var resp = await TransferController.storeItem({
                    cash_id_from: this.cashIdFrom,
                    cash_id_to: this.cashIdTo,
                    amount: this.origAmount,
                    note: this.note
                });
                if (resp.message) {
                    this.$emit('saved');
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
                const resp = await TransferController.deleteItem(this.editingItemId);
                if (resp.message) {
                    this.$emit('deleted');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.type = "income";
            this.cashIdFrom = '';
            this.cashIdTo = '';
            this.origAmount = 0;
            this.note = '';
            this.currencyId = '';
            this.editingItemId = null;
            this.resetFormChanges();
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.cashIdFrom = newEditingItem.cashFromId;
                    this.cashIdTo = newEditingItem.cashToId;
                    this.origAmount = newEditingItem.amount;
                    this.note = newEditingItem.note;
                    this.cashAmount = newEditingItem.cashAmount;
                    this.cashCurrencyId = newEditingItem.cashCurrencyId;
                    this.currencyId = newEditingItem.origCurrencyId;
                    this.editingItemId = newEditingItem.id;
                } else {
                    this.clearForm();
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        },

    }
}
</script>
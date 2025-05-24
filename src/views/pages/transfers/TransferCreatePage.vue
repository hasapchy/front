<template>
    <div class="flex flex-col overflow-auto p-4">
        <h2 class="text-lg font-bold mb-4">Трансфер</h2>
        <div class="mt-2">
            <label class="block mb-1">Касса отправитель</label>
            <select v-model="cashIdFrom" :disabled="!!editingItemId">
                <option value="">-- Выберите кассу --</option>
                <option v-if="allCashRegisters.length" v-for="parent in allCashRegisters" :value="parent.id">{{
                    parent.name
                    }}
                </option>
            </select>
        </div>
        <div class="mt-2">
            <label class="block mb-1">Касса получатель</label>
            <select v-model="cashIdTo" :disabled="!!editingItemId">
                <option value="">-- Выберите кассу --</option>
                <option v-if="allCashRegisters.length" v-for="parent in allCashRegisters" :value="parent.id">{{
                    parent.name
                    }}
                </option>
            </select>
        </div>
        <div class="mt-2">
            <label>Сумма</label>
            <input type="number" v-model="origAmount" :disabled="!!editingItemId">
        </div>
        <div class="mt-2">
            <label>Примечание</label>
            <input type="text" v-model="note" :disabled="!!editingItemId">
        </div>
        <!-- <div v-if="cashCurrencyId != currencyId && editingItemId" class="flex items-center space-x-2">
        <div class="w-full mt-2">
            <label>Сконвертированная сумма</label>
            <input type="number" v-model="cashAmount" :disabled="!!editingItemId">
        </div>
        <div class="w-full mt-2">
            <label class="block mb-1">Валюта кассы</label>
            <select v-model="cashCurrencyId" :disabled="!!editingItemId">
                <option value="">Нет</option>
                <option v-if="currencies.length" v-for="parent in currencies" :value="parent.id">{{ parent.symbol }} -
                    {{ parent.name }}
                </option>
            </select>
        </div>
    </div> -->
    </div>
    <!-- {{ editingItem.id }} -->
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление трансфера'" :confirm-text="'Удалить трфнсфер'" :leave-text="'Отмена'" />
</template>


<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import AppController from '@/api/AppController';
import CashRegisterController from '@/api/CashRegisterController';
import TransferDto from '@/dto/transfer/TransferDto';
import TransferController from '@/api/TransferController';


export default {
    components: {
        PrimaryButton,
        AlertDialog
    },
    props: {
        editingItem: {
            type: TransferDto,
            required: false,
            default: null
        }
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
    created() {
        this.fetchCurrencies();
        this.fetchAllCashRegisters();
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async fetchAllCashRegisters() {
            this.allCashRegisters = await CashRegisterController.getAllItems();
        },
        async save() {
            this.saveLoading = true;
            try {
                //     if (this.editingItemId != null) {
                //         var resp = await TransactionController.updateItem(
                //             this.editingItemId,
                //             {
                //                 category_id: this.categoryId,
                //                 project_id: this.projectId,
                //                 date: this.date,
                //                 client_id: this.selectedClient?.id
                //             });
                //     } else {
                var resp = await TransferController.storeItem({
                    cash_id_from: this.cashIdFrom,
                    cash_id_to: this.cashIdTo,
                    amount: this.origAmount,
                    note: this.note
                });
                //     }
                if (resp.message) {
                    this.$emit('saved');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', error);
            }
            this.saveLoading = false;

        },
        async deleteItem() {
            // this.closeDeleteDialog();
            // if (this.editingItemId == null) {
            //     return;
            // }
            // this.deleteLoading = true;
            // try {
            //     var resp = await CategoryController.deleteItem(
            //         this.editingItemId);
            //     if (resp.message) {
            //         this.$emit('deleted');
            //         this.clearForm();
            //     }
            // } catch (error) {
            //     this.$emit('deleted-error', error);
            // }
            // this.deleteLoading = false;
        },
        clearForm() {
            this.type = "income";
            this.cashIdFrom = '';
            this.cashIdTo = '';
            this.origAmount = 0;
            this.note = '';
            this.currencyId = '';
            this.editingItemId = null;
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
            },
            deep: true,
            immediate: true
        },

    }
}

</script>
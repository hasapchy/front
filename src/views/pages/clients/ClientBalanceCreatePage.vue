<template>
    <div class="flex flex-col h-full">
        <div class="flex flex-col overflow-auto h-full p-4 pb-24">
            <h2 class="text-lg font-bold mb-4">{{ editingItem ? ($t('editBalance') || 'Редактирование баланса') : ($t('createBalance') || 'Создание баланса') }}</h2>
            <div>
                <div>
                    <label>{{ $t('currency') || 'Валюта' }}</label>
                    <select v-model="selectedCurrencyId" :disabled="!!editingItem">
                        <option :value="null">{{ $t('selectCurrency') || 'Выберите валюту' }}</option>
                        <option 
                            v-for="currency in availableCurrencies" 
                            :key="currency.id" 
                            :value="currency.id">
                            {{ currency.symbol }} - {{ currency.name }}
                        </option>
                    </select>
                </div>
                <div v-if="editingItem">
                    <label>{{ $t('balance') || 'Баланс' }}</label>
                    <input type="text" :value="formatBalance(editingItem.balance)" readonly :class="{
                        'text-[#5CB85C]': editingItem.balance > 0,
                        'text-[#EE4F47]': editingItem.balance < 0,
                        'text-[#337AB7]': editingItem.balance == 0
                    }" />
                </div>
                <div v-if="!editingItem">
                    <label>{{ $t('initialBalance') || 'Начальный баланс' }}</label>
                    <input type="number" step="0.01" v-model.number="initialBalance" />
                </div>
                <div>
                    <label>{{ $t('note') || 'Примечание' }}</label>
                    <textarea v-model="note" class="w-full" rows="3"></textarea>
                </div>
                <div>
                    <label class="flex items-center space-x-2">
                        <input 
                            type="checkbox" 
                            v-model="isDefault"
                            :disabled="editingItem?.isDefault || !canUpdateBalance"
                            class="mr-2" />
                        <span>{{ $t('setAsDefault') || 'Установить как дефолтный' }}</span>
                    </label>
                </div>
                <div class="mt-4">
                    <label class="inline-flex items-center gap-1 mb-1">
                        <span>{{ $t('balanceVisibleToEmployees') || 'Виден сотрудникам' }}</span>
                        <FieldHint
                            :text="$t('balanceVisibleToEmployeesHint') || 'Если никого не выбрать — баланс виден всем. Если выбрать сотрудников — только они смогут видеть этот баланс.'"
                            placement="top" />
                    </label>
                    <UserSearch
                        :selectedUsers="selectedUsers"
                        @update:selectedUsers="selectedUsers = $event"
                        :multiple="true" />
                </div>
            </div>
        </div>
        
        <div class="fixed bottom-0 left-0 right-0 p-4 flex space-x-2 bg-[#edf4fb] border-t border-gray-200 z-10">
            <PrimaryButton 
                v-if="editingItem"
                :onclick="showDeleteDialog"
                :isDanger="true"
                :is-loading="deleteLoading"
                icon="fas fa-trash"
                :disabled="!canDeleteBalance || editingItem.isDefault">
            </PrimaryButton>
            <PrimaryButton 
                :onclick="save"
                :is-loading="saveLoading"
                icon="fas fa-save"
                :disabled="!initialClient || !isFormValid || (editingItem && !canUpdateBalance) || (!editingItem && !canCreateBalance)">
            </PrimaryButton>
        </div>
        
        <AlertDialog 
            :dialog="deleteDialog" 
            @confirm="deleteItem" 
            @leave="closeDeleteDialog"
            :descr="$t('confirmDeleteBalance') || 'Вы уверены, что хотите удалить баланс?'"
            :confirm-text="$t('delete') || 'Удалить'"
            :leave-text="$t('cancel') || 'Отмена'" />
        
        <AlertDialog 
            :dialog="confirmationDialog" 
            @confirm="confirmAction" 
            @leave="cancelAction"
            :descr="confirmationMessage"
            :confirm-text="$t('yes') || 'Да'"
            :leave-text="$t('cancel') || 'Отмена'" />
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import ClientBalanceDto from '@/dto/client/ClientBalanceDto';
import ClientController from '@/api/ClientController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudFormMixin from '@/mixins/crudFormMixin';

export default {
    mixins: [getApiErrorMessage, notificationMixin, crudFormMixin],
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    components: {
        PrimaryButton,
        AlertDialog,
        UserSearch,
        FieldHint,
    },
    props: {
        editingItem: {
            type: Object,
            default: null,
            validator: function(value) {
                return value === null || (value && typeof value === 'object' && value.id !== undefined);
            }
        },
        initialClient: {
            type: Object,
            default: null,
            validator: function(value) {
                return value === null || (value && typeof value === 'object' && value.id !== undefined);
            }
        }
    },
    data() {
        const userIds = this.editingItem && this.editingItem.getUserIds
            ? this.editingItem.getUserIds()
            : (this.editingItem?.users || []).map(u => (typeof u === 'object' && u?.id != null) ? u.id : u).filter(Boolean);
        return {
            selectedCurrencyId: this.editingItem ? this.editingItem.currencyId : null,
            isDefault: this.editingItem ? this.editingItem.isDefault : false,
            initialBalance: 0,
            note: this.editingItem ? (this.editingItem.note || '') : '',
            selectedUsers: userIds,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            editingItemId: this.editingItem?.id || null,
            confirmationDialog: false,
            confirmationMessage: '',
            confirmationResolve: null
        };
    },
    computed: {
        availableCurrencies() {
            return this.$store.getters.currencies || [];
        },
        canCreateBalance() {
            return this.$store.getters.hasPermission('client_balances_create');
        },
        canUpdateBalance() {
            return this.$store.getters.hasPermission('client_balances_update_all');
        },
        canDeleteBalance() {
            return this.$store.getters.hasPermission('client_balances_delete_all');
        },
        isFormValid() {
            if (this.editingItem) {
                return true;
            }
            return !!this.selectedCurrencyId;
        }
    },
    async mounted() {
        if (!this.$store.getters.currencies?.length) {
            await this.$store.dispatch('loadCurrencies');
        }
    },
    watch: {
        editingItem: {
            handler(newItem) {
                if (newItem) {
                    this.note = newItem.note || '';
                    const userIds = newItem.getUserIds ? newItem.getUserIds() : (newItem.users || []).map(u => (typeof u === 'object' && u?.id != null) ? u.id : u).filter(Boolean);
                    this.selectedUsers = userIds;
                } else {
                    this.note = '';
                    this.selectedUsers = [];
                }
            },
            immediate: true
        }
    },
    methods: {
        formatBalance(balance) {
            return this.$formatNumber(balance, null, true);
        },
        async save() {
            if (!this.isFormValid) return;
            
            this.saveLoading = true;
            try {
                await this.performSave();
            } catch (error) {
                this.onSaveError(error);
            } finally {
                this.saveLoading = false;
            }
        },
        getSelectedUserIds() {
            if (Array.isArray(this.selectedUsers)) {
                return this.selectedUsers.map(u => (typeof u === 'object' && u?.id != null) ? u.id : u).filter(Boolean);
            }
            return [];
        },
        async performSave() {
            if (!this.initialClient?.id) return;
            const userIds = this.getSelectedUserIds();
            if (this.editingItemId) {
                const result = await ClientController.updateClientBalance(
                    this.initialClient.id,
                    this.editingItemId,
                    { is_default: this.isDefault, note: this.note, user_ids: userIds }
                );
                
                if (result.requires_confirmation) {
                    const confirmed = await this.showConfirmationDialog(
                        result.message || (this.$t('confirmSetDefaultBalance') || 'Вы уверены, что хотите установить этот баланс как дефолтный?')
                    );
                    
                    if (confirmed) {
                        await ClientController.updateClientBalance(
                            this.initialClient.id,
                            this.editingItemId,
                            { is_default: true, skip_confirmation: true, note: this.note, user_ids: userIds }
                        );
                    } else {
                        return;
                    }
                }
            } else {
                await ClientController.createClientBalance(
                    this.initialClient.id,
                    this.selectedCurrencyId,
                    this.isDefault,
                    this.initialBalance,
                    this.note,
                    userIds
                );
            }
            
            this.$emit('saved');
        },
        onSaveError(error) {
            const errorMessage = this.getApiErrorMessage(error);
            const errorText = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
            this.showNotification(
                this.$t('error') || 'Ошибка',
                errorText,
                true
            );
            this.$emit('saved-error', error);
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        async deleteItem() {
            if (!this.editingItemId || !this.initialClient?.id) return;
            
            this.deleteLoading = true;
            try {
                await ClientController.deleteClientBalance(
                    this.initialClient.id,
                    this.editingItemId
                );
                
                this.showNotification(
                    this.$t('success') || 'Успешно',
                    this.$t('balanceDeleted') || 'Баланс удален успешно',
                    false
                );
                
                this.closeDeleteDialog();
                this.$emit('deleted');
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                const errorText = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
                this.showNotification(
                    this.$t('error') || 'Ошибка',
                    errorText,
                    true
                );
                this.closeDeleteDialog();
                this.$emit('deleted-error', error);
            } finally {
                this.deleteLoading = false;
            }
        },
        async showConfirmationDialog(message) {
            return new Promise((resolve) => {
                this.confirmationMessage = message;
                this.confirmationResolve = resolve;
                this.confirmationDialog = true;
            });
        },
        confirmAction() {
            this.confirmationDialog = false;
            if (this.confirmationResolve) {
                this.confirmationResolve(true);
                this.confirmationResolve = null;
            }
        },
        cancelAction() {
            this.confirmationDialog = false;
            if (this.confirmationResolve) {
                this.confirmationResolve(false);
                this.confirmationResolve = null;
            }
        }
    }
};
</script>

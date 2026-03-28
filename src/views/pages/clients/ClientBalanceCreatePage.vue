<template>
  <div class="flex flex-col h-full">
    <div class="flex flex-col overflow-auto h-full p-4 pb-24">
      <h2 class="text-lg font-bold mb-4">
        {{ editingItem ? $t('editBalance') : $t('createBalance') }}
      </h2>
      <div>
        <div>
          <label>{{ $t('currency') }}</label>
          <select
            v-model="selectedCurrencyId"
            :disabled="!!editingItem"
          >
            <option :value="null">
              {{ $t('selectCurrency') }}
            </option>
            <option 
              v-for="currency in availableCurrencies" 
              :key="currency.id" 
              :value="currency.id"
            >
              {{ currency.symbol }} - {{ currency.name }}
            </option>
          </select>
        </div>
        <div>
          <label>{{ $t('type') }}</label>
          <select v-model.number="balanceType">
            <option :value="0">
              {{ $t('salaryPaymentTypeNonCash') }}
            </option>
            <option :value="1">
              {{ $t('salaryPaymentTypeCash') }}
            </option>
          </select>
        </div>
        <div v-if="editingItem">
          <label>{{ $t('balance') }}</label>
          <input
            type="text"
            :value="formatBalance(editingItem.balance)"
            readonly
            :class="{
              'text-[#5CB85C]': editingItem.balance > 0,
              'text-[#EE4F47]': editingItem.balance < 0,
              'text-[#337AB7]': editingItem.balance == 0
            }"
          >
        </div>
        <div v-if="!editingItem">
          <label>{{ $t('initialBalance') }}</label>
          <input
            v-model.number="initialBalance"
            type="number"
            step="0.01"
          >
        </div>
        <div>
          <label>{{ $t('note') }}</label>
          <textarea
            v-model="note"
            class="w-full"
            rows="3"
          />
        </div>
        <div>
          <label class="flex items-center space-x-2">
            <input 
              v-model="isDefault" 
              type="checkbox"
              :disabled="editingItem?.isDefault || !canUpdateBalance"
              class="mr-2"
            >
            <span>{{ $t('setAsDefault') }}</span>
          </label>
        </div>
        <div class="mt-4">
          <label class="inline-flex items-center gap-1 mb-1">
            <span>{{ $t('balanceVisibleToEmployees') }}</span>
            <FieldHint
              :text="$t('balanceVisibleToEmployeesHint')"
              placement="top"
            />
          </label>
          <UserSearch
            :selected-users="selectedUsers"
            :multiple="true"
            @update:selected-users="selectedUsers = $event"
          />
        </div>
      </div>
    </div>
        
    <div class="fixed bottom-0 left-0 right-0 p-4 flex space-x-2 bg-[#edf4fb] border-t border-gray-200 z-10">
      <PrimaryButton 
        v-if="editingItem"
        :onclick="showDeleteDialog"
        :is-danger="true"
        :is-loading="deleteLoading"
        icon="fas fa-trash"
        :disabled="!canDeleteBalance || editingItem.isDefault"
      />
      <PrimaryButton 
        :onclick="save"
        :is-loading="saveLoading"
        icon="fas fa-save"
        :disabled="!initialClient || !isFormValid || (editingItem && !canUpdateBalance) || (!editingItem && !canCreateBalance)"
      />
    </div>
        
    <AlertDialog 
      :dialog="deleteDialog" 
      :descr="$t('confirmDeleteBalance')" 
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="deleteItem"
      @leave="closeDeleteDialog"
    />
        
    <AlertDialog 
      :dialog="confirmationDialog" 
      :descr="confirmationMessage" 
      :confirm-text="$t('yes')"
      :leave-text="$t('cancel')"
      @confirm="confirmAction"
      @leave="cancelAction"
    />
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
    components: {
        PrimaryButton,
        AlertDialog,
        UserSearch,
        FieldHint,
    },
    mixins: [getApiErrorMessage, notificationMixin, crudFormMixin],
    props: {
        editingItem: {
            type: Object,
            default: null,
            validator: function(value) {
                return value === null || (value && value.id !== undefined);
            }
        },
        initialClient: {
            type: Object,
            default: null,
            validator: function(value) {
                return value === null || (value && value.id !== undefined);
            }
        }
    },
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    data() {
        const userIds = this.editingItem && this.editingItem.getUserIds
            ? this.editingItem.getUserIds()
            : (this.editingItem?.users || []).map(u => (u?.id != null ? u.id : u)).filter(Boolean);
        return {
            selectedCurrencyId: this.editingItem ? this.editingItem.currencyId : null,
            balanceType: this.editingItem ? (Number(this.editingItem.type) === 0 ? 0 : 1) : 1,
            isDefault: this.editingItem ? this.editingItem.isDefault : false,
            initialBalance: 0,
            note: this.editingItem ? (this.editingItem.note ) : '',
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
    watch: {
        editingItem: {
            handler(newItem) {
                if (newItem) {
                    this.balanceType = Number(newItem.type) === 0 ? 0 : 1;
                    this.note = newItem.note ;
                    const userIds = newItem.getUserIds ? newItem.getUserIds() : (newItem.users || []).map(u => (u?.id != null ? u.id : u)).filter(Boolean);
                    this.selectedUsers = userIds;
                } else {
                    this.balanceType = 1;
                    this.note = '';
                    this.selectedUsers = [];
                }
            },
            immediate: true
        }
    },
    async mounted() {
        if (!this.$store.getters.currencies?.length) {
            await this.$store.dispatch('loadCurrencies');
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
                return this.selectedUsers.map(u => (u?.id != null ? u.id : u)).filter(Boolean);
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
                    { type: this.balanceType, isDefault: this.isDefault, note: this.note, creatorIds: userIds }
                );
                
                if (result.requires_confirmation) {
                    const confirmed = await this.showConfirmationDialog(
                        result.message || this.$t('confirmSetDefaultBalance')
                    );
                    
                    if (confirmed) {
                        await ClientController.updateClientBalance(
                            this.initialClient.id,
                            this.editingItemId,
                            { type: this.balanceType, isDefault: true, skipConfirmation: true, note: this.note, creatorIds: userIds }
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
                    this.balanceType,
                    userIds
                );
            }
            
            this.$emit('saved');
        },
        onSaveError(error) {
            const errorMessage = this.getApiErrorMessage(error);
            const errorText = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
            this.showNotification(
                this.$t('error'),
                errorText,
                true
            );
            this.emitSavedError(error);
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
                    this.$t('success'),
                    this.$t('balanceDeleted'),
                    false
                );
                
                this.closeDeleteDialog();
                this.$emit('deleted');
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                const errorText = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
                this.showNotification(
                    this.$t('error'),
                    errorText,
                    true
                );
                this.closeDeleteDialog();
                this.emitDeletedError(error);
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

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex min-h-0 flex-1 flex-col overflow-auto p-4">
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
        
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
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
    </teleport>
        
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
import ClientController from '@/api/ClientController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

export default {
    components: {
        PrimaryButton,
        AlertDialog,
        UserSearch,
        FieldHint,
    },
    mixins: [getApiErrorMessage, notificationMixin, crudFormMixin, sideModalFooterPortal],
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
        getFormState() {
            return {
                selectedCurrencyId: this.selectedCurrencyId,
                balanceType: this.balanceType,
                isDefault: this.isDefault,
                initialBalance: this.initialBalance,
                note: this.note,
                selectedUsers: [...(this.selectedUsers || [])],
                editingItemId: this.editingItemId,
            };
        },
        getSelectedUserIds() {
            if (Array.isArray(this.selectedUsers)) {
                return this.selectedUsers.map(u => (u?.id != null ? u.id : u)).filter(Boolean);
            }
            return [];
        },
        prepareSave() {
            if (!this.isFormValid || !this.initialClient?.id) {
                throw new Error(this.$t('allRequiredFieldsMustBeFilled'));
            }
            return {
                clientId: this.initialClient.id,
                editingItemId: this.editingItemId,
                balanceType: this.balanceType,
                isDefault: this.isDefault,
                note: this.note,
                userIds: this.getSelectedUserIds(),
                selectedCurrencyId: this.selectedCurrencyId,
                initialBalance: this.initialBalance,
            };
        },
        async performSave(data) {
            if (data.editingItemId) {
                const result = await ClientController.updateClientBalance(
                    data.clientId,
                    data.editingItemId,
                    { type: data.balanceType, isDefault: data.isDefault, note: data.note, creatorIds: data.userIds }
                );
                if (result.requires_confirmation) {
                    const confirmed = await this.showConfirmationDialog(
                        result.message || this.$t('confirmSetDefaultBalance')
                    );
                    if (confirmed) {
                        await ClientController.updateClientBalance(
                            data.clientId,
                            data.editingItemId,
                            { type: data.balanceType, isDefault: true, skipConfirmation: true, note: data.note, creatorIds: data.userIds }
                        );
                    } else {
                        return null;
                    }
                }
            } else {
                await ClientController.createClientBalance(
                    data.clientId,
                    data.selectedCurrencyId,
                    data.isDefault,
                    data.initialBalance,
                    data.note,
                    data.balanceType,
                    data.userIds
                );
            }
            return { message: 'ok' };
        },
        async save() {
            if (!this.isFormValid) return;
            this.saveLoading = true;
            try {
                const payload = this.prepareSave();
                const resp = await this.performSave(payload);
                if (resp == null) return;
                this.$emit('saved');
            } catch (error) {
                this.onSaveError(error);
            } finally {
                this.saveLoading = false;
            }
        },
        async performDelete() {
            if (!this.editingItemId || !this.initialClient?.id) {
                throw new Error('Invalid delete');
            }
            await ClientController.deleteClientBalance(this.initialClient.id, this.editingItemId);
            return { message: 'ok' };
        },
        onDeleteSuccess() {
            this.showNotification(
                this.$t('success'),
                this.$t('balanceDeleted'),
                false
            );
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
        onDeleteError(error) {
            const errorMessage = this.getApiErrorMessage(error);
            const errorText = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
            this.showNotification(
                this.$t('error'),
                errorText,
                true
            );
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

<template>
  <div class="flex flex-col overflow-auto h-full p-4">
    <div class="space-y-4">
      <div>
        <label class="required">{{ $t('name') }}</label>
        <input
          v-model="name"
          type="text"
        >
      </div>
      <div>
        <label class="required">{{ $t('type') }}</label>
        <select v-model="type">
          <option value="1">
            {{ $t('income') }}
          </option>
          <option value="0">
            {{ $t('expense') }}
          </option>
        </select>
      </div>
    </div>
  </div>
  <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
    <PrimaryButton
      v-if="editingItem != null"
      :onclick="showDeleteDialog"
      :is-danger="true"
      :is-loading="deleteLoading"
      icon="fas fa-trash"
      :disabled="!$store.getters.hasPermission('transaction_categories_delete')"
    />
    <PrimaryButton
      icon="fas fa-save"
      :onclick="save"
      :is-loading="saveLoading"
      :disabled="!canSave"
      :aria-label="$t('save')"
    />
  </div>
  <AlertDialog
    :dialog="deleteDialog"
    :descr="$t('deleteTransactionCategory')"
    :confirm-text="$t('deleteTransactionCategory')"
    :leave-text="$t('cancel')"
    @confirm="deleteItem"
    @leave="closeDeleteDialog"
  />
  <AlertDialog
    :dialog="closeConfirmDialog"
    :descr="$t('unsavedChanges')"
    :confirm-text="$t('closeWithoutSaving')"
    :leave-text="$t('stay')"
    @confirm="confirmClose"
    @leave="cancelClose"
  />
</template>

<script>
import TransactionCategoryController from '@/api/TransactionCategoryController';
import TransactionCategoryDto from '@/dto/transaction/TransactionCategoryDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";

export default {
    components: { PrimaryButton, AlertDialog },
    mixins: [getApiErrorMessage, crudFormMixin],
    props: {
        editingItem: { type: TransactionCategoryDto, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            type: this.editingItem ? (this.editingItem.type ? '1' : '0') : '1',
        }
    },
    computed: {
        canSave() {
            if (this.editingItemId != null) {
                return this.$store.getters.hasPermission('transaction_categories_update');
            } else {
                return this.$store.getters.hasPermission('transaction_categories_create');
            }
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                name: this.name,
                type: this.type
            };
        },
        prepareSave() {
            return {
                name: this.name,
                type: this.type === '1'
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await TransactionCategoryController.updateItem(this.editingItemId, data);
            } else {
                return await TransactionCategoryController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await TransactionCategoryController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete transaction category');
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
            this.type = '1';
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.name = newEditingItem.name ;
            this.type = newEditingItem.type ? '1' : '0';
        }
    }
}
</script>

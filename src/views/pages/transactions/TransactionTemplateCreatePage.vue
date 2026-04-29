<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex min-h-0 flex-1 flex-col overflow-auto p-4">
      <h3
        v-if="showHeading"
        class="text-base font-semibold mb-4 shrink-0"
      >
        {{ editingItem ? $t('editTransactionTemplate') : $t('createTransactionTemplate') }}
      </h3>
      <div>
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <label class="block mb-1 required">{{ $t('name') }}</label>
            <input v-model="name" type="text" class="w-full">
          </div>
          <div class="flex-1">
            <label class="block mb-1 required">{{ $t('icon') }}</label>
            <select v-model="icon" class="w-full">
              <option value="">
                {{ $t('no') }}
              </option>
              <option v-for="opt in iconOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="mt-2">
          <ClientSearch v-model:selected-client="selectedClient" :show-label="true" :required="false" />
        </div>
        <div class="mt-2">
          <label class="block mb-1 required">{{ $t('type') }}</label>
          <select v-model="type" class="w-full" required>
            <option value="1">
              {{ $t('income') }}
            </option>
            <option value="0">
              {{ $t('expense') }}
            </option>
          </select>
        </div>
        <div class="mt-2">
          <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
          <select v-model="cashId" class="w-full" required>
            <option value="">
              {{ $t('no') }}
            </option>
            <option v-for="c in allCashRegisters" :key="c.id" :value="c.id">
              {{ c.displayName || c.name }} ({{ c.currencySymbol }})
            </option>
          </select>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <div class="w-full">
            <label class="block mb-1">{{ $t('amountBeforeConversion') }}</label>
            <FormattedDecimalInput
              v-model="amount"
              variant="amount"
              class="w-full"
              min="0"
            />
          </div>
          <div class="w-full">
            <label class="block mb-1">{{ $t('currency') }}</label>
            <select v-model="currencyId" class="w-full">
              <option value="">
                {{ $t('no') }}
              </option>
              <option v-for="c in currencies" :key="c.id" :value="c.id">
                {{ c.symbol }} - {{ c.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="mt-2">
          <label class="block mb-1">{{ $t('category') }}</label>
          <TransactionCategoryTreeSelect v-model="categoryId" :categories="filteredCategories" :allow-empty="true"
            :required="false" />
        </div>
        <div class="mt-2">
          <label class="block mb-1">{{ $t('project') }}</label>
          <select v-model="projectId" class="w-full">
            <option value="">
              {{ $t('no') }}
            </option>
            <option v-for="p in allProjects" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>
        <div class="mt-2">
          <label class="block mb-1">{{ $t('note') }}</label>
          <input v-model="note" type="text" class="w-full">
        </div>
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
          :is-loading="deleteLoading" icon="fas fa-trash" :disabled="!canDelete" />
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading"
          :disabled="!name || !icon || !cashId || (editingItemId != null && !canUpdate) || (editingItemId == null && !canCreate)"
          :aria-label="$t('save')" />
      </div>
    </teleport>
    <AlertDialog :dialog="deleteDialog" :descr="$t('confirmDelete')" :confirm-text="$t('delete')"
      :leave-text="$t('cancel')" @confirm="deleteItem" @leave="closeDeleteDialog" />
    <AlertDialog :dialog="closeConfirmDialog" :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')" @confirm="confirmClose" @leave="cancelClose" />
  </div>
</template>

<script>
import TransactionTemplateController from '@/api/TransactionTemplateController';
import TransactionTemplateDto from '@/dto/transaction/TransactionTemplateDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import { ICON_OPTIONS } from '@/constants/cashIconOptions';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import TransactionCategoryTreeSelect from '@/views/components/transactions/TransactionCategoryTreeSelect.vue';
export default {
  components: { PrimaryButton, AlertDialog, ClientSearch, TransactionCategoryTreeSelect },
  mixins: [getApiErrorMessage, crudFormMixin, storeDataLoaderMixin, sideModalFooterPortal],
  props: {
    editingItem: { type: TransactionTemplateDto, required: false, default: null },
    showHeading: { type: Boolean, default: false },
  },
  emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
  data() {
    return {
      name: this.editingItem ? this.editingItem.name : '',
      icon: this.editingItem ? this.editingItem.icon : (ICON_OPTIONS[0]?.value),
      cashId: this.editingItem ? this.editingItem.cashId : '',
      type: this.editingItem ? String(this.editingItem.type) : '1',
      amount: this.editingItem != null && this.editingItem.amount != null ? this.editingItem.amount : null,
      currencyId: this.editingItem ? this.editingItem.currencyId : '',
      categoryId: this.editingItem ? this.editingItem.categoryId : '',
      projectId: this.editingItem ? this.editingItem.projectId : '',
      selectedClient: this.editingItem ? this.editingItem.client : null,
      note: this.editingItem ? this.editingItem.note : '',
      allCashRegisters: [],
      currencies: [],
      allCategories: [],
      allProjects: [],
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
        note: this.note
      };
    },
    prepareSave() {
      const payload = {
        name: this.name,
        icon: this.icon,
        cashId: this.cashId,
        type: parseInt(this.type, 10),
        amount: this.amount != null && this.amount !== '' ? parseFloat(this.amount) : null,
        currencyId: this.currencyId || null,
        categoryId: this.categoryId || null,
        projectId: this.projectId || null,
        clientId: this.selectedClient?.id || null,
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
      this.icon = ICON_OPTIONS[0]?.value;
      this.cashId = this.allCashRegisters[0]?.id;
      this.type = '1';
      this.amount = null;
      this.currencyId = this.currencies.find(c => c.isDefault)?.id || this.currencies[0]?.id;
      this.categoryId = '';
      this.projectId = '';
      this.selectedClient = null;
      this.note = '';
      if (this.resetFormChanges) {
        this.resetFormChanges();
      }
    },
    onEditingItemChanged(newEditingItem) {
      if (!newEditingItem) return;
      this.name = newEditingItem.name;
      this.icon = newEditingItem.icon || ICON_OPTIONS[0]?.value;
      this.cashId = newEditingItem.cashId;
      this.type = String(newEditingItem.type ?? 1);
      this.amount = newEditingItem.amount != null ? newEditingItem.amount : null;
      this.currencyId = newEditingItem.currencyId;
      this.categoryId = newEditingItem.categoryId;
      this.projectId = newEditingItem.projectId;
      this.selectedClient = newEditingItem.client || null;
      this.note = newEditingItem.note;
    }
  }
};
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex min-h-0 flex-1 flex-col overflow-auto p-4">
      <TabBar :key="`tabs-${$i18n.locale}`" :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => {
        changeTab(t);
      }" />
      <div>
        <div v-if="currentTab === 'info'" class="mb-4">
          <div ref="clientTypeDropdownRef" class="relative">
            <label class="required">{{ $t('clientType') }}</label>
            <button type="button"
              class="w-full px-3 py-2 border-2 border-gray-400 rounded-md text-left flex items-center gap-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              :aria-expanded="clientTypeDropdownOpen" :aria-haspopup="true"
              @click="clientTypeDropdownOpen = !clientTypeDropdownOpen">
              <i
                :class="clientTypeOptions.find(o => o.value === clientType)?.iconClass || 'fas fa-user text-[var(--nav-accent)]'" />
              <span>{{clientTypeOptions.find(o => o.value === clientType)?.label || $t('individual')}}</span>
            </button>
            <div v-show="clientTypeDropdownOpen"
              class="absolute z-10 mt-1 w-full border border-gray-300 rounded-md bg-white shadow-lg max-h-60 overflow-auto">
              <button v-for="opt in clientTypeOptions" :key="opt.value" type="button"
                class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                :class="{ 'bg-blue-50': opt.value === clientType }" @click="selectClientType(opt.value)">
                <i :class="opt.iconClass" />
                <span>{{ opt.label }}</span>
              </button>
            </div>
          </div>
          <div v-if="clientType === 'employee' || clientType === 'investor'">
            <UserSearch :selected-user="selectedEmployee" :required="true" :show-label="true"
              :label="$t('selectEmployee')"
              @update:selected-user="selectedEmployee = $event" />
          </div>
          <div v-if="clientType !== 'employee' && clientType !== 'investor'" class="flex gap-4 w-full">
            <div class="flex flex-col w-full">
              <label class="required">{{ clientType === 'company' ? $t('companyName') : $t('firstName') }}</label>
              <input v-model="firstName" type="text" required autocomplete="off">
            </div>
            <div v-if="clientType === 'individual'" class="flex flex-col w-full">
              <label>{{ $t('lastName') }}</label>
              <input v-model="lastName" type="text" autocomplete="off">
            </div>
            <div v-if="clientType === 'individual'" class="flex flex-col w-full">
              <label>{{ $t('patronymic') }}</label>
              <input v-model="patronymic" type="text">
            </div>
          </div>
          <label>{{ $t('characteristics') }}</label>
          <div class="flex flex-wrap gap-2">
            <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
              <input v-model="status" type="checkbox">
              <i class="fas fa-circle-check text-green-600" :class="{ 'opacity-40': !status }" />
              <span>{{ $t('active') }}</span>
            </label>
            <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
              <input v-model="isSupplier" type="checkbox">
              <i class="fas fa-truck text-[var(--nav-accent)]" :class="{ 'opacity-40': !isSupplier }" />
              <span>{{ $t('supplier') }}</span>
            </label>
            <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
              <input v-model="isConflict" type="checkbox">
              <i class="fas fa-angry text-[#D53935]" :class="{ 'opacity-40': !isConflict }" />
              <span>{{ $t('problemClient') }}</span>
            </label>
          </div>
          <div>
            <label class="required">{{ $t('phoneNumber') }}</label>
            <div class="flex items-center space-x-2">
              <PhoneInputWithCountry v-model="newPhone" :default-country="newPhoneCountry" class="flex-1"
                :required="true" @country-change="handleCountryChange" @keyup.enter="addPhone"
                @blur="handlePhoneBlur" />
              <PrimaryButton v-if="newPhone" icon="fas fa-add" :is-success="true" :onclick="addPhone"
                :aria-label="$t('add')" />
            </div>
            <div v-for="(phone, index) in phones" :key="`phone-${index}-${phone}`"
              class="flex items-stretch space-x-2 mt-2">
              <PhoneInputWithCountry v-model="editingPhones[index]" :default-country="getPhoneCountryId(phone)"
                class="flex-1" @country-change="(country) => handlePhoneCountryChange(index, country)"
                @blur="() => handleEditPhoneBlur(index)" @keyup.enter="() => savePhoneEdit(index)" />
              <PrimaryButton icon="fas fa-check" :is-success="true" :onclick="() => savePhoneEdit(index)"
                :disabled="!isPhoneEditChanged(index)" :aria-label="$t('apply')" />
              <PrimaryButton icon="fas fa-close" :is-danger="true" :onclick="() => removePhone(index)"
                :aria-label="$t('remove')" />
            </div>
          </div>
          <div>
            <label>{{ $t('email') }}</label>
            <div class="flex items-center space-x-2">
              <input v-model="newEmail" type="text" class="flex-1" autocomplete="off" placeholder="test@gmail.com"
                @keyup.enter="addEmail" @blur="handleEmailBlur">
              <PrimaryButton v-if="newEmail" icon="fas fa-add" :is-success="true" :onclick="addEmail"
                :aria-label="$t('add')" />
            </div>
            <div v-for="(email, index) in emails" :key="`email-${index}-${email}`"
              class="flex items-stretch space-x-2 mt-2">
              <input v-model="editingEmails[index]" type="text" class="flex-1" autocomplete="off"
                placeholder="test@gmail.com" @blur="() => handleEditEmailBlur(index)"
                @keyup.enter="() => saveEmailEdit(index)">
              <PrimaryButton icon="fas fa-check" :is-success="true" :onclick="() => saveEmailEdit(index)"
                :disabled="!isEmailEditChanged(index)" :aria-label="$t('apply')" />
              <PrimaryButton icon="fas fa-close" :is-danger="true" :onclick="() => removeEmail(index)"
                :aria-label="$t('remove')" />
            </div>
          </div>
          <div>
            <label>{{ $t('address') }}</label>
            <input v-model="address" type="text" autocomplete="off">
          </div>
          <div class="flex gap-4 w-full">
            <div class="flex flex-col w-full">
              <label>{{ $t('discount') }}</label>
              <input v-model="discount" type="number" class="w-full">
            </div>
            <div ref="discountTypeDropdownRef" class="flex flex-col w-full relative">
              <label>{{ $t('discountType') }}</label>
              <button type="button"
                class="w-full px-3 py-2 border-2 border-gray-400 rounded-md text-left flex items-center gap-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                :aria-expanded="discountTypeDropdownOpen" :aria-haspopup="true"
                @click="discountTypeDropdownOpen = !discountTypeDropdownOpen">
                <i
                  :class="discountTypeOptions.find(o => o.value === discountType)?.iconClass || 'fas fa-coins text-[var(--nav-accent)]'" />
                <span>{{discountTypeOptions.find(o => o.value === discountType)?.label || $t('fixed')}}</span>
              </button>
              <div v-show="discountTypeDropdownOpen"
                class="absolute z-10 mt-1 w-full border-2 border-gray-400 rounded-md bg-white shadow-lg overflow-auto">
                <button v-for="opt in discountTypeOptions" :key="opt.value" type="button"
                  class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  :class="{ 'bg-blue-50': opt.value === discountType }" @click="selectDiscountType(opt.value)">
                  <i :class="opt.iconClass" />
                  <span>{{ opt.label }}</span>
                </button>
              </div>
            </div>
          </div>
          <div>
            <label>{{ $t('note') }}</label>
            <input v-model="note" type="text">
          </div>
        </div>
        <div
          v-if="currentTab === 'history' && editingItem && $store.getters.hasPermission('settings_client_balance_view')"
          class="mt-4">
          <ClientBalanceHistoryTab
            :editing-item="editingItem"
            @balance-updated="onBalanceTabDataUpdated"
          />
        </div>
        <div
          v-if="currentTab === 'balances' && editingItem && ($store.getters.hasPermission('settings_client_balance_view') || $store.getters.hasPermission('client_balances_view_all'))"
          class="mt-4">
          <ClientBalancesTab
            :editing-item="editingItem"
            @balance-updated="onBalanceTabDataUpdated"
          />
        </div>
      </div>
    </div>

    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
          :is-loading="deleteLoading" icon="fas fa-trash" :disabled="!$store.getters.hasPermission('clients_delete')"
          :aria-label="$t('delete')" />
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('clients_update')) ||
          (editingItemId == null && !$store.getters.hasPermission('clients_create'))" :aria-label="$t('save')" />
      </div>
    </teleport>

    <AlertDialog :dialog="deleteDialog" :descr="$t('confirmDelete')" :confirm-text="$t('delete')"
      :leave-text="$t('cancel')" @confirm="deleteItem" @leave="closeDeleteDialog" />
    <AlertDialog :dialog="closeConfirmDialog" :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')" @confirm="confirmClose" @leave="cancelClose" />
  </div>
</template>

<script>
import ClientController from "@/api/ClientController";
import UsersController from "@/api/UsersController";
import ClientDto from "@/dto/client/ClientDto";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import TabBar from "@/views/components/app/forms/TabBar.vue";
import PhoneInputWithCountry from "@/views/components/app/forms/PhoneInputWithCountry.vue";
import ClientBalancesTab from "@/views/pages/clients/ClientBalancesTab.vue";
import ClientBalanceHistoryTab from "@/views/pages/clients/ClientBalanceHistoryTab.vue";
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import phoneEmailListFormMixin from "@/mixins/phoneEmailListFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { hasPhoneShorterThanMinDigits, mapApiPhonesToLists } from "@/utils/phoneEmailFormUtils";

export default {
  components: { PrimaryButton, AlertDialog, TabBar, PhoneInputWithCountry, ClientBalancesTab, ClientBalanceHistoryTab, UserSearch },
  mixins: [getApiErrorMessage, notificationMixin, phoneEmailListFormMixin, crudFormMixin, sideModalFooterPortal],
  props: {
    editingItem: { type: ClientDto, default: null },
    defaultFirstName: { type: String, default: "" },
  },
  emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request", "editing-item-update"],
  data() {
    const phoneLists = this.editingItem
      ? mapApiPhonesToLists(this.editingItem.phones)
      : { phones: [], editingPhones: [], editingPhoneCountries: [] };
    return {
      firstName: this.editingItem
        ? this.editingItem.firstName
        : this.defaultFirstName || "",
      lastName: this.editingItem ? this.editingItem.lastName : "",
      patronymic: this.editingItem ? this.editingItem.patronymic : "",
      position: this.editingItem ? this.editingItem.position : "",
      clientType: this.editingItem ? this.editingItem.clientType : "individual",
      employeeId: this.editingItem ? this.editingItem.employeeId : null,
      selectedEmployee: null,
      address: this.editingItem ? this.editingItem.address : "",
      note: this.editingItem ? this.editingItem.note : "",
      status: this.editingItem ? this.editingItem.status : true,
      isConflict: this.editingItem ? this.editingItem.isConflict : false,
      isSupplier: this.editingItem ? this.editingItem.isSupplier : false,
      phones: phoneLists.phones,
      editingPhones: phoneLists.editingPhones,
      editingPhoneCountries: phoneLists.editingPhoneCountries,
      emails: this.editingItem ? this.editingItem.emails.map((email) => email.email) : [],
      editingEmails: this.editingItem ? this.editingItem.emails.map((email) => email.email) : [],
      discountType: this.editingItem ? this.editingItem.discountType : "fixed",
      discount: this.editingItem ? this.editingItem.discount : 0,
      clientTypeDropdownOpen: false,
      discountTypeDropdownOpen: false,
      currentTab: "info",
      tabs: [
        { name: "info", label: "info" },
        { name: "history", label: "history" },
        { name: "balances", label: "account" }
      ]
    };
  },
  computed: {
    clientTypeOptions() {
      const color = 'text-[var(--nav-accent)]';
      const options = [
        { value: 'individual', iconClass: `fas fa-user ${color}`, label: this.$t('individual') },
        { value: 'company', iconClass: `fas fa-building ${color}`, label: this.$t('company') },
        { value: 'employee', iconClass: `fas fa-id-badge ${color}`, label: this.$t('employee') },
      ];
      if (this.clientType === 'investor') {
        options.push({
          value: 'investor',
          iconClass: `fas fa-hand-holding-usd ${color}`,
          label: this.$t('investor'),
        });
      }
      return options;
    },
    discountTypeOptions() {
      const color = 'text-[var(--nav-accent)]';
      return [
        { value: 'percent', iconClass: `fas fa-percent ${color}`, label: this.$t('percent') },
        { value: 'fixed', iconClass: `fas fa-coins ${color}`, label: this.$t('fixed') }
      ];
    },
    translatedTabs() {
      let visibleTabs = this.editingItem ? this.tabs : this.tabs.filter(tab =>
        tab.name !== 'balances' && tab.name !== 'history'
      );
      if (!this.$store.getters.hasPermission('settings_client_balance_view')) {
        visibleTabs = visibleTabs.filter(tab => tab.name !== 'balances' && tab.name !== 'history');
      }
      return visibleTabs.map(tab => ({
        ...tab,
        label: this.$t(tab.label)
      }));
    }
  },
  watch: {
    clientTypeDropdownOpen(open) {
      if (open) {
        this.$nextTick(() => {
          setTimeout(() => document.addEventListener('click', this.closeClientTypeDropdown), 0);
        });
      } else {
        document.removeEventListener('click', this.closeClientTypeDropdown);
      }
    },
    discountTypeDropdownOpen(open) {
      if (open) {
        this.$nextTick(() => {
          setTimeout(() => document.addEventListener('click', this.closeDiscountTypeDropdown), 0);
        });
      } else {
        document.removeEventListener('click', this.closeDiscountTypeDropdown);
      }
    },
    defaultFirstName(newVal) {
      if (!this.editingItem) {
        this.firstName = newVal || "";
      }
    },
    clientType: {
      handler(type) {
        if (type === "company") {
          this.position = "";
        } else if (type === "employee" || type === "investor") {
          this.lastName = "";
        }

        if (type !== "employee" && type !== "investor") {
          this.employeeId = null;
          this.selectedEmployee = null;
        }
      },
      deep: true,
      immediate: true,
    },
    selectedEmployee: {
      handler(newEmployee) {
        if (newEmployee) {
          this.employeeId = newEmployee.id;
          if (this.clientType === "employee" || this.clientType === "investor") {
            this.firstName = newEmployee.name || "";
            this.lastName = newEmployee.surname || "";
            this.position = newEmployee.position || "";
          }
        } else {
          this.employeeId = null;
        }
      },
    },
  },
  async mounted() {
    if (!this.$store.getters.users?.length) {
      await this.$store.dispatch('loadUsers');
    }

    if (!this.$store.getters.clients?.length) {
      await this.$store.dispatch('loadClients');
    }

    if (this.employeeId) {
      await this.loadSelectedEmployee();
    }

    this.saveInitialState();
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeClientTypeDropdown);
    document.removeEventListener('click', this.closeDiscountTypeDropdown);
  },
  methods: {
    selectClientType(value) {
      this.clientType = value;
      this.clientTypeDropdownOpen = false;
    },
    selectDiscountType(value) {
      this.discountType = value;
      this.discountTypeDropdownOpen = false;
    },
    closeDiscountTypeDropdown(e) {
      if (this.$refs.discountTypeDropdownRef && !this.$refs.discountTypeDropdownRef.contains(e.target)) {
        this.discountTypeDropdownOpen = false;
      }
    },
    closeClientTypeDropdown(e) {
      if (this.$refs.clientTypeDropdownRef && !this.$refs.clientTypeDropdownRef.contains(e.target)) {
        this.clientTypeDropdownOpen = false;
      }
    },
    changeTab(tabName) {
      if ((tabName === 'balances' || tabName === 'history') && !this.editingItem) {
        this.currentTab = 'info';
        return;
      }
      this.currentTab = tabName;
    },
    onBalanceTabDataUpdated(updatedClient) {
      if (updatedClient) {
        this.$emit('editing-item-update', updatedClient);
      }
    },
    async loadSelectedEmployee() {
      if (!this.employeeId) {
        this.selectedEmployee = null;
        return;
      }
      const allUsers = this.$store.getters.usersForCurrentCompany || [];
      const user = allUsers.find(u => u.id === this.employeeId);
      if (user) {
        this.selectedEmployee = user;
      } else {
        const loadedUser = await UsersController.getItem(this.employeeId).catch(() => null);
        if (loadedUser) {
          this.selectedEmployee = loadedUser;
        }
      }
    },
    getFormState() {
      return {
        firstName: this.firstName,
        lastName: this.lastName,
        patronymic: this.patronymic,
        position: this.position,
        clientType: this.clientType,
        employeeId: this.employeeId,
        address: this.address,
        note: this.note,
        status: this.status,
        isConflict: this.isConflict,
        isSupplier: this.isSupplier,
        phones: [...this.phones],
        emails: [...this.emails],
        discountType: this.discountType,
        discount: this.discount,
      };
    },

    prepareSave() {
      if ((this.clientType === 'employee' || this.clientType === 'investor') && !this.selectedEmployee) {
        throw new Error(this.$t('selectEmployee'));
      }
      if (hasPhoneShorterThanMinDigits(this.phones)) {
        throw new Error(this.$t("phoneNumberMinLength"));
      }

      return {
        firstName: this.firstName,
        lastName: this.lastName,
        patronymic: this.patronymic,
        position: this.clientType === 'company' ? '' : this.position,
        clientType: this.clientType,
        employeeId: this.selectedEmployee?.id || null,
        address: this.address,
        note: this.note,
        status: this.status,
        isConflict: this.isConflict,
        isSupplier: this.isSupplier,
        phones: this.phones,
        emails: this.emails,
        discountType: this.discountType,
        discount: this.discount,
      };
    },
    async performSave(data) {
      let resp;
      if (this.editingItemId) {
        resp = await ClientController.updateItem(this.editingItemId, data);
      } else {
        resp = await ClientController.storeItem(data);
      }

      if (resp.message) {
        return resp.item || data;
      }
      throw new Error(this.$t('errorSavingClient'));
    },
    onSaveError(error) {
      if (error.message && (error.message.includes('selectEmployee') || error.message.includes('выбрать сотрудника'))) {
        this.showNotification(this.$t('error'), error.message, true);
      }
    },

    async performDelete() {
      const resp = await ClientController.deleteItem(this.editingItemId);
      if (resp.message) {
        return resp;
      }
      throw new Error(this.$t('errorDeletingClient'));
    },

    clearForm() {
      this.firstName = "";
      this.lastName = "";
      this.patronymic = "";
      this.position = "";
      this.clientType = "individual";
      this.employeeId = null;
      this.selectedEmployee = null;
      this.address = "";
      this.note = "";
      this.status = true;
      this.isConflict = false;
      this.isSupplier = false;
      this.resetPhoneEmailListFields();
      this.discountType = "fixed";
      this.discount = 0;
      this.currentTab = "info";
      this.resetFormChanges();
    },
    async onEditingItemChanged(newEditingItem) {
      if (newEditingItem === this._lastEditingItemRef) {
        return;
      }
      this._lastEditingItemRef = newEditingItem;
      if (newEditingItem) {
        this.firstName = newEditingItem.firstName || "";
        this.lastName = newEditingItem.lastName || "";
        this.patronymic = newEditingItem.patronymic || "";
        this.position = newEditingItem.position || "";
        this.clientType = newEditingItem.clientType || "individual";
        this.address = newEditingItem.address || "";
        this.note = newEditingItem.note || "";
        this.status = newEditingItem.status || false;
        this.isConflict = newEditingItem.isConflict || false;
        this.isSupplier = newEditingItem.isSupplier || false;
        this.applyPhoneEmailListsFromApiItem(newEditingItem);
        this.discountType = newEditingItem.discountType ?? "fixed";
        this.discount = newEditingItem.discount ?? 0;

        this.employeeId = newEditingItem.employeeId || null;
        if (this.employeeId) {
          await this.loadSelectedEmployee();
        } else {
          this.selectedEmployee = null;
        }

        this.currentTab = "info";
      } else {
        this.currentTab = "info";
      }
    }
  },
};
</script>

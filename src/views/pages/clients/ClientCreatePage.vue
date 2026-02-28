<template>
  <div class="flex flex-col h-full">
    <div class="flex flex-col overflow-auto h-full p-4 pb-24">
      <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editClient') : $t('createClient') }}</h2>
      <TabBar :key="`tabs-${$i18n.locale}`" :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => {
        changeTab(t);
      }" />
      <div>
        <div v-if="currentTab === 'info'" class="mb-4">
          <div class="relative" ref="clientTypeDropdownRef">
            <label class="required">{{ $t('clientType') }}</label>
            <button type="button"
              class="w-full px-3 py-2 border-2 border-gray-400 rounded-md text-left flex items-center gap-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="clientTypeDropdownOpen = !clientTypeDropdownOpen"
              :aria-expanded="clientTypeDropdownOpen" :aria-haspopup="true">
              <i :class="clientTypeOptions.find(o => o.value === clientType)?.iconClass || 'fas fa-user text-[#3571A4]'"></i>
              <span>{{ clientTypeOptions.find(o => o.value === clientType)?.label || $t('individual') }}</span>
            </button>
            <div v-show="clientTypeDropdownOpen"
              class="absolute z-10 mt-1 w-full border border-gray-300 rounded-md bg-white shadow-lg max-h-60 overflow-auto">
              <button type="button" v-for="opt in clientTypeOptions" :key="opt.value"
                class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                :class="{ 'bg-blue-50': opt.value === clientType }"
                @click="selectClientType(opt.value)">
                <i :class="opt.iconClass"></i>
                <span>{{ opt.label }}</span>
              </button>
            </div>
          </div>
          <div v-if="clientType === 'employee' || clientType === 'investor'">
            <UserSearch :selectedUser="selectedEmployee" @update:selectedUser="selectedEmployee = $event"
              :required="true" :showLabel="true" :label="$t('selectEmployee')"
              :filterUsers="filterAvailableEmployees" />
          </div>
          <div v-if="clientType !== 'employee' && clientType !== 'investor'" class="flex gap-4 w-full">
            <div class="flex flex-col w-full">
              <label class="required">{{ clientType === 'company' ? $t('companyName') : $t('firstName') }}</label>
              <input type="text" v-model="firstName" required autocomplete="off" />
            </div>
            <div v-if="clientType === 'individual'" class="flex flex-col w-full">
              <label>{{ $t('lastName') }}</label>
              <input type="text" v-model="lastName" autocomplete="off" />
            </div>
            <div v-if="clientType === 'individual'" class="flex flex-col w-full">
              <label>{{ $t('patronymic') }}</label>
              <input type="text" v-model="patronymic" />
            </div>
          </div>
          <label>{{ $t('characteristics') }}</label>
          <div class="flex flex-wrap gap-2">
            <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
              <input type="checkbox" v-model="status" />
              <i class="fas fa-circle-check text-green-600" :class="{ 'opacity-40': !status }"></i>
              <span>{{ $t('active') }}</span>
            </label>
            <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
              <input type="checkbox" v-model="isSupplier" />
              <i class="fas fa-truck text-[#3571A4]" :class="{ 'opacity-40': !isSupplier }"></i>
              <span>{{ $t('supplier') }}</span>
            </label>
            <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
              <input type="checkbox" v-model="isConflict" />
              <i class="fas fa-angry text-[#D53935]" :class="{ 'opacity-40': !isConflict }"></i>
              <span>{{ $t('problemClient') }}</span>
            </label>
          </div>
          <div>
            <label class="required">{{ $t('phoneNumber') }}</label>
            <div class="flex items-center space-x-2">
              <PhoneInputWithCountry v-model="newPhone" :default-country="newPhoneCountry"
                @country-change="handleCountryChange" @keyup.enter="addPhone" @blur="handlePhoneBlur" class="flex-1"
                :required="true" ref="phoneInputRef" />
              <PrimaryButton v-if="newPhone" icon="fas fa-add" :is-success="true" :onclick="addPhone" :aria-label="$t('add')" />
            </div>
            <div v-for="(phone, index) in phones" :key="`phone-${index}-${phone}`"
              class="flex items-stretch space-x-2 mt-2">
              <PhoneInputWithCountry v-model="editingPhones[index]" :default-country="getPhoneCountryId(phone)"
                @country-change="(country) => handlePhoneCountryChange(index, country)"
                @blur="() => handleEditPhoneBlur(index)" @keyup.enter="() => savePhoneEdit(index)" class="flex-1" />
              <PrimaryButton icon="fas fa-check" :is-success="true" :onclick="() => savePhoneEdit(index)"
                :disabled="!isPhoneEditChanged(index)" :aria-label="$t('apply')" />
              <PrimaryButton icon="fas fa-close" :is-danger="true" :onclick="() => removePhone(index)" :aria-label="$t('remove')" />
            </div>
          </div>
          <div>
            <label>{{ $t('email') }}</label>
            <div class="flex items-center space-x-2">
              <input
                type="text"
                v-model="newEmail"
                @keyup.enter="addEmail"
                @blur="handleEmailBlur"
                class="flex-1"
                autocomplete="off"
                placeholder="test@gmail.com"
              />
              <PrimaryButton v-if="newEmail" icon="fas fa-add" :is-success="true" :onclick="addEmail" :aria-label="$t('add')" />
            </div>
            <div
              v-for="(email, index) in emails"
              :key="`email-${index}-${email}`"
              class="flex items-stretch space-x-2 mt-2"
            >
              <input
                type="text"
                v-model="editingEmails[index]"
                @blur="() => handleEditEmailBlur(index)"
                @keyup.enter="() => saveEmailEdit(index)"
                class="flex-1"
                autocomplete="off"
                placeholder="test@gmail.com"
              />
              <PrimaryButton
                icon="fas fa-check"
                :is-success="true"
                :onclick="() => saveEmailEdit(index)"
                :disabled="!isEmailEditChanged(index)"
                :aria-label="$t('apply')"
              />
              <PrimaryButton
                icon="fas fa-close"
                :is-danger="true"
                :onclick="() => removeEmail(index)"
                :aria-label="$t('remove')"
              />
            </div>
          </div>
          <div>
            <label>{{ $t('address') }}</label>
            <input type="text" v-model="address" autocomplete="off" />
          </div>
          <div class="flex gap-4 w-full">
            <div class="flex flex-col w-full">
              <label>{{ $t('discount') }}</label>
              <input type="number" v-model="discount" class="w-full" />
            </div>
            <div class="flex flex-col w-full relative" ref="discountTypeDropdownRef">
              <label>{{ $t('discountType') }}</label>
              <button type="button"
                class="w-full px-3 py-2 border-2 border-gray-400 rounded-md text-left flex items-center gap-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="discountTypeDropdownOpen = !discountTypeDropdownOpen"
                :aria-expanded="discountTypeDropdownOpen" :aria-haspopup="true">
                <i :class="discountTypeOptions.find(o => o.value === discountType)?.iconClass || 'fas fa-coins text-[#3571A4]'"></i>
                <span>{{ discountTypeOptions.find(o => o.value === discountType)?.label || $t('fixed') }}</span>
              </button>
              <div v-show="discountTypeDropdownOpen"
                class="absolute z-10 mt-1 w-full border-2 border-gray-400 rounded-md bg-white shadow-lg overflow-auto">
                <button type="button" v-for="opt in discountTypeOptions" :key="opt.value"
                  class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  :class="{ 'bg-blue-50': opt.value === discountType }"
                  @click="selectDiscountType(opt.value)">
                  <i :class="opt.iconClass"></i>
                  <span>{{ opt.label }}</span>
                </button>
              </div>
            </div>
          </div>
          <div>
            <label>{{ $t('note') }}</label>
            <input type="text" v-model="note" />
          </div>
        </div>
        <div
          v-if="currentTab === 'history' && editingItem && $store.getters.hasPermission('settings_client_balance_view')"
          class="mt-4">
          <ClientBalanceHistoryTab :editing-item="editingItem" />
        </div>
        <div
          v-if="currentTab === 'balances' && editingItem && ($store.getters.hasPermission('settings_client_balance_view') || $store.getters.hasPermission('client_balances_view_all'))"
          class="mt-4">
          <ClientBalancesTab :editing-item="editingItem" />
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 p-4 flex space-x-2 bg-[#edf4fb] border-t border-gray-200 z-10">
      <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
        :is-loading="deleteLoading" icon="fas fa-trash" :disabled="!$store.getters.hasPermission('clients_delete')" :aria-label="$t('delete')">
      </PrimaryButton>
      <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('clients_update')) ||
        (editingItemId == null && !$store.getters.hasPermission('clients_create'))" :aria-label="$t('save')">
      </PrimaryButton>
    </div>
    
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('confirmDelete')"
      :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
      :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
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
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";

export default {
  mixins: [getApiErrorMessage, notificationMixin, formChangesMixin, crudFormMixin],
  emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
  components: { PrimaryButton, AlertDialog, TabBar, PhoneInputWithCountry, ClientBalancesTab, ClientBalanceHistoryTab, UserSearch },
  props: {
    editingItem: { type: ClientDto, default: null },
    defaultFirstName: { type: String, default: "" },
  },
  data() {
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
      phones: this.editingItem ? this.editingItem.phones.map((phone) => phone.phone) : [],
      editingPhones: [],
      editingPhoneCountries: [],
      emails: this.editingItem ? this.editingItem.emails.map((email) => email.email) : [],
      editingEmails: this.editingItem ? this.editingItem.emails.map((email) => email.email) : [],
      discountType: this.editingItem ? this.editingItem.discountType : "fixed",
      discount: this.editingItem ? this.editingItem.discount : 0,
      editingItemId: this.editingItem?.id || null,
      newPhone: "",
      newPhoneCountry: "tm",
      currentPhoneCountry: null,
      newEmail: "",
      saveLoading: false,
      deleteDialog: false,
      deleteLoading: false,
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
      const color = 'text-[#3571A4]';
      return [
        { value: 'individual', iconClass: `fas fa-user ${color}`, label: this.$t('individual') },
        { value: 'company', iconClass: `fas fa-building ${color}`, label: this.$t('company') },
        { value: 'employee', iconClass: `fas fa-id-badge ${color}`, label: this.$t('employee') },
        { value: 'investor', iconClass: `fas fa-hand-holding-usd ${color}`, label: this.$t('investor') }
      ];
    },
    discountTypeOptions() {
      const color = 'text-[#3571A4]';
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
    },
    users() {
      const allUsers = this.$store.getters.usersForCurrentCompany || [];

      if (this.clientType !== 'employee' && this.clientType !== 'investor') {
        return allUsers;
      }

      const clients = this.$store.getters.clients || [];

      const usedEmployeeIds = new Set();
      clients.forEach(client => {
        if (
          (client.clientType === 'employee' || client.clientType === 'investor') &&
          client.employeeId &&
          (!this.editingItem || client.id !== this.editingItem.id)
        ) {
          usedEmployeeIds.add(client.employeeId);
        }
      });

      let available = allUsers.filter(user => !usedEmployeeIds.has(user.id));

      if (this.employeeId) {
        const selected = allUsers.find(u => u.id === this.employeeId);
        const existsInAvailable = available.some(u => u.id === this.employeeId);
        if (selected && !existsInAvailable) {
          available = [selected, ...available];
        }
      }

      return available;
    }
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
        try {
          const loadedUser = await UsersController.getItem(this.employeeId);
          if (loadedUser) {
            this.selectedEmployee = loadedUser;
          }
        } catch (error) {
        }
      }
    },
    filterAvailableEmployees(user) {
      if (this.clientType !== 'employee' && this.clientType !== 'investor') {
        return true;
      }
      const clients = this.$store.getters.clients || [];
      const usedEmployeeIds = new Set();
      clients.forEach(client => {
        if (
          (client.clientType === 'employee' || client.clientType === 'investor') &&
          client.employeeId &&
          (!this.editingItem || client.id !== this.editingItem.id)
        ) {
          usedEmployeeIds.add(client.employeeId);
        }
      });
      if (this.employeeId && user.id === this.employeeId) {
        return true;
      }
      return !usedEmployeeIds.has(user.id);
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

    handleCountryChange(country) {
      this.currentPhoneCountry = country;
      this.newPhoneCountry = country.id;
    },
    handlePhoneBlur() {
      if (this.newPhone && this.newPhone.trim()) {
        this.addPhone();
      }
    },
    getPhoneCountryCode(phone) {
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("993")) {
        return "+993";
      } else if (cleaned.startsWith("7")) {
        return "+7";
      }
      if (cleaned.length >= 9 && cleaned.startsWith("993")) {
        return "+993";
      }
      return "+993";
    },
    getPhoneCountryFlag(phone) {
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("7")) {
        return "/flags/640px-Flag_of_Russia.svg.webp";
      }
      return "/flags/640px-Flag_of_Turkmenistan.svg.png";
    },
    getPhoneCountryName(phone) {
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("7")) {
        return "Россия";
      }
      return "Туркменистан";
    },
    addPhone() {
      if (this.newPhone && this.newPhone.trim()) {
        const cleanedPhone = this.newPhone.replace(/\D/g, "");

        if (cleanedPhone.length < 6) {
          this.showNotification(this.$t('error'), this.$t('phoneNumberMinLength') || 'Номер телефона должен содержать не менее 6 цифр', true);
          return;
        }
        const expectedLength = 11;
        if (cleanedPhone.length < expectedLength) {
          this.showNotification(this.$t('error'), this.$t('phoneNumberLengthWithCountry', { length: expectedLength }), true);
          return;
        }

        let phoneToSave = cleanedPhone;

        if (this.currentPhoneCountry) {
          if (!cleanedPhone.startsWith(this.currentPhoneCountry.dialCode)) {
            let phoneWithoutCode = cleanedPhone;
            if (cleanedPhone.startsWith("993")) {
              phoneWithoutCode = cleanedPhone.substring(3);
            } else if (cleanedPhone.startsWith("7")) {
              phoneWithoutCode = cleanedPhone.substring(1);
            }
            phoneToSave = this.currentPhoneCountry.dialCode + phoneWithoutCode;
          }
        } else {
          if (!cleanedPhone.startsWith("993") && !cleanedPhone.startsWith("7")) {
            phoneToSave = "993" + cleanedPhone;
          }
        }

        if (phoneToSave.length !== expectedLength) {
          this.showNotification(this.$t('error'), this.$t('phoneNumberLength', { length: expectedLength }), true);
          return;
        }

        if (this.phones.includes(phoneToSave)) {
          this.showNotification(this.$t('error'), this.$t('phoneNumberDuplicate'), true);
          return;
        }
        this.phones.push(phoneToSave);
        this.editingPhones.push(this.formatPhoneForInput(phoneToSave));
        this.editingPhoneCountries.push(this.currentPhoneCountry || { dialCode: "993", id: "tm" });
        this.newPhone = "";
        this.currentPhoneCountry = null;
        this.newPhoneCountry = "tm";
      }
    },
    removePhone(index) {
      this.phones.splice(index, 1);
      this.editingPhones.splice(index, 1);
      this.editingPhoneCountries.splice(index, 1);
    },
    formatPhoneForInput(phone) {
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("993")) {
        return cleaned.substring(3);
      } else if (cleaned.startsWith("7")) {
        return cleaned.substring(1);
      }
      return cleaned;
    },
    getPhoneCountryId(phone) {
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("7")) {
        return "ru";
      }
      return "tm";
    },
    handlePhoneCountryChange(index, country) {
      this.editingPhoneCountries[index] = country;
      if (this.editingPhones[index] !== undefined) {
        const currentValue = this.editingPhones[index].replace(/\D/g, "");
        if (currentValue) {
          this.editingPhones[index] = currentValue;
        }
      }
    },
    handleEditPhoneBlur(index) {
      if (this.editingPhones[index] && this.editingPhones[index].trim() && this.isPhoneEditChanged(index)) {
        this.savePhoneEdit(index);
      }
    },
    isPhoneEditChanged(index) {
      if (this.editingPhones[index] === undefined || this.phones[index] === undefined) {
        return false;
      }
      const savedLocal = this.formatPhoneForInput(this.phones[index]).replace(/\D/g, "");
      const savedCountryId = this.getPhoneCountryId(this.phones[index]);
      const editedLocal = (this.editingPhones[index] || "").replace(/\D/g, "");
      const editedCountryId = this.editingPhoneCountries[index]?.id || savedCountryId;
      return editedLocal !== savedLocal || editedCountryId !== savedCountryId;
    },
    savePhoneEdit(index) {
      if (this.editingPhones[index] === undefined) {
        return;
      }

      const editedPhone = this.editingPhones[index];
      if (!editedPhone || !editedPhone.trim()) {
        this.showNotification(this.$t('error'), this.$t('phoneNumberRequired'), true);
        return;
      }

      const cleanedPhone = editedPhone.replace(/\D/g, "");
      const currentPhone = this.phones[index];
      const currentFormatted = this.formatPhoneForInput(currentPhone);
      const currentCleaned = currentFormatted.replace(/\D/g, "");

      if (cleanedPhone === currentCleaned) {
        return;
      }

      let phoneWithoutCode = cleanedPhone;
      if (cleanedPhone.startsWith("993")) {
        phoneWithoutCode = cleanedPhone.substring(3);
      } else if (cleanedPhone.startsWith("7")) {
        phoneWithoutCode = cleanedPhone.substring(1);
      }

      const selectedCountry = this.editingPhoneCountries[index];
      let dialCode = "993";
      let expectedLocalLength = 8;

      if (selectedCountry && selectedCountry.dialCode) {
        dialCode = selectedCountry.dialCode;
        expectedLocalLength = dialCode === "7" ? 10 : 8;
      } else {
        const currentCleanedFull = currentPhone.replace(/\D/g, "");
        if (currentCleanedFull.startsWith("7")) {
          dialCode = "7";
          expectedLocalLength = 10;
        }
      }

      if (phoneWithoutCode.length < expectedLocalLength) {
        this.showNotification(this.$t('error'), this.$t('phoneNumberLengthWithoutCountry', { length: expectedLocalLength }), true);
        this.editingPhones[index] = this.formatPhoneForInput(this.phones[index]);
        return;
      }

      if (phoneWithoutCode.length > expectedLocalLength) {
        phoneWithoutCode = phoneWithoutCode.substring(phoneWithoutCode.length - expectedLocalLength);
      }

      const phoneToSave = dialCode + phoneWithoutCode;
      const expectedFullLength = 11;

      if (phoneToSave.length !== expectedFullLength) {
        this.showNotification(this.$t('error'), this.$t('phoneNumberLengthWithCountry', { length: expectedFullLength }), true);
        this.editingPhones[index] = this.formatPhoneForInput(this.phones[index]);
        return;
      }

      if (this.phones.includes(phoneToSave) && this.phones[index] !== phoneToSave) {
        this.showNotification(this.$t('error'), this.$t('phoneNumberDuplicate'), true);
        this.editingPhones[index] = this.formatPhoneForInput(this.phones[index]);
        return;
      }

      this.phones[index] = phoneToSave;
      this.editingPhones[index] = this.formatPhoneForInput(phoneToSave);

      if (dialCode === "7") {
        this.editingPhoneCountries[index] = { dialCode: "7", id: "ru" };
      } else {
        this.editingPhoneCountries[index] = { dialCode: "993", id: "tm" };
      }
    },
    handleEmailBlur() {
      if (this.newEmail && this.newEmail.trim()) {
        this.addEmail();
      }
    },
    addEmail() {
      if (!this.newEmail || !this.newEmail.trim()) {
        return;
      }
      const email = this.newEmail.trim();
      const atIndex = email.indexOf("@");
      if (atIndex < 1 || atIndex === email.length - 1) {
        this.showNotification(this.$t('error'), this.$t('invalidEmail') || 'Некорректный email', true);
        return;
      }
      const normalized = email.toLowerCase();
      if (this.emails.some((e) => e.toLowerCase() === normalized)) {
        this.showNotification(this.$t('error'), this.$t('emailDuplicate') || 'Такой email уже добавлен', true);
        return;
      }
      this.emails.push(normalized);
      this.editingEmails.push(normalized);
      this.newEmail = "";
    },
    handleEditEmailBlur(index) {
      if (this.editingEmails[index] !== undefined && this.editingEmails[index].trim() && this.isEmailEditChanged(index)) {
        this.saveEmailEdit(index);
      }
    },
    isEmailEditChanged(index) {
      if (this.editingEmails[index] === undefined || this.emails[index] === undefined) {
        return false;
      }
      return (this.editingEmails[index] || "").trim().toLowerCase() !== (this.emails[index] || "").toLowerCase();
    },
    saveEmailEdit(index) {
      if (this.editingEmails[index] === undefined) {
        return;
      }
      const edited = this.editingEmails[index].trim();
      if (!edited) {
        this.showNotification(this.$t('error'), this.$t('invalidEmail') || 'Некорректный email', true);
        this.editingEmails[index] = this.emails[index];
        return;
      }
      const atIndex = edited.indexOf("@");
      if (atIndex < 1 || atIndex === edited.length - 1) {
        this.showNotification(this.$t('error'), this.$t('invalidEmail') || 'Некорректный email', true);
        this.editingEmails[index] = this.emails[index];
        return;
      }
      const normalized = edited.toLowerCase();
      if (normalized === this.emails[index]) {
        return;
      }
      if (this.emails.some((e, i) => i !== index && e.toLowerCase() === normalized)) {
        this.showNotification(this.$t('error'), this.$t('emailDuplicate') || 'Такой email уже добавлен', true);
        this.editingEmails[index] = this.emails[index];
        return;
      }
      this.emails[index] = normalized;
      this.editingEmails[index] = normalized;
    },
    removeEmail(index) {
      this.emails.splice(index, 1);
      this.editingEmails.splice(index, 1);
    },
    prepareSave() {
      if ((this.clientType === 'employee' || this.clientType === 'investor') && !this.selectedEmployee) {
        throw new Error(this.$t('selectEmployee') || 'Необходимо выбрать сотрудника');
      }
      const invalidPhone = (this.phones || []).find(p => (p || '').replace(/\D/g, '').length < 6);
      if (invalidPhone) {
        throw new Error(this.$t('phoneNumberMinLength') || 'Номер телефона должен содержать не менее 6 цифр');
      }

      return {
        first_name: this.firstName,
        last_name: this.lastName,
        patronymic: this.patronymic,
        position: this.clientType === 'company' ? '' : this.position,
        client_type: this.clientType,
        employee_id: this.selectedEmployee?.id || null,
        address: this.address,
        note: this.note,
        status: this.status,
        is_conflict: this.isConflict,
        is_supplier: this.isSupplier,
        phones: this.phones,
        emails: this.emails,
        discount_type: this.discountType,
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
      throw new Error(this.$t('errorSavingClient') || 'Ошибка сохранения клиента');
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
      throw new Error(this.$t('errorDeletingClient') || 'Ошибка удаления клиента');
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
      this.phones = [];
      this.editingPhones = [];
      this.editingPhoneCountries = [];
      this.newPhone = "";
      this.newPhoneCountry = "tm";
      this.currentPhoneCountry = null;
      this.emails = [];
      this.editingEmails = [];
      this.discountType = "fixed";
      this.discount = 0;
      this.currentTab = "info";
      this.resetFormChanges();
    },
    showDeleteDialog() {
      this.deleteDialog = true;
    },
    closeDeleteDialog() {
      this.deleteDialog = false;
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
        this.phones = newEditingItem.phones.map((phone) => phone.phone) || [];
        this.editingPhones = newEditingItem.phones.map((phone) => this.formatPhoneForInput(phone.phone)) || [];
        this.editingPhoneCountries = newEditingItem.phones.map((phone) => {
          const cleaned = phone.phone.replace(/\D/g, "");
          if (cleaned.startsWith("7")) {
            return { dialCode: "7", id: "ru" };
          }
          return { dialCode: "993", id: "tm" };
        }) || [];
        this.newPhone = "";
        this.newPhoneCountry = "tm";
        this.currentPhoneCountry = null;
        this.emails = newEditingItem.emails.map((email) => email.email) || [];
        this.editingEmails = [...this.emails];
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
        if (type === "individual") {
        } else if (type === "company") {
          this.position = "";
        } else {
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
};
</script>

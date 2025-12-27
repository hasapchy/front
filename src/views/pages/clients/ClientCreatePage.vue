<template>
  <div class="flex flex-col overflow-auto h-full p-4">
    <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editClient') : $t('createClient') }}</h2>
    <TabBar :key="`tabs-${$i18n.locale}`" :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => {
      changeTab(t);
    }" />
    <div>
      <div v-if="currentTab === 'info'" class="mb-4">
        <div>
          <label class="required">{{ $t('clientType') }}</label>
          <select v-model="clientType">
            <option value="individual">{{ $t('individual') }}</option>
            <option value="company">{{ $t('company') }}</option>
            <option value="employee">{{ $t('employee') }}</option>
            <option value="investor">{{ $t('investor') }}</option>
          </select>
        </div>
        <div v-if="clientType === 'employee' || clientType === 'investor'">
          <UserSearch
            v-model:selectedUser="selectedEmployee"
            :required="true"
            :showLabel="true"
            :label="$t('selectEmployee')"
            :filterUsers="filterAvailableEmployees"
          />
        </div>
        <div v-if="clientType !== 'employee' && clientType !== 'investor'">
          <label class="required">{{ $t('firstName') }}</label>
          <input type="text" v-model="firstName" required />
        </div>
        <div v-if="clientType === 'individual'">
          <label>{{ $t('lastName') }}</label>
          <input type="text" v-model="lastName" />
        </div>
        <div v-if="clientType === 'individual'">
          <label>{{ $t('patronymic') }}</label>
          <input type="text" v-model="patronymic" />
        </div>
        <div v-if="clientType === 'company'">
          <label>{{ $t('contactPerson') }}</label>
          <input type="text" v-model="contactPerson" />
        </div>
        <div v-if="clientType === 'company'">
          <label>{{ $t('position') }}</label>
          <input type="text" v-model="position" />
        </div>
        <div>
          <label>{{ $t('address') }}</label>
          <input type="text" v-model="address" />
        </div>
        <div>
          <label>{{ $t('note') }}</label>
          <input type="text" v-model="note" />
        </div>
        <label>{{ $t('characteristics') }}</label>
        <div class="flex flex-wrap gap-2">
          <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
            <input type="checkbox" v-model="status" />
            <span>{{ $t('active') }}</span>
          </label>
          <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
            <input type="checkbox" v-model="isSupplier" />
            <span>{{ $t('supplier') }}</span>
          </label>
          <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
            <input type="checkbox" v-model="isConflict" />
            <span>{{ $t('problemClient') }}</span>
          </label>
        </div>
        <div>
          <label class="required">{{ $t('phoneNumber') }}</label>
          <div class="flex items-center space-x-2">
            <PhoneInputWithCountry v-model="newPhone" :default-country="newPhoneCountry"
              @country-change="handleCountryChange" @keyup.enter="addPhone" @blur="handlePhoneBlur" class="flex-1"
              :required="true" ref="phoneInputRef" />
            <PrimaryButton v-if="newPhone" icon="fas fa-add" :is-info="true" :onclick="addPhone" />
          </div>
          <div v-for="(phone, index) in phones" :key="`phone-${index}-${phone}`"
            class="flex items-stretch space-x-2 mt-2">
            <PhoneInputWithCountry v-model="editingPhones[index]" :default-country="getPhoneCountryId(phone)"
              @country-change="(country) => handlePhoneCountryChange(index, country)"
              @blur="() => handleEditPhoneBlur(index)" @keyup.enter="() => savePhoneEdit(index)" class="flex-1" />
            <PrimaryButton icon="fas fa-check" :is-info="true" :onclick="() => savePhoneEdit(index)" />
            <PrimaryButton icon="fas fa-close" :is-danger="true" :onclick="() => removePhone(index)" />
          </div>
        </div>
        <div>
          <label>{{ $t('email') }}</label>
          <div class="flex items-center space-x-2">
            <input type="text" v-model="newEmail" @keyup.enter="addEmail" />
            <PrimaryButton icon="fas fa-add" :is-info="true" :onclick="addEmail" />
          </div>
          <div v-for="(email, index) in emails" :key="email" class="flex items-center space-x-2 mt-2">
            <input type="text" :value="email" readonly />
            <PrimaryButton icon="fas fa-close" :is-danger="true" :onclick="() => removeEmail(index)" />
          </div>
        </div>
        <div class="flex gap-4 w-full">
          <div class="flex flex-col w-full">
            <label>{{ $t('discountType') }}</label>
            <select v-model="discountType" class="w-full">
              <option value="">{{ $t('selectDiscountType') }}</option>
              <option value="percent">{{ $t('percent') }}</option>
              <option value="fixed">{{ $t('fixed') }}</option>
            </select>
          </div>
          <div class="flex flex-col w-full">
            <label>{{ $t('discount') }}</label>
            <input type="number" v-model="discount" class="w-full" />
          </div>
        </div>
      </div>
      <div
        v-show="currentTab === 'balance' && editingItem && $store.getters.hasPermission('settings_client_balance_view')"
        class="mt-4">
        <ClientBalanceTab :editing-item="editingItem" />
      </div>
      <div v-show="currentTab === 'payments' && editingItem" class="mt-4">
        <ClientPaymentsTab :editing-item="editingItem" @payments-updated="handlePaymentsUpdated" />
      </div>
      <div v-show="currentTab === 'operations' && editingItem" class="mt-4">
        <ClientOperationsTab :editing-item="editingItem" />
      </div>
    </div>

  </div>
  <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
    <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true" :is-loading="deleteLoading"
      icon="fas fa-trash" :disabled="!$store.getters.hasPermission('clients_delete')">
    </PrimaryButton>
    <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('clients_update')) ||
      (editingItemId == null && !$store.getters.hasPermission('clients_create'))">
    </PrimaryButton>
  </div>
  <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('confirmDelete')"
    :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
  <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
    :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
  <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
    :is-danger="notificationIsDanger" @close="closeNotification" />
</template>

<script>
import ClientController from "@/api/ClientController";
import UsersController from "@/api/UsersController";
import ClientDto from "@/dto/client/ClientDto";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import TabBar from "@/views/components/app/forms/TabBar.vue";
import PhoneInputWithCountry from "@/views/components/app/forms/PhoneInputWithCountry.vue";
import ClientBalanceTab from "@/views/pages/clients/ClientBalanceTab.vue";
import ClientPaymentsTab from "@/views/pages/clients/ClientPaymentsTab.vue";
import ClientOperationsTab from "@/views/pages/clients/ClientOperationsTab.vue";
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import formChangesMixin from "@/mixins/formChangesMixin";

export default {
  mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
  emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
  components: { PrimaryButton, AlertDialog, NotificationToast, TabBar, PhoneInputWithCountry, ClientBalanceTab, ClientPaymentsTab, ClientOperationsTab, UserSearch },
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
      contactPerson: this.editingItem ? this.editingItem.contactPerson : "",
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
      currentTab: "info",
      tabs: [
        { name: "info", label: "info" },
        { name: "balance", label: "balance" },
        { name: "payments", label: "payments" },
        { name: "operations", label: "operations" }
      ]
    };
  },
  computed: {
    translatedTabs() {
      let visibleTabs = this.editingItem ? this.tabs : this.tabs.filter(tab =>
        tab.name !== 'balance' && tab.name !== 'payments' && tab.name !== 'operations'
      );
      if (!this.$store.getters.hasPermission('settings_client_balance_view')) {
        visibleTabs = visibleTabs.filter(tab => tab.name !== 'balance');
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
    if (this.$store.getters.users.length === 0) {
      await this.$store.dispatch('loadUsers');
    }

    if (this.$store.getters.clients.length === 0) {
      await this.$store.dispatch('loadClients');
    }
    
    if (this.employeeId) {
      await this.loadSelectedEmployee();
    }
    
    this.saveInitialState();
  },
  methods: {
    changeTab(tabName) {
      if ((tabName === 'balance' || tabName === 'payments' || tabName === 'operations') && !this.editingItem) {
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
          console.error('Ошибка при загрузке сотрудника:', error);
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
    handlePaymentsUpdated() {
      if (this.editingItem && this.editingItem.id) {
      }
    },
    getFormState() {
      return {
        firstName: this.firstName,
        lastName: this.lastName,
        patronymic: this.patronymic,
        contactPerson: this.contactPerson,
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

        const expectedLength = 11;

        if (cleanedPhone.length < expectedLength) {
          this.showNotification("Ошибка", `Номер должен содержать ${expectedLength} цифр (код страны + номер)`, true);
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
          this.showNotification("Ошибка", `Номер должен содержать ${expectedLength} цифр`, true);
          return;
        }

        if (this.phones.includes(phoneToSave)) {
          this.showNotification("Ошибка", "Этот номер телефона уже добавлен!", true);
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
      if (this.editingPhones[index] && this.editingPhones[index].trim()) {
        this.savePhoneEdit(index);
      }
    },
    savePhoneEdit(index) {
      if (this.editingPhones[index] === undefined) {
        return;
      }

      const editedPhone = this.editingPhones[index];
      if (!editedPhone || !editedPhone.trim()) {
        this.showNotification("Ошибка", "Номер телефона не может быть пустым", true);
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
        this.showNotification("Ошибка", `Номер должен содержать ${expectedLocalLength} цифр (без кода страны)`, true);
        this.editingPhones[index] = this.formatPhoneForInput(this.phones[index]);
        return;
      }

      if (phoneWithoutCode.length > expectedLocalLength) {
        phoneWithoutCode = phoneWithoutCode.substring(phoneWithoutCode.length - expectedLocalLength);
      }

      const phoneToSave = dialCode + phoneWithoutCode;
      const expectedFullLength = 11;

      if (phoneToSave.length !== expectedFullLength) {
        this.showNotification("Ошибка", `Номер должен содержать ${expectedFullLength} цифр (код страны + номер)`, true);
        this.editingPhones[index] = this.formatPhoneForInput(this.phones[index]);
        return;
      }

      if (this.phones.includes(phoneToSave) && this.phones[index] !== phoneToSave) {
        this.showNotification("Ошибка", "Этот номер телефона уже добавлен!", true);
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
    addEmail() {
      if (this.newEmail) {
        this.emails.push(this.newEmail);
        this.newEmail = "";
      }
    },
    removeEmail(index) {
      this.emails.splice(index, 1);
    },
    async save() {
      if ((this.clientType === 'employee' || this.clientType === 'investor') && !this.selectedEmployee) {
        this.showNotification(this.$t('error') || 'Ошибка', this.$t('selectEmployee') || 'Необходимо выбрать сотрудника', true);
        return;
      }

      this.saveLoading = true;
      try {
        const clientData = {
          first_name: this.firstName,
          last_name: this.lastName,
          patronymic: this.patronymic,
          contact_person: this.contactPerson,
          position: this.position,
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

        let resp;
        if (this.editingItem) {
          resp = await ClientController.updateItem(this.editingItem.id, clientData);
        } else {
          resp = await ClientController.storeItem(clientData);
        }

        if (resp.message) {
          this.$emit("saved", resp.item || clientData);
          this.clearForm();
        }
      } catch (error) {
        this.$emit("saved-error", error);
      } finally {
        this.saveLoading = false;
      }
    },
    async deleteItem() {
      this.closeDeleteDialog();
      if (!this.editingItem) {
        return;
      }
      this.deleteLoading = true;
      try {
        const resp = await ClientController.deleteItem(this.editingItem.id);
        if (resp.message) {
          this.$emit("deleted");
          this.clearForm();
        }
      } catch (error) {
        this.$emit("deleted-error", this.getApiErrorMessage(error));
      }
      this.deleteLoading = false;
    },
    clearForm() {
      this.firstName = "";
      this.lastName = "";
      this.patronymic = "";
      this.contactPerson = "";
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
  },
  watch: {
    defaultFirstName(newVal) {
      if (!this.editingItem) {
        this.firstName = newVal || "";
      }
    },
    editingItem: {
      handler(newEditingItem) {
        if (newEditingItem) {
          this.firstName = newEditingItem.firstName || "";
          this.lastName = newEditingItem.lastName || "";
          this.patronymic = newEditingItem.patronymic || "";
          this.contactPerson = newEditingItem.contactPerson || "";
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
          this.discountType = newEditingItem.discountType ?? "fixed";
          this.discount = newEditingItem.discount ?? 0;
          this.$nextTick(async () => {
            this.employeeId = newEditingItem.employeeId || null;
            if (this.employeeId) {
              await this.loadSelectedEmployee();
            } else {
              this.selectedEmployee = null;
            }
            this.saveInitialState();
          });
          this.currentTab = "info";
        } else {
          this.clearForm();
          this.currentTab = "info";
        }
      },
      deep: true,
      immediate: true,
    },
    clientType: {
      handler(type) {
        if (type === "individual") {
          this.contactPerson = "";
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

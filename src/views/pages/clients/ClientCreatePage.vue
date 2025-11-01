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
          <label class="required">{{ $t('selectEmployee') }}</label>
          <select v-model="employeeId" required>
            <option :value="null">{{ $t('selectEmployee') }}</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.name }}
            </option>
          </select>
        </div>
        <div v-if="clientType !== 'employee' && clientType !== 'investor'">
          <label class="required">{{ $t('firstName') }}</label>
          <input type="text" v-model="firstName" required />
        </div>
        <div v-if="clientType === 'individual'">
          <label>{{ $t('lastName') }}</label>
          <input type="text" v-model="lastName" />
        </div>
        <div v-if="clientType === 'company'">
          <label>{{ $t('contactPerson') }}</label>
          <input type="text" v-model="contactPerson" />
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
            <PhoneInputWithCountry
              v-model="newPhone"
              :default-country="newPhoneCountry"
              :preferred-countries="['tm', 'ru']"
              @country-change="handleCountryChange"
              @keyup.enter="addPhone"
              @blur="handlePhoneBlur"
              class="flex-1"
              :required="true"
              ref="phoneInputRef"
            />
            <PrimaryButton v-if="newPhone" icon="fas fa-add" :is-info="true" :onclick="addPhone" />
          </div>
          <div v-for="(phone, index) in phones" :key="phone" class="flex items-center space-x-2 mt-2">
            <div class="flex items-center space-x-1 px-2 py-1 border border-gray-300 rounded-l bg-gray-50">
              <img
                :src="getPhoneCountryFlag(phone)"
                :alt="getPhoneCountryName(phone)"
                class="w-5 h-4 object-cover rounded"
              />
              <span class="text-sm font-medium">{{ getPhoneCountryCode(phone) }}</span>
            </div>
            <input type="text" :value="formatPhoneForDisplay(phone)" readonly class="flex-1 px-3 py-1 border border-l-0 border-gray-300 rounded-r bg-gray-50" />
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
      <div v-show="currentTab === 'balance' && editingItem" class="mt-4">
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
  <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
            :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
  <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
            :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
  <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
    :is-danger="notificationIsDanger" @close="closeNotification" />
</template>

<script>
import ClientController from "@/api/ClientController";
import ClientDto from "@/dto/client/ClientDto";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import TabBar from "@/views/components/app/forms/TabBar.vue";
import PhoneInputWithCountry from "@/views/components/app/forms/PhoneInputWithCountry.vue";
import ClientBalanceTab from "@/views/pages/clients/ClientBalanceTab.vue";
import ClientPaymentsTab from "@/views/pages/clients/ClientPaymentsTab.vue";
import ClientOperationsTab from "@/views/pages/clients/ClientOperationsTab.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import formChangesMixin from "@/mixins/formChangesMixin";

export default {
  mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
  emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
  components: { PrimaryButton, AlertDialog, NotificationToast, TabBar, PhoneInputWithCountry, ClientBalanceTab, ClientPaymentsTab, ClientOperationsTab },
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
      contactPerson: this.editingItem ? this.editingItem.contactPerson : "",
      clientType: this.editingItem ? this.editingItem.clientType : "individual",
      employeeId: this.editingItem ? this.editingItem.employeeId : null,
      address: this.editingItem ? this.editingItem.address : "",
      note: this.editingItem ? this.editingItem.note : "",
      status: this.editingItem ? this.editingItem.status : true,
      isConflict: this.editingItem ? this.editingItem.isConflict : false,
      isSupplier: this.editingItem ? this.editingItem.isSupplier : false,
      phones: this.editingItem ? this.editingItem.phones.map((phone) => phone.phone) : [],
      emails: this.editingItem ? this.editingItem.emails.map((email) => email.email) : [],
      discountType: this.editingItem ? this.editingItem.discountType : "fixed",
      discount: this.editingItem ? this.editingItem.discount : 0,
      editingItemId: this.editingItem?.id || null,
      newPhone: "",
      newPhoneCountry: "tm", // tm - Туркменистан, ru - Россия
      currentPhoneCountry: null, // Текущая выбранная страна для нового телефона
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
      // Скрываем вкладки баланса, платежей и операций при создании нового клиента
      const visibleTabs = this.editingItem ? this.tabs : this.tabs.filter(tab =>
        tab.name !== 'balance' && tab.name !== 'payments' && tab.name !== 'operations'
      );
      return visibleTabs.map(tab => ({
        ...tab,
        label: this.$t(tab.label)
      }));
    },
    users() {
      const allUsers = this.$store.getters.users || [];

      // Если тип клиента не employee/investor, возвращаем всех сотрудников
      if (this.clientType !== 'employee' && this.clientType !== 'investor') {
        return allUsers;
      }

      // Получаем список клиентов из store
      const clients = this.$store.getters.clients || [];

      // Находим ID сотрудников, которые уже используются как employee_id
      // в клиентах типа employee или investor (исключаем текущего редактируемого клиента)
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

      // Фильтруем сотрудников, исключая уже использованных
      let available = allUsers.filter(user => !usedEmployeeIds.has(user.id));

      // Гарантируем, что выбранный ранее сотрудник присутствует в списке
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
    // Загружаем сотрудников для выбора сотрудника
    if (this.$store.getters.users.length === 0) {
      await this.$store.dispatch('loadUsers');
    }

    // Загружаем клиентов для проверки уже выбранных сотрудников
    if (this.$store.getters.clients.length === 0) {
      await this.$store.dispatch('loadClients');
    }
  },
  methods: {
    changeTab(tabName) {
      // Предотвращаем переход на вкладку баланса, платежей или операций при создании нового клиента
      if ((tabName === 'balance' || tabName === 'payments' || tabName === 'operations') && !this.editingItem) {
        this.currentTab = 'info';
        return;
      }
      this.currentTab = tabName;
    },
    handlePaymentsUpdated() {
      // Обновляем данные клиента после изменения платежей
      if (this.editingItem && this.editingItem.id) {
        // Можно добавить перезагрузку данных клиента если нужно
      }
    },
    getFormState() {
      return {
        firstName: this.firstName,
        lastName: this.lastName,
        contactPerson: this.contactPerson,
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
      // Добавляем телефон при потере фокуса, только если есть введенный номер
      // При separateDialCode нужно проверить реальный ввод, а не только v-model
      const phoneComponent = this.$refs.phoneInputRef;
      if (phoneComponent && phoneComponent.iti) {
        const inputValue = phoneComponent.$refs.phoneInput?.value || "";
        const cleanedInput = inputValue.replace(/\D/g, "");
        // Добавляем только если введено минимум 3 цифры (чтобы избежать ошибок при случайном клике)
        if (cleanedInput && cleanedInput.length >= 3) {
          this.addPhone();
        }
      } else if (this.newPhone && this.newPhone.trim()) {
        // Fallback для случая, когда компонент не готов
        this.addPhone();
      }
    },
    getPhoneCountryCode(phone) {
      // Определяем код страны по номеру телефона
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("993")) {
        return "+993";
      } else if (cleaned.startsWith("7")) {
        return "+7";
      }
      // По умолчанию определяем по длине и первым цифрам
      if (cleaned.length >= 9 && cleaned.startsWith("993")) {
        return "+993";
      }
      return "+993"; // По умолчанию Туркменистан
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
    formatPhoneForDisplay(phone) {
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("993")) {
        // Форматируем как 993 12 345678
        const rest = cleaned.substring(3);
        if (rest.length >= 2) {
          return `993 ${rest.substring(0, 2)} ${rest.substring(2)}`;
        }
        return `993 ${rest}`;
      } else if (cleaned.startsWith("7")) {
        // Форматируем как 7 (999) 999-99-99
        const rest = cleaned.substring(1);
        if (rest.length >= 3) {
          const formatted = `7 (${rest.substring(0, 3)}) ${rest.substring(3, 6)}-${rest.substring(6, 8)}-${rest.substring(8)}`;
          return formatted.replace(/-+$/, ""); // Удаляем лишние дефисы в конце
        }
        return `7 ${rest}`;
      }
      return phone;
    },
    addPhone() {
      if (this.newPhone && this.newPhone.trim()) {
        // Получаем номер в международном формате через компонент
        const phoneComponent = this.$refs.phoneInputRef;
        if (!phoneComponent || !phoneComponent.iti) {
          // Если компонент не готов, используем базовую валидацию
          // Это fallback на случай, если библиотека не загрузилась
          const cleanedPhone = this.newPhone.replace(/\D/g, "");
          
          // Базовая проверка: номер должен содержать код страны и номер
          // Минимум проверяем по международному стандарту (не менее 7 цифр)
          if (cleanedPhone.length < 7) {
            this.showNotification("Ошибка", "Номер телефона слишком короткий", true);
            return;
          }
          
          // Максимум 15 цифр по международному стандарту E.164
          if (cleanedPhone.length > 15) {
            this.showNotification("Ошибка", "Номер телефона слишком длинный (максимум 15 цифр)", true);
            return;
          }
          
          // Примечание: точная валидация длины для конкретной страны
          // выполняется через intl-tel-input (isValidNumber)
          
          // Определяем код страны из выбранной страны
          let phoneToSave = cleanedPhone;
          if (this.currentPhoneCountry) {
            // Если номер не начинается с кода страны, добавляем его
            if (!cleanedPhone.startsWith(this.currentPhoneCountry.dialCode)) {
              phoneToSave = this.currentPhoneCountry.dialCode + cleanedPhone;
            } else {
              phoneToSave = cleanedPhone;
            }
          } else {
            // По умолчанию добавляем код Туркменистана, если код не указан
            if (!cleanedPhone.startsWith("993") && !cleanedPhone.startsWith("7")) {
              phoneToSave = "993" + cleanedPhone;
            }
          }

          if (this.phones.includes(phoneToSave)) {
            this.showNotification("Ошибка", "Этот номер телефона уже добавлен!", true);
            return;
          }
          this.phones.push(phoneToSave);
        } else {
          // Используем intl-tel-input с встроенной валидацией
          const iti = phoneComponent.iti;
          
          // Получаем введенный номер (при separateDialCode это только национальный номер без кода)
          const inputElement = phoneComponent.$refs.phoneInput;
          const inputValue = inputElement ? inputElement.value : "";
          const cleanedInput = inputValue.replace(/\D/g, "");
          
          // Проверяем, что пользователь ввел хотя бы минимальное количество цифр
          if (!cleanedInput || cleanedInput.length < 3) {
            this.showNotification("Ошибка", "Пожалуйста, введите номер телефона", true);
            return;
          }
          
          // Проверяем валидность номера через встроенную валидацию intl-tel-input
          // Библиотека автоматически проверяет правильную длину для каждой страны:
          // - Туркменистан: 993 + 8 цифр = 11 цифр (в поле только 8 цифр)
          // - Россия: 7 + 10 цифр = 11 цифр (в поле только 10 цифр)
          // и т.д. для других стран
          if (!iti.isValidNumber()) {
            // Получаем более подробную информацию об ошибке
            const validationError = iti.getValidationError();
            let errorMessage = "Пожалуйста, введите корректный номер телефона";
            
            if (validationError === 1) {
              const countryData = iti.getSelectedCountryData();
              errorMessage = `Номер телефона слишком короткий для ${countryData.name}. Введите полный номер`;
            } else if (validationError === 2) {
              const countryData = iti.getSelectedCountryData();
              errorMessage = `Номер телефона слишком длинный для ${countryData.name}`;
            } else if (validationError === 3) {
              errorMessage = "Неверный формат номера для выбранной страны";
            } else {
              // Если номер еще неполный, показываем более понятное сообщение
              const countryData = iti.getSelectedCountryData();
              errorMessage = `Введите полный номер телефона для ${countryData.name}`;
            }
            
            this.showNotification("Ошибка", errorMessage, true);
            return;
          }

          // Получаем номер в международном формате (E164: +99312345678)
          // isValidNumber() уже проверил валидность, поэтому getNumber() вернет корректный номер
          const fullNumber = iti.getNumber();

          // Проверяем, что getNumber() вернул валидный номер
          if (!fullNumber || fullNumber.length < 8) {
            this.showNotification("Ошибка", "Введите полный номер телефона", true);
            return;
          }

          // Убираем + и сохраняем только цифры (код страны + номер)
          // intl-tel-input уже проверил, что номер имеет правильную длину для страны
          const cleanedNumber = fullNumber.replace(/[^\d]/g, "");
          
          if (this.phones.includes(cleanedNumber)) {
            this.showNotification("Ошибка", "Этот номер телефона уже добавлен!", true);
            return;
          }
          
          this.phones.push(cleanedNumber);
        }

        // Очищаем поле ввода
        this.newPhone = "";
        this.currentPhoneCountry = null;
        this.newPhoneCountry = "tm"; // Сбрасываем на Туркменистан
      }
    },
    removePhone(index) {
      this.phones.splice(index, 1);
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
      this.saveLoading = true;
      try {
        const clientData = {
          first_name: this.firstName,
          last_name: this.lastName,
          contact_person: this.contactPerson,
          client_type: this.clientType,
          employee_id: this.employeeId,
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
        const errorMessage = this.getApiErrorMessage(error);
        this.$emit("saved-error", errorMessage);
      }
      this.saveLoading = false;
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
      this.contactPerson = "";
      this.clientType = "individual";
      this.employeeId = null;
      this.address = "";
      this.note = "";
      this.status = true;
      this.isConflict = false;
      this.isSupplier = false;
      this.phones = [];
      this.newPhone = "";
      this.newPhoneCountry = "tm";
      this.currentPhoneCountry = null;
      this.emails = [];
      this.discountType = "fixed";
      this.discount = 0;
      // Всегда возвращаемся на вкладку "info" при создании нового клиента
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
          this.contactPerson = newEditingItem.contactPerson || "";
          this.clientType = newEditingItem.clientType || "individual";
          this.employeeId = newEditingItem.employeeId || null;
          this.address = newEditingItem.address || "";
          this.note = newEditingItem.note || "";
          this.status = newEditingItem.status || false;
          this.isConflict = newEditingItem.isConflict || false;
          this.isSupplier = newEditingItem.isSupplier || false;
          this.phones = newEditingItem.phones.map((phone) => phone.phone) || [];
          this.newPhone = "";
          this.newPhoneCountry = "tm";
          this.currentPhoneCountry = null;
          this.emails = newEditingItem.emails.map((email) => email.email) || [];
          this.discountType = newEditingItem.discountType ?? "fixed";
          this.discount = newEditingItem.discount ?? 0;
          this.currentTab = "info";
        } else {
          this.clearForm();
          this.currentTab = "info";
        }
        this.$nextTick(() => {
          this.saveInitialState();
        });
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

        // Сбрасываем employeeId если тип клиента не employee/investor
        if (type !== "employee" && type !== "investor") {
          this.employeeId = null;
        }
      },
      deep: true,
      immediate: true,
    },
    employeeId: {
      handler(newEmployeeId) {
        // Автозаполнение данных сотрудника при выборе
        if (newEmployeeId && (this.clientType === "employee" || this.clientType === "investor")) {
          const selectedUser = this.users.find(user => user.id === newEmployeeId);
          if (selectedUser) {
            // Автозаполняем имя сотрудника
            this.firstName = selectedUser.name || "";
          } else {
            // Если выбранный сотрудник недоступен (например, уже используется), сбрасываем
            this.employeeId = null;
          }
        }
      },
    },
  },
};
</script>

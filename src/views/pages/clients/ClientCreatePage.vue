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
            <input type="text" v-model="newPhone" ref="phoneInput" @keyup.enter="addPhone" @blur="addPhone" required />
            <PrimaryButton v-if="newPhone" icon="fas fa-add" :is-info="true" :onclick="addPhone" />
          </div>
          <div v-for="(phone, index) in phones" :key="phone" class="flex items-center space-x-2 mt-2">
            <input type="text" :value="phone" readonly />
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
import Inputmask from "inputmask";
import ClientBalanceTab from "@/views/pages/clients/ClientBalanceTab.vue";
import ClientPaymentsTab from "@/views/pages/clients/ClientPaymentsTab.vue";
import ClientOperationsTab from "@/views/pages/clients/ClientOperationsTab.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import formChangesMixin from "@/mixins/formChangesMixin";

export default {
  mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
  emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
  components: { PrimaryButton, AlertDialog, NotificationToast, TabBar, ClientBalanceTab, ClientPaymentsTab, ClientOperationsTab },
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

      // Если тип клиента не employee/investor, возвращаем всех пользователей
      if (this.clientType !== 'employee' && this.clientType !== 'investor') {
        return allUsers;
      }

      // Получаем список клиентов из store
      const clients = this.$store.getters.clients || [];

      // Находим ID пользователей, которые уже используются как employee_id
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

      // Фильтруем пользователей, исключая уже использованных
      let available = allUsers.filter(user => !usedEmployeeIds.has(user.id));

      // Гарантируем, что выбранный ранее пользователь присутствует в списке
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
    const phoneInput = this.$refs.phoneInput;
    const mask = new Inputmask({
      mask: "\\9\\9\\3 99 999999",
      placeholder: "_",
      showMaskOnHover: false,
      showMaskOnFocus: true,
      clearIncomplete: true,
      keepStatic: true,
    });
    mask.mask(phoneInput);

    // Загружаем пользователей для выбора сотрудника
    if (this.$store.getters.users.length === 0) {
      await this.$store.dispatch('loadUsers');
    }

    // Загружаем клиентов для проверки уже выбранных пользователей
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

    addPhone() {
      if (this.newPhone) {
        const cleanedPhone = this.newPhone.replace(/\D/g, "");
        if (cleanedPhone.length !== 11) {
          this.phoneError = "Номер должен содержать ровно 11 цифр";
          return;
        }
        if (this.phones.includes(cleanedPhone)) {
          this.showNotification("Ошибка", "Этот номер телефона уже добавлен!", true);
          return;
        }
        this.phones.push(cleanedPhone);
        this.newPhone = "";
        this.phoneError = "";
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
            // Если выбранный пользователь недоступен (например, уже используется), сбрасываем
            this.employeeId = null;
          }
        }
      },
    },
  },
};
</script>

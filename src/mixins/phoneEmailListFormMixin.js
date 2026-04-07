import {
  formatPhoneForInput,
  getPhoneCountryId,
  isEmailEditChanged as isEmailEditChangedUtil,
  isPhoneEditChanged as isPhoneEditChangedUtil,
  mapApiPhonesToLists,
  tryAddEmail,
  trySaveEmailEdit,
  trySavePhoneEdit,
  validateAndNormalizeNewPhone,
} from "@/utils/phoneEmailFormUtils";

export default {
  data() {
    return {
      phones: [],
      editingPhones: [],
      editingPhoneCountries: [],
      emails: [],
      editingEmails: [],
      newPhone: "",
      newPhoneCountry: "tm",
      currentPhoneCountry: null,
      newEmail: "",
    };
  },
  methods: {
    handleCountryChange(country) {
      this.currentPhoneCountry = country;
      this.newPhoneCountry = country.id;
    },
    handlePhoneBlur() {
      if (this.newPhone && this.newPhone.trim()) {
        this.addPhone();
      }
    },
    addPhone() {
      if (!this.newPhone || !this.newPhone.trim()) {
        return;
      }
      const result = validateAndNormalizeNewPhone(
        this.newPhone,
        this.currentPhoneCountry,
        this.phones
      );
      if (!result.ok) {
        if (result.i18nKey) {
          this.showNotification(
            this.$t("error"),
            this.$t(result.i18nKey, result.i18nParams || {}),
            true
          );
        }
        return;
      }
      this.phones.push(result.phoneToSave);
      this.editingPhones.push(formatPhoneForInput(result.phoneToSave));
      this.editingPhoneCountries.push(result.countryMeta);
      this.newPhone = "";
      this.currentPhoneCountry = null;
      this.newPhoneCountry = "tm";
    },
    removePhone(index) {
      this.phones.splice(index, 1);
      this.editingPhones.splice(index, 1);
      this.editingPhoneCountries.splice(index, 1);
    },
    formatPhoneForInput,
    getPhoneCountryId,
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
      if (
        this.editingPhones[index] &&
        this.editingPhones[index].trim() &&
        this.isPhoneEditChanged(index)
      ) {
        this.savePhoneEdit(index);
      }
    },
    isPhoneEditChanged(index) {
      return isPhoneEditChangedUtil({
        savedFullPhone: this.phones[index],
        editedDisplay: this.editingPhones[index],
        editedCountryId: this.editingPhoneCountries[index]?.id,
      });
    },
    savePhoneEdit(index) {
      const result = trySavePhoneEdit({
        editedPhoneRaw: this.editingPhones[index],
        currentStoredPhone: this.phones[index],
        selectedCountry: this.editingPhoneCountries[index],
        existingPhones: this.phones,
        currentIndex: index,
      });
      if (!result.ok) {
        if (result.i18nKey) {
          this.showNotification(
            this.$t("error"),
            this.$t(result.i18nKey, result.i18nParams || {}),
            true
          );
        }
        if (result.revertDisplay !== undefined) {
          this.editingPhones[index] = result.revertDisplay;
        }
        return;
      }
      if (result.noop) {
        return;
      }
      this.phones[index] = result.phoneToSave;
      this.editingPhones[index] = formatPhoneForInput(result.phoneToSave);
      this.editingPhoneCountries[index] = result.countryMeta;
    },
    handleEmailBlur() {
      if (this.newEmail && this.newEmail.trim()) {
        this.addEmail();
      }
    },
    addEmail() {
      const result = tryAddEmail(this.newEmail, this.emails);
      if (!result.ok) {
        if (result.i18nKey) {
          this.showNotification(this.$t("error"), this.$t(result.i18nKey), true);
        }
        return;
      }
      this.emails.push(result.normalized);
      this.editingEmails.push(result.normalized);
      this.newEmail = "";
    },
    handleEditEmailBlur(index) {
      if (
        this.editingEmails[index] !== undefined &&
        this.editingEmails[index].trim() &&
        this.isEmailEditChanged(index)
      ) {
        this.saveEmailEdit(index);
      }
    },
    isEmailEditChanged(index) {
      return isEmailEditChangedUtil(this.emails[index], this.editingEmails[index]);
    },
    saveEmailEdit(index) {
      const result = trySaveEmailEdit({
        editedRaw: this.editingEmails[index],
        currentEmail: this.emails[index],
        existingEmails: this.emails,
        currentIndex: index,
      });
      if (!result.ok) {
        if (result.i18nKey) {
          this.showNotification(this.$t("error"), this.$t(result.i18nKey), true);
        }
        if (result.revertTo !== undefined) {
          this.editingEmails[index] = result.revertTo;
        }
        return;
      }
      if (result.noop) {
        return;
      }
      this.emails[index] = result.normalized;
      this.editingEmails[index] = result.normalized;
    },
    removeEmail(index) {
      this.emails.splice(index, 1);
      this.editingEmails.splice(index, 1);
    },
    resetPhoneEmailListFields() {
      this.phones = [];
      this.editingPhones = [];
      this.editingPhoneCountries = [];
      this.newPhone = "";
      this.newPhoneCountry = "tm";
      this.currentPhoneCountry = null;
      this.emails = [];
      this.editingEmails = [];
      this.newEmail = "";
    },
    applyPhoneEmailListsFromApiItem(apiItem) {
      const phoneLists = mapApiPhonesToLists(apiItem.phones);
      this.phones = phoneLists.phones;
      this.editingPhones = phoneLists.editingPhones;
      this.editingPhoneCountries = phoneLists.editingPhoneCountries;
      this.newPhone = "";
      this.newPhoneCountry = "tm";
      this.currentPhoneCountry = null;
      this.emails = (apiItem.emails || []).map((e) => e.email);
      this.editingEmails = [...this.emails];
      this.newEmail = "";
    },
  },
};

<template>
  <div class="phone-input-wrapper">
    <div
      class="relative flex items-stretch gap-0"
      :class="{ 'input-focused': isInputFocused }"
    >
      <!-- Флаг и код страны -->
      <div class="relative">
        <button
          type="button"
          class="phone-country-trigger flex items-center space-x-1 rounded-l bg-white hover:bg-gray-50 focus:outline-none dark:bg-[var(--input-bg)] dark:hover:bg-[var(--surface-muted)]"
          style="border: 2px solid #bbb; border-right: none; border-radius: 5px 0 0 5px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); padding: 8px 12px; display: flex; align-items: center; justify-content: center;"
          @click="toggleCountryDropdown"
        >
          <img
            :src="selectedCountry.flag"
            :alt="selectedCountry.name"
            class="w-5 h-4 object-cover rounded"
          >
          <!-- <span class="font-medium">{{ selectedCountry.code }}</span> -->
          <i class="fas fa-chevron-down ml-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]" />
        </button>

        <!-- Dropdown список стран -->
        <div
          v-if="showCountryDropdown"
          class="phone-country-list absolute z-50 mt-1 max-h-60 overflow-auto rounded border border-gray-300 bg-white shadow-lg dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
          style="min-width: 200px;"
        >
          <div
            v-for="country in countries"
            :key="country.code"
            class="flex cursor-pointer items-center space-x-2 px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
            :class="{ 'bg-blue-50 dark:bg-[var(--surface-muted)] dark:text-[var(--label-accent)]': country.code === selectedCountry.code }"
            @click="selectCountry(country)"
          >
            <img
              :src="country.flag"
              :alt="country.name"
              class="w-5 h-4 object-cover rounded"
            >
            <span>{{ country.name }}</span>
            <span class="ml-auto text-gray-500 dark:text-[var(--text-secondary)]">{{ country.code }}</span>
          </div>
        </div>
      </div>

      <!-- Поле ввода телефона -->
      <input
        type="text"
        :value="phoneValue"
        :placeholder="selectedCountry.placeholder"
        :required="required"
        autocomplete="off"
        @input="handleInput"
        class="phone-national-field flex-1 rounded-r text-gray-900 placeholder:text-gray-400 focus:outline-none dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)] dark:placeholder:text-[var(--text-secondary)]"
        @focus="handleFocus"
        style="border: 2px solid #bbb; border-left: none; border-radius: 0 5px 5px 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); transition: border-color 0.2s ease; padding: 8px 12px; margin-left: 0; font-family: 'Open Sans', sans-serif; font-size: 12px;"
        @blur="handleBlur"
        ref="phoneInput"
        @keyup.enter="$emit('keyup.enter', $event)"
      >
    </div>
  </div>
</template>

<script>
import Inputmask from "inputmask";
import { DEFAULT_PHONE_COUNTRY_ID, PHONE_COUNTRIES } from "@/constants/phoneCountries";

export default {
  name: "PhoneInputWithCountry",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    required: {
      type: Boolean,
      default: false,
    },
    defaultCountry: {
      type: String,
      default: DEFAULT_PHONE_COUNTRY_ID,
    },
  },
  emits: ["update:modelValue", "country-change", "phone-change", "focus", "blur"],
  data() {
    return {
      showCountryDropdown: false,
      selectedCountryCode: this.defaultCountry,
      phoneValue: this.modelValue || "",
      inputmaskInstance: null,
      isInputFocused: false,
      countries: PHONE_COUNTRIES,
    };
  },
  computed: {
    selectedCountry() {
      return (
        this.countries.find((c) => c.id === this.selectedCountryCode) ||
        this.countries[0]
      );
    },
  },
  watch: {
    modelValue(newVal) {
      this.phoneValue = newVal || "";
    },
    defaultCountry(newVal) {
      this.selectedCountryCode = newVal;
      this.applyMask();
    },
  },
  mounted() {
    this.$nextTick(() => this.applyMask());
    this.closeDropdownOnClickOutside();
  },
  beforeUnmount() {
    if (this.inputmaskInstance) {
      try {
        this.inputmaskInstance.remove();
      } catch {
        void 0;
      }
      this.inputmaskInstance = null;
    }
    document.removeEventListener("click", this.handleClickOutside);
  },
  methods: {
    toggleCountryDropdown() {
      this.showCountryDropdown = !this.showCountryDropdown;
    },
    selectCountry(country) {
      this.selectedCountryCode = country.id;
      this.showCountryDropdown = false;
      this.applyMask();
      this.$emit("country-change", country);

      // Очищаем значение при смене страны, чтобы пользователь ввел новый номер
      this.phoneValue = "";
      this.$emit("update:modelValue", "");
    },
    applyMask() {
      const phoneInput = this.$refs.phoneInput;
      const country = this.selectedCountry;
      const mask = country?.mask;
      if (!phoneInput || !mask) return;

      if (this.inputmaskInstance) {
        try {
          this.inputmaskInstance.remove();
        } catch {
          void 0;
        }
        this.inputmaskInstance = null;
      }

      this.inputmaskInstance = new Inputmask({
        mask,
        placeholder: "_",
        showMaskOnHover: false,
        showMaskOnFocus: true,
        clearIncomplete: true,
        keepStatic: true,
      });
      this.inputmaskInstance.mask(phoneInput);
    },
    handleInput(event) {
      this.phoneValue = event.target.value;
      this.$emit("update:modelValue", event.target.value);
      this.$emit("phone-change", event.target.value);
    },
    handleFocus(event) {
      this.isInputFocused = true;
      this.$emit("focus", event);
    },
    handleBlur(event) {
      this.isInputFocused = false;
      this.$emit("blur", event);
    },
    closeDropdownOnClickOutside() {
      this.handleClickOutside = (event) => {
        if (!this.$el.contains(event.target)) {
          this.showCountryDropdown = false;
        }
      };
      document.addEventListener("click", this.handleClickOutside);
    },
  },
};
</script>

<style scoped>
.phone-input-wrapper {
  width: 100%;
  flex: 1;
  min-width: 0;
}

.phone-input-wrapper>div {
  display: flex;
  align-items: stretch;
  gap: 0;
}

.phone-input-wrapper button {
  min-height: 100%;
  display: flex;
  align-items: center;
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  transition: border-color 0.2s ease;
}

.phone-input-wrapper input {
  min-height: 100%;
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
}

.phone-input-wrapper :deep(input:focus) {
  border-color: #337AB7 !important;
  border-left-color: #337AB7 !important;
}

.phone-input-wrapper .input-focused button {
  border-color: #337AB7 !important;
}
</style>

<style>
html.dark .phone-input-wrapper .phone-country-trigger {
  border-color: var(--input-border) !important;
  box-shadow: none !important;
}

html.dark .phone-input-wrapper .phone-national-field {
  border-color: var(--input-border) !important;
  box-shadow: none !important;
}

html.dark .phone-input-wrapper .input-focused .phone-country-trigger {
  border-color: var(--label-accent) !important;
}

html.dark .phone-input-wrapper .phone-national-field:focus {
  border-color: var(--label-accent) !important;
  border-left: none !important;
}
</style>

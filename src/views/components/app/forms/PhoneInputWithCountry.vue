<template>
  <div class="phone-input-wrapper">
    <div
      class="relative flex items-stretch gap-0"
      :class="{ 'input-focused': isInputFocused }"
    >
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
          <i class="fas fa-chevron-down ml-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]" />
        </button>

        <div
          v-if="showCountryDropdown"
          class="phone-country-list absolute z-50 mt-1 max-h-60 overflow-hidden rounded border border-gray-300 bg-white shadow-lg dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
          style="min-width: 200px;"
        >
          <input
            ref="countrySearchInput"
            v-model="countrySearch"
            type="search"
            autocomplete="off"
            class="phone-country-search w-full border-b border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none dark:border-[var(--border-subtle)] dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)] dark:placeholder:text-[var(--text-secondary)]"
            @click.stop
          >
          <div class="max-h-48 overflow-auto">
            <div
              v-for="country in filteredCountries"
              :key="country.id"
              class="flex cursor-pointer items-center space-x-2 px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
              :class="{ 'bg-blue-50 dark:bg-[var(--surface-muted)] dark:text-[var(--label-accent)]': country.id === selectedCountry.id }"
              @click="selectCountry(country)"
            >
              <img
                :src="country.flag"
                :alt="country.name"
                class="w-5 h-4 object-cover rounded"
              >
              <span>{{ country.name }}</span>
              <span class="ml-auto shrink-0 text-gray-500 dark:text-[var(--text-secondary)]">{{ country.code }}</span>
            </div>
          </div>
        </div>
      </div>

      <input
        ref="phoneInput"
        type="tel"
        inputmode="numeric"
        :value="phoneValue"
        :placeholder="selectedCountry.code"
        :required="required"
        :maxlength="selectedCountry.localLengthMax"
        autocomplete="off"
        class="phone-national-field flex-1 rounded-r text-gray-900 placeholder:text-gray-400 focus:outline-none dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)] dark:placeholder:text-[var(--text-secondary)]"
        style="border: 2px solid #bbb; border-left: none; border-radius: 0 5px 5px 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); transition: border-color 0.2s ease; padding: 8px 12px; margin-left: 0; font-family: 'Open Sans', sans-serif; font-size: 12px;"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keyup.enter="$emit('keyup.enter', $event)"
      >
    </div>
  </div>
</template>

<script>
import {
  DEFAULT_PHONE_COUNTRY_ID,
  PHONE_COUNTRIES,
  resolvePhoneCountry,
} from "@/constants/phoneCountries";

function sliceNationalDigits(value, country) {
  const max = country?.localLengthMax ?? 15;
  return String(value ?? "").replace(/\D/g, "").slice(0, max);
}

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
      type: [String, Object],
      default: DEFAULT_PHONE_COUNTRY_ID,
    },
  },
  emits: ["update:modelValue", "country-change", "phone-change", "focus", "blur"],
  data() {
    const country = resolvePhoneCountry(this.defaultCountry);
    return {
      showCountryDropdown: false,
      selectedCountryCode: country.id,
      phoneValue: sliceNationalDigits(this.modelValue, country),
      isInputFocused: false,
      countrySearch: "",
    };
  },
  computed: {
    selectedCountry() {
      return resolvePhoneCountry(this.selectedCountryCode);
    },
    filteredCountries() {
      const q = (this.countrySearch || "").trim().toLowerCase();
      if (!q) {
        return PHONE_COUNTRIES;
      }
      const digits = q.replace(/\D/g, "");
      return PHONE_COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.includes(q) ||
          c.code.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
          (digits.length > 0 && c.dialCode.startsWith(digits)),
      );
    },
  },
  watch: {
    modelValue(newVal) {
      this.phoneValue = this.normalizeNational(newVal);
    },
    defaultCountry(newVal) {
      const country = resolvePhoneCountry(newVal);
      this.selectedCountryCode = country.id;
      this.phoneValue = sliceNationalDigits(this.phoneValue, country);
      this.$emit("update:modelValue", this.phoneValue);
    },
    showCountryDropdown(open) {
      if (open) {
        this.countrySearch = "";
        this.$nextTick(() => {
          this.$refs.countrySearchInput?.focus?.();
        });
      }
    },
  },
  mounted() {
    this.closeDropdownOnClickOutside();
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  },
  methods: {
    normalizeNational(value) {
      return sliceNationalDigits(value, this.selectedCountry);
    },
    toggleCountryDropdown() {
      this.showCountryDropdown = !this.showCountryDropdown;
    },
    selectCountry(country) {
      this.selectedCountryCode = country.id;
      this.showCountryDropdown = false;
      this.countrySearch = "";
      this.$emit("country-change", country);
      this.phoneValue = "";
      this.$emit("update:modelValue", "");
    },
    handleInput(event) {
      this.phoneValue = this.normalizeNational(event.target.value);
      event.target.value = this.phoneValue;
      this.$emit("update:modelValue", this.phoneValue);
      this.$emit("phone-change", this.phoneValue);
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

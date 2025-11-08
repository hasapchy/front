<template>
  <div class="phone-input-wrapper">
    <div class="relative flex items-stretch gap-0" :class="{ 'input-focused': isInputFocused }">
      <!-- Флаг и код страны -->
      <div class="relative">
        <button type="button" @click="toggleCountryDropdown"
          class="flex items-center space-x-1 rounded-l bg-white hover:bg-gray-50 focus:outline-none"
          style="border: 2px solid #bbb; border-right: none; border-radius: 5px 0 0 5px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); padding: 8px 12px; display: flex; align-items: center; justify-content: center;">
          <img :src="selectedCountry.flag" :alt="selectedCountry.name" class="w-5 h-4 object-cover rounded" />
          <!-- <span class="font-medium">{{ selectedCountry.code }}</span> -->
          <i class="fas fa-chevron-down text-xs ml-1"></i>
        </button>

        <!-- Dropdown список стран -->
        <div v-if="showCountryDropdown"
          class="absolute z-50 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto"
          style="min-width: 200px;">
          <div v-for="country in countries" :key="country.code" @click="selectCountry(country)"
            class="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
            :class="{ 'bg-blue-50': country.code === selectedCountry.code }">
            <img :src="country.flag" :alt="country.name" class="w-5 h-4 object-cover rounded" />
            <span>{{ country.name }}</span>
            <span class="text-gray-500 ml-auto">{{ country.code }}</span>
          </div>
        </div>
      </div>

      <!-- Поле ввода телефона -->
      <input type="text" :value="phoneValue" @input="handleInput" @focus="handleFocus" @blur="handleBlur"
        @keyup.enter="$emit('keyup.enter', $event)" :placeholder="selectedCountry.placeholder" :required="required"
        class="flex-1 rounded-r focus:outline-none"
        style="border: 2px solid #bbb; border-left: none; border-radius: 0 5px 5px 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); transition: border-color 0.2s ease; padding: 8px 12px; margin-left: 0; font-family: 'Open Sans', sans-serif; font-size: 12px;"
        ref="phoneInput" />
    </div>
  </div>
</template>

<script>
import Inputmask from "inputmask";

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
      default: "tm", // tm - Туркменистан, ru - Россия
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
      countries: [
        {
          code: "+993",
          name: "Туркменистан",
          flag: "/flags/640px-Flag_of_Turkmenistan.svg.png",
          mask: "\\9\\9\\3 99 999999",
          placeholder: "993 12 345678",
          dialCode: "993",
          id: "tm",
        },
        {
          code: "+7",
          name: "Россия",
          flag: "/flags/640px-Flag_of_Russia.svg.webp",
          mask: "\\7 (999) 999-99-99",
          placeholder: "7 (999) 999-99-99",
          dialCode: "7",
          id: "ru",
        },
      ],
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
  mounted() {
    this.applyMask();
    this.closeDropdownOnClickOutside();
  },
  beforeUnmount() {
    if (this.inputmaskInstance) {
      this.inputmaskInstance.remove();
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
      if (!phoneInput) return;

      // Удаляем предыдущую маску
      if (this.inputmaskInstance) {
        this.inputmaskInstance.remove();
      }

      // Применяем новую маску
      this.inputmaskInstance = new Inputmask({
        mask: this.selectedCountry.mask,
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
  watch: {
    modelValue(newVal) {
      this.phoneValue = newVal || "";
    },
    defaultCountry(newVal) {
      this.selectedCountryCode = newVal;
      this.applyMask();
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

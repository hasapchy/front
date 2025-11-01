<template>
  <div class="phone-input-wrapper">
    <input
      type="tel"
      :value="phoneValue"
      @input="handleInput"
      @keyup.enter="$emit('keyup.enter', $event)"
      @blur="handleBlur"
      :placeholder="placeholder"
      :required="required"
      ref="phoneInput"
    />
  </div>
</template>

<script>
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

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
    preferredCountries: {
      type: Array,
      default: () => ["tm", "ru"], // По умолчанию показываем Туркменистан и Россию первыми
    },
  },
  emits: ["update:modelValue", "country-change", "phone-change"],
  data() {
    return {
      phoneValue: this.modelValue || "",
      iti: null, // Экземпляр intl-tel-input
      placeholder: "",
    };
  },
  mounted() {
    this.initIntlTelInput();
  },
  beforeUnmount() {
    if (this.iti) {
      this.iti.destroy();
    }
  },
  methods: {
    initIntlTelInput() {
      const phoneInput = this.$refs.phoneInput;
      if (!phoneInput) return;

      // Инициализируем intl-tel-input
      this.iti = intlTelInput(phoneInput, {
        initialCountry: this.defaultCountry,
        preferredCountries: this.preferredCountries,
        separateDialCode: true, // Раздельно показываем код страны
        autoHideDialCode: false, // Не скрываем код страны автоматически
        nationalMode: false, // Используем международный формат
        autoPlaceholder: "polite", // Автоматически обновляем placeholder при смене страны
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@25.12.3/build/js/utils.js", // Для валидации и форматирования
        allowDropdown: true, // Разрешаем выбор страны
      });

      // Обновляем placeholder при загрузке
      this.updatePlaceholder();

      // Обработчик изменения страны
      phoneInput.addEventListener("countrychange", () => {
        const countryData = this.iti.getSelectedCountryData();
        this.$emit("country-change", {
          id: countryData.iso2,
          code: `+${countryData.dialCode}`,
          name: countryData.name,
          dialCode: countryData.dialCode,
        });
        this.updatePlaceholder();
        // При смене страны обновляем значение из input (код страны уже отдельно)
        this.phoneValue = phoneInput.value;
        this.$emit("update:modelValue", this.phoneValue);
      });

      // Если есть начальное значение, устанавливаем его
      if (this.modelValue) {
        this.iti.setNumber(this.modelValue);
        this.phoneValue = phoneInput.value;
      }
    },
    updatePlaceholder() {
      if (this.iti) {
        const countryData = this.iti.getSelectedCountryData();
        if (countryData) {
          const example = this.iti.getPlaceholder();
          this.placeholder = example || "";
        }
      }
    },
    handleInput(event) {
      // При separateDialCode: true, в input только номер без кода страны
      // Код страны отображается отдельно в .iti__selected-dial-code
      this.phoneValue = event.target.value;
      
      // Получаем номер в международном формате для сохранения
      const fullNumber = this.iti ? this.iti.getNumber() : "";
      
      // При separateDialCode значение input уже без кода страны
      const nationalNumber = event.target.value;
      
      this.$emit("update:modelValue", nationalNumber);
      this.$emit("phone-change", {
        national: nationalNumber,
        international: fullNumber,
      });
    },
    handleBlur(event) {
      this.$emit("blur", event);
    },
    // Публичный метод для получения номера в разных форматах
    getNumber(format = "national") {
      if (!this.iti) return "";
      
      // Если utils загружены, используем их
      if (typeof window.intlTelInputUtils !== "undefined") {
        const formats = {
          national: window.intlTelInputUtils.numberFormat.NATIONAL,
          international: window.intlTelInputUtils.numberFormat.INTERNATIONAL,
          e164: window.intlTelInputUtils.numberFormat.E164,
        };
        return this.iti.getNumber(formats[format] || window.intlTelInputUtils.numberFormat.NATIONAL);
      }
      
      // Если utils не загружены, просто возвращаем значение из input
      return this.$refs.phoneInput ? this.$refs.phoneInput.value : "";
    },
    // Публичный метод для получения данных выбранной страны
    getSelectedCountry() {
      if (!this.iti) return null;
      const countryData = this.iti.getSelectedCountryData();
      return {
        id: countryData.iso2,
        code: `+${countryData.dialCode}`,
        name: countryData.name,
        dialCode: countryData.dialCode,
      };
    },
    // Публичный метод для валидации номера
    isValid() {
      if (!this.iti) return false;
      return this.iti.isValidNumber();
    },
  },
  watch: {
    modelValue(newVal) {
      if (this.iti && newVal !== this.phoneValue) {
        this.iti.setNumber(newVal);
        this.phoneValue = this.$refs.phoneInput ? this.$refs.phoneInput.value : "";
      }
    },
    defaultCountry(newVal) {
      if (this.iti) {
        this.iti.setCountry(newVal);
        this.updatePlaceholder();
      }
    },
  },
  // Expose методы для доступа извне
  expose: ["iti", "getNumber", "getSelectedCountry", "isValid"],
};
</script>

<style scoped>
.phone-input-wrapper {
  width: 100%;
}

/* Переопределяем стили intl-tel-input для интеграции с формой */
.phone-input-wrapper :deep(.iti) {
  width: 100%;
  display: flex;
}

.phone-input-wrapper :deep(.iti__flag-container) {
  cursor: pointer;
  border: 1px solid #d1d5db;
  border-right: none;
  border-radius: 4px 0 0 4px;
  background: white;
}

.phone-input-wrapper :deep(.iti__selected-flag) {
  padding: 0.25rem 0.5rem;
  min-height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phone-input-wrapper :deep(.iti__selected-flag:hover) {
  background-color: #f9fafb;
}

.phone-input-wrapper :deep(.iti__selected-dial-code) {
  padding: 0 0.25rem;
  font-size: 1rem;
}

.phone-input-wrapper :deep(.iti input) {
  border: 1px solid #d1d5db;
  border-left: none;
  border-radius: 0 4px 4px 0;
  padding: 0.25rem 0.75rem;
  min-height: 2.25rem;
  width: 100%;
  font-size: 1rem;
  line-height: 1.5;
  color: #111827;
  background-color: white;
}

.phone-input-wrapper :deep(.iti input:focus) {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.phone-input-wrapper :deep(.iti__country-list) {
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.phone-input-wrapper :deep(.iti__country) {
  padding: 8px 12px;
}

.phone-input-wrapper :deep(.iti__country:hover) {
  background-color: #f3f4f6;
}

.phone-input-wrapper :deep(.iti__country.iti__highlight) {
  background-color: #dbeafe;
}

</style>

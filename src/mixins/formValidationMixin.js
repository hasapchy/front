export default {
  methods: {
    validateForm() {
      return { valid: true };
    },
    validateRequired(field, value, fieldName) {
      if (value === null || value === undefined || value === '') {
        return `${fieldName} обязательно для заполнения`;
      }
      if (typeof value === 'string' && !value.trim()) {
        return `${fieldName} обязательно для заполнения`;
      }
      return null;
    },
    validateArrayRequired(field, value, fieldName) {
      if (!Array.isArray(value) || value.length === 0) {
        return `${fieldName} обязательно для заполнения`;
      }
      return null;
    },
    validateEmail(email) {
      if (!email) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return 'Некорректный email адрес';
      }
      return null;
    },
    validateMinLength(value, minLength, fieldName) {
      if (value && value.length < minLength) {
        return `${fieldName} должен содержать минимум ${minLength} символов`;
      }
      return null;
    },
    validateNumber(value, fieldName, min = null, max = null) {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const num = parseFloat(value);
      if (isNaN(num)) {
        return `${fieldName} должен быть числом`;
      }
      if (min !== null && num < min) {
        return `${fieldName} должен быть не меньше ${min}`;
      }
      if (max !== null && num > max) {
        return `${fieldName} должен быть не больше ${max}`;
      }
      return null;
    },
  },
};


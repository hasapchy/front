export default {
  methods: {
    validateForm() {
      return { valid: true };
    },
    validateRequired(field, value, fieldName) {
      if (value === null || value === undefined || value === '') {
        return `${fieldName} is required`;
      }
      if (value?.trim && !value.trim()) {
        return `${fieldName} is required`;
      }
      return null;
    },
    validateArrayRequired(field, value, fieldName) {
      if (!Array.isArray(value) || value.length === 0) {
        return `${fieldName} is required`;
      }
      return null;
    },
    validateEmail(email) {
      if (!email) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return 'Invalid email address';
      }
      return null;
    },
    validateMinLength(value, minLength, fieldName) {
      if (value && value.length < minLength) {
        return `${fieldName} must contain at least ${minLength} characters`;
      }
      return null;
    },
    validateNumber(value, fieldName, min = null, max = null) {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const num = parseFloat(value);
      if (isNaN(num)) {
        return `${fieldName} must be a number`;
      }
      if (min !== null && num < min) {
        return `${fieldName} must be greater than or equal to ${min}`;
      }
      if (max !== null && num > max) {
        return `${fieldName} must be less than or equal to ${max}`;
      }
      return null;
    },
  },
};


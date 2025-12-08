import api from "./axiosInstance";

export default class BaseController {
  static async handleRequest(requestFn, errorMessage) {
    try {
      return await requestFn();
    } catch (error) {
      console.error(errorMessage, error);
      throw error;
    }
  }

  static async getItems(endpoint, page = 1, per_page = 20, params = {}) {
    return this.handleRequest(async () => {
      const queryParams = { page, per_page, ...params };
      const response = await api.get(endpoint, { params: queryParams });
      return response.data;
    }, `Ошибка при получении списка: ${endpoint}`);
  }

  static async getItem(endpoint, id) {
    return this.handleRequest(async () => {
      const response = await api.get(`${endpoint}/${id}`);
      return response.data;
    }, `Ошибка при получении элемента: ${endpoint}/${id}`);
  }

  static async getListItems(endpoint, params = {}) {
    return this.handleRequest(async () => {
      const response = await api.get(`${endpoint}/all`, { params });
      return response.data;
    }, `Ошибка при получении всех элементов: ${endpoint}/all`);
  }

  static validateInput(item, requiredFields = []) {
    if (!item || typeof item !== "object") {
      throw new Error("Данные для отправки должны быть объектом");
    }

    if (requiredFields.length > 0) {
      const missingFields = requiredFields.filter((field) => {
        const value = item[field];
        return value === null || value === undefined || value === "";
      });

      if (missingFields.length > 0) {
        throw new Error(
          `Обязательные поля отсутствуют: ${missingFields.join(", ")}`
        );
      }
    }

    return true;
  }

  static async storeItem(endpoint, item, options = {}) {
    return this.handleRequest(async () => {
      const {
        file = null,
        fileField = null,
        headers = {},
        requiredFields = [],
      } = options;

      // Базовая валидация входных данных
      this.validateInput(item, requiredFields);

      if (file && fileField) {
        const formData = this.createFormData(item, fileField, file, options);
        const { data } = await api.post(endpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...headers,
          },
        });
        return data;
      } else {
        const { data } = await api.post(endpoint, item, { headers });
        return data;
      }
    }, `Ошибка при создании элемента: ${endpoint}`);
  }

  static async updateItem(endpoint, id, item, options = {}) {
    return this.handleRequest(async () => {
      const {
        file = null,
        fileField = null,
        headers = {},
        requiredFields = [],
      } = options;

      // Базовая валидация входных данных
      if (!id) {
        throw new Error("ID обязателен для обновления элемента");
      }
      this.validateInput(item, requiredFields);

      if (file && fileField) {
        const formData = this.createFormData(item, fileField, file, options);
        const { data } = await api.put(`${endpoint}/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...headers,
          },
        });
        return data;
      } else {
        const { data } = await api.put(`${endpoint}/${id}`, item, { headers });
        return data;
      }
    }, `Ошибка при обновлении элемента: ${endpoint}/${id}`);
  }

  static async deleteItem(endpoint, id) {
    return this.handleRequest(async () => {
      if (!id) {
        throw new Error("ID обязателен для удаления элемента");
      }
      const { data } = await api.delete(`${endpoint}/${id}`);
      return data;
    }, `Ошибка при удалении элемента: ${endpoint}/${id}`);
  }

  static createFormData(payload, fileField, file, options = {}) {
    const formData = new FormData();
    const { booleanFields = [] } = options;

    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (value === null || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else if (booleanFields.includes(key)) {
        formData.append(key, value ? "1" : "0");
      } else {
        formData.append(key, value);
      }
    });

    if (file && fileField) {
      formData.append(fileField, file);
    }

    return formData;
  }
}

import api from "./axiosInstance";
import { toSnakeCaseDeep } from "@/utils/caseTransform";

export default class BaseController {
  static async get(endpoint, config = {}) {
    return this.handleRequest(async () => {
      const { data } = await api.get(endpoint, config);
      return data;
    }, `GET request failed: ${endpoint}`);
  }

  static async getData(endpoint, config = {}) {
    const data = await this.get(endpoint, config);
    return data.data;
  }

  static async post(endpoint, payload = {}, config = {}) {
    return this.handleRequest(async () => {
      const { data } = await api.post(endpoint, payload, config);
      return data;
    }, `POST request failed: ${endpoint}`);
  }

  static async postData(endpoint, payload = {}, config = {}) {
    const data = await this.post(endpoint, payload, config);
    return data.data;
  }

  static async put(endpoint, payload = {}, config = {}) {
    return this.handleRequest(async () => {
      const { data } = await api.put(endpoint, payload, config);
      return data;
    }, `PUT request failed: ${endpoint}`);
  }

  static async putData(endpoint, payload = {}, config = {}) {
    const data = await this.put(endpoint, payload, config);
    return data.data;
  }

  static async delete(endpoint, config = {}) {
    return this.handleRequest(async () => {
      const { data } = await api.delete(endpoint, config);
      return data;
    }, `DELETE request failed: ${endpoint}`);
  }

  static async deleteData(endpoint, config = {}) {
    const data = await this.delete(endpoint, config);
    return data.data;
  }

  static async handleRequest(requestFn, errorMessage) {
    try {
      return requestFn();
    } catch (error) {
      console.error(errorMessage, error);
      throw error;
    }
  }

  static async getItems(endpoint, page = 1, perPage = 20, params = {}) {
    return this.handleRequest(async () => {
      const queryParams = { page, per_page: perPage, ...params };
      const response = await api.get(endpoint, { params: queryParams });
      const payload = response.data.data;
      return {
        items: payload.items,
        current_page: payload.meta.current_page,
        next_page: payload.meta.next_page,
        last_page: payload.meta.last_page,
        per_page: payload.meta.per_page,
        total: payload.meta.total,
      };
    }, `Failed to fetch list: ${endpoint}`);
  }

  static async getItem(endpoint, id) {
    return this.handleRequest(async () => {
      const response = await api.get(`${endpoint}/${id}`);
      return response.data.data;
    }, `Failed to fetch item: ${endpoint}/${id}`);
  }

  static async getListItems(endpoint, params = {}) {
    return this.handleRequest(async () => {
      const response = await api.get(`${endpoint}/all`, { params });
      return response.data.data;
    }, `Failed to fetch all items: ${endpoint}/all`);
  }

  static validateInput(item, requiredFields = []) {
    if (!item || item !== Object(item)) {
      throw new Error("Payload must be an object");
    }

    if (requiredFields.length > 0) {
      const missingFields = requiredFields.filter((field) => {
        const value = item[field];
        return value === null || value === undefined || value === "";
      });

      if (missingFields.length > 0) {
        throw new Error(
          `Required fields are missing: ${missingFields.join(", ")}`
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
    }, `Failed to create item: ${endpoint}`);
  }

  static async updateItem(endpoint, id, item, options = {}) {
    return this.handleRequest(async () => {
      const {
        file = null,
        fileField = null,
        headers = {},
        requiredFields = [],
      } = options;

      if (!id) {
        throw new Error("ID is required to update item");
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
    }, `Failed to update item: ${endpoint}/${id}`);
  }

  static async deleteItem(endpoint, id) {
    return this.handleRequest(async () => {
      if (!id) {
        throw new Error("ID is required to delete item");
      }
      const { data } = await api.delete(`${endpoint}/${id}`);
      return data;
    }, `Failed to delete item: ${endpoint}/${id}`);
  }

  static async downloadExport(endpoint, params = {}, ids = null, defaultFilename = 'export.xlsx') {
    return this.handleRequest(async () => {
      const requestParams = { ...params };
      if (Array.isArray(ids) && ids.length > 0) {
        requestParams.ids = ids;
      }
      const response = await api.get(`${endpoint}/export`, {
        params: requestParams,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = defaultFilename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i)
          || contentDisposition.match(/filename="?([^";\n]+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].trim().replace(/^["']|["']$/g, '');
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    }, `Export failed: ${endpoint}/export`);
  }

  static createFormData(payload, fileField, file, options = {}) {
    const formData = new FormData();
    const { booleanFields = [] } = options;
    const data = toSnakeCaseDeep(payload);

    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (value === null || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else if (booleanFields.includes(key)) {
        formData.append(key, value ? "1" : "0");
      } else if (value && value === Object(value)) {
        formData.append(key, JSON.stringify(value));
      }else {
        formData.append(key, value);
      }
    });

    if (file && fileField) {
      formData.append(fileField, file);
    }

    return formData;
  }
}

import { CompanyDto } from "@/dto/companies/CompanyDto";
import api from "./axiosInstance";

const CompaniesController = {
  async getItems(page = 1, per_page = 10) {
    const { data } = await api.get(`/companies?page=${page}&per_page=${per_page}`);
    return {
      items: CompanyDto.fromArray(data.data || []),
      currentPage: data.current_page,
      lastPage: data.last_page,
    };
  },

  async storeItem(item, logoFile) {
    try {
      const formData = new FormData();
      Object.keys(item).forEach((key) => {
        const value = item[key];
        // Пропускаем null/undefined, чтобы не отправлять строку "null"
        if (value === null || value === undefined) return;
        formData.append(key, value);
      });
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const { data } = await api.post("/companies", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    } catch (error) {
      console.error("Ошибка при создании компании:", error);
      throw error;
    }
  },

  async updateItem(id, item, logoFile) {
    try {
      const formData = new FormData();
      Object.keys(item).forEach((key) => {
        const value = item[key];
        // Пропускаем null/undefined, чтобы не отправлять строку "null"
        if (value === null || value === undefined) return;
        formData.append(key, value);
      });
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const { data } = await api.post(`/companies/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении компании:", error);
      throw error;
    }
  },

  async deleteItem(id) {
    const { data } = await api.delete(`/companies/${id}`);
    return data;
  },
};

export default CompaniesController;

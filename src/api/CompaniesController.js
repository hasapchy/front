import { CompanyDto } from "@/dto/companies/CompanyDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import api from "./axiosInstance";

const CompaniesController = {
  async getItems(page = 1, per_page = 20) {
    try {
      const { data } = await api.get(`/companies?page=${page}&per_page=${per_page}`);
      const items = CompanyDto.fromApiArray(data.items);
      return new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );
    } catch (error) {
      console.error("Ошибка при получении компаний:", error);
      throw error;
    }
  },

  async storeItem(item, logoFile) {
    try {
      const formData = new FormData();
      const booleanFields = ['show_deleted_transactions', 'rounding_enabled', 'rounding_quantity_enabled', 'skip_project_order_balance'];
      Object.keys(item).forEach((key) => {
        const value = item[key];
        if (value === null || value === undefined) return;
        if (booleanFields.includes(key)) {
          formData.append(key, value ? '1' : '0');
        } else {
          formData.append(key, value);
        }
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
      const booleanFields = ['show_deleted_transactions', 'rounding_enabled', 'rounding_quantity_enabled', 'skip_project_order_balance'];
      Object.keys(item).forEach((key) => {
        const value = item[key];
        if (value === null || value === undefined) return;
        if (booleanFields.includes(key)) {
          formData.append(key, value ? '1' : '0');
        } else {
          formData.append(key, value);
        }
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
    try {
      const { data } = await api.delete(`/companies/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении компании:", error);
      throw error;
    }
  },
};

export default CompaniesController;

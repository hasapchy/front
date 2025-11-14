import api from "./axiosInstance";

import PaginatedResponse from "@/dto/app/PaginatedResponseDto";

const RolesController = {
  async getItems(page = 1, per_page = 20, search = null) {
    try {
      let url = `/roles?page=${page}&per_page=${per_page}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const { data } = await api.get(url);
      const items = data.items || [];
      return new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );
    } catch (error) {
      console.error("Ошибка при получении ролей:", error);
      throw error;
    }
  },

  async getAllItems() {
    try {
      const { data } = await api.get(`/roles/all`);
      return data;
    } catch (error) {
      console.error("Ошибка при получении всех ролей:", error);
      throw error;
    }
  },

  async getItem(id) {
    try {
      const { data } = await api.get(`/roles/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при получении роли:", error);
      throw error;
    }
  },

  async storeItem(payload) {
    try {
      const { data } = await api.post("/roles", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return data;
    } catch (error) {
      console.error("Ошибка при создании роли:", error);
      throw error;
    }
  },

  async updateItem(id, payload) {
    try {
      const { data } = await api.put(`/roles/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return data;
    } catch (error) {
      console.error("Ошибка при обновлении роли:", error);
      throw error;
    }
  },

  async deleteItem(id) {
    try {
      const { data } = await api.delete(`/roles/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении роли:", error);
      throw error;
    }
  },
};

export default RolesController;


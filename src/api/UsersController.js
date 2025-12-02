import { UserDto } from "@/dto/users/UserDto";
import api from "./axiosInstance";

import PaginatedResponse from "@/dto/app/PaginatedResponseDto";

const UsersController = {
  async getItems(page = 1, per_page = 20) {
    try {
      const { data } = await api.get(`/users?page=${page}&per_page=${per_page}`);
      const items = UserDto.fromApiArray(data.items);
      return new PaginatedResponse(
        items,
        data.current_page,
        data.next_page,
        data.last_page,
        data.total
      );
    } catch (error) {
      console.error("Ошибка при получении пользователей:", error);
      throw error;
    }
  },

  async getAllItems() {
    try {
      const { data } = await api.get(`/users/all`);
      const users = UserDto.fromApiArray(data);
      // Отладочная проверка: проверяем, что surname присутствует
      if (users.length > 0 && users[0].surname === undefined) {
        console.warn('⚠️ Внимание: surname отсутствует в данных пользователя. Проверьте API ответ:', data[0]);
      }
      return users;
    } catch (error) {
      console.error("Ошибка при получении всех пользователей:", error);
      throw error;
    }
  },


  async storeItem(payload, file = null) {
    try {
      let requestData;
      let headers = {};

      if (file) {
        const formData = new FormData();

        Object.keys(payload).forEach((key) => {
          const value = payload[key];
          if (value === null || value === undefined) {
            return;
          }

          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              formData.append(`${key}[${index}]`, item);
            });
          } else {
            formData.append(key, value);
          }
        });

        formData.append("photo", file);
        requestData = formData;
        headers["Content-Type"] = "multipart/form-data";
      } else {
        requestData = payload;
        headers["Content-Type"] = "application/json";
      }

      const { data } = await api.post("/users", requestData, {
        headers,
      });

      return data;
    } catch (error) {
      console.error("Ошибка при создании пользователя:", error);
      throw error;
    }
  },

  async updateItem(id, payload, file = null) {
    try {
      
      let requestData;
      let headers = {};
      
      if (file) {
        // Если есть файл, используем FormData
        const formData = new FormData();
        
        Object.keys(payload).forEach((key) => {
          if (Array.isArray(payload[key])) {
            // Для массивов добавляем каждый элемент отдельно
            payload[key].forEach((item, index) => {
              formData.append(`${key}[${index}]`, item);
            });
          } else {
            const value = payload[key];
            if (value === null || value === undefined) {
              return;
            }
            formData.append(key, value);
          }
        });
        
        formData.append("photo", file);
        requestData = formData;
        headers["Content-Type"] = "multipart/form-data";
      } else {
        // Если нет файла, отправляем JSON
        requestData = payload;
        headers["Content-Type"] = "application/json";
      }

      const { data } = await api.put(`/users/${id}`, requestData, {
        headers: headers,
      });
      
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении пользователя:", error);
      throw error;
    }
  },

  async deleteItem(id) {
    try {
      const { data } = await api.delete(`/users/${id}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении пользователя:", error);
      throw error;
    }
  },

  async getAllPermissions() {
    try {
      const { data } = await api.get(`/permissions`);
      return data;
    } catch (error) {
      console.error("Ошибка при получении разрешений:", error);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const { data } = await api.get(`/user/current`);
      return data;
    } catch (error) {
      console.error("Ошибка при получении текущего пользователя:", error);
      throw error;
    }
  },

  async updateProfile(payload, file = null) {
    try {
      const formData = new FormData();
      
      Object.keys(payload).forEach((key) => {
        formData.append(key, payload[key]);
      });
      
      if (file) {
        formData.append("photo", file);
      }

      const { data } = await api.post(`/user/profile`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getSalaries(userId) {
    try {
      const { data } = await api.get(`/users/${userId}/salaries`);
      return data.salaries || [];
    } catch (error) {
      console.error("Ошибка при получении зарплат:", error);
      throw error;
    }
  },

  async createSalary(userId, salaryData) {
    try {
      const { data } = await api.post(`/users/${userId}/salaries`, salaryData);
      return data;
    } catch (error) {
      console.error("Ошибка при создании зарплаты:", error);
      throw error;
    }
  },

  async updateSalary(userId, salaryId, salaryData) {
    try {
      const { data } = await api.put(`/users/${userId}/salaries/${salaryId}`, salaryData);
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении зарплаты:", error);
      throw error;
    }
  },

  async deleteSalary(userId, salaryId) {
    try {
      const { data } = await api.delete(`/users/${userId}/salaries/${salaryId}`);
      return data;
    } catch (error) {
      console.error("Ошибка при удалении зарплаты:", error);
      throw error;
    }
  },

  async getEmployeeBalance(userId) {
    try {
      const { data } = await api.get(`/users/${userId}/balance`);
      return data.balance;
    } catch (error) {
      console.error("Ошибка при получении баланса сотрудника:", error);
      throw error;
    }
  },

  async getEmployeeBalanceHistory(userId) {
    try {
      const { data } = await api.get(`/users/${userId}/balance-history`);
      const ClientBalanceHistoryDto = (await import("@/dto/client/ClientBalanceHistoryDto")).default;
      return ClientBalanceHistoryDto.fromApiArray(data.history || []);
    } catch (error) {
      if (error?.response?.status !== 403) {
        console.error("Ошибка при получении истории баланса сотрудника:", error);
      }
      throw error;
    }
  },
};

export default UsersController;

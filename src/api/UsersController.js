import { UserDto } from "@/dto/users/UserDto";
import api from "./axiosInstance";

const UsersController = {
  async getItems(page = 1) {
    const { data } = await api.get(`/users?page=${page}`);
    return {
      items: UserDto.fromArray(data.data),
      currentPage: data.current_page,
      lastPage: data.last_page,
    };
  },

  async getAllUsers() {
    const { data } = await api.get(`/users/all`);
    return UserDto.fromArray(data);
  },

  async storeItem(payload, file = null) {
    try {
      const formData = new FormData();
      
      Object.keys(payload).forEach((key) => {
        formData.append(key, payload[key]);
      });
      
      if (file) {
        formData.append("photo", file);
      }

      const { data } = await api.post("/users", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
            formData.append(key, payload[key]);
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
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },

  async getAllPermissions() {
    const { data } = await api.get(`/permissions`);
    return data;
  },

  async getCurrentUser() {
    const { data } = await api.get(`/user/current`);
    return data;
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
      console.error("Ошибка при обновлении профиля:", error);
      throw error;
    }
  },
};

export default UsersController;

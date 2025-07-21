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

  async storeItem(payload) {
    const { data } = await api.post("/users", payload);
    return data;
  },

  async updateItem(id, payload) {
    const { data } = await api.put(`/users/${id}`, payload);
    return data;
  },

  async deleteItem(id) {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },

  async getAllPermissions() {
    const { data } = await api.get(`/permissions`);
    return data;
  },
};

export default UsersController;

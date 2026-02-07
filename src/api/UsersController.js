import { UserDto } from "@/dto/users/UserDto";
import api from "./axiosInstance";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import BaseController from "./BaseController";

export default class UsersController extends BaseController {
  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/users", page, per_page);
    const items = UserDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getListItems() {
    const data = await super.getListItems("/users");
    return UserDto.fromApiArray(data);
  }

  static async searchItems(term, signal = null) {
    return super.handleRequest(
      async () => {
        const config = { params: { search_request: term } };
        if (signal) config.signal = signal;
        const response = await api.get("/users/search", config);
        const data = Array.isArray(response.data) ? response.data : [];
        return UserDto.fromApiArray(data);
      },
      "Ошибка при поиске пользователей:"
    );
  }

  static async getItem(id) {
    return super.handleRequest(
      async () => {
        const response = await api.get(`/users/${id}`);
        const userData = response.data.data || response.data.user || response.data;
        return UserDto.fromApiArray([userData])[0] || null;
      },
      `Ошибка при получении пользователя: /users/${id}`
    );
  }

  static async storeItem(payload, file = null) {
    return super.storeItem("/users", payload, {
      file: file,
      fileField: "photo"
    });
  }

  static async updateItem(id, payload, file = null) {
    return super.updateItem("/users", id, payload, {
      file: file,
      fileField: "photo"
    });
  }

  static async deleteItem(id) {
    return super.deleteItem("/users", id);
  }

  static async getAllPermissions() {
    return super.handleRequest(
      async () => {
        const { data } = await api.get(`/permissions`);
        return data;
      },
      "Ошибка при получении разрешений:"
    );
  }

  static async getCurrentUser() {
    return super.handleRequest(
      async () => {
        const { data } = await api.get(`/user/current`);
        return data;
      },
      "Ошибка при получении текущего пользователя:"
    );
  }

  static async updateProfile(payload, file = null) {
    return super.handleRequest(
      async () => {
        const formData = super.createFormData(payload, "photo", file);
        const { data } = await api.post(`/user/profile`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return data;
      },
      "Ошибка при обновлении профиля:"
    );
  }

  static async getSalaries(userId) {
    return super.handleRequest(
      async () => {
        const { data } = await api.get(`/users/${userId}/salaries`);
        return data;
      },
      "Ошибка при получении зарплат:"
    );
  }

  static async createSalary(userId, salaryData) {
    return super.handleRequest(
      async () => {
        const { data } = await api.post(`/users/${userId}/salaries`, salaryData);
        return data;
      },
      "Ошибка при создании зарплаты:"
    );
  }

  static async updateSalary(userId, salaryId, salaryData) {
    return super.handleRequest(
      async () => {
        const { data } = await api.put(
          `/users/${userId}/salaries/${salaryId}`,
          salaryData
        );
        return data;
      },
      "Ошибка при обновлении зарплаты:"
    );
  }

  static async deleteSalary(userId, salaryId) {
    return super.handleRequest(
      async () => {
        const { data } = await api.delete(
          `/users/${userId}/salaries/${salaryId}`
        );
        return data;
      },
      "Ошибка при удалении зарплаты:"
    );
  }

  static async getEmployeeBalance(userId) {
    return super.handleRequest(
      async () => {
        const { data } = await api.get(`/users/${userId}/balance`);
        return data.balance;
      },
      "Ошибка при получении баланса сотрудника:"
    );
  }

  static async getEmployeeBalanceHistory(userId) {
    return super.handleRequest(
      async () => {
        const { data } = await api.get(`/users/${userId}/balance-history`);
        const ClientBalanceHistoryDto = (
          await import("@/dto/client/ClientBalanceHistoryDto")
        ).default;
        return ClientBalanceHistoryDto.fromApiArray(data.history || []);
      },
      "Ошибка при получении истории баланса сотрудника:"
    );
  }
}

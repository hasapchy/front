import { UserDto } from "@/dto/users/UserDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import { toSnakeCaseDeep } from "@/utils/caseTransform";
import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";

export default class UsersController extends BaseController {
  static async getItems(page = 1, perPage = 20, params = {}) {
    const queryParams = { activeOnly: true, ...params };
    const data = await super.getItems("/users", page, perPage, queryParams);
    const items = UserDto.fromApiArray(data.items);
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

  static async getItem(id) {
    return super.handleRequest(
      async () => {
        const userData = await super.getData(`/users/${id}`);
        return UserDto.fromApi(userData);
      },
      apiErrorMessage("userGet", { path: `/users/${id}` })
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

  static async searchItems(term, signal = null) {
    return super.handleRequest(
      async () => {
        const config = { params: { searchRequest: term } };
        if (signal) config.signal = signal;
        const data = await super.getData("/users/search", config);
        return UserDto.fromApiArray(data);
      },
      apiErrorMessage("usersSearch")
    );
  }

  static async getAllPermissions() {
    return super.handleRequest(
      async () => {
        return super.getData(`/permissions`);
      },
      apiErrorMessage("permissionsGet")
    );
  }

  static async getCurrentUser() {
    return super.handleRequest(
      async () => {
        return super.get(`/user/current`);
      },
      apiErrorMessage("currentUserGet")
    );
  }

  static async updateProfile(payload, file = null) {
    return super.handleRequest(
      async () => {
        const formData = super.createFormData(
          toSnakeCaseDeep(payload),
          "photo",
          file
        );
        return super.post(`/user/profile`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      },
      apiErrorMessage("profileUpdate")
    );
  }

  static async getSalaries(userId) {
    return super.handleRequest(
      async () => {
        const list = await super.getData(`/users/${userId}/salaries`);
        const arr = Array.isArray(list) ? list : [];
        return {
          salaries: arr.map((salary) => ({
            id: salary.id,
            amount: salary.amount,
            paymentType: salary.payment_type,
            startDate: salary.start_date,
            endDate: salary.end_date,
            note: salary.note,
            currency: salary.currency || null,
            currencyId: salary.currency_id,
          })),
        };
      },
      apiErrorMessage("salariesGetList")
    );
  }

  static async createSalary(userId, salaryData) {
    return super.handleRequest(
      async () => {
        return super.post(`/users/${userId}/salaries`, salaryData);
      },
      apiErrorMessage("salaryCreate")
    );
  }

  static async updateSalary(userId, salaryId, salaryData) {
    return super.handleRequest(
      async () => {
        return super.put(
          `/users/${userId}/salaries/${salaryId}`,
          salaryData
        );
      },
      apiErrorMessage("salaryUpdate")
    );
  }

  static async deleteSalary(userId, salaryId) {
    return super.handleRequest(
      async () => {
        return super.delete(
          `/users/${userId}/salaries/${salaryId}`
        );
      },
      apiErrorMessage("salaryDelete")
    );
  }

  static async getEmployeeBalance(userId) {
    return super.handleRequest(
      async () => {
        const data = await super.getData(`/users/${userId}/balance`);
        return data.balance;
      },
      apiErrorMessage("employeeBalanceGet")
    );
  }

  static async getEmployeeBalanceHistory(userId) {
    return super.handleRequest(
      async () => {
        const data = await super.getData(`/users/${userId}/balance-history`);
        const ClientBalanceHistoryDto = (
          await import("@/dto/client/ClientBalanceHistoryDto")
        ).default;
        return ClientBalanceHistoryDto.fromApiArray(data.history || []);
      },
      apiErrorMessage("employeeBalanceHistory")
    );
  }
}

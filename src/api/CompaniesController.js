import api from "./axiosInstance";
import { CompanyDto } from "@/dto/companies/CompanyDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import BaseController from "./BaseController";

export default class CompaniesController extends BaseController {
  static async getItems(page = 1, per_page = 20) {
    const data = await super.getItems("/companies", page, per_page);
    const items = CompanyDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async storeItem(item, logoFile) {
    const booleanFields = ['show_deleted_transactions', 'rounding_enabled', 'rounding_quantity_enabled', 'skip_project_order_balance'];
    return super.storeItem("/companies", item, {
      file: logoFile,
      fileField: "logo",
      booleanFields: booleanFields
    });
  }

  static async updateItem(id, item, logoFile) {
    return super.handleRequest(
      async () => {
        const booleanFields = ['show_deleted_transactions', 'rounding_enabled', 'rounding_quantity_enabled', 'skip_project_order_balance'];
        const formData = super.createFormData(item, "logo", logoFile, { booleanFields });
        const { data } = await api.post(`/companies/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return data;
      },
      "Ошибка при обновлении компании:"
    );
  }

  static async deleteItem(id) {
    return super.deleteItem("/companies", id);
  }

  static async accrueSalaries(companyId, data) {
    return super.handleRequest(
      async () => {
        const { data: response } = await api.post(`/companies/${companyId}/salaries/accrue`, data);
        return response;
      },
      "Ошибка при начислении зарплат:"
    );
  }

  static async checkExistingSalaries(companyId, date, userIds) {
    return super.handleRequest(
      async () => {
        const response = await api.get(`/companies/${companyId}/salaries/check`, {
          params: { date, user_ids: userIds }
        });
        return response.data;
      },
      "Ошибка при проверке начислений:"
    );
  }
}

import { CompanyDto } from "@/dto/companies/CompanyDto";
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import BaseController from "./BaseController";

export default class CompaniesController extends BaseController {
  static async getItems(page = 1, perPage = 20) {
    const data = await super.getItems("/companies", page, perPage);
    const items = CompanyDto.fromApiArray(data.items);
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
        const data = await super.post(`/companies/${id}`, formData, {
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
        return super.post(`/companies/${companyId}/salaries/accrue`, data);
      },
      "Ошибка при начислении зарплат:"
    );
  }

  static async paySalaries(companyId, data) {
    return super.handleRequest(
      async () => {
        return super.post(`/companies/${companyId}/salaries/pay`, data);
      },
      "Ошибка при выплате зарплат:"
    );
  }

  static async checkExistingSalaries(companyId, date, userIds) {
    return super.handleRequest(
      async () => {
        const data = await super.getData(`/companies/${companyId}/salaries/check`, {
          params: { date, creator_ids: userIds }
        });
        return {
          ...data,
          hasExisting: Boolean(data?.has_existing),
          affectedUsers: (data?.affected_users || []).map((item) => ({
            ...item,
            creatorId: item?.creator_id,
          })),
        };
      },
      "Ошибка при проверке начислений:"
    );
  }

  static async getSalaryAccrualPreview(companyId, date, userIds, paymentType = 1, currencyId = null) {
    return super.handleRequest(
      async () => {
        const params = {
          date,
          creator_ids: userIds,
          payment_type: paymentType,
        };
        if (currencyId != null && currencyId !== "") {
          params.currency_id = currencyId;
        }
        return super.getData(`/companies/${companyId}/salaries/preview`, {
          params,
        });
      },
      "Ошибка при получении предпросмотра начисления:"
    );
  }

  static async getSalaryMonthlyReport(companyId, month) {
    return super.handleRequest(
      async () => {
        return super.getData(`/companies/${companyId}/salaries/monthly-report`, {
          params: { month },
        });
      },
      "Ошибка при загрузке отчёта по зарплатам:"
    );
  }

  static async getSalaryMonthlyReportBatch(companyId, batchId) {
    return super.handleRequest(
      async () => {
        return super.getData(`/companies/${companyId}/salaries/monthly-report`, {
          params: { batch_id: batchId },
        });
      },
      "Ошибка при загрузке операции по зарплатам:"
    );
  }

  static async deleteSalaryMonthlyReportBatch(companyId, batchId) {
    return super.handleRequest(
      async () => {
        return super.deleteData(`/companies/${companyId}/salaries/batch/${batchId}`);
      },
      "Ошибка при удалении операции по зарплатам:"
    );
  }
}

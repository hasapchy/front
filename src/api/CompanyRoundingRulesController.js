import api from "./axiosInstance";
import CompanyRoundingRuleDto from "@/dto/CompanyRoundingRuleDto";
import BaseController from "./BaseController";

export default class CompanyRoundingRulesController extends BaseController {
  static async getItems() {
    return super.handleRequest(
      async () => {
        const response = await api.get("/company-rounding-rules");
        return CompanyRoundingRuleDto.fromApiArray(response.data);
      },
      "Ошибка при получении правил округления:"
    );
  }

  static async storeItem(item) {
    const data = await super.storeItem("/company-rounding-rules", item);
    return data.rule;
  }
}


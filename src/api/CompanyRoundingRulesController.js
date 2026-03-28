import CompanyRoundingRuleDto from "@/dto/CompanyRoundingRuleDto";
import BaseController from "./BaseController";

export default class CompanyRoundingRulesController extends BaseController {
  static async getItems() {
    const data = await super.getData("/company-rounding-rules");
    return CompanyRoundingRuleDto.fromApiArray(data);
  }

  static async storeItem(item) {
    const data = await super.storeItem("/company-rounding-rules", item);
    return data.rule;
  }
}


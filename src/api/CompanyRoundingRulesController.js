import api from "./axiosInstance";

export default class CompanyRoundingRulesController {
  static async getItems() {
    try {
      const response = await api.get("/company-rounding-rules");
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении правил округления:", error);
      throw error;
    }
  }

  static async storeItem(item) {
    try {
      const response = await api.post("/company-rounding-rules", item);
      return response.data.rule;
    } catch (error) {
      console.error("Ошибка при сохранении правил округления:", error);
      throw error;
    }
  }
}


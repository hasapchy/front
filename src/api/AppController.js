import UnitDto from "../dto/app/UnitDto";
import CurrencyDto from "../dto/app/CurrencyDto";
import api from "./axiosInstance";
import BaseController from "./BaseController";

export default class AppController extends BaseController {
  static async getCurrencies() {
    return super.handleRequest(
      async () => {
        const response = await api.get("/app/currency");
        return CurrencyDto.fromApiArray(response.data);
      },
      "Error fetching currencies:"
    );
  }

  static async getUnits() {
    return super.handleRequest(
      async () => {
        const response = await api.get("/app/units");
        return UnitDto.fromApiArray(response.data);
      },
      "Error fetching units:"
    );
  }

  static async getCurrencyExchangeRate(currencyId) {
    return super.handleRequest(
      async () => {
        const response = await api.get(`/app/currency/${currencyId}/exchange-rate`);
        return response.data;
      },
      "Error fetching currency exchange rate:"
    );
  }
}

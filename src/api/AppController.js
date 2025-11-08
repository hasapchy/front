import UnitDto from "../dto/app/UnitDto";
import CurrencyDto from "../dto/app/CurrencyDto";
import api from "./axiosInstance";

class AppController {
  async getCurrencies() {
    try {
      const response = await api.get("/app/currency");
      const data = response.data;
      return CurrencyDto.fromApiArray(data);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      throw error;
    }
  }

  async getUnits() {
    try {
      const response = await api.get("/app/units");
      const data = response.data;

      return UnitDto.fromApiArray(data);
    } catch (error) {
      console.error("Error fetching units:", error);
      throw error;
    }
  }

  async getCurrencyExchangeRate(currencyId) {
    try {
      const response = await api.get(`/app/currency/${currencyId}/exchange-rate`);
      return response.data;
    } catch (error) {
      console.error("Error fetching currency exchange rate:", error);
      throw error;
    }
  }
}

export default new AppController();

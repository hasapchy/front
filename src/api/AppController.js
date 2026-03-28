import UnitDto from "../dto/app/UnitDto";
import CurrencyDto from "../dto/app/CurrencyDto";
import BaseController from "./BaseController";

export default class AppController extends BaseController {
  static async getCurrencies() {
    const data = await super.getData("/app/currency");
    return CurrencyDto.fromApiArray(data);
  }

  static async getUnits() {
    const data = await super.getData("/app/units");
    return UnitDto.fromApiArray(data);
  }

  static async getVersions() {
    return super.getData("/app/versions");
  }

  static async getCurrencyExchangeRate(currencyId) {
    const data = await super.getData(`/app/currency/${currencyId}/exchange-rate`);
    return {
      exchangeRate: data.exchange_rate,
    };
  }
}

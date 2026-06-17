import BaseController from "./BaseController";

export default class TransactionCategoryTranslationController extends BaseController {
  static async getDictionary() {
    return this.getData("/transaction_categories/translations/dictionary");
  }

  static async upsert(items) {
    return this.put("/transaction_categories/translations", { items });
  }
}

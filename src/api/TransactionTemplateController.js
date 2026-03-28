import BaseController from './BaseController';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import TransactionTemplateDto from '@/dto/transaction/TransactionTemplateDto';

export default class TransactionTemplateController extends BaseController {
  static async getItems(page = 1, perPage = 20, params = {}) {
    const { cashId, type, search } = params;
    const queryParams = { page, per_page: perPage };
    if (cashId != null && cashId !== '') queryParams.cash_id = cashId;
    if (type !== undefined && type !== null && type !== '') queryParams.type = type;
    if (search) queryParams.search = search;
    const data = await super.getItems('/transaction-templates', page, perPage, queryParams);
    const items = TransactionTemplateDto.fromApiArray(data.items);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getItem(id) {
    const data = await super.getItem('/transaction-templates', id);
    return TransactionTemplateDto.fromApi(data);
  }

  static async storeItem(payload) {
    return super.storeItem('/transaction-templates', payload);
  }

  static async updateItem(id, payload) {
    return super.updateItem('/transaction-templates', id, payload);
  }

  static async deleteItem(id) {
    return super.deleteItem('/transaction-templates', id);
  }
  static async getAll(params = {}) {
    const { cashId, type } = params;
    const queryParams = {};
    if (cashId != null && cashId !== '') queryParams.cash_id = cashId;
    if (type !== undefined && type !== null && type !== '') queryParams.type = type;
    const data = await super.getListItems('/transaction-templates', queryParams);
    return TransactionTemplateDto.fromApiArray(data);
  }

  static async getApplyData(id) {
    return this.handleRequest(async () => {
      return this.getData(`/transaction-templates/${id}/apply`);
    }, `Ошибка при применении шаблона: ${id}`);
  }

}

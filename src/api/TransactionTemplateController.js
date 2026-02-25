import api from './axiosInstance';
import BaseController from './BaseController';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import TransactionTemplateDto from '@/dto/transaction/TransactionTemplateDto';

export default class TransactionTemplateController extends BaseController {
  static async getItems(page = 1, perPage = 20, params = {}) {
    const { cash_id, type, search } = params;
    const queryParams = { page, per_page: perPage };
    if (cash_id != null && cash_id !== '') queryParams.cash_id = cash_id;
    if (type !== undefined && type !== null && type !== '') queryParams.type = type;
    if (search) queryParams.search = search;
    const data = await super.getItems('/transaction-templates', page, perPage, queryParams);
    const items = TransactionTemplateDto.fromApiArray(data.items || []);
    return new PaginatedResponse(
      items,
      data.current_page || 1,
      data.next_page || null,
      data.last_page || 1,
      data.total || 0
    );
  }

  static async getAll(params = {}) {
    const { cash_id, type } = params;
    const queryParams = {};
    if (cash_id != null && cash_id !== '') queryParams.cash_id = cash_id;
    if (type !== undefined && type !== null && type !== '') queryParams.type = type;
    const data = await super.getListItems('/transaction-templates', queryParams);
    return TransactionTemplateDto.fromApiArray(Array.isArray(data) ? data : []);
  }

  static async getItem(id) {
    const data = await super.getItem('/transaction-templates', id);
    if (!data || !data.item) return null;
    return TransactionTemplateDto.fromApi(data.item);
  }

  static async getApplyData(id) {
    return this.handleRequest(async () => {
      const response = await api.get(`/transaction-templates/${id}/apply`);
      return response.data?.item ?? null;
    }, `Ошибка при применении шаблона: ${id}`);
  }

  static async storeItem(payload) {
    return await super.storeItem('/transaction-templates', payload);
  }

  static async updateItem(id, payload) {
    return await super.updateItem('/transaction-templates', id, payload);
  }

  static async deleteItem(id) {
    return await super.deleteItem('/transaction-templates', id);
  }
}

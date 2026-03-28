import BaseController from './BaseController';
import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import RecurringScheduleDto from '@/dto/transaction/RecurringScheduleDto';

const ENDPOINT = 'recurring-transactions';

export default class RecurringTransactionController extends BaseController {
  static async getItems(page = 1, perPage = 20) {
    const data = await super.getItems(`/${ENDPOINT}`, page, perPage);
    const items = RecurringScheduleDto.fromApiArray(data.items);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getItem(id) {
    const data = await super.getData(`/${ENDPOINT}/${id}`);
    return RecurringScheduleDto.fromApi(data);
  }

  static async storeItem(payload) {
    return super.postData(`/${ENDPOINT}`, RecurringScheduleDto.toApi(payload));
  }

  static async updateItem(id, payload) {
    return super.putData(`/${ENDPOINT}/${id}`, RecurringScheduleDto.toApi(payload));
  }

  static async deleteItem(id) {
    return super.delete(`/${ENDPOINT}/${id}`);
  }
}

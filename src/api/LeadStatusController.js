import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import LeadStatusDto from '@/dto/lead/LeadStatusDto';
import BaseController from './BaseController';

export default class LeadStatusController extends BaseController {
  static async getItems(page = 1, perPage = 20) {
    const data = await super.getItems('/lead_statuses', page, perPage);
    const items = LeadStatusDto.fromApiArray(data.items);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getAllItems() {
    const data = await super.getListItems('/lead_statuses');
    return LeadStatusDto.fromApiArray(data);
  }

  static async storeItem(item) {
    return super.storeItem('/lead_statuses', item);
  }

  static async updateItem(id, item) {
    return super.updateItem('/lead_statuses', id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem('/lead_statuses', id);
  }
}

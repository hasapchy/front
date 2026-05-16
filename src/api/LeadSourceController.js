import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import LeadSourceDto from '@/dto/lead/LeadSourceDto';
import BaseController from './BaseController';

export default class LeadSourceController extends BaseController {
  static async getItems(page = 1, perPage = 20) {
    const data = await super.getItems('/lead_sources', page, perPage);
    const items = LeadSourceDto.fromApiArray(data.items);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  static async getAllItems() {
    const data = await super.getListItems('/lead_sources');
    return LeadSourceDto.fromApiArray(data);
  }

  static async storeItem(item) {
    return super.storeItem('/lead_sources', item);
  }

  static async updateItem(id, item) {
    return super.updateItem('/lead_sources', id, item);
  }

  static async deleteItem(id) {
    return super.deleteItem('/lead_sources', id);
  }
}

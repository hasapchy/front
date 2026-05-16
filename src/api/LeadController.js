import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import LeadDto from "@/dto/lead/LeadDto";
import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";

export default class LeadController extends BaseController {
  /**
   * @param {number} page
   * @param {number} perPage
   * @param {{ status_id?: number }} [params]
   */
  static async getItems(page = 1, perPage = 20, params = {}) {
    const queryParams = {};
    if (params && typeof params === "object" && params.status_id != null && params.status_id !== "") {
      queryParams.status_id = params.status_id;
    }
    const data = await super.getItems("/leads", page, perPage, queryParams);
    const items = LeadDto.fromApiArray(data.items);
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

  /**
   * @param {number} id
   * @returns {Promise<LeadDto>}
   */
  static async getItem(id) {
    const data = await super.getItem("/leads", id);
    return LeadDto.fromApi(data);
  }

  /**
   * @param {LeadDto|object} item
   */
  static async storeItem(item) {
    const payload = item instanceof LeadDto ? item.toApiPayload() : item;
    return super.storeItem("/leads", payload);
  }

  /**
   * @param {number} id
   * @param {LeadDto|object} item
   */
  static async updateItem(id, item) {
    const payload = item instanceof LeadDto ? item.toApiPayload() : item;
    return super.updateItem("/leads", id, payload);
  }

  /**
   * @param {number} id
   */
  static async deleteItem(id) {
    return super.deleteItem("/leads", id);
  }

  /**
   * @param {number} id
   * @param {File[]} files
   * @returns {Promise<object>}
   */
  static async uploadFiles(id, files) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files[]", file);
    });
    return super.handleRequest(
      async () => {
        const body = await super.post(`/leads/${id}/files`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return body.data;
      },
      apiErrorMessage("leadFilesUpload", { id })
    );
  }
}

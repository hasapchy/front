import BaseController from './BaseController';
import { apiErrorMessage } from './apiErrorMessage';

export default class EntityLinkController extends BaseController {
  /**
   * @param {{ entity: string, entityId: number|string }} params
   * @returns {Promise<object>}
   */
  static async getPreview({ entity, entityId }) {
    return super.handleRequest(
      async () => super.getData('/entity-links/preview', {
        params: {
          entity,
          entity_id: entityId,
        },
      }),
      apiErrorMessage('entityLinkPreview'),
    );
  }
}

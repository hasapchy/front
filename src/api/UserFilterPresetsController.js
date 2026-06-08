import BaseController from './BaseController';

const PRESET_REQUEST_CONFIG = { skipCaseTransform: true };

export default class UserFilterPresetsController extends BaseController {
  static async list(source) {
    return super.getData('/user/filter-presets', { params: { source } });
  }

  static async create(payload) {
    return super.postData('/user/filter-presets', payload, PRESET_REQUEST_CONFIG);
  }

  static async update(id, payload) {
    return super.putData(`/user/filter-presets/${id}`, payload, PRESET_REQUEST_CONFIG);
  }

  static async delete(id) {
    const data = await super.delete(`/user/filter-presets/${id}`);
    return data?.data;
  }

  static async setDefault(source, presetId) {
    return super.putData('/user/filter-presets/default', {
      source,
      preset_id: presetId,
    }, PRESET_REQUEST_CONFIG);
  }
}

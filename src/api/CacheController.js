import BaseController from "./BaseController";

export default class CacheController extends BaseController {
  static async clearAllCache() {
    return super.post("/cache/clear");
  }
}


import api from "./axiosInstance";

const CacheController = {
  async clearAllCache() {
    const { data } = await api.post("/cache/clear");
    return data;
  },
};

export default CacheController;


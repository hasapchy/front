import api from "@/api/axiosInstance";
import basementApi from "@/api/basement/basementAxiosInstance";

export const batchRequests = async (requests, useBasement = false) => {
  const apiInstance = useBasement ? basementApi : api;
  return Promise.all(requests.map(request => apiInstance(request)));
};

export const batchGet = async (urls, useBasement = false) => {
  const apiInstance = useBasement ? basementApi : api;
  const requests = urls.map(url => apiInstance.get(url));
  return Promise.all(requests);
};

export const batchPost = async (url, items, useBasement = false) => {
  const apiInstance = useBasement ? basementApi : api;
  const requests = items.map(item => apiInstance.post(url, item));
  return Promise.all(requests);
};

